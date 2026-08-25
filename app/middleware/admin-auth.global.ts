export default defineNuxtRouteMiddleware(async (to) => {
  // Executa apenas em rotas administrativas
  if (!to.path.startsWith('/admin')) {
    return
  }

  const { isAuthenticated, user, checkSession } = useAdminAuth()

  // Se o usuário ainda não foi verificado no client/SSR, verifica a sessão
  if (!user.value) {
    await checkSession()
  }

  const isLoginPage = to.path === '/admin/login'

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
})
