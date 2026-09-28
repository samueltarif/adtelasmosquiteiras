/**
 * Tipos e Interfaces do Gerador de Links de Rastreamento
 * Arquivo: app/types/trackingLinks.ts
 */

export type TrackingPlatform = 'instagram' | 'facebook' | 'tiktok' | 'google' | 'microsoft'

export type TrackingTrafficType = 'organic' | 'ads'

export type TikTokAdsMode = 'standard' | 'smart_plus'

export interface DestinationPreset {
  label: string
  path: string
}

export interface TrackingLinkState {
  platform: TrackingPlatform
  trafficType: TrackingTrafficType
  format: string
  tiktokAdsMode: TikTokAdsMode
  destination: string
  customDestination: string
  campaign: string
  content: string
  term: string
}

export interface BuiltTrackingLink {
  fullUrl: string
  baseDomain: string
  path: string
  expectedChannel: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content?: string
  utm_term?: string
  macros: string[]
  platformParams: Record<string, string>
}

export interface LinkValidationResult {
  isValid: boolean
  errors: string[]
  url: string
  domain: string
  path: string
  detectedChannel: string
  expectedChannel: string
  isChannelMatched: boolean
  params: Record<string, string>
  macrosFound: string[]
  runtimeSimulations?: {
    resolvedSource?: string
    simulatedChannel?: string
  }
}
