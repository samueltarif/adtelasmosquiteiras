import { createHash } from 'crypto'

export interface AttributionContext {
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
  gclid?: string | null
  gbraid?: string | null
  wbraid?: string | null
  fbclid?: string | null
  msclkid?: string | null
  referrer?: string | null
  landing_path?: string | null
}

export function classifyDevice(userAgent: string): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  if (!userAgent) return 'unknown'
  const ua = userAgent.toLowerCase()
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    return 'mobile'
  }
  return 'desktop'
}

export function classifyBot(userAgent: string): { isBot: boolean; botName: string | null } {
  if (!userAgent) return { isBot: false, botName: null }
  const ua = userAgent.toLowerCase()
  const bots = [
    { name: 'Googlebot', pattern: /googlebot/ },
    { name: 'Bingbot', pattern: /bingbot/ },
    { name: 'AhrefsBot', pattern: /ahrefsbot/ },
    { name: 'SemrushBot', pattern: /semrushbot/ },
    { name: 'YandexBot', pattern: /yandexbot/ },
    { name: 'DuckDuckBot', pattern: /duckduckbot/ },
    { name: 'Baiduspider', pattern: /baiduspider/ },
    { name: 'Generic Crawler', pattern: /(bot|crawler|spider|slurp|headlesschrome|puppeteer|lighthouse)/ }
  ]

  for (const b of bots) {
    if (b.pattern.test(ua)) {
      return { isBot: true, botName: b.name }
    }
  }

  return { isBot: false, botName: null }
}

export function classifyAcquisitionChannel(params: AttributionContext): string {
  const { gclid, gbraid, wbraid, fbclid, msclkid, utm_source, utm_medium, referrer } = params
  const source = (utm_source || '').toLowerCase()
  const medium = (utm_medium || '').toLowerCase()
  const ref = (referrer || '').toLowerCase()

  // 1. Google Ads (Identificador Pago Vence Referrer Orgânico)
  if (gclid || gbraid || wbraid || (source.includes('google') && (medium.includes('cpc') || medium.includes('paid') || medium.includes('ppc')))) {
    return 'google_ads'
  }

  // 2. Microsoft Ads / Bing Paid (Identificador Pago msclkid Vence Referrer Orgânico)
  if (msclkid || (source.includes('bing') && (medium.includes('cpc') || medium.includes('paid') || medium.includes('ppc')))) {
    return 'microsoft_ads'
  }

  // 3. Facebook / Meta Ads
  if (fbclid || (source.includes('facebook') && (medium.includes('cpc') || medium.includes('paid') || medium.includes('ppc')))) {
    return 'facebook_ads'
  }

  // 4. Instagram
  if (source.includes('instagram') || ref.includes('instagram.com') || ref.includes('l.instagram.com')) {
    return 'instagram'
  }

  // 5. Facebook Organic/Social
  if (source.includes('facebook') || ref.includes('facebook.com') || ref.includes('m.facebook.com')) {
    return 'facebook'
  }

  // 6. Google Organic
  if (source.includes('google') || ref.includes('google.com') || ref.includes('google.com.br')) {
    return 'google_organic'
  }

  // 7. Bing Organic
  if (source.includes('bing') || ref.includes('bing.com')) {
    return 'bing_organic'
  }

  // 8. Other Paid
  if (medium.includes('cpc') || medium.includes('paid') || medium.includes('banner') || medium.includes('ppc')) {
    return 'other_paid'
  }

  // 9. Direct
  if (!source && !ref) {
    return 'direct'
  }

  // 10. Referral
  if (ref) {
    return 'referral'
  }

  return 'unknown'
}

// In-Memory LRU Cache para Idempotência no Servidor (Best-effort em serverless)
const processedIds = new Set<string>()
const MAX_IDEMPOTENCY_CACHE = 5000

export function isIdempotentRequest(id: string | null | undefined): boolean {
  if (!id) return false
  if (processedIds.has(id)) {
    return true
  }
  if (processedIds.size >= MAX_IDEMPOTENCY_CACHE) {
    const firstItem = processedIds.values().next().value
    if (firstItem) processedIds.delete(firstItem)
  }
  processedIds.add(id)
  return false
}

export function generateIpHash(ipRaw: string): string {
  const cleanIp = (ipRaw || '0.0.0.0').split(',')[0].trim()
  return createHash('sha256').update(cleanIp + 'adt-salt-2026').digest('hex').substring(0, 16)
}
