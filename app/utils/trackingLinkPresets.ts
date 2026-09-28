/**
 * Presets e Configurações Oficiais do Gerador de Links de Rastreamento
 * Arquivo: app/utils/trackingLinkPresets.ts
 */

import type { DestinationPreset, TrackingPlatform } from '../types/trackingLinks'

export const CANONICAL_BASE_DOMAIN = 'https://www.adtelasmosquiteiras.com.br'

export interface PlatformConfig {
  id: TrackingPlatform
  name: string
  icon: string
  badgeColor: string
  enabled: boolean
  supportedTypes: ('organic' | 'ads')[]
}

export const PLATFORMS_CONFIG: PlatformConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'lucide:instagram',
    badgeColor: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    enabled: true,
    supportedTypes: ['organic', 'ads']
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'lucide:facebook',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    enabled: true,
    supportedTypes: ['organic', 'ads']
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'lucide:video',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    enabled: true,
    supportedTypes: ['organic', 'ads']
  },
  {
    id: 'google',
    name: 'Google Ads',
    icon: 'lucide:target',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    enabled: false,
    supportedTypes: ['ads']
  },
  {
    id: 'microsoft',
    name: 'Microsoft Ads',
    icon: 'lucide:monitor',
    badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    enabled: false,
    supportedTypes: ['ads']
  }
]

export const DESTINATION_PRESETS: DestinationPreset[] = [
  { label: 'Página Inicial ( / )', path: '/' },
  { label: 'LP Principal Telas ( /lp/telas-mosquiteiras )', path: '/lp/telas-mosquiteiras' },
  { label: 'Serviços de Telas ( /servicos/telas )', path: '/servicos/telas' },
  { label: 'Orçamento Rápido ( /orcamento )', path: '/orcamento' },
  { label: 'Contato ( /contato )', path: '/contato' },
  { label: 'Caminho Customizado...', path: 'custom' }
]

export interface OrganicFormatPreset {
  id: string
  label: string
  defaultCampaign: string
  defaultContent: string
}

export const ORGANIC_FORMATS: Record<string, OrganicFormatPreset[]> = {
  instagram: [
    { id: 'bio', label: 'Link na Bio', defaultCampaign: 'bio', defaultContent: 'perfil' },
    { id: 'stories', label: 'Stories', defaultCampaign: 'stories', defaultContent: 'link_storie' },
    { id: 'reels', label: 'Reels', defaultCampaign: 'reels', defaultContent: 'video' },
    { id: 'post', label: 'Post / Feed', defaultCampaign: 'feed', defaultContent: 'post' },
    { id: 'outro', label: 'Outro Formato', defaultCampaign: '', defaultContent: '' }
  ],
  facebook: [
    { id: 'perfil', label: 'Perfil / Sobre', defaultCampaign: 'perfil', defaultContent: 'perfil' },
    { id: 'post', label: 'Post da Página', defaultCampaign: 'post', defaultContent: 'post' },
    { id: 'outro', label: 'Outro Formato', defaultCampaign: '', defaultContent: '' }
  ],
  tiktok: [
    { id: 'bio', label: 'Link na Bio', defaultCampaign: 'bio', defaultContent: 'perfil' },
    { id: 'video', label: 'Vídeo / Conteúdo', defaultCampaign: 'video', defaultContent: 'conteudo' },
    { id: 'outro', label: 'Outro Formato', defaultCampaign: '', defaultContent: '' }
  ]
}

export const META_ADS_PARAMS: Record<string, string> = {
  utm_source: '{{site_source_name}}',
  utm_medium: 'paid_social',
  utm_campaign: '{{campaign.name}}',
  utm_content: '{{ad.name}}',
  utm_term: '{{adset.name}}',
  meta_placement: '{{placement}}',
  meta_campaign_id: '{{campaign.id}}',
  meta_adset_id: '{{adset.id}}',
  meta_ad_id: '{{ad.id}}'
}

export const TIKTOK_STANDARD_PARAMS: Record<string, string> = {
  utm_source: 'tiktok',
  utm_medium: 'paid_social',
  utm_campaign: '__CAMPAIGN_NAME__',
  utm_term: '__AID_NAME__',
  utm_content: '__CID_NAME__',
  tiktok_campaign_id: '__CAMPAIGN_ID__',
  tiktok_adgroup_id: '__AID__',
  tiktok_creative_id: '__CID__',
  tiktok_placement: '__PLACEMENT__'
}

export const TIKTOK_SMART_PLUS_PARAMS: Record<string, string> = {
  utm_source: 'tiktok',
  utm_medium: 'paid_social',
  utm_campaign: '__CAMPAIGN_NAME__',
  utm_term: '__AID_NAME__',
  utm_content: '__CID_NAME__',
  tiktok_campaign_id: '__CAMPAIGN_ID__',
  tiktok_adgroup_id: '__AID__',
  tiktok_ad_id: '__ADID_V2__',
  tiktok_creative_id: '__CID__',
  tiktok_placement: '__PLACEMENT__'
}
