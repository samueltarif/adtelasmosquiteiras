import { getServiceMetadata } from '~/utils/ctaTaxonomy'
import { cleanWhatsappUrl, appendShortCodeToWhatsappUrl } from '~/utils/whatsappShortCode'
import { dispatchWhatsappTracking } from '~/utils/whatsappTrackingQueue'

export interface ClickTrackingContext {
  target: HTMLElement
  anchorEl: HTMLAnchorElement | null
  tipo: string
  path: string
  visitorId: string
  sessionId: string
  landingPath: string
  attr: Record<string, any>
  text: string
}

const anchorRestoreTimers = new WeakMap<HTMLAnchorElement, ReturnType<typeof setTimeout>>()

export function getCtaLocation(target: HTMLElement): string {
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

export function getServiceContext(target: HTMLElement, rawTarget?: HTMLElement | null): { serviceKey: string | null; serviceName: string | null } {
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

export function ensureWhatsappAnchorHasActiveRef(anchorEl: HTMLAnchorElement, target: HTMLElement, activeShortCode: string): void {
  if (!activeShortCode) return
  const rawHref = anchorEl.getAttribute('data-original-href') || cleanWhatsappUrl(anchorEl.href)
  const targetHref = appendShortCodeToWhatsappUrl(rawHref, activeShortCode, { replaceExisting: true })
  anchorEl.href = targetHref
  target.setAttribute('href', targetHref)
}

export function prepareWhatsappAnchorForNavigation(anchorEl: HTMLAnchorElement, target: HTMLElement, shortCode: string): void {
  // Preservar o href original limpo para garantir que cliques subsequentes no mesmo elemento gerem novos códigos
  if (!anchorEl.hasAttribute('data-original-href')) {
    const rawHref = anchorEl.getAttribute('href') || anchorEl.href
    anchorEl.setAttribute('data-original-href', rawHref.includes('Ref:') ? cleanWhatsappUrl(rawHref) : rawHref)
  }

  const baseCleanHref = anchorEl.getAttribute('data-original-href') || cleanWhatsappUrl(anchorEl.href)
  const targetHref = appendShortCodeToWhatsappUrl(baseCleanHref, shortCode, { replaceExisting: true })

  // Atualiza href do elemento para a navegação do clique
  anchorEl.setAttribute('href', targetHref)
  anchorEl.href = targetHref
  if (target !== anchorEl) {
    target.setAttribute('href', targetHref)
  }
  anchorEl.setAttribute('data-active-short-code', shortCode)

  // Cancela timer anterior especificamente deste anchor se houver
  const existingTimer = anchorRestoreTimers.get(anchorEl)
  if (existingTimer) {
    clearTimeout(existingTimer)
    anchorRestoreTimers.delete(anchorEl)
  }

  // Restaura o href original no DOM apenas após a janela de deduplicação (750ms)
  // garantindo que durante toda a janela de 700ms o elemento mantenha o short_code ativo.
  // O uso de WeakMap isola o timer por elemento, garantindo que um clique em outro CTA não cancele este timer.
  const timer = setTimeout(() => {
    if (anchorEl) {
      const cleanHref = anchorEl.getAttribute('data-original-href') || baseCleanHref
      anchorEl.setAttribute('href', cleanHref)
      anchorEl.href = cleanHref
      if (target !== anchorEl) {
        target.setAttribute('href', cleanHref)
      }
      anchorEl.removeAttribute('data-active-short-code')
    }
    anchorRestoreTimers.delete(anchorEl)
  }, 750)

  anchorRestoreTimers.set(anchorEl, timer)
}

export function buildClickPayload(
  ctx: ClickTrackingContext,
  eventId: string,
  serviceKey: string | null,
  serviceName: string | null,
  ctaLocation: string,
  shortCode?: string
): Record<string, any> {
  const basePayload: Record<string, any> = {
    event_id: eventId,
    visitor_id: ctx.visitorId,
    session_id: ctx.sessionId,
    tipo: ctx.tipo,
    origem: ctx.path || '/',
    cta_location: ctaLocation,
    service_key: serviceKey,
    service_name: serviceName,
    landing_path: ctx.landingPath,
    utm_source: ctx.attr.utm_source,
    utm_medium: ctx.attr.utm_medium,
    utm_campaign: ctx.attr.utm_campaign,
    utm_content: ctx.attr.utm_content,
    utm_term: ctx.attr.utm_term,
    google_campaign_id: ctx.attr.campaign_id || null,
    google_adgroup_id: ctx.attr.adgroup_id || null,
    google_creative_id: ctx.attr.creative || null,
    google_match_type: ctx.attr.matchtype || null,
    google_network: ctx.attr.network || null,
    google_device: ctx.attr.device || null,
    google_target_id: ctx.attr.target_id || null,
    gclid: ctx.attr.gclid,
    gbraid: ctx.attr.gbraid,
    wbraid: ctx.attr.wbraid,
    fbclid: ctx.attr.fbclid || null,
    msclkid: ctx.attr.msclkid || null,
    meta_campaign_id: ctx.attr.meta_campaign_id || null,
    meta_adset_id: ctx.attr.meta_adset_id || null,
    meta_ad_id: ctx.attr.meta_ad_id || null,
    meta_placement: ctx.attr.meta_placement || null,
    ttclid: ctx.attr.ttclid || null,
    tiktok_campaign_id: ctx.attr.tiktok_campaign_id || null,
    tiktok_adgroup_id: ctx.attr.tiktok_adgroup_id || null,
    tiktok_ad_id: ctx.attr.tiktok_ad_id || null,
    tiktok_creative_id: ctx.attr.tiktok_creative_id || null,
    tiktok_placement: ctx.attr.tiktok_placement || null,
    referrer: ctx.attr.referrer,
    channel: ctx.attr.channel,
    text: ctx.text.substring(0, 100)
  }

  if (shortCode) {
    basePayload.short_code = shortCode
  }

  return basePayload
}

export function dispatchClickTracking(
  tipo: string,
  payload: Record<string, any>,
  shortCode?: string
): void {
  if (tipo === 'whatsapp' && shortCode) {
    // Fila local com keepalive: true / sendBeacon (Regras 4 e 5)
    dispatchWhatsappTracking(payload.event_id, shortCode, payload)
    return
  }

  // Demais cliques (não-WhatsApp)
  $fetch('/api/track-click', {
    method: 'POST',
    body: payload
  }).catch(() => {
    // Silencioso — nunca interfere na experiência do usuário
  })
}
