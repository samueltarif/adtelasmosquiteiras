/**
 * Lógica Central e Utilitários para Histórico de Mudanças de Marketing
 * Arquivo: server/shared/adminMarketingChangeCore.mjs
 *
 * TIMEZONE NOMINAL: America/Sao_Paulo (Canônico IANA)
 * Offset dinâmico derivado via Intl.DateTimeFormat (sem regra rígida UTC-3)
 */

export const MARKETING_TIMEZONE = 'America/Sao_Paulo'
export const SP_OFFSET_HOURS = 3 // Mantido exclusivamente para compatibilidade retrospectiva (deprecated)

export const VALID_CHANGE_TYPES = new Set([
  'landing_page',
  'ad_copy',
  'keyword',
  'negative_keyword',
  'budget',
  'bid',
  'tracking',
  'url_suffix',
  'conversion',
  'asset',
  'sitelink',
  'campaign_setting',
  'other'
])

export const VALID_SCOPES = new Set([
  'campaign',
  'landing',
  'tracking',
  'account'
])

export const VALID_ENTRY_SOURCES = new Set([
  'manual',
  'system',
  'migration'
])

export const VALID_STATUSES = new Set([
  'active',
  'archived'
])

/**
 * Extrai partes da data segundo o fuso canônico America/Sao_Paulo usando Intl nativo
 */
export function getSaoPauloParts(dateInput = new Date()) {
  const date = typeof dateInput === 'object' ? dateInput : new Date(dateInput)
  if (isNaN(date.getTime())) {
    throw new Error('Data inválida fornecida para getSaoPauloParts')
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MARKETING_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  })

  const map = {}
  for (const p of formatter.formatToParts(date)) {
    if (p.type !== 'literal') map[p.type] = parseInt(p.value, 10)
  }

  return {
    year: map.year || 1970,
    month: map.month || 1,
    day: map.day || 1,
    hour: map.hour === 24 ? 0 : (map.hour || 0),
    minute: map.minute || 0,
    second: map.second || 0
  }
}

/**
 * Converte data/hora informada em São Paulo para UTC ISO string (timestamptz)
 * Utiliza o fuso nominal 'America/Sao_Paulo' com offset dinâmico (sem +3h hardcoded).
 */
export function parseSaoPauloToUtcIso(dateTimeStr) {
  if (!dateTimeStr) return null
  const str = String(dateTimeStr).trim()

  // Se já tiver indicador de timezone UTC (Z) ou offset explícito (+/-HH:mm)
  if (/Z$/i.test(str) || /[+-]\d{2}:\d{2}$/.test(str)) {
    const d = new Date(str)
    if (isNaN(d.getTime())) return null
    return d.toISOString()
  }

  // Formato datetime-local: "YYYY-MM-DDTHH:mm" ou "YYYY-MM-DD HH:mm" ou com segundos
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const hour = Number(match[4])
    const minute = Number(match[5])
    const second = Number(match[6] || 0)

    const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
    const sp = getSaoPauloParts(utcGuess)
    const localAsUtc = new Date(Date.UTC(sp.year, sp.month - 1, sp.day, sp.hour, sp.minute, sp.second))
    const offsetMs = utcGuess.getTime() - localAsUtc.getTime()
    return new Date(utcGuess.getTime() + offsetMs).toISOString()
  }

  // Formato apenas data "YYYY-MM-DD"
  const dateOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1])
    const month = Number(dateOnlyMatch[2])
    const day = Number(dateOnlyMatch[3])

    const utcGuess = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    const sp = getSaoPauloParts(utcGuess)
    const localAsUtc = new Date(Date.UTC(sp.year, sp.month - 1, sp.day, sp.hour, sp.minute, sp.second))
    const offsetMs = utcGuess.getTime() - localAsUtc.getTime()
    return new Date(utcGuess.getTime() + offsetMs).toISOString()
  }

  const d = new Date(str)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

/**
 * Converte timestamptz UTC para formato de exibição local em São Paulo
 */
export function formatUtcToSaoPaulo(isoStr, includeSeconds = false) {
  if (!isoStr) return '-'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return isoStr
    return d.toLocaleString('pt-BR', {
      timeZone: MARKETING_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {})
    })
  } catch {
    return isoStr
  }
}
