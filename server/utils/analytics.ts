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

export const ALLOWED_CTA_LOCATIONS = new Set([
  'header',
  'hero',
  'footer',
  'floating_whatsapp',
  'sticky_mobile',
  'service_card',
  'service_page',
  'quote_form',
  'contact_form',
  'cep_result',
  'modal',
  'faq',
  'other'
])

export const CANONICAL_SERVICE_TAXONOMY: Record<string, string> = {
  // Telas Mosquiteiras
  telas_janelas: 'Telas Mosquiteiras para Janelas',
  telas_portas: 'Telas Mosquiteiras para Portas',
  telas_varandas: 'Telas Mosquiteiras para Varandas',
  telas_sacadas: 'Telas Mosquiteiras para Sacadas',
  telas_apartamentos: 'Telas Mosquiteiras para Apartamentos',
  telas_banheiro: 'Telas Mosquiteiras para Banheiro',
  telas_correr: 'Telas Mosquiteiras de Correr',
  telas_removiveis: 'Telas Mosquiteiras Removíveis',
  telas_perfis: 'Telas Mosquiteiras com Perfis',
  telas_basculantes: 'Telas Mosquiteiras para Basculantes',
  telas_pivotantes: 'Telas Mosquiteiras Pivotantes',
  telas_especiais: 'Telas Mosquiteiras Especiais',
  telas_anti_pernilongos: 'Telas Mosquiteiras Anti-Pernilongos',
  telas_fachadas: 'Telas Mosquiteiras para Fachadas',
  telas_coberturas: 'Telas Mosquiteiras para Coberturas',
  telas_restaurantes: 'Telas Mosquiteiras para Restaurantes',
  telas_industrias: 'Telas Mosquiteiras para Indústrias',
  pet_screen: 'Telas Mosquiteiras Pet Screen',

  // Redes de Proteção
  redes_janelas: 'Redes de Proteção para Janelas',
  redes_sacadas: 'Redes de Proteção para Sacadas e Varandas',
  redes_pets: 'Redes de Proteção para Gatos e Pets',
  redes_criancas: 'Redes de Proteção para Crianças',
  redes_escadas: 'Redes de Proteção para Escadas e Mezaninos',

  // Vidraçaria
  vidracaria: 'Serviços de Vidraçaria'
}

// Mapeamento de Alias/Variações comuns para Chaves Canônicas
export const SERVICE_KEY_ALIASES: Record<string, string> = {
  telas_removivel: 'telas_removiveis',
  telas_basculante: 'telas_basculantes',
  telas_pivotante: 'telas_pivotantes',
  telas_aluminio: 'telas_perfis',
  telas_acoinox: 'telas_especiais',
  telas_pernilongos: 'telas_anti_pernilongos',
  redes_gatos: 'redes_pets',
  redes_varandas: 'redes_sacadas',
  redes_apartamentos: 'redes_janelas',
  redes_portas: 'redes_janelas',
  redes_basculantes: 'redes_janelas',
  redes_cachorros: 'redes_pets',
  redes_animais: 'redes_pets',
  redes_idosos: 'redes_criancas',
  redes_piscinas: 'redes_sacadas',
  redes_telhados: 'redes_escadas',
  redes_portoes: 'redes_janelas',
  redes_muros: 'redes_escadas',
  redes_coberturas: 'redes_escadas'
}

export function validateCtaLocation(location: string | null | undefined): string {
  if (!location) return 'other'
  return ALLOWED_CTA_LOCATIONS.has(location) ? location : 'other'
}

export function normalizeActionType(type: string | null | undefined): string {
  if (!type) return 'other'
  if (type === 'cta_interno') return 'internal_cta'
  return type
}

export function resolveCanonicalService(key: string | null | undefined): { service_key: string | null; service_name: string | null } {
  if (!key || typeof key !== 'string') {
    return { service_key: null, service_name: null }
  }
  const cleanKey = key.trim()
  
  // 1. Tentar chave canônica direta
  if (CANONICAL_SERVICE_TAXONOMY[cleanKey]) {
    return { service_key: cleanKey, service_name: CANONICAL_SERVICE_TAXONOMY[cleanKey] }
  }

  // 2. Tentar alias conhecido (ex: telas_removivel -> telas_removiveis)
  const canonicalKey = SERVICE_KEY_ALIASES[cleanKey]
  if (canonicalKey && CANONICAL_SERVICE_TAXONOMY[canonicalKey]) {
    return { service_key: canonicalKey, service_name: CANONICAL_SERVICE_TAXONOMY[canonicalKey] }
  }

  return { service_key: null, service_name: null }
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

  // 1. Google Ads
  if (gclid || gbraid || wbraid || (source.includes('google') && (medium.includes('cpc') || medium.includes('paid') || medium.includes('ppc')))) {
    return 'google_ads'
  }

  // 2. Microsoft Ads / Bing Paid
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

// In-Memory LRU Cache para Idempotência no Servidor
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
