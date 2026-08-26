import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { validateServiceKey, buildPublicMediaUrl } from '../../../../utils/r2SiteStorage'

/**
 * ======================================================================
 * ADMIN SITE MEDIA — LIST
 * ======================================================================
 * GET /api/admin/media/site/list
 *
 * Lista as mídias de serviços para o painel administrativo.
 * Permite filtro opcional por service_key canônica.
 *
 * REGRAS DE SEGURANÇA:
 * 1. Exige autenticação e autorização ativa de administrador.
 * 2. Valida service_key quando fornecida como filtro.
 * 3. Monta publicUrl dinamicamente sem persistir URLs absolutas no banco.
 * ======================================================================
 */

export default defineEventHandler(async (event) => {
  // 1. Guard de Autenticação e RBAC Administrativo
  await requireActiveAdmin(event)

  // 2. Proteção de Cache
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  setHeader(event, 'Pragma', 'no-cache')
  setHeader(event, 'Expires', '0')

  const config = useRuntimeConfig()
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      message: 'Configuração de banco de dados indisponível no servidor'
    })
  }

  const query = getQuery(event)
  const serviceKey = (query.service_key || query.serviceKey) as string | undefined

  if (serviceKey && !validateServiceKey(serviceKey)) {
    throw createError({
      statusCode: 400,
      message: `service_key "${serviceKey}" inválida.`
    })
  }

  const dbHeaders = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
  }

  let endpoint = `${config.supabaseUrl}/rest/v1/service_media?select=*&order=is_featured.desc,sort_order.asc,created_at.desc`
  if (serviceKey) {
    endpoint = `${config.supabaseUrl}/rest/v1/service_media?service_key=eq.${encodeURIComponent(serviceKey)}&select=*&order=is_featured.desc,sort_order.asc,created_at.desc`
  }

  try {
    const records: any[] = await $fetch(endpoint, { headers: dbHeaders })
    const formatted = (records || []).map((rec) => ({
      id: rec.id,
      service_key: rec.service_key,
      storage_key: rec.storage_key,
      media_type: rec.media_type,
      mime_type: rec.mime_type,
      title: rec.title,
      alt_text: rec.alt_text,
      caption: rec.caption,
      sort_order: rec.sort_order,
      is_featured: rec.is_featured,
      is_active: rec.is_active,
      width: rec.width,
      height: rec.height,
      file_size_bytes: rec.file_size_bytes,
      created_by: rec.created_by,
      created_at: rec.created_at,
      updated_at: rec.updated_at,
      publicUrl: buildPublicMediaUrl(config.public?.r2SiteMediaPublicBaseUrl, rec.storage_key)
    }))

    return {
      success: true,
      count: formatted.length,
      media: formatted
    }
  } catch (err: any) {
    console.error('Erro ao consultar lista de service_media:', err?.message || err)
    throw createError({
      statusCode: 500,
      message: 'Falha ao carregar lista de mídias de serviços'
    })
  }
})
