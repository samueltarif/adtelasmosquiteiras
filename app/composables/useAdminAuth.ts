import { ref, computed } from 'vue'

export interface AdminUser {
  id?: string
  userId?: string
  email: string
  role: string
}

// SESSION_STATE = 'authenticated' | 'unauthenticated' | 'unavailable'
export type SessionState = 'authenticated' | 'unauthenticated' | 'unavailable'

export function useAdminAuth() {
  const user = useState<AdminUser | null>('admin_user', () => null)
  const isChecking = useState<boolean>('admin_auth_checking', () => false)
  const sessionState = useState<SessionState>('admin_session_state', () => 'unauthenticated')
  const authError = ref<string | null>(null)

  const isAuthenticated = computed(() => sessionState.value === 'authenticated')
  const isUnavailable = computed(() => sessionState.value === 'unavailable')

  /**
   * Verifica a sessão ativa no servidor.
   *
   * PATCH 1.7:
   * - 401/403 -> unauthenticated + user.value=null
   * - 5xx / 503 / status 0 / network transport failure -> unavailable
   * - NETWORK_STATUS_0_POLICY=UNAVAILABLE (preserva user.value conhecido)
   */
  const checkSession = async () => {
    isChecking.value = true
    authError.value = null
    try {
      const fetcher = useRequestFetch()
      const res = await fetcher<{ authenticated: boolean; user: AdminUser | null }>('/api/admin/auth/session')
      if (res?.authenticated && res?.user) {
        user.value = res.user
        sessionState.value = 'authenticated'
      } else {
        user.value = null
        sessionState.value = 'unauthenticated'
      }
    } catch (err: any) {
      const status = err?.statusCode || err?.status || (err?.response && err.response.status) || 0
      if (status === 401 || status === 403) {
        user.value = null
        sessionState.value = 'unauthenticated'
      } else {
        // NETWORK_STATUS_0_POLICY=UNAVAILABLE
        // USE_ADMIN_AUTH_503_POLICY=PRESERVE_EXISTING_USER
        sessionState.value = 'unavailable'
        authError.value = 'INFRA_UNAVAILABLE'
        // user.value existente permanece preservado
      }
    } finally {
      isChecking.value = false
    }
    return sessionState.value
  }

  /**
   * Realiza login administrativo com e-mail e senha.
   */
  const login = async (email: string, password: string) => {
    authError.value = null
    try {
      const res = await $fetch<{ success: boolean; user: AdminUser }>('/api/admin/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      if (res?.success && res?.user) {
        user.value = res.user
        sessionState.value = 'authenticated'
        return { success: true }
      }
      throw new Error('Falha no login')
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'E-mail ou senha inválidos.'
      authError.value = message
      return { success: false, error: message }
    }
  }

  /**
   * Realiza logout administrativo e limpa os cookies de sessão.
   */
  const logout = async () => {
    try {
      await $fetch('/api/admin/auth/logout', { method: 'POST' })
    } catch {}
    user.value = null
    sessionState.value = 'unauthenticated'
    await navigateTo('/admin/login')
  }

  return {
    user,
    isAuthenticated,
    isUnavailable,
    sessionState,
    isChecking,
    authError,
    checkSession,
    login,
    logout
  }
}
