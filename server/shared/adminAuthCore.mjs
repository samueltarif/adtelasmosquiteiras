/**
 * Utilitários puros de autenticação e autorização administrativa
 * Arquivo: server/shared/adminAuthCore.mjs
 *
 * PATCH 1.7:
 * - MISSING_ADMIN_ROLE_POLICY=DENY (deny access on missing/empty role)
 * - CSRF_POLICY=TRUE_SAME_ORIGIN (scheme + hostname + port validation)
 */

import { validateMediaAccess, sanitizeMediaMetadata } from './adminMediaAuthCore.mjs'

export const ADMIN_AUTH_COOKIE_NAME = 'sb_admin_token'
export const ADMIN_REFRESH_COOKIE_NAME = 'sb_admin_refresh_token'
export const ALLOWED_ADMIN_ROLES = ['admin', 'superadmin']

export function parseAdminAuthCookies(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return null
  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split('=')
    if (rawName === ADMIN_AUTH_COOKIE_NAME) {
      const val = rest.join('=').trim()
      if (val) return decodeURIComponent(val)
    }
  }
  return null
}

export function parseAdminRefreshCookie(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return null
  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split('=')
    if (rawName === ADMIN_REFRESH_COOKIE_NAME) {
      const val = rest.join('=').trim()
      if (val) return decodeURIComponent(val)
    }
  }
  return null
}

export function extractAuthToken(authHeader, cookieHeader, cookieToken = null) {
  if (cookieToken && typeof cookieToken === 'string' && cookieToken.trim()) return cookieToken.trim()
  if (authHeader && typeof authHeader === 'string' && authHeader.trim().toLowerCase().startsWith('bearer ')) {
    const t = authHeader.trim().slice(7).trim()
    if (t) return t
  }
  if (cookieHeader && typeof cookieHeader === 'string') {
    if (cookieHeader.includes('=')) {
      return parseAdminAuthCookies(cookieHeader)
    }
    return cookieHeader.trim()
  }
  return null
}

export function extractRefreshToken(cookieHeader, cookieRefreshToken = null) {
  if (cookieRefreshToken && typeof cookieRefreshToken === 'string' && cookieRefreshToken.trim()) return cookieRefreshToken.trim()
  if (cookieHeader && typeof cookieHeader === 'string') {
    if (cookieHeader.includes('=')) {
      return parseAdminRefreshCookie(cookieHeader)
    }
    return cookieHeader.trim()
  }
  return null
}

export function verifyActiveAdmin(supabaseUser, adminRecords, allowedRoles = ALLOWED_ADMIN_ROLES) {
  if (!supabaseUser || !supabaseUser.id) {
    return { authorized: false, reason: 'UNAUTHENTICATED' }
  }

  if (!Array.isArray(adminRecords) || adminRecords.length === 0) {
    return { authorized: false, reason: 'NON_ADMIN' }
  }

  const matchingAdmin = adminRecords.find((a) => a.user_id === supabaseUser.id)
  if (!matchingAdmin) {
    return { authorized: false, reason: 'NON_ADMIN' }
  }

  if (matchingAdmin.is_active !== true) {
    return { authorized: false, reason: 'INACTIVE_ADMIN' }
  }

  // MISSING_ADMIN_ROLE_POLICY=DENY: role ausente/null/vazio -> UNAUTHORIZED_ROLE
  if (!matchingAdmin.role || typeof matchingAdmin.role !== 'string' || !matchingAdmin.role.trim()) {
    return { authorized: false, reason: 'UNAUTHORIZED_ROLE' }
  }

  const role = matchingAdmin.role.trim().toLowerCase()
  if (!allowedRoles.includes(role)) {
    return { authorized: false, reason: 'UNAUTHORIZED_ROLE' }
  }

  return {
    authorized: true,
    admin: {
      adminId: matchingAdmin.id,
      userId: supabaseUser.id,
      email: matchingAdmin.email || supabaseUser.email || '',
      role,
      isActive: true
    }
  }
}

export function validateMutationOrigin(
  originHeader,
  refererHeader,
  hostHeader,
  isDev = false,
  authorizationHeader = null,
  hasAdminCookies = false,
  protocol = 'https'
) {
  // CSRF_MISSING_HOST_POLICY=REJECT: Host ausente em mutação deve ser rejeitado (403)
  if (!hostHeader || typeof hostHeader !== 'string' || !hostHeader.trim()) {
    return { allowed: false, statusCode: 403, message: 'Acesso negado: Host ausente.' }
  }

  const cleanOrigin = (originHeader && typeof originHeader === 'string' && originHeader.trim()) ? originHeader.trim() : null
  const cleanReferer = (refererHeader && typeof refererHeader === 'string' && refererHeader.trim()) ? refererHeader.trim() : null

  // CSRF_MISSING_ORIGIN_REFERER_POLICY=FAIL_CLOSED_PRODUCTION
  // Em produção, se Origin e Referer estiverem ausentes, rejeita incondicionalmente com 403.
  if (!cleanOrigin && !cleanReferer) {
    if (isDev && !hasAdminCookies && authorizationHeader && typeof authorizationHeader === 'string' && authorizationHeader.trim().toLowerCase().startsWith('bearer ')) {
      return { allowed: true, statusCode: 200, message: 'OK' }
    }
    return {
      allowed: false,
      statusCode: 403,
      message: 'Acesso negado: Origin e Referer ausentes. Requisição rejeitada por política de segurança CSRF.'
    }
  }

  const cleanProto = (protocol || (isDev ? 'http' : 'https')).replace(/:$/, '')
  let expectedOrigin
  try {
    expectedOrigin = new URL(`${cleanProto}://${hostHeader.trim()}`).origin.toLowerCase()
  } catch {
    return { allowed: false, statusCode: 403, message: 'Acesso negado: Host inválido.' }
  }

  if (cleanOrigin) {
    try {
      const originUrl = new URL(cleanOrigin)
      const originVal = originUrl.origin.toLowerCase()
      if (originVal === expectedOrigin) return { allowed: true, statusCode: 200, message: 'OK' }
      if (isDev && (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1')) {
        return { allowed: true, statusCode: 200, message: 'OK' }
      }
      return {
        allowed: false,
        statusCode: 403,
        message: 'Acesso negado: solicitação cross-site não autorizada (Origin mismatch).'
      }
    } catch {
      return { allowed: false, statusCode: 403, message: 'Acesso negado: Origin inválido.' }
    }
  }

  if (cleanReferer) {
    try {
      const refererUrl = new URL(cleanReferer)
      const refererVal = refererUrl.origin.toLowerCase()
      if (refererVal === expectedOrigin) return { allowed: true, statusCode: 200, message: 'OK' }
      if (isDev && (refererUrl.hostname === 'localhost' || refererUrl.hostname === '127.0.0.1')) {
        return { allowed: true, statusCode: 200, message: 'OK' }
      }
      return {
        allowed: false,
        statusCode: 403,
        message: 'Acesso negado: solicitação cross-site não autorizada (Referer mismatch).'
      }
    } catch {
      return { allowed: false, statusCode: 403, message: 'Acesso negado: Referer inválido.' }
    }
  }

  return { allowed: false, statusCode: 403, message: 'Acesso negado: solicitação rejeitada por política de segurança CSRF.' }
}

export function isExplicitDevOrTestEnvironment() {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
}

export { validateMediaAccess, sanitizeMediaMetadata }
