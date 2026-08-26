import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import {
  ALLOWED_MIME_TYPES,
  MIME_TO_EXT,
  generateSitePresignedUploadUrl,
  isSiteR2Configured
} from '../../../../../utils/r2SiteStorage'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const body = await readBody(event).catch(() => ({}))

  const mimeType = body.mime_type || body.mimeType
  const fileSize = parseInt(body.file_size_bytes || body.fileSizeBytes, 10)

  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw createError({
      statusCode: 400,
      message: 'Formato de imagem inválido. Formatos aceitos: JPEG, PNG, WebP.'
    })
  }

  // Limite de 5 MB para a logo
  const MAX_LOGO_SIZE = 5 * 1024 * 1024
  if (!fileSize || isNaN(fileSize) || fileSize <= 0 || fileSize > MAX_LOGO_SIZE) {
    throw createError({
      statusCode: 400,
      message: 'Tamanho da logo inválido. O arquivo deve ter até 5 MB.'
    })
  }

  if (!isSiteR2Configured()) {
    throw createError({
      statusCode: 500,
      message: 'Armazenamento de mídia R2 não configurado no servidor.'
    })
  }

  // Gera storage_key padronizada e segura no prefixo branding/company/
  const ext = MIME_TO_EXT[mimeType] || 'png'
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const storageKey = `branding/company/logo_${timestamp}_${randomSuffix}.${ext}`

  try {
    const uploadUrl = await generateSitePresignedUploadUrl(storageKey, mimeType, 900)

    return {
      success: true,
      storageKey,
      uploadUrl,
      expiresInSeconds: 900
    }
  } catch (err: any) {
    console.error('[logo/authorize] Erro ao gerar URL pré-assinada:', err)
    throw createError({
      statusCode: 500,
      message: 'Erro ao autorizar upload da logo no R2.'
    })
  }
})
