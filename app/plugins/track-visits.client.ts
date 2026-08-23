export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return

  // Deduplicação em memória para evitar disparo duplo simultâneo (ex: app:mounted + afterEach)
  let lastTrackedPath = ''
  let lastTrackedTime = 0

  // Gera um session ID único por sessão do navegador (sessionStorage)
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
    if (!path || path.startsWith('/admin')) return

    const now = Date.now()
    // Trava de deduplicação: descarta se for a mesma rota rastreada a menos de 1000ms
    if (path === lastTrackedPath && (now - lastTrackedTime) < 1000) {
      return
    }

    lastTrackedPath = path
    lastTrackedTime = now

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

  // Rastreia navegação inicial (hard load / F5) e trocas de rota SPA / Back / Forward
  const router = useRouter()
  router.afterEach((to) => {
    trackPage(to.path)
  })
})
