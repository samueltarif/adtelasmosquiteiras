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
