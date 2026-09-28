export const CANONICAL_CHANNELS = [
  'google_ads',
  'microsoft_ads',
  'tiktok_ads',
  'instagram_ads',
  'facebook_ads',
  'meta_ads',
  'tiktok_organic',
  'instagram_organic',
  'facebook_organic',
  'google_organic',
  'direct',
  'referral',
  'other_paid'
] as const

export type CanonicalChannel = typeof CANONICAL_CHANNELS[number]

/**
 * Valida o canal recebido do cliente contra a allowlist de canais canônicos.
 * Não aceita valores arbitrários no banco de dados.
 * Se o canal não pertencer à allowlist, retorna o fallback fornecido (padrão: null).
 */
export function validateCanonicalChannel(
  rawChannel: unknown,
  fallbackChannel: CanonicalChannel | null = null
): CanonicalChannel | null {
  if (typeof rawChannel !== 'string') return fallbackChannel
  const normalized = rawChannel.trim().toLowerCase()
  if ((CANONICAL_CHANNELS as readonly string[]).includes(normalized)) {
    return normalized as CanonicalChannel
  }
  return fallbackChannel
}
