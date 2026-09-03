import type { H3Event } from 'h3'
import { getHeader, getCookie, createError } from 'h3'
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

import {
  setAdminAuthCookies,
  clearAdminAuthCookies,
  enforceMutationCsrf
} from './adminAuthCookies.ts'

import {
  resolveSupabaseUser,
  fetchAdminUserSingleFlight
} from './adminAuthSession.ts'

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
 * Guard Central de Autenticação e Autorização Administrativa.
 *
 * REGRAS DE EXECUÇÃO:
 * 1. CSRF Same-Origin check em mutações.
 * 2. Valida identidade via getClaims JWKS local (0 roundtrips de rede) ou refresh server-side com verificação criptográfica.
 * 3. Valida autorização estritamente por auth.users.id ↔ admin_users.user_id via Single-Flight.
 * 4. Valida se is_active === true e role permitida ('admin', 'superadmin').
 * 5. ADMIN_AUTH_FAIL_CLOSED = YES (zero fallback de e-mail / zero fabricação de superadmin / zero bypass hardcoded).
 *
 * @throws 401 se não autenticado ou falha no refresh
 * @throws 403 se usuário não for admin ativo ou possuir role não autorizada
 * @throws 503 em caso de falha de infraestrutura
 */
export async function requireActiveAdmin(
  event: H3Event,
  allowedRoles: string[] = ALLOWED_ADMIN_ROLES
): Promise<AdminIdentity> {
  const config = useRuntimeConfig()

  // 1. Proteção contra CSRF em endpoints mutáveis
  enforceMutationCsrf(event)

  // 2. Se já foi validado neste ciclo de request (cache por-request)
  if (event.context?.auth?.admin) {
    const cachedAdmin = event.context.auth.admin as AdminIdentity
    if (!cachedAdmin || cachedAdmin.isActive !== true) {
      throw createError({
        statusCode: 403,
        message: 'Acesso negado: a conta administrativa está inativa.'
      })
    }
    if (!cachedAdmin.role || !allowedRoles.includes(cachedAdmin.role)) {
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

  const accessToken = extractAuthToken(authHeader, cookieHeader, cookieToken)
  const refreshToken = extractRefreshToken(cookieHeader, cookieRefreshToken)

  if (!accessToken && !refreshToken) {
    throw createError({
      statusCode: 401,
      message: 'Autenticação necessária. Faça login no Painel Administrativo.'
    })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 503,
      message: 'Serviço de banco de dados temporariamente indisponível.'
    })
  }

  // 3. Validação de Identidade (getClaims local ou refresh server-side verificado)
  const userRes = await resolveSupabaseUser(
    event,
    {
      supabaseUrl: config.supabaseUrl,
      supabaseServiceRoleKey: config.supabaseServiceRoleKey,
      anonKey: (config as any).supabaseAnonKey || config.supabaseServiceRoleKey,
      publishableKey: (config as any).supabasePublishableKey
    },
    accessToken,
    refreshToken
  )

  if (!userRes?.id) {
    clearAdminAuthCookies(event)
    throw createError({
      statusCode: 401,
      message: 'Sessão inválida ou expirada. Faça login novamente.'
    })
  }

  // 4. Consulta a tabela public.admin_users por user_id estrito (Single-Flight + Fail-Closed)
  let adminRecords: any[] = []
  try {
    adminRecords = await fetchAdminUserSingleFlight(
      { supabaseUrl: config.supabaseUrl, supabaseServiceRoleKey: config.supabaseServiceRoleKey },
      userRes.id
    )
  } catch {
    console.error('[adminAuth] ADMIN_USERS_LOOKUP_FAILED')
    throw createError({
      statusCode: 503,
      message: 'Serviço de autorização temporariamente indisponível.'
    })
  }

  // 5. Verificação de autorização e role (ADMIN_AUTHORIZATION_AUTHORITY = PUBLIC_ADMIN_USERS)
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

  if (event.context) {
    event.context.auth = {
      adminSession: true,
      admin: verifyResult.admin,
      user: userRes
    }
  }

  return verifyResult.admin
}
