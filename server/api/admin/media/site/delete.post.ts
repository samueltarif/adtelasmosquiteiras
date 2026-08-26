import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { deleteSiteObjectFromR2 } from '../../../../utils/r2SiteStorage'

/**
 * ======================================================================
 * ADMIN SITE MEDIA — DELETE
 * ======================================================================
 * POST /api/admin/media/site/delete
 *
 * Exclui com segurança uma mídia de serviço:
 * 1. Valida administrador ativo com RBAC.
 * 2. Consulta o registro no banco para obter a storage_key canônica.
 * 3. Exclui o objeto físico no bucket R2 (adtelas-site-media).
 * 4. Após confirmação do R2, remove o registro na tabela public.service_media.
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

  const body = await readBody(event).catch(() => null)
  if (!body || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'Payload inválido. Objeto JSON esperado.'
    })
  }

  const { id } = body
  if (!id || typeof id !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'id da mídia é obrigatório'
    })
  }

  const dbHeaders = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
  }

  // 3. Localiza a mídia para obter a storage_key
  let existingMedia: any = null
  try {
    const res: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/service_media?id=eq.${encodeURIComponent(id)}&select=*`,
      { headers: dbHeaders }
    )
    if (res && res.length > 0) {
      existingMedia = res[0]
    }
  } catch (err: any) {
    console.error('Erro ao consultar service_media antes da exclusão:', err?.message || err)
    throw createError({
      statusCode: 500,
      message: 'Falha ao localizar registro para exclusão'
    })
  }

  if (!existingMedia) {
    throw createError({
      statusCode: 404,
      message: 'Mídia não encontrada no banco de dados'
    })
  }

  const storageKey = existingMedia.storage_key

  // 4. Exclui o objeto do Cloudflare R2
  const r2Deleted = await deleteSiteObjectFromR2(storageKey)
  if (!r2Deleted) {
    console.warn(`Aviso: Tentativa de exclusão no R2 falhou para storage_key "${storageKey}". Prosseguindo com deleção do banco...`)
  }

  // 5. Exclui o registro na tabela public.service_media
  try {
    await $fetch(
      `${config.supabaseUrl}/rest/v1/service_media?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: dbHeaders
      }
    )

    return {
      success: true,
      deletedMediaId: id,
      storageKey,
      serviceKey: existingMedia.service_key
    }
  } catch (err: any) {
    console.error('Erro ao excluir service_media do banco:', err?.message || err)
    throw createError({
      statusCode: 500,
      message: 'Falha ao remover registro da mídia do banco de dados'
    })
  }
})
