import { ref } from 'vue'

const VISITOR_COOKIE_NAME = 'adt_vid'
const SESSION_COOKIE_NAME = 'adt_sid'
const LANDING_COOKIE_NAME = 'adt_landing_path'
const FIRST_TOUCH_COOKIE_NAME = 'adt_ft_channel'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutos em milissegundos
const VISITOR_EXPIRATION_SECONDS = 365 * 24 * 60 * 60 // 365 dias

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback seguro de UUID v4 caso crypto.randomUUID não esteja disponível
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

  const firstTouchCookie = useCookie<string | null>(FIRST_TOUCH_COOKIE_NAME, {
    maxAge: VISITOR_EXPIRATION_SECONDS,
    path: '/',
    sameSite: 'lax'
  })

  /**
   * Obtém ou cria o Visitor ID (adt_vid) persistente por 365 dias.
   * Não utiliza PII, IP ou User-Agent para derivar o ID.
   */
  function getOrCreateVisitorId(): string {
    if (!visitorCookie.value) {
      visitorCookie.value = generateUUID()
    }
    return visitorCookie.value
  }

  /**
   * Obtém ou cria a sessão atual (adt_sid).
   * Renova a expiração de 30 min se houver atividade contínua.
   * Cria um novo session_id se mais de 30 min de inatividade ocorrerem.
   */
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

  /**
   * Registra a Landing Page da Sessão caso seja uma nova sessão.
   */
  function getSessionLandingPath(currentPath: string = '/'): string {
    if (!landingCookie.value) {
      landingCookie.value = currentPath || '/'
    }
    return landingCookie.value
  }

  /**
   * Registra o First Touch Channel (Primeira origem de aquisição conhecida).
   * Jamais sobrescreve depois de gravado na primeira visita.
   */
  function setFirstTouchChannelOnce(channel: string) {
    if (!firstTouchCookie.value && channel && channel !== 'unknown') {
      firstTouchCookie.value = channel
    }
  }

  function getFirstTouchChannel(): string {
    return firstTouchCookie.value || 'direct'
  }

  return {
    getOrCreateVisitorId,
    getOrCreateSessionId,
    getSessionLandingPath,
    setFirstTouchChannelOnce,
    getFirstTouchChannel,
    generateUUID
  }
}
