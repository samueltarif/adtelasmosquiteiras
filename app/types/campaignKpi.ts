// app/types/campaignKpi.ts
// Interfaces TypeScript para o módulo de KPIs de Campanhas (Fase 7)

// ============================================================
// PLATAFORMAS SUPORTADAS
// ============================================================
export const CAMPAIGN_PLATFORMS = [
  'google_ads',
  'instagram_ads',
  'facebook_ads',
  'tiktok_ads',
  'microsoft_ads',
  'outro',
] as const

export type CampaignPlatform = (typeof CAMPAIGN_PLATFORMS)[number]

export const PLATFORM_LABELS: Record<CampaignPlatform, string> = {
  google_ads: 'Google Ads',
  instagram_ads: 'Instagram Ads',
  facebook_ads: 'Facebook Ads',
  tiktok_ads: 'TikTok Ads',
  microsoft_ads: 'Microsoft Ads',
  outro: 'Outro',
}

// ============================================================
// ENTIDADE PRINCIPAL
// ============================================================
export interface CampaignKpiEntry {
  id: string
  platform: CampaignPlatform
  campaign_name: string
  utm_campaign: string | null
  period_start: string  // ISO date 'YYYY-MM-DD'
  period_end: string    // ISO date 'YYYY-MM-DD'

  // Dados informados pela plataforma
  planned_budget: number | null
  spend: number | null
  impressions: number | null
  clicks: number | null
  whatsapp_contacts: number | null
  leads: number | null
  sales: number | null
  revenue: number | null
  notes: string | null

  // Metas definidas pelo usuário
  target_ctr: number | null
  target_cpc: number | null
  target_cpl: number | null
  target_cpa: number | null
  target_roas: number | null
  target_leads: number | null
  target_sales: number | null
  target_lead_to_sale_rate: number | null
  target_budget: number | null

  // Auditoria
  created_by: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// PAYLOAD PARA CRIAR/EDITAR
// ============================================================
export interface CampaignKpiPayload {
  platform: CampaignPlatform
  campaign_name: string
  utm_campaign?: string | null
  period_start: string
  period_end: string
  planned_budget?: number | null
  spend?: number | null
  impressions?: number | null
  clicks?: number | null
  whatsapp_contacts?: number | null
  leads?: number | null
  sales?: number | null
  revenue?: number | null
  notes?: string | null
  target_ctr?: number | null
  target_cpc?: number | null
  target_cpl?: number | null
  target_cpa?: number | null
  target_roas?: number | null
  target_leads?: number | null
  target_sales?: number | null
  target_lead_to_sale_rate?: number | null
  target_budget?: number | null
}

// ============================================================
// KPIs CALCULADOS
// ============================================================
export interface CampaignKpis {
  ctr: number | null             // %
  cpc: number | null             // R$
  cpm: number | null             // R$
  cost_per_whatsapp: number | null
  click_to_whatsapp_rate: number | null  // %
  click_to_lead_rate: number | null      // %
  whatsapp_to_lead_rate: number | null   // %
  lead_to_sale_rate: number | null       // %
  cpl: number | null             // R$
  cpa: number | null             // R$
  roas: number | null
  budget_consumption: number | null  // %
  avg_ticket: number | null      // R$
}

// ============================================================
// STATUS DE META
// ============================================================
export type GoalStatus = 'achieved' | 'not_achieved' | 'no_goal'

export interface GoalResult {
  status: GoalStatus
  current: number | null
  target: number | null
}

export interface CampaignGoals {
  ctr: GoalResult
  cpc: GoalResult
  cpl: GoalResult
  cpa: GoalResult
  roas: GoalResult
  leads: GoalResult
  sales: GoalResult
  lead_to_sale_rate: GoalResult
}

// ============================================================
// DADOS DO TRACKING OBSERVADOS PELO SITE
// ============================================================
export interface CampaignTrackingData {
  sessions: number
  pageviews: number
  whatsapp_clicks: number
  lead_form_starts: number
  leads: number
  first_seen: string | null
  last_seen: string | null
}
