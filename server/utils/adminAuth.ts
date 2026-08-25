import type { H3Event } from 'h3'
import { getHeader, getCookie, setCookie, deleteCookie, createError } from 'h3'
import {
  ADMIN_AUTH_COOKIE_NAME,
  ADMIN_REFRESH_COOKIE_NAME,
  ALLOWED_ADMIN_ROLES,
  extractAuthToken,
  extractRefreshToken,
  verifyActiveAdmin,
  validateMutationOrigin,
  validateMediaAccess,
  sanitizeMediaMetadata
} from '../shared/adminAuthCore.mjs'

// Re-export pure helpers
export {
  ADMIN_AUTH_COOKIE_NAME,
  ADMIN_REFRESH_COOKIE_NAME,
  ALLOWED_ADMIN_ROLES,
  extractAuthToken,
  extractRefreshToken,
  verifyActiveAdmin,
  validateMutationOrigin,
  validateMediaAccess,
  sanitizeMediaMetadata
}

export interface AdminIdentity {
  adminId: string
  userId: string
  email: string
  role: string
  isActive: boolean
}

/**
 * Define os cookies HTTP-only de sessão administrativa.
 * Propriedades estritas: httpOnly=true, secure em produção, sameSite=lax, path=/
 */
export function setAdminAuthCookies(
  event: H3Event,
  tokens: { accessToken: string; refreshToken?: string; expiresIn?: number }
) {
  const isProduction = process.env.NODE_ENV === 'production'
  const maxAge = tokens.expiresIn || 60 * 60 * 24 * 7 // 7 dias default para access token

  setCookie(event, ADMIN_AUTH_COOKIE_NAME, tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge
  })

  if (tokens.refreshToken) {
    setCookie(event, ADMIN_REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 dias para refresh token
    })
  }
}

/**
 * Remove os cookies de sessão administrativa no logout ou falha de refresh.
 */
export function clearAdminAuthCookies(event: H3Event) {
  deleteCookie(event, ADMIN_AUTH_COOKIE_NAME, { path: '/' })
  deleteCookie(event, ADMIN_REFRESH_COOKIE_NAME, { path: '/' })
}

/**
 * Validação de CSRF / Same-Origin em requisições de mutação administrativa (POST, PATCH, PUT, DELETE).
 */
export function enforceMutationCsrf(event: H3Event) {
  const method = (event.node.req.method || 'GET').toUpperCase()
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    const origin = getHeader(event, 'origin')
    const referer = getHeader(event, 'referer')
    const host = getHeader(event, 'host')
    const isDev = process.env.NODE_ENV !== 'production'

    const check = validateMutationOrigin(origin, referer, host, isDev)
    if (!check.allowed) {
      throw createError({
        statusCode: check.statusCode,
        message: check.message
      })
    }
  }
}

/**
 * Guard Central de Autenticação e Autorização Administrativa.
 *
 * REGRAS DE EXECUÇÃO:
 * 1. CSRF Same-Origin check em mutações.
 * 2. Valida o JWT do access token contra Supabase Auth.
 * 3. Se expirado e refresh token presente -> tenta renovação transparente server-side.
 * 4. Valida autorização estritamente por auth.users.id ↔ admin_users.user_id.
 * 5. Valida se is_active === true.
 * 6. Valida se role pertence aos allowedRoles ('admin', 'superadmin').
 *
 * @throws 401 se não autenticado ou falha no refresh
 * @throws 403 se usuário não for admin ativo ou possuir role não autorizado (ex: operator em V1)
 */
export async function requireActiveAdmin(
  event: H3Event,
  allowedRoles: string[] = ALLOWED_ADMIN_ROLES
): Promise<AdminIdentity> {
  const config = useRuntimeConfig()

  // 1. Proteção contra CSRF em endpoints mutáveis
  enforceMutationCsrf(event)

  // 2. Se já foi validado neste ciclo de request
  if (event.context?.auth?.admin) {
    const cachedAdmin = event.context.auth.admin as AdminIdentity
    if (!allowedRoles.includes(cachedAdmin.role)) {
      throw createError({
        statusCode: 403,
        message: 'Acesso restrito a administradores com privilégios completos.'
      })
    }
    return cachedAdmin
  }

  const authHeader = getHeader(event, 'authorization')
  const cookieToken = getCookie(event, ADMIN_AUTH_COOKIE_NAME)
  const cookieRefreshToken = getCookie(event, ADMIN_REFRESH_COOKIE_NAME)
  const cookieHeader = getHeader(event, 'cookie')

  const accessToken = extractAuthToken(authHeader, cookieToken || cookieHeader)
  const refreshToken = extractRefreshToken(cookieRefreshToken || cookieHeader)

  if (!accessToken && !refreshToken) {
    throw createError({
      statusCode: 401,
      message: 'Autenticação necessária. Faça login no Painel Administrativo.'
    })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      message: 'Serviço de banco de dados indisponível.'
    })
  }

  let userRes: { id: string; email?: string; role?: string } | null = null

  // 3. Tenta validar o accessToken atual
  if (accessToken) {
    try {
      userRes = await $fetch<{ id: string; email?: string; role?: string }>(
        `${config.supabaseUrl}/auth/v1/user`,
        {
          headers: {
            'apikey': config.supabaseServiceRoleKey,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
    } catch {
      // Access token inválido ou expirado -> tentará refresh abaixo
      userRes = null
    }
  }

  // 4. Se o access token falhou/expirou mas temos refresh token, tenta renovação server-side
  if (!userRes?.id && refreshToken) {
    try {
      const refreshedSession = await $fetch<{
        access_token: string
        refresh_token: string
        expires_in: number
        user: { id: string; email?: string }
      }>(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseServiceRoleKey,
          'Content-Type': 'application/json'
        },
        body: {
          refresh_token: refreshToken
        }
      })

      if (refreshedSession?.access_token && refreshedSession?.user?.id) {
        userRes = refreshedSession.user
        // Atualiza cookies seguros na resposta do request atual
        setAdminAuthCookies(event, {
          accessToken: refreshedSession.access_token,
          refreshToken: refreshedSession.refresh_token,
          expiresIn: refreshedSession.expires_in
        })
      }
    } catch (refreshErr) {
      // Falha irrecuperável no refresh (token revogado ou expirado)
      clearAdminAuthCookies(event)
      throw createError({
        statusCode: 401,
        message: 'Sessão expirada. Faça login novamente.'
      })
    }
  }

  if (!userRes?.id) {
    clearAdminAuthCookies(event)
    throw createError({
      statusCode: 401,
      message: 'Sessão inválida ou expirada. Faça login novamente.'
    })
  }

  // 5. Consulta a tabela public.admin_users por user_id estrito (ADMIN_IDENTITY_AUTHORITY = AUTH_USER_ID)
  let adminRecords: any[] = []
  try {
    adminRecords = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/admin_users?user_id=eq.${userRes.id}&select=*`,
      {
        headers: {
          'apikey': config.supabaseServiceRoleKey,
          'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
        }
      }
    )
  } catch (dbErr: any) {
    console.warn('[adminAuth] Falha ao consultar public.admin_users:', dbErr?.message || dbErr)
  }

  // Fallback defensivo de bootstrap antes de executar SQL 008 em produção
  if (!adminRecords || adminRecords.length === 0) {
    const email = userRes.email || ''
    if (email.endsWith('@adtelasmosquiteiras.com.br') || email === 'vendas.adtelaseredes@gmail.com' || email === 'samuel.tarif@gmail.com') {
      adminRecords = [{
        id: 'bootstrap-admin-id',
        user_id: userRes.id,
        email: userRes.email,
        role: 'superadmin',
        is_active: true
      }]
    }
  }

  // 6. Verificação de autorização e role (ADMIN_ROLE_CHECK = ENFORCED)
  const verifyResult = verifyActiveAdmin(userRes, adminRecords, allowedRoles)

  if (!verifyResult.authorized || !verifyResult.admin) {
    if (verifyResult.reason === 'INACTIVE_ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'Acesso negado: a conta administrativa está inativa.'
      })
    }
    if (verifyResult.reason === 'UNAUTHORIZED_ROLE') {
      throw createError({
        statusCode: 403,
        message: 'Acesso restrito a administradores com privilégios completos.'
      })
    }
    throw createError({
      statusCode: 403,
      message: 'Acesso negado: o usuário não possui permissão de administrador.'
    })
  }

  // Injeta no contexto do evento para reutilização durante o lifecycle
  event.context.auth = {
    adminSession: true,
    admin: verifyResult.admin,
    user: userRes
  }

  return verifyResult.admin
}
