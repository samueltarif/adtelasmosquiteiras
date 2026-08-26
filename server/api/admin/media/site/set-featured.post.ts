import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { validateServiceKey } from '../../../../utils/r2SiteStorage'

/**
 * ======================================================================
 * ADMIN SITE MEDIA — SET FEATURED
 * ======================================================================
 * POST /api/admin/media/site/set-featured
 *
 * Define uma mídia como destaque principal do serviço de forma estritamente
 * atômica via RPC public.set_featured_service_media no Supabase.
 *
 * REGRAS DE INTEGRIDADE:
 * 1. Exige autenticação e autorização ativa de administrador.
 * 2. Valida se service_key pertence à allowlist canônica.
 * 3. Executa a RPC segura com service_role (bloqueada para anon/authenticated no banco).
 * 4. A RPC valida o alvo (existência, pertencimento e foto) antes de remover o featured anterior.
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

  const { id, service_key } = body
  if (!id || typeof id !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'id da mídia é obrigatório'
    })
  }

  if (!validateServiceKey(service_key)) {
    throw createError({
      statusCode: 400,
      message: `service_key "${service_key}" inválida.`
    })
  }

  const dbHeaders = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json'
  }

  try {
    const rpcResult = await $fetch(
      `${config.supabaseUrl}/rest/v1/rpc/set_featured_service_media`,
      {
        method: 'POST',
        headers: dbHeaders,
        body: {
          p_media_id: id,
          p_service_key: service_key
        }
      }
    )

    return {
      success: true,
      featuredMediaId: id,
      serviceKey: service_key,
      rpcResult
    }
  } catch (err: any) {
    console.error('Erro ao executar RPC set_featured_service_media:', err?.message || err)
    const errorMsg = err?.data?.message || err?.message || 'Falha ao definir mídia de destaque'
    throw createError({
      statusCode: err?.statusCode || 400,
      message: errorMsg
    })
  }
})
