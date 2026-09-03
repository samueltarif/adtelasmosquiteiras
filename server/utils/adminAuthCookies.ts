/**
 * Utilitários de Cookies e CSRF para Sessão Administrativa
 * Arquivo: server/utils/adminAuthCookies.ts
 *
 * PATCH 5.0C.2: Modularização arquitetural para cumprimento de LOC <= 200.
 */

import type { H3Event } from 'h3'
import { getHeader, getCookie, setCookie, deleteCookie, createError } from 'h3'
import {
  ADMIN_AUTH_COOKIE_NAME,
  ADMIN_REFRESH_COOKIE_NAME,
  validateMutationOrigin,
  isExplicitDevOrTestEnvironment
} from '../shared/adminAuthCore.mjs'

export { isExplicitDevOrTestEnvironment }

/**
 * Define os cookies HTTP-only de sessão administrativa.
 * Propriedades estritas: httpOnly=true, secure por padrão (fail-closed, false apenas em dev/test), sameSite=lax, path=/
 */
export function setAdminAuthCookies(
  event: H3Event,
  tokens: { accessToken: string; refreshToken?: string; expiresIn?: number }
) {
  const isDevOrTest = isExplicitDevOrTestEnvironment()
  const secure = !isDevOrTest
  const maxAge = tokens.expiresIn || 60 * 60 * 24 * 7 // 7 dias default

  setCookie(event, ADMIN_AUTH_COOKIE_NAME, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge
  })

  if (tokens.refreshToken) {
    setCookie(event, ADMIN_REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 dias para refresh
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
 * Validação de CSRF / Same-Origin em requisições de mutação administrativa.
 */
export function enforceMutationCsrf(event: H3Event) {
  const method = (event.node?.req?.method || 'GET').toUpperCase()
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    const origin = getHeader(event, 'origin')
    const referer = getHeader(event, 'referer')
    const host = getHeader(event, 'host')
    const authorization = getHeader(event, 'authorization')
    const cookieHeader = getHeader(event, 'cookie') || ''
    const cookieToken = getCookie(event, ADMIN_AUTH_COOKIE_NAME)
    const cookieRefreshToken = getCookie(event, ADMIN_REFRESH_COOKIE_NAME)
    const hasAdminCookies = Boolean(
      cookieToken ||
      cookieRefreshToken ||
      cookieHeader.includes(ADMIN_AUTH_COOKIE_NAME) ||
      cookieHeader.includes(ADMIN_REFRESH_COOKIE_NAME)
    )
    const isDev = isExplicitDevOrTestEnvironment()
    const protocol = getHeader(event, 'x-forwarded-proto') || (isDev ? 'http' : 'https')

    const check = validateMutationOrigin(origin, referer, host, isDev, authorization, hasAdminCookies, protocol)
    if (!check.allowed) {
      throw createError({
        statusCode: check.statusCode,
        message: check.message
      })
    }
  }
}
