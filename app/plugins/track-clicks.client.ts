import { useAnalyticsIdentity } from '~/composables/useAnalyticsIdentity'
import { useAttribution } from '~/composables/useAttribution'
import { SERVICE_TAXONOMY, getServiceMetadata } from '~/utils/ctaTaxonomy'
import { generateShortCode, appendShortCodeToWhatsappUrl, cleanWhatsappUrl, extractShortCodeFromMessage } from '~/utils/whatsappShortCode'
import { dispatchWhatsappTracking, flushPendingWhatsappClicks } from '~/utils/whatsappTrackingQueue'

export default defineNuxtPlugin(() => {
  if (typeof document === 'undefined') return

  const identity = useAnalyticsIdentity()
  const attribution = useAttribution()

  // Flush de payloads pendentes da fila local de retry no carregamento da página
  try {
    flushPendingWhatsappClicks()
  } catch {}

  let lastClickTime = 0
  let lastClickKey = ''

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

    if (key && !name) {
      const meta = getServiceMetadata(key)
      if (meta) name = meta.name
    }

    return { serviceKey: key, serviceName: name }
  }

  // Interceptação de clique real
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement)?.closest('a, button, [data-track-type]') as HTMLElement | null
    if (!target) return

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
    // 2. Links de WhatsApp (wa.me ou api.whatsapp.com ou whatsapp no text/gtm)
    else if (
      href.includes('wa.me') || 
      href.includes('whatsapp.com') || 
      href.includes('whatsapp') || 
      text.includes('whatsapp') ||
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

    // Se identificou um tipo de clique de intenção de contato rastreável, grava
    if (tipo) {
      const now = Date.now()
      const ctaLocation = getCtaLocation(target)
      const dedupeKey = `${tipo}:${ctaLocation}:${path}`

      // Trava de deduplicação de 700ms para cliques repetidos acidentais
      if (dedupeKey === lastClickKey && (now - lastClickTime) < 700) {
        return
      }
      lastClickKey = dedupeKey
      lastClickTime = now

      const visitorId = identity.getOrCreateVisitorId()
      const { sessionId } = identity.getOrCreateSessionId(path)
      const landingPath = identity.getSessionLandingPath(path)
      const attr = attribution.getOrInitAttribution()
      const { serviceKey, serviceName } = getServiceContext(target, e.target as HTMLElement)

      // Tratamento específico e atômico para WhatsApp
      if (tipo === 'whatsapp') {
        const shortCode = generateShortCode()
        const eventId = identity.generateUUID()

        if (anchorEl) {
          // 1. Preservar o href original limpo (sem Ref prévio) para garantir que cliques subsequentes
          // no mesmo botão sempre gerem códigos novos e independentes (Item 3 da Revisão de Segurança)
          if (!anchorEl.hasAttribute('data-original-href')) {
            const rawHref = anchorEl.getAttribute('href') || anchorEl.href
            anchorEl.setAttribute('data-original-href', cleanWhatsappUrl(rawHref))
          }

          const baseCleanHref = anchorEl.getAttribute('data-original-href') || cleanWhatsappUrl(anchorEl.href)
          const targetHref = appendShortCodeToWhatsappUrl(baseCleanHref, shortCode, { replaceExisting: true })

          // Atualiza href do elemento para a navegação do clique
          anchorEl.href = targetHref
          target.setAttribute('href', targetHref)

          // Restaura o href original no DOM após o despacho da navegação
          // Impedindo mutações permanentes que contaminem cliques futuros
          setTimeout(() => {
            if (anchorEl) {
              const cleanHref = anchorEl.getAttribute('data-original-href') || baseCleanHref
              anchorEl.href = cleanHref
              target.setAttribute('href', cleanHref)
              anchorEl.removeAttribute('data-short-code')
              anchorEl.removeAttribute('data-event-id')
            }
          }, 100)
        }

        const payload = {
          event_id: eventId,
          short_code: shortCode,
          visitor_id: visitorId,
          session_id: sessionId,
          tipo: 'whatsapp',
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
          google_campaign_id: attr.campaign_id || null,
          google_adgroup_id: attr.adgroup_id || null,
          google_creative_id: attr.creative || null,
          google_match_type: attr.matchtype || null,
          google_network: attr.network || null,
          google_device: attr.device || null,
          google_target_id: attr.target_id || null,
          gclid: attr.gclid,
          gbraid: attr.gbraid,
          wbraid: attr.wbraid,
          referrer: attr.referrer,
          channel: attr.channel,
          text: text.substring(0, 100)
        }

        // Fila local com keepalive: true / sendBeacon (Regras 4 e 5)
        dispatchWhatsappTracking(eventId, shortCode, payload)
        return
      }

      // Demais cliques (não-WhatsApp) seguem pipeline padrão existente
      const eventId = identity.generateUUID()
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
          google_campaign_id: attr.campaign_id || null,
          google_adgroup_id: attr.adgroup_id || null,
          google_creative_id: attr.creative || null,
          google_match_type: attr.matchtype || null,
          google_network: attr.network || null,
          google_device: attr.device || null,
          google_target_id: attr.target_id || null,
          gclid: attr.gclid,
          gbraid: attr.gbraid,
          wbraid: attr.wbraid,
          referrer: attr.referrer,
          channel: attr.channel,
          text: text.substring(0, 100)
        }
      }).catch(() => {
        // Silencioso — nunca interfere na experiência do usuário
      })
    }
  }, { passive: true, capture: true })
})
