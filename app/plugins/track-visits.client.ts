export default defineNuxtPlugin((nuxtApp) => {
  // Gera um session ID único por sessão do navegador
  const getSessionId = () => {
    if (typeof sessionStorage === 'undefined') return ''
    let sid = sessionStorage.getItem('adt_sid')
    if (!sid) {
      sid = Math.random().toString(36).substring(2) + Date.now().toString(36)
      sessionStorage.setItem('adt_sid', sid)
    }
    return sid
  }

  const trackPage = (path: string) => {
    // Ignora rotas admin
    if (path.startsWith('/admin')) return

    // Fire-and-forget — não bloqueia navegação
    $fetch('/api/track-visit', {
      method: 'POST',
      body: {
        path,
        referrer: document.referrer || null,
        sessionId: getSessionId()
      }
    }).catch(() => {
      // Silencioso — rastreamento nunca deve quebrar a experiência
    })
  }

  // Rastreia a página inicial
  nuxtApp.hook('app:mounted', () => {
    trackPage(window.location.pathname)
  })

  // Rastreia cada mudança de rota (SPA navigation)
  const router = useRouter()
  router.afterEach((to) => {
    trackPage(to.path)
  })
})
