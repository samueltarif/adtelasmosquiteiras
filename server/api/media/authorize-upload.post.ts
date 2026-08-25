import { verifyMediaUploadToken } from '../../utils/mediaAuth'
import { generatePresignedUploadUrl } from '../../utils/r2Storage'
import {
  ALLOWED_PHOTO_MIMES,
  ALLOWED_VIDEO_MIMES,
  PHOTO_MAX_COUNT,
  VIDEO_MAX_COUNT,
  PHOTO_MAX_SIZE_BYTES,
  VIDEO_MAX_SIZE_BYTES
} from '../../shared/leadEmailCore.mjs'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authHeader = getHeader(event, 'authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader

  // 1. Validação Criptográfica do Token de Upload
  const tokenPayload = verifyMediaUploadToken(token)
  const { leadId, submissionId } = tokenPayload

  const body = await readBody(event) || {}
  const {
    client_media_id,
    media_type,
    mime_type,
    file_size_bytes,
    original_filename
  } = body

  if (!client_media_id) {
    throw createError({ statusCode: 400, message: 'client_media_id é obrigatório' })
  }

  const cleanMime = (mime_type || '').toLowerCase().trim()
  const isPhoto = ALLOWED_PHOTO_MIMES.has(cleanMime)
  const isVideo = ALLOWED_VIDEO_MIMES.has(cleanMime)

  if (!isPhoto && !isVideo) {
    throw createError({
      statusCode: 400,
      message: `Tipo de arquivo não permitido: ${cleanMime || 'desconhecido'}. Aceitos: JPG, PNG, WebP, MP4, WebM, MOV`
    })
  }

  const effectiveMediaType = isPhoto ? 'photo' : 'video'
  const maxAllowedSize = isPhoto ? PHOTO_MAX_SIZE_BYTES : VIDEO_MAX_SIZE_BYTES
  const sizeNum = Number(file_size_bytes) || 0

  if (sizeNum <= 0) {
    throw createError({ statusCode: 400, message: 'Tamanho de arquivo inválido' })
  }

  if (sizeNum > maxAllowedSize) {
    throw createError({
      statusCode: 400,
      message: `Tamanho do arquivo (${Math.round(sizeNum / (1024 * 1024))} MB) excede o limite máximo permitido de ${Math.round(maxAllowedSize / (1024 * 1024))} MB`
    })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Configuração de banco indisponível' })
  }

  const headers = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json'
  }

  // 2. Checagem de Idempotência: (lead_id, client_media_id) já existe?
  try {
    const existingRes: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/lead_media?lead_id=eq.${leadId}&client_media_id=eq.${client_media_id}&select=*`,
      { headers }
    )

    const existing = existingRes?.[0]
    if (existing) {
      if (existing.upload_status === 'uploaded') {
        return {
          success: true,
          alreadyUploaded: true,
          clientMediaId: client_media_id,
          storageKey: existing.storage_key
        }
      }

      // Reutiliza a storage_key pendente e gera nova Presigned URL para retry
      const presignedUrl = await generatePresignedUploadUrl(existing.storage_key, existing.mime_type, 900)
      return {
        success: true,
        presignedUrl,
        storageKey: existing.storage_key,
        clientMediaId: client_media_id
      }
    }
  } catch (err: any) {
    console.warn('[authorize-upload] Erro ao consultar idempotência:', err?.message || err)
  }

  // 3. Validação de Cotas por Lead em public.lead_media
  try {
    const leadMediaList: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/lead_media?lead_id=eq.${leadId}&select=id,media_type,upload_status`,
      { headers }
    )

    const activeMedia = (leadMediaList || []).filter(m => m.upload_status !== 'deleted' && m.upload_status !== 'failed')
    const photoCount = activeMedia.filter(m => m.media_type === 'photo').length
    const videoCount = activeMedia.filter(m => m.media_type === 'video').length

    if (isPhoto && photoCount >= PHOTO_MAX_COUNT) {
      throw createError({
        statusCode: 400,
        message: `Limite de fotos atingido (${PHOTO_MAX_COUNT} fotos permitidas por lead)`
      })
    }

    if (isVideo && videoCount >= VIDEO_MAX_COUNT) {
      throw createError({
        statusCode: 400,
        message: `Limite de vídeos atingido (${VIDEO_MAX_COUNT} vídeos permitidos por lead)`
      })
    }
  } catch (err: any) {
    if (err.statusCode) throw err
  }

  // 4. Determinação da extensão segura e chave temporária
  let ext = 'jpg'
  if (cleanMime === 'image/png') ext = 'png'
  else if (cleanMime === 'image/webp') ext = 'webp'
  else if (cleanMime === 'video/mp4') ext = 'mp4'
  else if (cleanMime === 'video/webm') ext = 'webm'
  else if (cleanMime === 'video/quicktime') ext = 'mov'

  const randomId = crypto.randomUUID()
  const tempStorageKey = `tmp/leads/${leadId}/${randomId}.${ext}`
  const safeFilename = `${effectiveMediaType}-${randomId.slice(0, 8)}.${ext}`

  // 5. Inserção do registro com status 'pending'
  try {
    await $fetch(`${config.supabaseUrl}/rest/v1/lead_media`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: {
        lead_id: leadId,
        client_media_id,
        submission_id: submissionId,
        storage_key: tempStorageKey,
        original_filename: original_filename ? String(original_filename).slice(0, 255) : safeFilename,
        safe_filename: safeFilename,
        media_type: effectiveMediaType,
        mime_type: cleanMime,
        file_size_bytes: sizeNum,
        upload_status: 'pending'
      }
    })
  } catch (dbErr: any) {
    console.error('[authorize-upload] Erro ao registrar mídia no Supabase:', dbErr?.message || dbErr)
    throw createError({ statusCode: 500, message: 'Erro ao registrar autorização de mídia' })
  }

  // 6. Geração da Presigned PUT URL do Cloudflare R2
  const presignedUrl = await generatePresignedUploadUrl(tempStorageKey, cleanMime, 900)

  return {
    success: true,
    presignedUrl,
    storageKey: tempStorageKey,
    clientMediaId: client_media_id
  }
})
