/**
 * Montador de Datasets Tabulares para Exportação (CSV, XLSX, JSON)
 * Arquivo: server/utils/dashboard-export/exportDataBuilder.ts
 * Limite: <= 200 linhas
 */

import { computeOverviewData, normalizeChannel, getChannelLabel, safeRate } from '../../shared/adminAnalyticsCore.mjs'
import { computeGoogleAdsData } from '../../shared/adminGoogleAdsMetrics.mjs'
import { buildCampaignKpisTable } from './exportCampaignKpisBuilder.ts'
import { buildTrackingAdditionalTables } from './exportTrackingDatasetsBuilder.ts'
import type { ExportDatasetKey, ExportRequestPayload } from '../../../app/types/dashboardExport.ts'
import type { CollectedExportRaw } from './exportDataCollector.ts'

export interface ExportTable {
  key: ExportDatasetKey
  title: string
  headers: string[]
  rows: any[][]
}

export function buildExportTables(raw: CollectedExportRaw, payload: ExportRequestPayload): Record<ExportDatasetKey, ExportTable> {
  const { rawViews, rawClicks, rawLeads, rawHistory, rawKpis, rawWhatsappAttrs, dateRange, meta } = raw
  const includeContact = meta.filters.include_contact_details
  const tables: Partial<Record<ExportDatasetKey, ExportTable>> = {}

  // 1. Resumo Geral (Overview)
  const overviewMetrics = computeOverviewData(rawViews, rawClicks, rawLeads, rawHistory, dateRange, payload.period)
  tables.overview = {
    key: 'overview',
    title: 'Resumo Geral',
    headers: ['Métrica', 'Valor', 'Taxa / Proporção', 'Observações'],
    rows: [
      ['Visitantes Únicos', overviewMetrics.kpis.unique_visitors, '100%', 'Total no período'],
      ['Novos Visitantes', overviewMetrics.kpis.new_visitors, safeRate(overviewMetrics.kpis.new_visitors, overviewMetrics.kpis.unique_visitors), 'Primeiro acesso'],
      ['Visitantes Recorrentes', overviewMetrics.kpis.returning_visitors, safeRate(overviewMetrics.kpis.returning_visitors, overviewMetrics.kpis.unique_visitors), 'Acesso anterior'],
      ['Sessões Humanas', overviewMetrics.kpis.sessions, '-', 'Sessões válidas'],
      ['Pageviews', overviewMetrics.kpis.pageviews, '-', 'Páginas visualizadas'],
      ['Cliques no WhatsApp', overviewMetrics.kpis.whatsapp_clicks, safeRate(overviewMetrics.kpis.whatsapp_clicks, overviewMetrics.kpis.sessions), 'Taxa sessão -> WhatsApp'],
      ['Inícios de Formulário', overviewMetrics.kpis.phone_clicks, safeRate(overviewMetrics.kpis.phone_clicks, overviewMetrics.kpis.sessions), 'Interações de formulário'],
      ['Leads Comerciais Reais', overviewMetrics.kpis.commercial_leads, safeRate(overviewMetrics.kpis.commercial_leads, overviewMetrics.kpis.sessions), 'Taxa sessão -> Lead']
    ]
  }

  // 2. Aquisição por Canal (13 canais canônicos)
  const channelMap: Record<string, { sessions: Set<string>; visitors: Set<string>; pvs: number; wa: number; leads: number }> = {}
  for (const v of rawViews || []) {
    if (v.is_bot) continue
    const ch = normalizeChannel(v.channel)
    if (!channelMap[ch]) channelMap[ch] = { sessions: new Set(), visitors: new Set(), pvs: 0, wa: 0, leads: 0 }
    if (v.session_id) channelMap[ch].sessions.add(v.session_id)
    if (v.visitor_id) channelMap[ch].visitors.add(v.visitor_id)
    channelMap[ch].pvs++
  }
  for (const c of rawClicks || []) {
    if (c.is_bot) continue
    const ch = normalizeChannel(c.channel)
    if (!channelMap[ch]) channelMap[ch] = { sessions: new Set(), visitors: new Set(), pvs: 0, wa: 0, leads: 0 }
    if (c.tipo === 'whatsapp') channelMap[ch].wa++
  }
  for (const l of rawLeads || []) {
    const ch = normalizeChannel(l.session_channel || l.first_touch_channel)
    if (!channelMap[ch]) channelMap[ch] = { sessions: new Set(), visitors: new Set(), pvs: 0, wa: 0, leads: 0 }
    channelMap[ch].leads++
  }

  tables.acquisition = {
    key: 'acquisition',
    title: 'Aquisição por Canal',
    headers: ['Canal Canônico', 'Rótulo', 'Sessões', 'Visitantes', 'Pageviews', 'WhatsApp', 'Leads', 'Taxa Conversão'],
    rows: Object.entries(channelMap).map(([ch, d]) => [
      ch,
      getChannelLabel(ch),
      d.sessions.size,
      d.visitors.size,
      d.pvs,
      d.wa,
      d.leads,
      safeRate(d.wa + d.leads, d.sessions.size)
    ])
  }

  // 3. Google Ads — Métricas, Campanhas e Palavras-chave
  const gAdsMetrics = computeGoogleAdsData(rawViews, rawClicks, rawLeads, dateRange)
  tables.google_ads = {
    key: 'google_ads',
    title: 'Google Ads — Métricas Observadas',
    headers: ['Métrica Google Ads (Tracking)', 'Valor', 'Taxa', 'Definição'],
    rows: [
      ['Sessões Google Ads', gAdsMetrics.kpis.sessions, '-', 'Sessões observadas com gclid/utm'],
      ['Visitantes Únicos', gAdsMetrics.kpis.unique_visitors, '-', 'Visitantes humanos'],
      ['Pageviews', gAdsMetrics.kpis.pageviews, '-', 'Visualizações de página'],
      ['Cliques no WhatsApp', gAdsMetrics.kpis.whatsapp_clicks, gAdsMetrics.kpis.whatsapp_rate, 'Taxa Sessão -> WhatsApp'],
      ['Inícios de Formulário', gAdsMetrics.kpis.form_starts, gAdsMetrics.kpis.form_start_rate, 'Taxa Sessão -> Formulário'],
      ['Leads Convertidos', gAdsMetrics.kpis.real_leads, gAdsMetrics.kpis.lead_conversion_rate, 'Taxa Sessão -> Lead']
    ]
  }

  tables.google_ads_campaigns = {
    key: 'google_ads_campaigns',
    title: 'Google Ads — Campanhas',
    headers: ['Campanha UTM', 'ID Campanha Google', 'Sessões', 'Visitantes', 'Pageviews', 'WhatsApp', 'Form Starts', 'Leads'],
    rows: (gAdsMetrics.campaigns || []).map((c: any) => [
      c.utm_campaign || '(não definido)',
      c.google_campaign_id || '-',
      c.sessions,
      c.unique_visitors,
      c.pageviews,
      c.whatsapp_clicks,
      c.form_starts,
      c.leads_count
    ])
  }

  tables.google_ads_keywords = {
    key: 'google_ads_keywords',
    title: 'Google Ads — Termos e Palavras-chave',
    headers: ['Palavra-chave / Termo', 'Sessões', 'Visitantes', 'Pageviews', 'WhatsApp', 'Form Starts', 'Leads', 'Taxa Intenção'],
    rows: (gAdsMetrics.keywords || []).map((k: any) => [
      k.keyword,
      k.sessions,
      k.unique_visitors,
      k.pageviews,
      k.whatsapp_clicks,
      k.form_starts,
      k.leads_count,
      k.contact_intent_rate
    ])
  }

  // 4. WhatsApp
  tables.whatsapp = {
    key: 'whatsapp',
    title: 'WhatsApp e Atribuições',
    headers: ['Data/Hora', 'Código Curto', 'Canal', 'Campanha', 'Origem', 'Página', 'Status Atribuição', 'Match'],
    rows: (rawWhatsappAttrs || []).map(w => [
      w.created_at || w.clicked_at || '-',
      w.short_code || '-',
      w.channel || '-',
      w.utm_campaign || w.campaign_name || '-',
      w.cta_location || '-',
      w.landing_path || '-',
      w.attribution_status || '-',
      w.match_method || '-'
    ])
  }

  // 5. Leads (com mascaramento LGPD)
  tables.leads = {
    key: 'leads',
    title: 'Leads Comerciais',
    headers: ['ID Lead', 'Data/Hora', 'Canal', 'Campanha', 'Serviço', 'Status', 'Nome', 'Telefone', 'Email'],
    rows: (rawLeads || []).map(l => [
      l.id,
      l.created_at,
      l.session_channel || l.first_touch_channel || '-',
      l.utm_campaign || '-',
      l.servico || '-',
      l.status || 'novo',
      includeContact ? (l.nome || '-') : '*** PROTEGIDO ***',
      includeContact ? (l.telefone || '-') : '*** PROTEGIDO ***',
      includeContact ? (l.email || '-') : '*** PROTEGIDO ***'
    ])
  }

  // 6. Pageviews Detalhados
  tables.page_views = {
    key: 'page_views',
    title: 'Pageviews Detalhados',
    headers: ['ID', 'Data/Hora', 'Canal', 'Página', 'Origem UTM', 'Campanha UTM', 'Dispositivo', 'GCLID', 'ID Sessão', 'ID Visitante'],
    rows: (rawViews || []).map(v => [
      v.id, v.created_at, v.channel || '-', v.path || v.landing_path || '/', v.utm_source || '-',
      v.utm_campaign || '-', v.device_type || '-', v.gclid ? 'SIM' : '-', v.session_id || '-', v.visitor_id || '-'
    ])
  }

  // 7. KPIs de Campanhas (Fase 7)
  tables.campaign_kpis = buildCampaignKpisTable(rawKpis)

  // 8. Tabelas Adicionais de Tracking (Dimensões Ads, Orgânico, Sessões, Cliques, Jornadas)
  const additional = buildTrackingAdditionalTables(rawViews, rawClicks)
  Object.assign(tables, additional)

  return tables as Record<ExportDatasetKey, ExportTable>
}
