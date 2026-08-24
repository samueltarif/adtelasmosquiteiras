import { ref } from 'vue'

const VISITOR_COOKIE_NAME = 'adt_vid'
const SESSION_COOKIE_NAME = 'adt_sid'
const LANDING_COOKIE_NAME = 'adt_landing_path'
const FIRST_TOUCH_STORAGE_KEY = 'adt_ft_context'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutos em milissegundos
const VISITOR_EXPIRATION_SECONDS = 365 * 24 * 60 * 60 // 365 dias

export interface FirstTouchContext {
  first_touch_channel: string
  first_touch_landing_path: string | null
  first_touch_referrer: string | null
  first_touch_utm_source: string | null
  first_touch_utm_medium: string | null
  first_touch_utm_campaign: string | null
  first_touch_utm_content: string | null
  first_touch_utm_term: string | null
  first_touch_gclid: string | null
  first_touch_gbraid: string | null
  first_touch_wbraid: string | null
  first_touch_fbclid: string | null
  first_touch_msclkid: string | null
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function useAnalyticsIdentity() {
  const visitorCookie = useCookie<string | null>(VISITOR_COOKIE_NAME, {
    maxAge: VISITOR_EXPIRATION_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  const sessionCookie = useCookie<string | null>(SESSION_COOKIE_NAME, {
    maxAge: 1800, // 30 minutos
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  const landingCookie = useCookie<string | null>(LANDING_COOKIE_NAME, {
    maxAge: 1800,
    path: '/',
    sameSite: 'lax'
  })

  function getOrCreateVisitorId(): string {
    if (!visitorCookie.value) {
      visitorCookie.value = generateUUID()
    }
    return visitorCookie.value
  }

  function getOrCreateSessionId(currentPath: string = '/'): { sessionId: string; isNewSession: boolean } {
    let isNewSession = false
    const now = Date.now()

    if (import.meta.client) {
      const lastActivity = parseInt(localStorage.getItem('adt_last_activity') || '0', 10)
      if (!sessionCookie.value || (now - lastActivity > SESSION_TIMEOUT_MS)) {
        sessionCookie.value = generateUUID()
        landingCookie.value = currentPath || '/'
        isNewSession = true
      }
      localStorage.setItem('adt_last_activity', now.toString())
    } else {
      if (!sessionCookie.value) {
        sessionCookie.value = generateUUID()
        landingCookie.value = currentPath || '/'
        isNewSession = true
      }
    }

    return { sessionId: sessionCookie.value, isNewSession }
  }

  function getSessionLandingPath(currentPath: string = '/'): string {
    if (!landingCookie.value) {
      landingCookie.value = currentPath || '/'
    }
    return landingCookie.value
  }

  /**
   * Grava o contexto completo do First Touch em localStorage para evitar enviar payload pesado em cabeçalhos HTTP.
   * Preserva permanentemente a primeira aquisição conhecida do visitante.
   */
  function setFirstTouchContextOnce(context: Partial<FirstTouchContext>) {
    if (import.meta.client) {
      const existing = localStorage.getItem(FIRST_TOUCH_STORAGE_KEY)
      if (!existing && context.first_touch_channel && context.first_touch_channel !== 'unknown') {
        const data: FirstTouchContext = {
          first_touch_channel: context.first_touch_channel || 'direct',
          first_touch_landing_path: context.first_touch_landing_path || null,
          first_touch_referrer: context.first_touch_referrer || null,
          first_touch_utm_source: context.first_touch_utm_source || null,
          first_touch_utm_medium: context.first_touch_utm_medium || null,
          first_touch_utm_campaign: context.first_touch_utm_campaign || null,
          first_touch_utm_content: context.first_touch_utm_content || null,
          first_touch_utm_term: context.first_touch_utm_term || null,
          first_touch_gclid: context.first_touch_gclid || null,
          first_touch_gbraid: context.first_touch_gbraid || null,
          first_touch_wbraid: context.first_touch_wbraid || null,
          first_touch_fbclid: context.first_touch_fbclid || null,
          first_touch_msclkid: context.first_touch_msclkid || null
        }
        localStorage.setItem(FIRST_TOUCH_STORAGE_KEY, JSON.stringify(data))
      }
    }
  }

  function getFirstTouchContext(): Partial<FirstTouchContext> {
    if (import.meta.client) {
      const stored = localStorage.getItem(FIRST_TOUCH_STORAGE_KEY)
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          // Fallback se JSON for inválido
        }
      }
    }
    return {
      first_touch_channel: 'direct',
      first_touch_landing_path: null,
      first_touch_referrer: null,
      first_touch_utm_source: null,
      first_touch_utm_medium: null,
      first_touch_utm_campaign: null,
      first_touch_utm_content: null,
      first_touch_utm_term: null,
      first_touch_gclid: null,
      first_touch_gbraid: null,
      first_touch_wbraid: null,
      first_touch_fbclid: null,
      first_touch_msclkid: null
    }
  }

  return {
    getOrCreateVisitorId,
    getOrCreateSessionId,
    getSessionLandingPath,
    setFirstTouchContextOnce,
    getFirstTouchContext,
    generateUUID
  }
}
