/**
 * Helpers de Sessão e Token Refresh do Supabase para Admin Auth
 * Arquivo: server/utils/adminAuthSession.ts
 *
 * PATCH 5.0C.2: Modularização para limite LOC <= 200.
 */

import type { H3Event } from 'h3'
import { setAdminAuthCookies, clearAdminAuthCookies } from './adminAuthCookies.ts'

export interface SupabaseAuthConfig {
  supabaseUrl: string
  supabaseServiceRoleKey: string
}

/**
 * Valida o accessToken ou tenta refresh com refreshToken no Supabase Auth.
 */
export async function resolveSupabaseUser(
  event: H3Event,
  config: SupabaseAuthConfig,
  accessToken: string | null,
  refreshToken: string | null
): Promise<{ id: string; email?: string; role?: string } | null> {
  let userRes: { id: string; email?: string; role?: string } | null = null

  // 1. Tenta validar accessToken
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
      userRes = null
    }
  }

  // 2. Tenta renovação server-side com refreshToken
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
        body: { refresh_token: refreshToken }
      })

      if (refreshedSession?.access_token && refreshedSession?.user?.id) {
        userRes = refreshedSession.user
        setAdminAuthCookies(event, {
          accessToken: refreshedSession.access_token,
          refreshToken: refreshedSession.refresh_token,
          expiresIn: refreshedSession.expires_in
        })
      }
    } catch {
      clearAdminAuthCookies(event)
      return null
    }
  }

  return userRes
}
