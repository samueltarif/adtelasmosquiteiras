/**
 * Helpers para o WhatsApp Lead Gate Global
 * Arquivo: app/utils/whatsappGateHelpers.ts
 */

export interface WhatsappGateContext {
  originalHref: string
  ctaLocation: string
  serviceKey: string | null
  serviceName: string | null
  path: string
  landingPath: string
  visitorId: string
  sessionId: string
  attrSnapshot: Record<string, any>
  firstTouchSnapshot?: Record<string, any> | null
  text?: string
}

export const GATE_SESSION_KEY = 'adt_wa_gate_session'

export function formatPhoneMask(val: string): string {
  if (!val) return ''
  let digits = val.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length > 11) digits = digits.slice(2)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export function openWhatsappWindow(targetHref: string): void {
  if (typeof window === 'undefined') return
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  if (isMobile) {
    window.open(targetHref, '_blank') || (window.location.href = targetHref)
  } else {
    window.open(targetHref, '_blank', 'noopener,noreferrer')
  }
}

export function pushGateSubmitEvents(context: WhatsappGateContext | null, shortCode: string): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'whatsapp_lead_submit',
    page_path: context?.path,
    cta_location: context?.ctaLocation,
    service_key: context?.serviceKey,
    short_code: shortCode
  })
  window.dataLayer.push({
    event: 'generate_lead',
    value: 1.0,
    currency: 'BRL',
    lead_type: 'whatsapp_gate',
    source: 'site_whatsapp_gate',
    page_path: context?.path,
    gclid: context?.attrSnapshot?.gclid || undefined
  })
  if ((window as any).gtag) {
    (window as any).gtag('event', 'generate_lead', {
      event_category: 'engagement',
      event_label: context?.ctaLocation || 'whatsapp_gate',
      value: 1.0,
      currency: 'BRL'
    })
  }
}

export function buildGatePayload(
  submissionId: string,
  eventId: string,
  shortCode: string,
  cleanNome: string,
  digits: string,
  existingLeadId: string | null,
  context: WhatsappGateContext | null
): Record<string, any> {
  const attr = context?.attrSnapshot || {}
  const ft = context?.firstTouchSnapshot
  const hasFt = !!(ft && ft.first_touch_channel)

  return {
    submission_id: submissionId,
    event_id: eventId,
    short_code: shortCode,
    nome: cleanNome,
    telefone: digits,
    lead_id: existingLeadId || undefined,
    origem: 'whatsapp_gate',
    cta_location: context?.ctaLocation,
    service_key: context?.serviceKey,
    service_name: context?.serviceName,
    landing_path: context?.landingPath,
    conversion_path: context?.path,
    visitor_id: context?.visitorId,
    session_id: context?.sessionId,
    channel: attr.channel,
    utm_source: attr.utm_source,
    utm_medium: attr.utm_medium,
    utm_campaign: attr.utm_campaign,
    utm_content: attr.utm_content,
    utm_term: attr.utm_term,
    google_campaign_id: attr.campaign_id || null,
    google_adgroup_id: attr.adgroup_id || null,
    google_creative_id: attr.creative_id || null,
    google_match_type: attr.match_type || null,
    google_network: attr.network || null,
    google_device: attr.device || null,
    google_target_id: attr.target_id || null,
    gclid: attr.gclid,
    gbraid: attr.gbraid,
    wbraid: attr.wbraid,
    fbclid: attr.fbclid || null,
    msclkid: attr.msclkid || null,
    meta_campaign_id: attr.meta_campaign_id || null,
    meta_adset_id: attr.meta_adset_id || null,
    meta_ad_id: attr.meta_ad_id || null,
    meta_placement: attr.meta_placement || null,
    ttclid: attr.ttclid || null,
    tiktok_campaign_id: attr.tiktok_campaign_id || null,
    tiktok_adgroup_id: attr.tiktok_adgroup_id || null,
    tiktok_ad_id: attr.tiktok_ad_id || null,
    tiktok_creative_id: attr.tiktok_creative_id || null,
    tiktok_placement: attr.tiktok_placement || null,
    referrer: attr.referrer,

    // First Touch Atômico Preservado
    first_touch_channel: hasFt ? ft.first_touch_channel : (attr.channel || 'direct'),
    first_touch_landing_path: hasFt ? (ft.first_touch_landing_path ?? null) : (context?.landingPath || null),
    first_touch_referrer: hasFt ? (ft.first_touch_referrer ?? null) : (attr.referrer || null),
    first_touch_utm_source: hasFt ? (ft.first_touch_utm_source ?? null) : (attr.utm_source || null),
    first_touch_utm_medium: hasFt ? (ft.first_touch_utm_medium ?? null) : (attr.utm_medium || null),
    first_touch_utm_campaign: hasFt ? (ft.first_touch_utm_campaign ?? null) : (attr.utm_campaign || null),
    first_touch_utm_content: hasFt ? (ft.first_touch_utm_content ?? null) : (attr.utm_content || null),
    first_touch_utm_term: hasFt ? (ft.first_touch_utm_term ?? null) : (attr.utm_term || null),
    first_touch_google_campaign_id: hasFt ? (ft.first_touch_google_campaign_id ?? null) : (attr.campaign_id || null),
    first_touch_google_adgroup_id: hasFt ? (ft.first_touch_google_adgroup_id ?? null) : (attr.adgroup_id || null),
    first_touch_google_creative_id: hasFt ? (ft.first_touch_google_creative_id ?? null) : (attr.creative_id || null),
    first_touch_google_match_type: hasFt ? (ft.first_touch_google_match_type ?? null) : (attr.match_type || null),
    first_touch_google_network: hasFt ? (ft.first_touch_google_network ?? null) : (attr.network || null),
    first_touch_google_device: hasFt ? (ft.first_touch_google_device ?? null) : (attr.device || null),
    first_touch_google_target_id: hasFt ? (ft.first_touch_google_target_id ?? null) : (attr.target_id || null),
    first_touch_gclid: hasFt ? (ft.first_touch_gclid ?? null) : (attr.gclid || null),
    first_touch_gbraid: hasFt ? (ft.first_touch_gbraid ?? null) : (attr.gbraid || null),
    first_touch_wbraid: hasFt ? (ft.first_touch_wbraid ?? null) : (attr.wbraid || null),
    first_touch_fbclid: hasFt ? (ft.first_touch_fbclid ?? null) : (attr.fbclid || null),
    first_touch_msclkid: hasFt ? (ft.first_touch_msclkid ?? null) : (attr.msclkid || null),
    first_touch_ttclid: hasFt ? (ft.first_touch_ttclid ?? null) : (attr.ttclid || null)
  }
}
