import { verifyMediaUploadToken } from '../../utils/mediaAuth'
import {
  verifyAndPromoteObject,
  deleteObjectImmediately
} from '../../utils/r2Storage'

export default defineEventHandler(async (event) => {
  const t0_finalizeStart = performance.now()
  const config = useRuntimeConfig()
  const authHeader = getHeader(event, 'authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader

  // 1. Validação Criptográfica do Token de Upload
  const tokenPayload = verifyMediaUploadToken(token)
  const { leadId } = tokenPayload

  const body = await readBody(event) || {}
  const { client_media_id } = body

  if (!client_media_id) {
    throw createError({ statusCode: 400, message: 'client_media_id é obrigatório' })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Configuração de banco indisponível' })
  }

  const headers = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  // ======================================================================
  // 2. AQUISIÇÃO ATÔMICA DO LOCK NO BANCO (pending ➔ finalizing)
  // ======================================================================
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  let acquiredRecord: any = null

  const tLockStart = performance.now()
  try {
    const lockResponse: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/lead_media?lead_id=eq.${leadId}&client_media_id=eq.${client_media_id}&or=(upload_status.eq.pending,and(upload_status.eq.finalizing,finalizing_at.lt.${tenMinutesAgo}))`,
      {
        method: 'PATCH',
        headers,
        body: {
          upload_status: 'finalizing',
          finalizing_at: new Date().toISOString()
        }
      }
    )

    if (Array.isArray(lockResponse) && lockResponse.length > 0) {
      acquiredRecord = lockResponse[0]
    }
  } catch (err: any) {
    console.error('[finalize-upload] Erro ao adquirir lock finalizing:', err?.message || err)
  }
  const tLockEnd = performance.now()

  // Se nenhuma linha foi adquirida, verifica se já foi finalizado ou está em andamento
  if (!acquiredRecord) {
    try {
      const currentRes: any[] = await $fetch(
        `${config.supabaseUrl}/rest/v1/lead_media?lead_id=eq.${leadId}&client_media_id=eq.${client_media_id}&select=*`,
        {
          headers: {
            'apikey': config.supabaseServiceRoleKey,
            'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
          }
        }
      )

      const current = currentRes?.[0]
      if (current) {
        if (current.upload_status === 'uploaded') {
          return {
            success: true,
            idempotent: true,
            uploadStatus: 'uploaded',
            storageKey: current.storage_key
          }
        }
        if (current.upload_status === 'finalizing') {
          setResponseStatus(event, 202)
          return {
            success: true,
            processing: true,
            message: 'Finalização já em andamento'
          }
        }
        if (current.upload_status === 'failed') {
          throw createError({ statusCode: 400, message: 'Upload marcado como falho previamente' })
        }
      }
    } catch (err: any) {
      if (err.statusCode) throw err
    }

    throw createError({ statusCode: 404, message: 'Registro de mídia não encontrado para finalização' })
  }

  // ======================================================================
  // 3. VERIFICAÇÃO RIGOROSA E PROMOÇÃO DO OBJETO NO R2
  // ======================================================================
  const tempStorageKey = acquiredRecord.storage_key
  const finalStorageKey = tempStorageKey.startsWith('tmp/')
    ? tempStorageKey.slice(4) // 'tmp/leads/...' ➔ 'leads/...'
    : tempStorageKey

  let isPromoted = false
  let promoteMetrics: any = {}

  const tPromoteStart = performance.now()
  try {
    promoteMetrics = await verifyAndPromoteObject({
      tempKey: tempStorageKey,
      finalKey: finalStorageKey,
      expectedMime: acquiredRecord.mime_type,
      maxBytes: acquiredRecord.file_size_bytes
    })
    isPromoted = true
  } catch (verifyErr: any) {
    console.error('[finalize-upload] Falha na verificação/promoção do R2:', verifyErr?.message || verifyErr)

    // Limpeza imediata do temporário inválido
    await deleteObjectImmediately(tempStorageKey)

    // Atualiza banco para 'failed'
    try {
      await $fetch(`${config.supabaseUrl}/rest/v1/lead_media?id=eq.${acquiredRecord.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: { upload_status: 'failed' }
      })
    } catch {}

    throw createError({
      statusCode: 400,
      message: `Falha na validação do arquivo: ${verifyErr?.message || 'Arquivo inválido'}`
    })
  }
  const tPromoteEnd = performance.now()

  // ======================================================================
  // 4. PERSISTÊNCIA NO BANCO COM COMPENSAÇÃO REVERSA
  // ======================================================================
  const tDbStart = performance.now()
  try {
    await $fetch(`${config.supabaseUrl}/rest/v1/lead_media?id=eq.${acquiredRecord.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: {
        storage_key: finalStorageKey,
        upload_status: 'uploaded',
        verified_at: new Date().toISOString()
      }
    })
  } catch (dbErr: any) {
    console.error('[finalize-upload] Falha no UPDATE do banco pós-cópia — acionando compensação:', dbErr)

    // COMPENSAÇÃO: Deleta o objeto final promovido no R2 para evitar órfãos
    if (isPromoted && finalStorageKey !== tempStorageKey) {
      await deleteObjectImmediately(finalStorageKey)
    }

    try {
      await $fetch(`${config.supabaseUrl}/rest/v1/lead_media?id=eq.${acquiredRecord.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: { upload_status: 'failed' }
      })
    } catch {}

    throw createError({ statusCode: 500, message: 'Erro ao persistir status de mídia no banco' })
  }
  const tDbEnd = performance.now()

  // ======================================================================
  // 5. LIMPEZA DO OBJETO TEMPORÁRIO EM SEGUNDO PLANO
  // ======================================================================
  if (tempStorageKey !== finalStorageKey) {
    const deletePromise = deleteObjectImmediately(tempStorageKey)
    if (typeof (event as any).waitUntil === 'function') {
      (event as any).waitUntil(deletePromise)
    } else {
      deletePromise.catch(() => {})
    }
  }

  const tTotalFinalize = performance.now() - t0_finalizeStart

  if (import.meta.dev) {
    const lockMs = (tLockEnd - tLockStart).toFixed(1)
    const verifyMs = (promoteMetrics.verifyMs || 0).toFixed(1)
    const copyMs = (promoteMetrics.copyMs || 0).toFixed(1)
    const dbMs = (tDbEnd - tDbStart).toFixed(1)
    console.log(`[Finalize Timing] Total: ${tTotalFinalize.toFixed(1)}ms | Lock DB: ${lockMs}ms | Verify Range: ${verifyMs}ms | Copy S3: ${copyMs}ms | Update DB: ${dbMs}ms`)
  }

  return {
    success: true,
    uploadStatus: 'uploaded',
    storageKey: finalStorageKey,
    clientMediaId: client_media_id
  }
})
