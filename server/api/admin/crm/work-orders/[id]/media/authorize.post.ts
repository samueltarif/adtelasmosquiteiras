import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { randomUUID } from 'crypto'
import { requireActiveAdmin } from '../../../../../../utils/adminAuth'
import {
  WORK_ORDER_PHOTO_MAX_BYTES,
  WORK_ORDER_VIDEO_MAX_BYTES,
  WORK_ORDER_ALLOWED_PHOTO_MIMES,
  WORK_ORDER_ALLOWED_VIDEO_MIMES,
  getSupabaseHeaders
} from '../../../../../../utils/crm'
import { generatePresignedUploadUrl } from '../../../../../../utils/r2Storage'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
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
  const filename = typeof body.filename === 'string' ? body.filename.trim() : ''
  const mimeType = typeof body.mimeType === 'string' ? body.mimeType.trim().toLowerCase() : ''
  const fileSizeBytes = parseInt(String(body.fileSizeBytes || '0'), 10)

  if (!filename || !mimeType) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nome do arquivo e tipo MIME são obrigatórios'
    })
  }

  // 1. Validação de existência da OS
  const woList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&select=id,status_os`,
    { headers: getSupabaseHeaders(config.supabaseServiceRoleKey) }
  ).catch(() => [])

  if (!Array.isArray(woList) || woList.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ordem de serviço não encontrada'
    })
  }

  // 2. Determinação de tipo e validação de MIME
  const isPhoto = WORK_ORDER_ALLOWED_PHOTO_MIMES.includes(mimeType)
  const isVideo = WORK_ORDER_ALLOWED_VIDEO_MIMES.includes(mimeType)

  if (!isPhoto && !isVideo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Formato de arquivo não suportado. Aceitos: JPG, PNG, WEBP, MP4, WEBM, MOV'
    })
  }

  const mediaType: 'photo' | 'video' = isPhoto ? 'photo' : 'video'
  const maxBytes = isPhoto ? WORK_ORDER_PHOTO_MAX_BYTES : WORK_ORDER_VIDEO_MAX_BYTES

  if (fileSizeBytes > maxBytes) {
    const limitMb = maxBytes / (1024 * 1024)
    throw createError({
      statusCode: 400,
      statusMessage: `Tamanho do arquivo excede o limite máximo permitido (${limitMb} MB)`
    })
  }

  // 3. Sanitização de nome e geração de storageKey no prefixo permanente work-orders/
  const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/)
  const ext = extMatch ? extMatch[1].toLowerCase() : (isPhoto ? 'jpg' : 'mp4')
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
  const fileId = randomUUID()
  const storageKey = `work-orders/${id}/${fileId}.${ext}`

  try {
    const uploadUrl = await generatePresignedUploadUrl(storageKey, mimeType, 900)

    return {
      uploadUrl,
      storageKey,
      mediaType,
      safeFilename,
      expiresInSeconds: 900
    }
  } catch (err: any) {
    console.error('[AuthorizeWorkOrderMedia] Erro ao gerar presigned PUT URL:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao autorizar upload no armazenamento privado'
    })
  }
})
