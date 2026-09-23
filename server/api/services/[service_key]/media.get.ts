import { validateServiceKey, buildPublicMediaUrl } from '../../../utils/r2SiteStorage'
import { getLocalMediaForService } from '../../../shared/localServiceMediaCatalog.mjs'

/**
 * ======================================================================
 * PUBLIC SERVICE MEDIA — LIST
 * ======================================================================
 * GET /api/services/[service_key]/media
 *
 * Endpoint público de alta performance para obter as mídias ativas
 * da galeria de um serviço canônico.
 *
 * REGRAS DE SEGURANÇA E PERFORMANCE:
 * 1. Valida service_key canônica contra allowlist estrita (404 se inválida).
 * 2. Retorna registros com is_active = true e cataloga mídias locais canônicas.
 * 3. Ordenação canônica: is_featured DESC, sort_order ASC, created_at ASC.
 * 4. Sanitização total: NUNCA expõe created_by ou dados administrativos internos.
 * 5. Cache HTTP otimizado com stale-while-revalidate.
 * ======================================================================
 */

export default defineEventHandler(async (event) => {
  const serviceKey = getRouterParam(event, 'service_key')

  if (!serviceKey || !validateServiceKey(serviceKey)) {
    throw createError({
      statusCode: 404,
      message: `Serviço "${serviceKey}" não encontrado na taxonomia canônica.`
    })
  }

  // Cache HTTP público balanceado (60s browser, 300s edge CDN, 600s stale)
  setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')

  const localMedia = getLocalMediaForService(serviceKey)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return {
      success: true,
      serviceKey,
      count: localMedia.length,
      media: localMedia
    }
  }

  const dbHeaders = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
  }

  try {
    const endpoint = `${config.supabaseUrl}/rest/v1/service_media?service_key=eq.${encodeURIComponent(serviceKey)}&is_active=eq.true&select=id,service_key,storage_key,media_type,mime_type,title,alt_text,caption,sort_order,is_featured,width,height,file_size_bytes,created_at&order=is_featured.desc,sort_order.asc,created_at.asc`

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
      width: rec.width,
      height: rec.height,
      file_size_bytes: rec.file_size_bytes,
      created_at: rec.created_at,
      publicUrl: buildPublicMediaUrl(config.public?.r2SiteMediaPublicBaseUrl, rec.storage_key)
    }))

    const combined = [...formatted]
    for (const item of localMedia) {
      if (!combined.some(c => c.storage_key === item.storage_key || c.publicUrl === item.publicUrl)) {
        combined.push(item)
      }
    }

    combined.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1
      if (!a.is_featured && b.is_featured) return 1
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })

    return {
      success: true,
      serviceKey,
      count: combined.length,
      media: combined
    }
  } catch (err: any) {
    console.warn(`Aviso: Falha ao consultar Supabase para ${serviceKey}, utilizando catálogo local:`, err?.message || err)
    return {
      success: true,
      serviceKey,
      count: localMedia.length,
      media: localMedia
    }
  }
})

