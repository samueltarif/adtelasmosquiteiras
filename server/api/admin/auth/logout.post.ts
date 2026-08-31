import { defineEventHandler, getCookie, getHeader } from 'h3'
import { clearAdminAuthCookies, enforceMutationCsrf } from '../../../utils/adminAuthCookies.ts'
import { ADMIN_AUTH_COOKIE_NAME } from '../../../shared/adminAuthCore.mjs'

/**
 * POST /api/admin/auth/logout
 *
 * PATCH 1.7:
 * - CSRF Same-Origin check (enforceMutationCsrf)
 * - SUPABASE_SESSION_REVOCATION_ON_LOGOUT=YES (scope=local via low-privilege key)
 * - LOGOUT_SCOPE=LOCAL
 * - LOGOUT_COOKIE_CLEAR=PASS
 */
export default defineEventHandler(async (event) => {
  // 1. Proteção CSRF / Same-Origin
  enforceMutationCsrf(event)

  const config = useRuntimeConfig()
  const grantKey = config?.supabasePublishableKey || config?.supabaseAnonKey

  // 2. Extrai access token da sessão ativa
  let accessToken = getCookie(event, ADMIN_AUTH_COOKIE_NAME)
  if (!accessToken) {
    const authHeader = getHeader(event, 'authorization')
    if (authHeader && authHeader.trim().toLowerCase().startsWith('bearer ')) {
      accessToken = authHeader.trim().slice(7).trim()
    }
  }

  // 3. Solicita revogação da sessão atual no Supabase Auth se houver token e configuração
  if (accessToken && config?.supabaseUrl && grantKey) {
    try {
      await $fetch(`${config.supabaseUrl}/auth/v1/logout?scope=local`, {
        method: 'POST',
        headers: {
          'apikey': grantKey,
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: 5000
      })
    } catch (err: any) {
      // 401/403/404 indica que o token já expirou ou já foi revogado upstream
      const status = err?.statusCode || err?.status || (err?.response && err.response.status) || 0
      if (status >= 500) {
        console.warn('[logout] SUPABASE_REMOTE_LOGOUT_INFRA_WARNING')
      }
    }
  }

  // 4. Limpa cookies HTTP-only de sessão
  clearAdminAuthCookies(event)

  return {
    success: true,
    message: 'Sessão encerrada com sucesso.'
  }
})
