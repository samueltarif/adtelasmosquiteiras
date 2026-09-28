import { useAnalyticsIdentity } from '~/composables/useAnalyticsIdentity'
import { useAttribution } from '~/composables/useAttribution'
import { generateShortCode } from '~/utils/whatsappShortCode'
import { flushPendingWhatsappClicks } from '~/utils/whatsappTrackingQueue'
import {
  getCtaLocation,
  getServiceContext,
  prepareWhatsappAnchorForNavigation,
  ensureWhatsappAnchorHasActiveRef,
  buildClickPayload,
  dispatchClickTracking
} from '~/utils/clickTrackerDispatcher'

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
  let lastActiveShortCode = ''

  // Interceptação de clique real em fase de captura
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

      // Janela de deduplicação de 700ms para cliques repetidos acidentais
      if (dedupeKey === lastClickKey && (now - lastClickTime) < 700) {
        if (tipo === 'whatsapp' && anchorEl && lastActiveShortCode) {
          ensureWhatsappAnchorHasActiveRef(anchorEl, target, lastActiveShortCode)
        }
        // Cancela a navegação concorrente/redundante durante a janela de deduplicação
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

      let shortCode: string | undefined

      if (tipo === 'whatsapp') {
        shortCode = generateShortCode()
        lastActiveShortCode = shortCode
        if (anchorEl) {
          prepareWhatsappAnchorForNavigation(anchorEl, target, shortCode)
        }
      }

      const payload = buildClickPayload(
        { target, anchorEl, tipo, path, visitorId, sessionId, landingPath, attr, text },
        eventId,
        serviceKey,
        serviceName,
        ctaLocation,
        shortCode
      )

      // Envia telemetria para /api/track-click através de dispatchClickTracking
      dispatchClickTracking(tipo, payload, shortCode)
    }
  }, { capture: true })
})
