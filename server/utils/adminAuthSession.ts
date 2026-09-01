/**
 * Helpers de Sessão, JWKS getClaims e Token Refresh — Admin Auth
 * PATCH 1.6/5.0C.3: Least-privilege grant keys, fail-closed auth & opt-in test auth
 */

import type { H3Event } from 'h3'
import { createPublicKey, verify as cryptoVerify } from 'node:crypto'
import { createError } from 'h3'
import { setAdminAuthCookies, clearAdminAuthCookies } from './adminAuthCookies.ts'

export interface SupabaseAuthConfig {
  supabaseUrl: string; supabaseServiceRoleKey?: string; serviceRoleKey?: string; anonKey?: string; publishableKey?: string
}

export interface UserClaims { id: string; email?: string; role?: string }

export const JWKS_CACHE_TTL_MS = 10 * 60 * 1000
const JWKS_UNKNOWN_KID_COOLDOWN_MS = 60 * 1000
const ALLOWED_JWT_ALGS = ['ES256', 'RS256']
const jwksCacheByIssuer = new Map<string, { keys: any[]; fetchedAt: number }>()
const jwksInFlight = new Map<string, Promise<any[]>>()
const jwksLastForcedRefresh = new Map<string, number>()
const inFlightAdminLookups = new Map<string, Promise<any[]>>()

function normalizeIssuer(url: string): string { return (url || '').trim().replace(/\/+$/, '') }

export function clearJwksCacheForTest() {
  jwksCacheByIssuer.clear(); jwksInFlight.clear(); jwksLastForcedRefresh.clear()
}

export async function getSupabaseJwks(supabaseUrl: string, forceRefresh = false): Promise<any[]> {
  const issuerKey = normalizeIssuer(supabaseUrl)
  if (!issuerKey) return []
  const now = Date.now()
  const cached = jwksCacheByIssuer.get(issuerKey)
  if (!forceRefresh && cached && now - cached.fetchedAt < JWKS_CACHE_TTL_MS) return cached.keys

  const inflight = jwksInFlight.get(issuerKey)
  if (inflight) return inflight

  const fetchPromise = (async () => {
    try {
      const res = await $fetch<{ keys: any[] }>(`${issuerKey}/auth/v1/.well-known/jwks.json`, { timeout: 5000 })
      if (res?.keys && Array.isArray(res.keys)) {
        jwksCacheByIssuer.set(issuerKey, { keys: res.keys, fetchedAt: Date.now() })
        return res.keys
      }
      return []
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.status === 404) return []
      console.warn('[adminAuthSession] JWKS_FETCH_FAILED')
      throw createError({ statusCode: 503, message: 'Serviço de autenticação temporariamente indisponível.' })
    }
  })().finally(() => jwksInFlight.delete(issuerKey))

  jwksInFlight.set(issuerKey, fetchPromise)
  return fetchPromise
}

async function findJwkByKid(supabaseUrl: string, kid: string): Promise<any | null> {
  const issuerKey = normalizeIssuer(supabaseUrl)
  const now = Date.now()
  const keys = await getSupabaseJwks(supabaseUrl, false)
  const match = keys.find((k) => k.kid === kid)
  if (match) return match
  const lastForced = jwksLastForcedRefresh.get(issuerKey) || 0
  if (now - lastForced < JWKS_UNKNOWN_KID_COOLDOWN_MS) return null
  jwksLastForcedRefresh.set(issuerKey, now)
  const freshKeys = await getSupabaseJwks(supabaseUrl, true)
  return freshKeys.find((k) => k.kid === kid) || null
}

async function verifyViaUserEndpoint(token: string, config: SupabaseAuthConfig): Promise<UserClaims | null> {
  const grantKey = config.publishableKey || config.anonKey
  if (!config.supabaseUrl || !grantKey) return null
  try {
    const res = await $fetch<{ id: string; email?: string; role?: string }>(`${config.supabaseUrl}/auth/v1/user`, {
      headers: { 'apikey': grantKey, 'Authorization': `Bearer ${token}` }, timeout: 5000
    })
    return res?.id ? { id: res.id, email: res.email, role: res.role } : null
  } catch (err: any) {
    const status = err?.statusCode || err?.status || (err?.response && err.response.status) || 0
    if (status === 400 || status === 401 || status === 403) return null
    throw createError({ statusCode: 503, message: 'Serviço de autenticação temporariamente indisponível.' })
  }
}

export async function getClaims(token: string, supabaseUrl: string, config?: SupabaseAuthConfig): Promise<UserClaims | null> {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    if (!header || typeof header !== 'object' || !payload || typeof payload !== 'object' || !payload.sub) return null
    const nowSec = Math.floor(Date.now() / 1000)
    if (!payload.exp || typeof payload.exp !== 'number' || payload.exp <= nowSec) return null
    if (payload.iss !== `${normalizeIssuer(supabaseUrl)}/auth/v1`) return null
    const hasAud = Array.isArray(payload.aud) ? payload.aud.includes('authenticated') : payload.aud === 'authenticated'
    if (!hasAud) return null
    if (payload.nbf !== undefined && (typeof payload.nbf !== 'number' || payload.nbf > nowSec)) return null
    if (payload.iat !== undefined && (typeof payload.iat !== 'number' || payload.iat > nowSec + 60)) return null

    if (header.alg === 'HS256') return config ? verifyViaUserEndpoint(token, config) : null
    if (!ALLOWED_JWT_ALGS.includes(header.alg) || !header.kid) return null

    const matchingKey = await findJwkByKid(supabaseUrl, header.kid)
    if (!matchingKey || (matchingKey.alg && matchingKey.alg !== header.alg)) return null
    if (header.alg === 'ES256' && (matchingKey.kty !== 'EC' || (matchingKey.crv && matchingKey.crv !== 'P-256'))) return null
    if (header.alg === 'RS256' && matchingKey.kty !== 'RSA') return null
    if ((matchingKey.use && matchingKey.use !== 'sig') || (matchingKey.key_ops && !matchingKey.key_ops.includes('verify'))) return null

    const publicKey = createPublicKey({ key: matchingKey, format: 'jwk' })
    const isEc = header.alg === 'ES256' || matchingKey.kty === 'EC'
    const isVerified = cryptoVerify('SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), isEc ? { key: publicKey, dsaEncoding: 'ieee-p1363' } : publicKey, Buffer.from(parts[2], 'base64url'))
    return isVerified ? { id: payload.sub, email: payload.email, role: payload.role } : null
  } catch (err: any) {
    if (err?.statusCode === 503) throw err
    return null
  }
}

export async function fetchAdminUserSingleFlight(config: SupabaseAuthConfig, userId: string): Promise<any[]> {
  const issuerKey = normalizeIssuer(config?.supabaseUrl)
  const key = config?.supabaseServiceRoleKey || config?.serviceRoleKey || ''
  if (!issuerKey || !key || !userId) {
    throw createError({ statusCode: 503, message: 'Serviço de autorização temporariamente indisponível.' })
  }
  const flightKey = `${issuerKey}:${userId}`
  const existing = inFlightAdminLookups.get(flightKey)
  if (existing) return existing
  const lookupPromise = (async () => {
    try {
      const res = await $fetch<any[]>(`${issuerKey}/rest/v1/admin_users?user_id=eq.${userId}&select=*`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }, timeout: 7000
      })
      return Array.isArray(res) ? res : []
    } finally { inFlightAdminLookups.delete(flightKey) }
  })()
  inFlightAdminLookups.set(flightKey, lookupPromise)
  return lookupPromise
}

export async function resolveSupabaseUser(
  event: H3Event,
  config: SupabaseAuthConfig,
  accessToken: string | null,
  refreshToken: string | null
): Promise<UserClaims | null> {
  if (accessToken) {
    const claims = await getClaims(accessToken, config.supabaseUrl, config)
    if (claims?.id) return claims
  }

  if (refreshToken) {
    const grantKey = config.publishableKey || config.anonKey
    if (!config.supabaseUrl || !grantKey) throw createError({ statusCode: 503, message: 'Serviço de autenticação temporariamente indisponível.' })
    let refreshed: any
    try {
      refreshed = await $fetch<{ access_token: string; refresh_token: string; expires_in: number; user: { id: string; email?: string } }>(
        `${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
        { method: 'POST', headers: { 'apikey': grantKey, 'Content-Type': 'application/json' }, body: { refresh_token: refreshToken }, timeout: 8000 }
      )
    } catch (err: any) {
      const status = err?.statusCode || err?.status || (err?.response && err.response.status) || 0
      if (status === 400 || status === 401 || status === 422) { clearAdminAuthCookies(event); return null }
      console.error('[adminAuthSession] REFRESH_GRANT_INFRA_FAILURE')
      throw createError({ statusCode: 503, message: 'Serviço de autenticação temporariamente indisponível.' })
    }

    if (refreshed?.access_token && refreshed?.user?.id) {
      const newClaims = await getClaims(refreshed.access_token, config.supabaseUrl, config)
      if (!newClaims?.id || newClaims.id !== refreshed.user.id) { clearAdminAuthCookies(event); return null }
      setAdminAuthCookies(event, { accessToken: refreshed.access_token, refreshToken: refreshed.refresh_token, expiresIn: refreshed.expires_in })
      return newClaims
    }
    console.error('[adminAuthSession] REFRESH_RESPONSE_INVALID')
    throw createError({ statusCode: 503, message: 'Serviço de autenticação temporariamente indisponível.' })
  }
  return null
}
