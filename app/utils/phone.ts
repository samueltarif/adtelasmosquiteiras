/**
 * Utilitário central de normalização de telefones brasileiros e formato E.164.
 * Suporta DDD 55 (RS) sem confundir com DDI 55 (Brasil).
 * LOC <= 200
 */

export function normalizeBrazilPhoneE164(phone: string | null | undefined): string {
  if (!phone) return ''
  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''

  // 10 dígitos (DDD + fixo) ou 11 dígitos (DDD + celular, inclusive DDD 55)
  // Exemplo: (55) 99999-1234 -> digits = 55999991234 (11 dígitos) -> vira 5555999991234
  // Exemplo: (11) 99999-1234 -> digits = 11999991234 (11 dígitos) -> vira 5511999991234
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }

  // 12 ou 13 dígitos já começando com 55 (DDI já incluso)
  // Exemplo: +55 (11) 99999-1234 -> digits = 5511999991234 (13 dígitos) -> mantém 5511999991234
  // Exemplo: +55 (55) 99999-1234 -> digits = 5555999991234 (13 dígitos) -> mantém 5555999991234
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return digits
  }

  // Caso internacional ou formato não padrão já com DDI
  if (digits.startsWith('55')) {
    return digits
  }

  return `55${digits}`
}

export function formatPhoneLink(phone: string | null | undefined): string {
  const normalized = normalizeBrazilPhoneE164(phone)
  return normalized ? `tel:+${normalized}` : ''
}

export function formatWhatsAppLink(phone: string | null | undefined, message?: string): string {
  const normalized = normalizeBrazilPhoneE164(phone)
  if (!normalized) return ''
  const query = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${normalized}${query}`
}

export const createWhatsAppHref = formatWhatsAppLink
export const createPhoneHref = formatPhoneLink

