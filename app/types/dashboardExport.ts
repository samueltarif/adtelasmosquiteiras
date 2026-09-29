/**
 * Tipagens para a Central de Exportação do Dashboard Admin
 * Arquivo: app/types/dashboardExport.ts
 * Limite: <= 200 linhas
 */

export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'pdf' | 'zip'

export type ExportPeriodPreset = 
  | 'today' 
  | 'last7days' 
  | 'last30days' 
  | 'last90days' 
  | 'all' 
  | 'custom'
  | 'current_dashboard'

export type ExportDatasetKey =
  | 'overview'
  | 'acquisition'
  | 'google_ads'
  | 'google_ads_campaigns'
  | 'google_ads_keywords'
  | 'google_ads_breakdown'
  | 'organic'
  | 'direct'
  | 'referral'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'microsoft_ads'
  | 'other_paid'
  | 'sessions'
  | 'visitors'
  | 'page_views'
  | 'landing_pages'
  | 'clicks'
  | 'whatsapp'
  | 'form_starts'
  | 'leads'
  | 'session_journeys'
  | 'campaign_kpis'
  | 'kpi_tracking_comparison'

export interface ExportRequestPayload {
  format: ExportFormat
  period: ExportPeriodPreset
  dateFrom?: string
  dateTo?: string
  datasets: ExportDatasetKey[]
  includeContactDetails?: boolean
  filterChannel?: string
  filterCampaign?: string
  filterLandingPage?: string
}

export interface ExportMetadata {
  project_name: string
  exported_at: string
  timezone: string
  period_label: string
  requested_start_utc: string
  requested_end_utc: string
  filters: {
    format: ExportFormat
    period: ExportPeriodPreset
    include_contact_details: boolean
    channel?: string
    campaign?: string
    landing_page?: string
  }
  schema_version: string
  data_sources: {
    tracking: string
    manual_kpis: string
  }
}
