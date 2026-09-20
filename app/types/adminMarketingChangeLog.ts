/**
 * Tipagens TypeScript Estritas para o Histórico de Mudanças de Marketing
 * Arquivo: app/types/adminMarketingChangeLog.ts
 */

export type MarketingChangeType =
  | 'landing_page'
  | 'ad_copy'
  | 'keyword'
  | 'negative_keyword'
  | 'budget'
  | 'bid'
  | 'tracking'
  | 'url_suffix'
  | 'conversion'
  | 'asset'
  | 'sitelink'
  | 'campaign_setting'
  | 'other'

export type MarketingChangeScope =
  | 'campaign'
  | 'landing'
  | 'tracking'
  | 'account'

export type MarketingEntrySource =
  | 'manual'
  | 'system'
  | 'migration'

export type MarketingChangeStatus =
  | 'active'
  | 'archived'

export interface MarketingChangeLogItem {
  id: string
  occurred_at: string
  change_type: MarketingChangeType
  scope: MarketingChangeScope
  entry_source: MarketingEntrySource
  title: string
  description: string | null
  campaign_name: string | null
  google_campaign_id: string | null
  landing_path: string | null
  previous_value: Record<string, any> | null
  new_value: Record<string, any> | null
  metadata: Record<string, any>
  created_by: string | null
  created_by_email_snapshot: string | null
  status: MarketingChangeStatus
  archived_at: string | null
  archived_by: string | null
  created_at: string
  updated_at: string
}

export interface CreateMarketingChangePayload {
  occurred_at: string
  change_type: MarketingChangeType
  scope: MarketingChangeScope
  title: string
  description?: string | null
  campaign_name?: string | null
  google_campaign_id?: string | null
  landing_path?: string | null
  previous_value?: Record<string, any> | string | null
  new_value?: Record<string, any> | string | null
  metadata?: Record<string, any>
}

export interface UpdateMarketingChangePayload {
  title?: string
  description?: string | null
  occurred_at?: string
  change_type?: MarketingChangeType
  scope?: MarketingChangeScope
  campaign_name?: string | null
  google_campaign_id?: string | null
  landing_path?: string | null
  previous_value?: Record<string, any> | string | null
  new_value?: Record<string, any> | string | null
  status?: MarketingChangeStatus
  metadata?: Record<string, any>
}

export interface MarketingChangeLogResponse {
  success: boolean
  changes?: MarketingChangeLogItem[]
  item?: MarketingChangeLogItem
  total?: number
  error?: string
}
