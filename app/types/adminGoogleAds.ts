/**
 * Tipagens TypeScript Estritas para o Módulo de Analytics Google Ads
 * Arquivo: app/types/adminGoogleAds.ts
 */

export interface GoogleAdsKpis {
  unique_visitors: number
  sessions: number
  pageviews: number
  whatsapp_clicks: number
  whatsapp_unique_visitors: number
  form_starts: number
  form_starts_unique_visitors: number
  real_leads: number
  real_lead_unique_visitors: number
  contact_intent_events: number
  contact_intent_unique_visitors: number
  contact_intent_rate: string
  lead_conversion_rate: string
  whatsapp_rate: string
  form_start_rate: string
}

export interface GoogleAdsFunnel {
  landing_visitors: number
  landing_sessions: number
  quote_cta_visitors: number
  quote_cta_clicks: number
  contact_intent_unique_visitors: number
  whatsapp_unique_visitors: number
  whatsapp_clicks: number
  form_start_unique_visitors: number
  form_start_clicks: number
  real_lead_unique_visitors: number
  real_leads_count: number
  taxa_intencao: string
  taxa_whatsapp: string
  taxa_form_start: string
  taxa_form_success: string
}

export interface GoogleAdsDataQuality {
  total_google_ads_sessions: number
  sessions_with_click_id: number
  sessions_with_keyword: number
  sessions_with_campaign_id: number
  pct_with_click_id: string
  pct_with_keyword: string
  pct_with_campaign_id: string
  total_real_leads: number
  leads_with_attribution: number
  pct_leads_with_attribution: string
}

export interface GoogleAdsCampaignMetric {
  utm_campaign: string
  google_campaign_id: string | null
  unique_visitors: number
  sessions: number
  pageviews: number
  whatsapp_clicks: number
  form_starts: number
  leads_count: number
  contact_intent_rate: string
  lead_conversion_rate: string
}

export interface GoogleAdsKeywordMetric {
  keyword: string
  utm_campaign: string | null
  unique_visitors: number
  sessions: number
  pageviews: number
  whatsapp_clicks: number
  form_starts: number
  leads_count: number
  contact_intent_rate: string
  lead_conversion_rate: string
}

export interface GoogleAdsCtaMetric {
  cta_location: string
  label: string
  tipo: string
  clicks: number
  unique_visitors: number
  pct_of_total_clicks: string
}

export interface GoogleAdsOverviewResponse {
  success: boolean
  meta: {
    preset: string
    date_label: string
    requested_start_utc: string
    requested_end_utc: string
    identity_start_utc: string
  }
  kpis: GoogleAdsKpis
  funnel: GoogleAdsFunnel
  data_quality: GoogleAdsDataQuality
  campaigns: GoogleAdsCampaignMetric[]
  keywords: GoogleAdsKeywordMetric[]
  ctas: GoogleAdsCtaMetric[]
}

export interface CohortMetrics {
  landing_unique_visitors: number
  sessions: number
  pageviews: number
  contact_intent_unique_visitors: number
  whatsapp_unique_visitors: number
  whatsapp_clicks: number
  form_start_unique_visitors: number
  form_starts: number
  quote_cta_unique_visitors: number
  quote_cta_clicks: number
  real_lead_unique_visitors: number
  real_leads_count: number
  taxa_intencao_num: number
  taxa_intencao: string
  taxa_whatsapp_num: number
  taxa_whatsapp: string
  taxa_form_start_num: number
  taxa_form_start: string
  taxa_lead_num: number
  taxa_lead: string
}

export interface MetricDeltaCount {
  diff: number
  formatted: string
  is_positive: boolean
  is_neutral: boolean
}

export interface MetricDeltaRate {
  diff_pp: number
  formatted: string
  is_positive: boolean
  is_neutral: boolean
}

export interface LandingComparisonDelta {
  landing_unique_visitors: MetricDeltaCount
  sessions: MetricDeltaCount
  pageviews: MetricDeltaCount
  contact_intent_unique_visitors: MetricDeltaCount
  whatsapp_unique_visitors: MetricDeltaCount
  form_start_unique_visitors: MetricDeltaCount
  real_lead_unique_visitors: MetricDeltaCount
  taxa_intencao: MetricDeltaRate
  taxa_whatsapp: MetricDeltaRate
  taxa_form_start: MetricDeltaRate
  taxa_lead: MetricDeltaRate
}

export interface DeviceComparisonData {
  visitors: number
  intent_visitors: number
  leads: number
  taxa_intencao: string
  taxa_lead: string
}

export interface DeviceComparisonRow {
  device: string
  label: string
  before: DeviceComparisonData
  after: DeviceComparisonData
  delta: {
    visitors: MetricDeltaCount
    intent_visitors: MetricDeltaCount
    leads: MetricDeltaCount
    taxa_intencao: MetricDeltaRate
    taxa_lead: MetricDeltaRate
  }
}

export interface LandingComparisonWindow {
  cutoffAtIso: string
  durationMs: number
  durationHours: number
  durationFormatted: string
  beforeStartUtc: string
  beforeEndUtc: string
  afterStartUtc: string
  afterEndUtc: string
  isSymmetric: boolean
  isPendingMaturity: boolean
  maturityBufferMinutes: number
}

export interface LandingComparisonSampleQuality {
  level: 'very_small' | 'small' | 'moderate' | 'large'
  label: string
  description: string
  minSampleSize: number
}

export interface LandingComparisonData {
  cutoffAt: string
  label?: string
  landing_first_seen_at?: string
  cutoffExplanation?: string
  channelFilter: 'google_ads' | 'all'
  window: LandingComparisonWindow
  sampleQuality: LandingComparisonSampleQuality
  before: CohortMetrics
  after: CohortMetrics
  delta: LandingComparisonDelta
  deviceBreakdown: Record<string, DeviceComparisonRow>
  config: {
    landing_path: string
    previous_path_prefixes: string[]
  }
}

export interface LandingComparisonResponse {
  success: boolean
  data?: LandingComparisonData
  error?: string
}

