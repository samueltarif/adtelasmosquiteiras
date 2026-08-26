import { ref, computed } from 'vue'

export interface AdminUser {
  id?: string
  userId?: string
  email: string
  role: string
}

export function useAdminAuth() {
  const user = useState<AdminUser | null>('admin_user', () => null)
  const isChecking = useState<boolean>('admin_auth_checking', () => false)
  const authError = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  /**
   * Verifica a sessão ativa no servidor (SSR e Client).
   */
  const checkSession = async () => {
    isChecking.value = true
    authError.value = null
    try {
      const fetcher = useRequestFetch()
      const res = await fetcher<{ authenticated: boolean; user: AdminUser | null }>('/api/admin/auth/session')
      if (res?.authenticated && res?.user) {
        user.value = res.user
      } else {
        user.value = null
      }
    } catch {
      user.value = null
    } finally {
      isChecking.value = false
    }
    return isAuthenticated.value
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
    await navigateTo('/admin/login')
  }

  return {
    user,
    isAuthenticated,
    isChecking,
    authError,
    checkSession,
    login,
    logout
  }
}
