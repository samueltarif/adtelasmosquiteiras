import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { requireActiveAdmin } from '../../../../../../utils/adminAuth'
import {
  getSupabaseHeaders,
  logCrmActivity,
  WORK_ORDER_PHOTO_MAX_BYTES,
  WORK_ORDER_VIDEO_MAX_BYTES,
  WORK_ORDER_ALLOWED_PHOTO_MIMES,
  WORK_ORDER_ALLOWED_VIDEO_MIMES,
  ALLOWED_MEDIA_ETAPAS
} from '../../../../../../utils/crm'
import {
  verifyObjectInR2,
  deleteObjectImmediately,
  getS3Client,
  getR2Config
} from '../../../../../../utils/r2Storage'
import { validateMediaMagicBytes } from '../../../../../../shared/leadEmailCore.mjs'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase não configurado no servidor'
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID da OS é obrigatório'
    })
  }

  const body = await readBody(event).catch(() => ({}))
  const storageKey = typeof body.storageKey === 'string' ? body.storageKey.trim() : ''
  const mimeType = typeof body.mimeType === 'string' ? body.mimeType.trim().toLowerCase() : ''
  const safeFilename = typeof body.safeFilename === 'string' ? body.safeFilename.trim() : 'arquivo'
  const etapa = body.etapa && ALLOWED_MEDIA_ETAPAS.includes(body.etapa) ? body.etapa : 'antes'
  const descricao = body.descricao ? String(body.descricao).trim() : null
  const workOrderItemId = body.workOrderItemId ? String(body.workOrderItemId).trim() : null

  if (!storageKey || !mimeType) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Chave de armazenamento (storageKey) e tipo MIME são obrigatórios'
    })
  }

  // 1. Validação de formato e limites
  const isPhoto = WORK_ORDER_ALLOWED_PHOTO_MIMES.includes(mimeType)
  const isVideo = WORK_ORDER_ALLOWED_VIDEO_MIMES.includes(mimeType)

  if (!isPhoto && !isVideo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tipo MIME de mídia não suportado'
    })
  }

  const maxBytes = isPhoto ? WORK_ORDER_PHOTO_MAX_BYTES : WORK_ORDER_VIDEO_MAX_BYTES
  const mediaType: 'photo' | 'video' = isPhoto ? 'photo' : 'video'

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 2. Validação da OS
  const woList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&select=id,client_id,status_os`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(woList) || woList.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ordem de serviço não encontrada'
    })
  }

  const wo = woList[0]

  // 3. Validação do item se informado
  if (workOrderItemId) {
    const itemCheck = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_order_items?id=eq.${workOrderItemId}&work_order_id=eq.${id}&select=id`,
      { headers }
    ).catch(() => [])

    if (!Array.isArray(itemCheck) || itemCheck.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'O item informado não pertence a esta ordem de serviço'
      })
    }
  }

  // 4. Verificação no R2 (HeadObject)
  const verifyRes = await verifyObjectInR2(storageKey, mimeType, maxBytes)
  if (!verifyRes.verified) {
    // Tenta apagar objeto inválido do R2
    await deleteObjectImmediately(storageKey).catch(() => {})
    throw createError({
      statusCode: 400,
      statusMessage: 'Arquivo não encontrado no R2 ou tamanho/formato inválido'
    })
  }

  const actualBytes = verifyRes.actualBytes

  // 5. Validação de Magic Bytes (lê os primeiros bytes do arquivo no R2)
  try {
    const s3Client = getS3Client()
    const r2Config = getR2Config()
    const getObjRes = await s3Client.send(
      new GetObjectCommand({
        Bucket: r2Config.bucketName,
        Key: storageKey,
        Range: 'bytes=0-1023'
      })
    )

    if (getObjRes.Body) {
      const byteArray = await getObjRes.Body.transformToByteArray()
      const buffer = Buffer.from(byteArray)
      const isMagicValid = validateMediaMagicBytes(buffer, mimeType)
      if (!isMagicValid) {
        await deleteObjectImmediately(storageKey).catch(() => {})
        throw createError({
          statusCode: 400,
          statusMessage: 'Validação de integridade falhou: os bytes do arquivo não correspondem ao tipo declarado'
        })
      }
    }
  } catch (magicErr: any) {
    if (magicErr.statusCode) throw magicErr
    console.warn('[FinalizeMedia] Falha ao inspecionar magic bytes no R2:', magicErr?.message || magicErr)
  }

  // 6. Inserção na tabela public.work_order_media
  let createdMedia: any = null
  try {
    const mediaPayload = {
      work_order_id: id,
      work_order_item_id: workOrderItemId,
      storage_key: storageKey,
      safe_filename: safeFilename,
      media_type: mediaType,
      mime_type: mimeType,
      file_size_bytes: actualBytes,
      etapa,
      descricao,
      created_by: admin.userId || null
    }

    const insertedList = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_order_media`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: mediaPayload
      }
    )

    if (!Array.isArray(insertedList) || insertedList.length === 0) {
      throw new Error('Retorno vazio ao inserir work_order_media')
    }

    createdMedia = insertedList[0]
  } catch (dbErr: any) {
    console.error('[FinalizeMedia] Erro no banco de dados. Executando compensação no R2...', dbErr?.message || dbErr)
    // SAGA compensatório: apaga o objeto do R2 se o banco falhou
    await deleteObjectImmediately(storageKey).catch(() => {})
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao registrar mídia no banco de dados'
    })
  }

  // 7. Registro de Auditoria
  await logCrmActivity(config, {
    clientId: wo.client_id,
    workOrderId: id,
    entityType: 'media',
    entityId: createdMedia.id,
    acao: 'media_uploaded',
    descricaoHumana: `Nova mídia técnica adicionada na etapa '${etapa}' (${safeFilename})`,
    dadosNovos: {
      media_id: createdMedia.id,
      etapa,
      media_type: mediaType
    },
    actorId: admin.userId
  })

  return {
    success: true,
    media: createdMedia
  }
})
