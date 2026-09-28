/**
 * Classificador e Normalizador Canônico de Canais de Tráfego
 * Arquivo: app/utils/trafficChannelClassifier.ts
 *
 * Taxonomia de 13 Canais Canônicos:
 * 1. google_ads, 2. microsoft_ads, 3. tiktok_ads, 4. instagram_ads,
 * 5. facebook_ads, 6. meta_ads, 7. tiktok_organic, 8. instagram_organic,
 * 9. facebook_organic, 10. google_organic, 11. other_paid, 12. direct, 13. referral
 */

export interface ChannelClassificationParams {
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
  ttclid?: string | null
  referrer?: string | null
}

const PAID_MEDIUM_EXACT = new Set([
  'cpc',
  'paid',
  'paid_social',
  'paidsocial',
  'ads',
  'ppc',
  'display',
  'banner',
  'cpa',
  'cpm'
])

export function normalizeTrafficSource(rawSource?: string | null): string {
  if (!rawSource) return ''
  const trimmed = String(rawSource).trim().toLowerCase()
  if (!trimmed) return ''

  if (trimmed === 'ig' || trimmed === 'instagram' || trimmed.startsWith('instagram')) {
    return 'instagram'
  }
  if (trimmed === 'fb' || trimmed === 'facebook' || trimmed.startsWith('facebook')) {
    return 'facebook'
  }
  if (trimmed === 'tt' || trimmed === 'tiktok' || trimmed.startsWith('tiktok')) {
    return 'tiktok'
  }
  if (trimmed === 'google') {
    return 'google'
  }
  if (trimmed === 'bing') {
    return 'bing'
  }
  return trimmed
}

export function normalizeTrafficMedium(rawMedium?: string | null): string {
  if (!rawMedium) return ''
  return String(rawMedium).trim().toLowerCase()
}

export function isPaidMedium(medium: string): boolean {
  if (!medium) return false
  if (PAID_MEDIUM_EXACT.has(medium)) return true
  return medium.includes('cpc') || medium.includes('paid') || medium.includes('ppc')
}

export function extractReferrerHostname(referrer?: string | null): string {
  if (!referrer) return ''
  const trimmed = String(referrer).trim().toLowerCase()
  if (!trimmed) return ''
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    return url.hostname
  } catch {
    return trimmed.split('/')[0] || ''
  }
}

export function isInstagramReferrer(hostname: string): boolean {
  return hostname === 'instagram.com' || hostname.endsWith('.instagram.com')
}

export function isFacebookReferrer(hostname: string): boolean {
  return (
    hostname === 'facebook.com' ||
    hostname.endsWith('.facebook.com') ||
    hostname === 'fb.com' ||
    hostname.endsWith('.fb.com')
  )
}

export function isTikTokReferrer(hostname: string): boolean {
  return hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com')
}

export function isGoogleReferrer(hostname: string): boolean {
  if (!hostname) return false
  return /(^|\.)google\.(com(\.[a-z]{2})?|[a-z]{2}(\.[a-z]{2})?)$/i.test(hostname)
}

export function isBingReferrer(hostname: string): boolean {
  if (!hostname) return false
  return hostname === 'bing.com' || hostname.endsWith('.bing.com')
}

export function classifyClientChannel(params: ChannelClassificationParams): string {
  const normSource = normalizeTrafficSource(params.utm_source)
  const normMedium = normalizeTrafficMedium(params.utm_medium)
  const refHost = extractReferrerHostname(params.referrer)
  const isPaid = isPaidMedium(normMedium)

  const hasGoogleClickId = !!(params.gclid || params.gbraid || params.wbraid)
  const hasMsClickId = !!params.msclkid
  const hasTtclid = !!params.ttclid
  const hasFbclid = !!params.fbclid

  // 1. GOOGLE ADS (Click IDs do Google ou Google + Pago têm PRECEDÊNCIA MÁXIMA)
  if (hasGoogleClickId || (normSource === 'google' && isPaid)) {
    return 'google_ads'
  }

  // 2. MICROSOFT ADS (msclkid ou Bing + Pago)
  if (hasMsClickId || (normSource === 'bing' && isPaid)) {
    return 'microsoft_ads'
  }

  // 3. TIKTOK ADS (ttclid presente OU (source=tiktok E medium pago))
  if (hasTtclid || (normSource === 'tiktok' && isPaid)) {
    return 'tiktok_ads'
  }

  // 4. INSTAGRAM ADS (source instagram E (medium pago OU fbclid))
  if (normSource === 'instagram' && (isPaid || hasFbclid)) {
    return 'instagram_ads'
  }

  // 5. FACEBOOK ADS (source facebook E (medium pago OU fbclid))
  if (normSource === 'facebook' && (isPaid || hasFbclid)) {
    return 'facebook_ads'
  }

  // 6. META ADS GENÉRICO (fbclid presente SEM source específico de IG ou FB)
  if (hasFbclid) {
    return 'meta_ads'
  }

  // 7. TIKTOK ORGÂNICO (source tiktok ou referrer tiktok.com legítimo não pago)
  if (normSource === 'tiktok' || isTikTokReferrer(refHost)) {
    return 'tiktok_organic'
  }

  // 8. INSTAGRAM ORGÂNICO (source instagram ou referrer de instagram.com não pago)
  if (normSource === 'instagram' || isInstagramReferrer(refHost)) {
    return 'instagram_organic'
  }

  // 9. FACEBOOK ORGÂNICO (source facebook ou referrer de facebook.com não pago)
  if (normSource === 'facebook' || isFacebookReferrer(refHost)) {
    return 'facebook_organic'
  }

  // 10. GOOGLE ORGÂNICO (source google sem pago ou referrer do Google)
  if (normSource === 'google' || isGoogleReferrer(refHost)) {
    return 'google_organic'
  }

  // 11. OTHER PAID (medium pago não mapeado anteriormente)
  if (isPaid) {
    return 'other_paid'
  }

  // 12. DIRECT (sem source, sem identificador de clique, sem referrer externo)
  if (!normSource && !refHost) {
    return 'direct'
  }

  // 13. REFERRAL (demais referrers externos ou source sem medium pago)
  if (refHost || normSource) {
    return 'referral'
  }

  return 'direct'
}
