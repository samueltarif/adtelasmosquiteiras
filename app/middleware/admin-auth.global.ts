export default defineNuxtRouteMiddleware(async (to) => {
  // Executa apenas em rotas administrativas
  if (!to.path.startsWith('/admin')) {
    return
  }

  const { isAuthenticated, isUnavailable, sessionState, user, checkSession } = useAdminAuth()

  // Se o usuário ainda não foi verificado no client/SSR, verifica a sessão
  if (!user.value && sessionState.value === 'unauthenticated') {
    await checkSession()
  }

  const isLoginPage = to.path === '/admin/login'

  // MIDDLEWARE_503_EXISTING_AUTH_POLICY=PRESERVE
  // MIDDLEWARE_503_NO_KNOWN_AUTH_POLICY=BLOCK_UNAVAILABLE
  if (isUnavailable.value) {
    if (user.value) {
      // Usuário previamente autenticado: preserva e permite permanecer na rota atual sem redirect para login
      return
    }
    // Fresh session (user=null) com 503 em rota privada:
    // NÃO permitir renderização normal da rota privada (fail-closed de disponibilidade)
    if (!isLoginPage) {
      return abortNavigation(
        createError({
          statusCode: 503,
          statusMessage: 'Serviço de autenticação temporariamente indisponível. Tente novamente em instantes.',
          fatal: false
        })
      )
    }
    // Na própria página de login, permite renderizar para exibir o aviso de indisponibilidade
    return
  }

  // Caso 1: Rota privada sem autenticação -> redireciona para login
  if (!isAuthenticated.value && !isLoginPage) {
    return navigateTo({
      path: '/admin/login',
      query: to.fullPath !== '/admin/dashboard' && to.fullPath !== '/admin' ? { redirect: to.fullPath } : undefined
    })
  }

  // Caso 2: Rota de login com usuário já autenticado -> redireciona para o dashboard
  if (isAuthenticated.value && isLoginPage) {
    const redirectPath = (to.query.redirect as string) || '/admin/dashboard'
    return navigateTo(redirectPath)
  }

  // Caso 3: Rota raiz /admin ou /admin/ -> redireciona para /admin/dashboard
  if (isAuthenticated.value && (to.path === '/admin' || to.path === '/admin/')) {
    return navigateTo('/admin/dashboard')
  }
})
