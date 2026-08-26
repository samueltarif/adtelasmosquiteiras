import { requireActiveAdmin } from '../../../../utils/adminAuth'
import {
  validateServiceKey,
  validateMediaTypeAndMime,
  validateFileSize,
  generateSiteMediaStorageKey,
  generateSitePresignedUploadUrl
} from '../../../../utils/r2SiteStorage'

/**
 * ======================================================================
 * ADMIN SITE MEDIA — AUTHORIZE UPLOAD
 * ======================================================================
 * POST /api/admin/media/site/authorize-upload
 *
 * Gera URL assinada (Presigned PUT) para upload direto ao Cloudflare R2
 * (bucket adtelas-site-media).
 *
 * REGRAS DE SEGURANÇA:
 * 1. Exige sessão de administrador ativa com RBAC completo.
 * 2. Proteção CSRF Same-Origin automática via requireActiveAdmin.
 * 3. Validação canônica estrita da service_key (12 serviços).
 * 4. Validação estrita de media_type, mime_type e limites de tamanho.
 * 5. Storage key gerada exclusivamente server-side com UUID criptográfico.
 * 6. Headers assinados no PUT: Content-Type e Cache-Control imutável.
 * 7. Zero exposição de credenciais privadas ou tokens do Cloudflare.
 * ======================================================================
 */

export default defineEventHandler(async (event) => {
  // 1. Guard de Autenticação e RBAC Administrativo
  const admin = await requireActiveAdmin(event)

  // 2. Proteção de Cache
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  setHeader(event, 'Pragma', 'no-cache')
  setHeader(event, 'Expires', '0')

  const body = await readBody(event).catch(() => null)
  if (!body || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'Payload inválido. Objeto JSON esperado.'
    })
  }

  const {
    service_key,
    media_type,
    mime_type,
    file_size_bytes
  } = body

  // 3. Validação de service_key
  if (!validateServiceKey(service_key)) {
    throw createError({
      statusCode: 400,
      message: `service_key "${service_key}" inválida. Deve pertencer à taxonomia canônica de 12 serviços.`
    })
  }

  // 4. Validação de media_type e mime_type
  const typeCheck = validateMediaTypeAndMime(media_type, mime_type)
  if (!typeCheck.valid) {
    throw createError({
      statusCode: 400,
      message: typeCheck.error
    })
  }

  // 5. Validação de Tamanho Máximo
  const sizeCheck = validateFileSize(typeCheck.mediaType, file_size_bytes)
  if (!sizeCheck.valid) {
    throw createError({
      statusCode: 400,
      message: sizeCheck.error
    })
  }

  // 6. Geração Segura da Storage Key no Servidor
  const storageKey = generateSiteMediaStorageKey(service_key, typeCheck.mimeType)

  // 7. Geração da Presigned PUT URL (TTL 15 minutos = 900s)
  const expiresIn = 900
  let uploadUrl: string
  try {
    uploadUrl = await generateSitePresignedUploadUrl(storageKey, typeCheck.mimeType, expiresIn)
  } catch (err: any) {
    console.error('Erro ao gerar Presigned PUT URL para Site Media:', err?.message || err)
    throw createError({
      statusCode: 500,
      message: 'Falha ao gerar autorização de upload no armazenamento'
    })
  }

  return {
    success: true,
    uploadUrl,
    storageKey,
    serviceKey: service_key,
    mediaType: typeCheck.mediaType,
    mimeType: typeCheck.mimeType,
    requiredHeaders: {
      'Content-Type': typeCheck.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable'
    },
    expiresIn,
    authorizedBy: admin.email
  }
})
