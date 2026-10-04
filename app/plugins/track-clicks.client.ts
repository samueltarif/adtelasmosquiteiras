import { useAnalyticsIdentity } from '~/composables/useAnalyticsIdentity'
import { useAttribution } from '~/composables/useAttribution'
import { useWhatsappLeadGate } from '~/composables/useWhatsappLeadGate'
import { flushPendingWhatsappClicks } from '~/utils/whatsappTrackingQueue'
import { flushPendingWhatsappLeads } from '~/utils/whatsappLeadQueue'
import {
  getCtaLocation,
  getServiceContext,
  buildClickPayload,
  dispatchClickTracking
} from '~/utils/clickTrackerDispatcher'

export default defineNuxtPlugin(() => {
  if (typeof document === 'undefined') return

  const identity = useAnalyticsIdentity()
  const attribution = useAttribution()

  // Flush de payloads pendentes das filas locais de retry no carregamento da página
  try {
    flushPendingWhatsappClicks()
    flushPendingWhatsappLeads()
  } catch {}

  let lastClickTime = 0
  let lastClickKey = ''

  // Interceptação de clique real em fase de captura
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement)?.closest('a, button, [data-track-type]') as HTMLElement | null
    if (!target) return

    // Ignorar cliques dentro do próprio modal de gate do WhatsApp ou no botão de submit
    if (target.closest('[data-wa-gate-submit], [data-wa-gate-modal]')) return

    const anchorEl = (target.closest('a') || (target.tagName === 'A' ? target : null)) as HTMLAnchorElement | null
    const href = anchorEl?.getAttribute('href') || target.getAttribute('href') || ''
    const text = (target.textContent || '').toLowerCase().trim()
    const gtm = target.getAttribute('data-gtm') || ''
    const trackType = target.getAttribute('data-track-type') || target.closest('[data-track-type]')?.getAttribute('data-track-type') || ''
    const path = window.location.pathname
    if (path.startsWith('/admin')) return

    let tipo = ''

    // 1. Atributo declarativo explícito (ex: data-track-type="quote_cta")
    if (trackType === 'quote_cta') {
      tipo = 'quote_cta'
    }
    // 2. Links de WhatsApp por href ou atributo explícito
    else if (
      href.includes('wa.me') || 
      href.includes('whatsapp.com') || 
      href.includes('api.whatsapp.com') ||
      trackType === 'whatsapp' ||
      gtm.includes('whatsapp')
    ) {
      tipo = 'whatsapp'
    }
    // 3. Links de telefone (tel:)
    else if (href.startsWith('tel:')) {
      tipo = 'telefone'
    }
    // 4. Links para a página de contato ou orçamento (CTAs internos)
    else if (href.includes('/contato') || href.includes('/orcamento')) {
      tipo = 'internal_cta'
    }

    if (tipo === 'whatsapp') {
      // REGRA CRÍTICA: Primeiro clique no CTA NÃO cria lead, NÃO gera REF, NÃO grava no Supabase
      e.preventDefault()
      e.stopPropagation()

      const visitorId = identity.getOrCreateVisitorId()
      const { sessionId } = identity.getOrCreateSessionId(path)
      const landingPath = identity.getSessionLandingPath(path)
      const attrSnapshot = { ...attribution.getOrInitAttribution() }
      const firstTouchSnapshot = identity.getFirstTouchContext()
      const { serviceKey, serviceName } = getServiceContext(target, e.target as HTMLElement)
      const ctaLocation = getCtaLocation(target)
      const rawHref = anchorEl?.getAttribute('href') || target.getAttribute('href') || ''

      const gate = useWhatsappLeadGate()
      gate.openGate({
        originalHref: rawHref,
        ctaLocation,
        serviceKey,
        serviceName,
        path,
        landingPath,
        visitorId,
        sessionId,
        attrSnapshot,
        firstTouchSnapshot,
        text
      })
      return
    }

    // Demais tipos de cliques (quote_cta, telefone, internal_cta)
    if (tipo) {
      const now = Date.now()
      const ctaLocation = getCtaLocation(target)
      const dedupeKey = `${tipo}:${ctaLocation}:${path}`

      // Janela de deduplicação de 700ms para cliques repetidos acidentais
      if (dedupeKey === lastClickKey && (now - lastClickTime) < 700) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      lastClickKey = dedupeKey
      lastClickTime = now

      const visitorId = identity.getOrCreateVisitorId()
      const { sessionId } = identity.getOrCreateSessionId(path)
      const landingPath = identity.getSessionLandingPath(path)
      const attr = attribution.getOrInitAttribution()
      const { serviceKey, serviceName } = getServiceContext(target, e.target as HTMLElement)
      const eventId = identity.generateUUID()

      const payload = buildClickPayload(
        { target, anchorEl, tipo, path, visitorId, sessionId, landingPath, attr, text },
        eventId,
        serviceKey,
        serviceName,
        ctaLocation
      )

      // Envia telemetria para /api/track-click através de dispatchClickTracking
      dispatchClickTracking(tipo, payload)
    }
  }, { capture: true })
})
