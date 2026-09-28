/**
 * Tipos TypeScript para Atribuição WhatsApp -> Cliente
 * Arquivo: app/types/adminWhatsappAttribution.ts
 */

export type WhatsappAttributionStatus = 'unassigned' | 'assigned' | 'dismissed' | 'expired'
export type WhatsappAttributionConfidence = 'confirmed' | 'probable' | 'unassigned'
export type WhatsappAttributionMatchMethod = 'exact_code' | 'manual_selection'

export interface WhatsappAttributionItem {
  id: string
  short_code: string
  lead_click_id: string | null
  visitor_id: string | null
  session_id: string | null
  clicked_at: string

  // Snapshot Multicanal & Atribuição
  channel: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  campaign_name: string | null
  landing_path: string | null
  cta_location: string | null

  // Click IDs
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  fbclid: string | null
  msclkid: string | null

  // Google Ads IDs
  google_campaign_id: string | null
  google_adgroup_id: string | null
  google_creative_id: string | null

  // Meta / Instagram / Facebook IDs
  meta_campaign_id: string | null
  meta_adset_id: string | null
  meta_ad_id: string | null
  meta_placement: string | null

  // TikTok Ads IDs
  ttclid: string | null
  tiktok_campaign_id: string | null
  tiktok_adgroup_id: string | null
  tiktok_ad_id: string | null
  tiktok_creative_id: string | null
  tiktok_placement: string | null

  // Helpers derivados de Click ID
  has_click_id: boolean
  click_id_type: 'gclid' | 'gbraid' | 'wbraid' | 'fbclid' | 'msclkid' | 'ttclid' | null
  click_id_value: string | null

  // Vínculos com CRM
  client_id: string | null
  lead_id: string | null
  client?: {
    id: string
    nome: string
    telefone_principal: string
    email?: string | null
  } | null
  lead?: {
    id: string
    nome: string
    telefone?: string | null
  } | null

  // Status e Confiança
  attribution_status: WhatsappAttributionStatus
  confidence_level: WhatsappAttributionConfidence
  match_method: WhatsappAttributionMatchMethod | null

  // Auditoria
  assigned_by: string | null
  assigned_at: string | null
  assigned_by_email?: string | null
  dismissed_by: string | null
  dismissed_at: string | null
  dismissed_by_email?: string | null
  notes: string | null

  created_at: string
  updated_at: string
}

export interface WhatsappAttributionsListResponse {
  success: boolean
  attributions: WhatsappAttributionItem[]
  total: number
  counts: {
    total: number
    unassigned: number
    assigned: number
    dismissed: number
  }
}

export interface WhatsappAttributionByCodeResponse {
  success: boolean
  attribution: WhatsappAttributionItem | null
  is_already_assigned: boolean
}

export interface AssignWhatsappAttributionPayload {
  client_id?: string
  lead_id?: string
  match_method: WhatsappAttributionMatchMethod
  provided_code?: string
  notes?: string
}

export interface DismissWhatsappAttributionPayload {
  notes?: string
}
