/**
 * Mapeamento e Apresentação Consistente dos Canais de Tráfego
 * Arquivo: app/utils/channelDisplay.ts
 *
 * Suporta os 11 canais canônicos e identificação explícita de registros legados.
 */

export function normalizeChannel(rawChannel?: string | null): string {
  if (!rawChannel || String(rawChannel).trim() === '' || rawChannel === 'null' || rawChannel === 'undefined') {
    return 'unknown_legacy'
  }
  return String(rawChannel).trim()
}

export function getChannelLabel(channel?: string | null): string {
  const norm = normalizeChannel(channel)
  const labels: Record<string, string> = {
    google_ads: 'Google Ads',
    microsoft_ads: 'Microsoft Ads',
    tiktok_ads: 'TikTok Ads',
    tiktok_organic: 'TikTok Orgânico',
    instagram_ads: 'Instagram Ads',
    instagram_organic: 'Instagram Orgânico',
    facebook_ads: 'Facebook Ads',
    facebook_organic: 'Facebook Orgânico',
    meta_ads: 'Meta Ads',
    google_organic: 'Google Orgânico',
    direct: 'Direto',
    referral: 'Referência',
    other_paid: 'Outro Pago',
    whatsapp: 'WhatsApp Direto',
    instagram: 'Instagram',
    facebook: 'Facebook',
    unknown_legacy: 'Legado / Canal não registrado'
  }
  return labels[norm] || norm
}

export function getChannelBadgeStyle(channel?: string | null): {
  bg: string
  text: string
  border: string
  dot: string
  icon: string
} {
  const norm = normalizeChannel(channel)

  switch (norm) {
    case 'google_ads':
      return {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400',
        border: 'border-indigo-500/20',
        dot: 'bg-indigo-400',
        icon: 'lucide:target'
      }
    case 'microsoft_ads':
      return {
        bg: 'bg-sky-500/10',
        text: 'text-sky-400',
        border: 'border-sky-500/20',
        dot: 'bg-sky-400',
        icon: 'lucide:monitor'
      }
    case 'tiktok_ads':
      return {
        bg: 'bg-cyan-500/15',
        text: 'text-cyan-300',
        border: 'border-cyan-500/30',
        dot: 'bg-cyan-400',
        icon: 'lucide:video'
      }
    case 'tiktok_organic':
      return {
        bg: 'bg-teal-500/10',
        text: 'text-teal-300',
        border: 'border-teal-500/20',
        dot: 'bg-teal-400',
        icon: 'lucide:video'
      }
    case 'instagram_ads':
      return {
        bg: 'bg-fuchsia-500/15',
        text: 'text-fuchsia-300',
        border: 'border-fuchsia-500/30',
        dot: 'bg-fuchsia-400',
        icon: 'lucide:instagram'
      }
    case 'instagram_organic':
      return {
        bg: 'bg-pink-500/10',
        text: 'text-pink-300',
        border: 'border-pink-500/20',
        dot: 'bg-pink-400',
        icon: 'lucide:instagram'
      }
    case 'facebook_ads':
      return {
        bg: 'bg-blue-600/15',
        text: 'text-blue-300',
        border: 'border-blue-500/30',
        dot: 'bg-blue-400',
        icon: 'lucide:facebook'
      }
    case 'facebook_organic':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-200',
        border: 'border-blue-500/20',
        dot: 'bg-blue-300',
        icon: 'lucide:facebook'
      }
    case 'meta_ads':
      return {
        bg: 'bg-violet-500/15',
        text: 'text-violet-300',
        border: 'border-violet-500/30',
        dot: 'bg-violet-400',
        icon: 'lucide:share-2'
      }
    case 'google_organic':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        dot: 'bg-emerald-400',
        icon: 'lucide:search'
      }
    case 'direct':
      return {
        bg: 'bg-slate-700/30',
        text: 'text-slate-300',
        border: 'border-white/10',
        dot: 'bg-slate-400',
        icon: 'lucide:arrow-right'
      }
    case 'referral':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        dot: 'bg-amber-400',
        icon: 'lucide:link'
      }
    case 'other_paid':
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-300',
        border: 'border-purple-500/20',
        dot: 'bg-purple-400',
        icon: 'lucide:badge-dollar-sign'
      }
    case 'unknown_legacy':
    default:
      return {
        bg: 'bg-slate-800/60',
        text: 'text-slate-400',
        border: 'border-white/5',
        dot: 'bg-slate-500',
        icon: 'lucide:clock'
      }
  }
}

export const CANONICAL_CHANNEL_OPTIONS = [
  { value: 'all', label: 'Todos os Canais' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'tiktok_ads', label: 'TikTok Ads' },
  { value: 'instagram_ads', label: 'Instagram Ads' },
  { value: 'facebook_ads', label: 'Facebook Ads' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'microsoft_ads', label: 'Microsoft Ads' },
  { value: 'tiktok_organic', label: 'TikTok Orgânico' },
  { value: 'instagram_organic', label: 'Instagram Orgânico' },
  { value: 'facebook_organic', label: 'Facebook Orgânico' },
  { value: 'google_organic', label: 'Google Orgânico' },
  { value: 'direct', label: 'Direto' },
  { value: 'referral', label: 'Referência' },
  { value: 'other_paid', label: 'Outro Pago' },
  { value: 'legacy_null', label: 'Legado / Canal não registrado' }
]
