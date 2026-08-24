import { useAnalyticsIdentity } from '~/composables/useAnalyticsIdentity'
import { useAttribution } from '~/composables/useAttribution'

export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return

  const identity = useAnalyticsIdentity()
  const attribution = useAttribution()

  let lastTrackedPath = ''
  let lastTrackedTime = 0

  const trackPage = (path: string) => {
    // Ignora rotas admin
    if (!path || path.startsWith('/admin')) return

    const now = Date.now()
    // Trava de deduplicação client-side para o mesmo path dentro de 1000ms
    if (path === lastTrackedPath && (now - lastTrackedTime) < 1000) {
      return
    }

    lastTrackedPath = path
    lastTrackedTime = now

    const visitorId = identity.getOrCreateVisitorId()
    const { sessionId } = identity.getOrCreateSessionId(path)
    const landingPath = identity.getSessionLandingPath(path)
    const attr = attribution.getOrInitAttribution()
    const eventId = identity.generateUUID()

    // Registrar First Touch se for um canal válido
    identity.setFirstTouchChannelOnce(attr.channel)

    // Fire-and-forget com beacon/fetch keepalive
    $fetch('/api/track-visit', {
      method: 'POST',
      body: {
        event_id: eventId,
        visitor_id: visitorId,
        session_id: sessionId,
        path,
        landing_path: landingPath,
        referrer: attr.referrer,
        utm_source: attr.utm_source,
        utm_medium: attr.utm_medium,
        utm_campaign: attr.utm_campaign,
        utm_content: attr.utm_content,
        utm_term: attr.utm_term,
        gclid: attr.gclid,
        channel: attr.channel
      }
    }).catch(() => {
      // Silencioso — rastreamento nunca deve quebrar a experiência
    })
  }

  // Rastreia navegação SPA / Back / Forward
  const router = useRouter()
  router.afterEach((to) => {
    trackPage(to.path)
  })
})
