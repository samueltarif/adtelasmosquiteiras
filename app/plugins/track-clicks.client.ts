import { useAnalyticsIdentity } from '~/composables/useAnalyticsIdentity'
import { useAttribution } from '~/composables/useAttribution'
import { SERVICE_TAXONOMY } from '~/utils/ctaTaxonomy'

export default defineNuxtPlugin(() => {
  if (typeof document === 'undefined') return

  const identity = useAnalyticsIdentity()
  const attribution = useAttribution()

  function getCtaLocation(target: HTMLElement): string {
    // 1. Explicit data-cta-location attribute on target or closest ancestor
    const explicitLocation = target.closest('[data-cta-location]')?.getAttribute('data-cta-location')
    if (explicitLocation) return explicitLocation

    // 2. DOM structural fallback
    if (target.closest('header')) return 'header'
    if (target.closest('footer')) return 'footer'
    if (target.closest('.hero, [class*="hero"]')) return 'hero'
    if (target.closest('#sticky-whatsapp, [class*="floating"], [class*="whatsapp-float"]')) return 'floating_whatsapp'
    if (target.closest('[class*="sticky-mobile"], [class*="mobile-cta"]')) return 'sticky_mobile'
    if (target.closest('.modal, [class*="modal"]')) return 'modal'
    if (target.closest('.service-card, [class*="card"]')) return 'service_card'

    return 'other'
  }

  function getServiceContext(target: HTMLElement, rawTarget?: HTMLElement | null): { serviceKey: string | null; serviceName: string | null } {
    let serviceEl = target.closest('[data-service-key]') as HTMLElement | null
    if (!serviceEl && rawTarget) {
      serviceEl = rawTarget.closest('[data-service-key]') as HTMLElement | null
    }
    if (!serviceEl) {
      const ctaEl = target.closest('[data-cta-location]')
      if (ctaEl && ctaEl.parentElement) {
        serviceEl = ctaEl.parentElement.closest('[data-service-key]') as HTMLElement | null
      }
    }

    if (!serviceEl) return { serviceKey: null, serviceName: null }

    const key = serviceEl.getAttribute('data-service-key') || null
    let name = serviceEl.getAttribute('data-service-name') || null

    if (key && !name && SERVICE_TAXONOMY[key]) {
      name = SERVICE_TAXONOMY[key].name
    }

    return { serviceKey: key, serviceName: name }
  }

  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement)?.closest('a, button') as HTMLElement | null
    if (!target) return

    const href = target.getAttribute('href') || ''
    const text = (target.textContent || '').toLowerCase().trim()
    const gtm = target.getAttribute('data-gtm') || ''
    const path = window.location.pathname

    let tipo = ''

    // 1. Links de WhatsApp (wa.me ou api.whatsapp.com ou whatsapp no text/gtm)
    if (
      href.includes('wa.me') || 
      href.includes('whatsapp.com') || 
      href.includes('whatsapp') || 
      text.includes('whatsapp') ||
      gtm.includes('whatsapp')
    ) {
      tipo = 'whatsapp'
    }
    // 2. Links de telefone (tel:)
    else if (href.startsWith('tel:')) {
      tipo = 'telefone'
    }
    // 3. Links para a página de contato ou orçamento (CTAs internos)
    else if (href.includes('/contato') || href.includes('/orcamento')) {
      tipo = 'internal_cta'
    }

    // Se identificou um tipo de clique de intenção de contato rastreável, grava
    if (tipo) {
      const visitorId = identity.getOrCreateVisitorId()
      const { sessionId } = identity.getOrCreateSessionId(path)
      const landingPath = identity.getSessionLandingPath(path)
      const attr = attribution.getOrInitAttribution()
      const eventId = identity.generateUUID()
      const ctaLocation = getCtaLocation(target)
      const { serviceKey, serviceName } = getServiceContext(target, e.target as HTMLElement)

      $fetch('/api/track-click', {
        method: 'POST',
        body: {
          event_id: eventId,
          visitor_id: visitorId,
          session_id: sessionId,
          tipo,
          origem: path || '/',
          cta_location: ctaLocation,
          service_key: serviceKey,
          service_name: serviceName,
          landing_path: landingPath,
          utm_source: attr.utm_source,
          utm_medium: attr.utm_medium,
          utm_campaign: attr.utm_campaign,
          utm_content: attr.utm_content,
          utm_term: attr.utm_term,
          gclid: attr.gclid,
          channel: attr.channel,
          text: text.substring(0, 100)
        }
      }).catch(() => {
        // Silencioso — nunca interfere na experiência do usuário
      })
    }
  }, { passive: true, capture: true })
})
