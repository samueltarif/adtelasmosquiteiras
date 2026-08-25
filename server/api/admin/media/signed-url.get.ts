import { generatePresignedDownloadUrl } from '../../../utils/r2Storage'
import { requireActiveAdmin, validateMediaAccess } from '../../../utils/adminAuth'

/**
 * ======================================================================
 * ADMIN SIGNED URL AUTHORITY — AD Telas e Redes
 * ======================================================================
 * Endpoint centralizado para geração de URLs temporárias assinadas (GET)
 * de visualização e download de fotos e vídeos de leads.
 *
 * REGRAS DE SEGURANÇA:
 * 1. Exige autenticação e autorização via requireActiveAdmin(event).
 * 2. Validação estrita de status: somente mídias com upload_status='uploaded'
 *    têm URLs assinadas geradas.
 * 3. TTL estrito de 300 segundos (5 minutos).
 * 4. Proteção contra IDOR: validação de existência, status e integridade.
 * 5. NUNCA retorna credenciais do R2, secrets ou tokens de upload.
 * ======================================================================
 */

export default defineEventHandler(async (event) => {
  // 1. Exige Administrador Autenticado e Ativo
  await requireActiveAdmin(event)

  // 2. Proteção de Cache: URLs assinadas temporárias não devem ser cacheadas por proxies ou navegadores
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  setHeader(event, 'Pragma', 'no-cache')
  setHeader(event, 'Expires', '0')

  const config = useRuntimeConfig()
  const query = getQuery(event)
  const mediaId = (query.media_id || query.mediaId) as string
  const leadId = (query.lead_id || query.leadId as string) || null

  if (!mediaId) {
    throw createError({ statusCode: 400, message: 'media_id é obrigatório' })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Configuração de banco indisponível' })
  }

  const headers = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
  }

  try {
    const res: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/lead_media?id=eq.${encodeURIComponent(mediaId)}&select=*`,
      { headers }
    )

    const media = res?.[0]

    // Validação estrita de acesso e status
    const accessCheck = validateMediaAccess(media, leadId)
    if (!accessCheck.allowed) {
      throw createError({
        statusCode: accessCheck.statusCode,
        message: accessCheck.message
      })
    }

    // Gera URL assinada temporária (TTL 300 segundos = 5 minutos)
    const signedUrl = await generatePresignedDownloadUrl(media.storage_key, 300)

    return {
      success: true,
      mediaId: media.id,
      leadId: media.lead_id,
      signedUrl,
      expiresInSeconds: 300,
      safeFilename: media.safe_filename,
      mediaType: media.media_type,
      mimeType: media.mime_type
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[admin/signed-url] Erro:', err?.message || err)
    throw createError({ statusCode: 500, message: 'Erro ao gerar URL assinada' })
  }
})
