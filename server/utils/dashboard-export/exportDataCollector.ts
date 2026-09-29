/**
 * Coletor de Dados para a Central de Exportação
 * Executa queries paginadas no Supabase respeitando o período e filtros
 * Arquivo: server/utils/dashboard-export/exportDataCollector.ts
 * Limite: <= 200 linhas
 */

import { fetchAllPaginated, getSaoPauloDateRange } from '../adminAnalytics'
import { getSupabaseHeaders } from '../crm'
import type { ExportRequestPayload, ExportMetadata } from '../../../app/types/dashboardExport'

export interface CollectedExportRaw {
  rawViews: any[]
  rawClicks: any[]
  rawLeads: any[]
  rawHistory: any[]
  rawKpis: any[]
  rawWhatsappAttrs: any[]
  dateRange: ReturnType<typeof getSaoPauloDateRange>
  meta: ExportMetadata
}

export async function collectExportRawData(
  supabaseUrl: string,
  serviceKey: string,
  payload: ExportRequestPayload
): Promise<CollectedExportRaw> {
  const headers = getSupabaseHeaders(serviceKey)

  // 1. Período
  let preset = payload.period === 'current_dashboard' ? 'today' : payload.period
  if (preset === 'all') preset = 'all'

  const dateRange = getSaoPauloDateRange(preset, payload.dateFrom, payload.dateTo)
  const { startUtc, endUtc, identityStartUtc, label } = dateRange

  // 2. Filtros de query
  let basePeriodQuery = `created_at=gte.${startUtc}&created_at=lt.${endUtc}`
  if (payload.period === 'all') {
    // Para 'all', busca tudo sem filtro de data ou a partir do marco zero
    basePeriodQuery = `created_at=gt.2020-01-01T00:00:00Z`
  }

  // Filtros adicionais opcionais
  let filterStr = ''
  if (payload.filterChannel) {
    filterStr += `&channel=eq.${encodeURIComponent(payload.filterChannel)}`
  }
  if (payload.filterCampaign) {
    filterStr += `&utm_campaign=eq.${encodeURIComponent(payload.filterCampaign)}`
  }
  if (payload.filterLandingPage) {
    filterStr += `&landing_path=eq.${encodeURIComponent(payload.filterLandingPage)}`
  }

  // 3. Executar buscas paginadas simultâneas (READ-ONLY)
  const [rawViews, rawClicks, rawLeads, rawHistory, rawKpis, rawWhatsappAttrs] = await Promise.all([
    // Page views
    fetchAllPaginated<any>(
      supabaseUrl,
      'page_views',
      `select=*&${basePeriodQuery}${filterStr}&order=created_at.asc`,
      headers
    ),
    // Lead clicks
    fetchAllPaginated<any>(
      supabaseUrl,
      'lead_clicks',
      `select=*&${basePeriodQuery}${filterStr}&order=created_at.asc`,
      headers
    ),
    // Leads
    fetchAllPaginated<any>(
      supabaseUrl,
      'leads',
      `select=*&${basePeriodQuery}${filterStr}&order=created_at.asc`,
      headers
    ),
    // Histórico para new vs returning visitors (apenas visitor_id e created_at)
    fetchAllPaginated<any>(
      supabaseUrl,
      'page_views',
      `select=visitor_id,created_at&created_at=lt.${startUtc}&order=created_at.asc`,
      headers
    ).catch(() => [] as any[]),
    // Campaign KPI entries (Fase 7)
    fetchAllPaginated<any>(
      supabaseUrl,
      'campaign_kpi_entries',
      `select=*&order=period_start.desc,created_at.desc`,
      headers
    ).catch(() => [] as any[]),
    // WhatsApp attributions
    fetchAllPaginated<any>(
      supabaseUrl,
      'whatsapp_attributions',
      `select=*&${basePeriodQuery}&order=created_at.asc`,
      headers
    ).catch(() => [] as any[])
  ])

  // 4. Metadados do arquivo
  const meta: ExportMetadata = {
    project_name: 'AD Telas e Redes de Proteção',
    exported_at: new Date().toISOString(),
    timezone: 'America/Sao_Paulo (UTC-03:00)',
    period_label: label,
    requested_start_utc: startUtc,
    requested_end_utc: endUtc,
    filters: {
      format: payload.format,
      period: payload.period,
      include_contact_details: !!payload.includeContactDetails,
      channel: payload.filterChannel,
      campaign: payload.filterCampaign,
      landing_page: payload.filterLandingPage
    },
    schema_version: '1.0.0',
    data_sources: {
      tracking: 'Dados observados pelo tracking proprietário do site',
      manual_kpis: 'Dados informados manualmente em public.campaign_kpi_entries'
    }
  }

  return {
    rawViews,
    rawClicks,
    rawLeads,
    rawHistory,
    rawKpis,
    rawWhatsappAttrs,
    dateRange,
    meta
  }
}
