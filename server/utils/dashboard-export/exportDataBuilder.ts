/**
 * Montador de Datasets Tabulares para Exportação (CSV, XLSX, JSON)
 * Arquivo: server/utils/dashboard-export/exportDataBuilder.ts
 * Limite: <= 200 linhas
 */

import { computeOverviewData, normalizeChannel, getChannelLabel, safeRate } from '../adminAnalytics'
import { computeGoogleAdsData } from '../../shared/adminGoogleAdsMetrics.mjs'
import type { ExportDatasetKey, ExportRequestPayload } from '../../../app/types/dashboardExport'
import type { CollectedExportRaw } from './exportDataCollector'

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

  // 1. Overview
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


  // 2. Acquisition (13 Canais Canônicos)
  const channelMap: Record<string, { sessions: Set<string>; visitors: Set<string>; pvs: number; wa: number; leads: number }> = {}
  for (const v of rawViews) {
    if (v.is_bot) continue
    const ch = normalizeChannel(v.channel)
    if (!channelMap[ch]) channelMap[ch] = { sessions: new Set(), visitors: new Set(), pvs: 0, wa: 0, leads: 0 }
    if (v.session_id) channelMap[ch].sessions.add(v.session_id)
    if (v.visitor_id) channelMap[ch].visitors.add(v.visitor_id)
    channelMap[ch].pvs++
  }
  for (const c of rawClicks) {
    if (c.is_bot) continue
    const ch = normalizeChannel(c.channel)
    if (!channelMap[ch]) channelMap[ch] = { sessions: new Set(), visitors: new Set(), pvs: 0, wa: 0, leads: 0 }
    if (c.tipo === 'whatsapp') channelMap[ch].wa++
  }
  for (const l of rawLeads) {
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

  // 3. Google Ads
  const gAdsMetrics = computeGoogleAdsData(rawViews, rawClicks, rawLeads, dateRange)
  tables.google_ads = {
    key: 'google_ads',
    title: 'Google Ads — Métricas Observadas',
    headers: ['Métrica Google Ads (Tracking)', 'Valor', 'Taxa', 'Definição'],
    rows: [
      ['Sessões Google Ads', gAdsMetrics.kpis.sessions, '-', 'Sessões observadas com gclid/utm'],
      ['Visitantes Únicos', gAdsMetrics.kpis.unique_visitors, '-', 'Visitantes humanos'],
      ['Pageviews', gAdsMetrics.kpis.pageviews, '-', 'Visualizações de página'],
      ['Cliques no WhatsApp', gAdsMetrics.kpis.whatsapp_clicks, gAdsMetrics.kpis.conversion_rate_whatsapp, 'Taxa Sessão -> WhatsApp'],
      ['Orçamentos / Formulários', gAdsMetrics.kpis.quote_clicks, gAdsMetrics.kpis.conversion_rate_quote, 'Taxa Sessão -> Orçamento'],
      ['Leads Convertidos', gAdsMetrics.kpis.leads, gAdsMetrics.kpis.conversion_rate_leads, 'Taxa Sessão -> Lead']
    ]
  }

  tables.google_ads_campaigns = {
    key: 'google_ads_campaigns',
    title: 'Google Ads — Campanhas',
    headers: ['Campanha UTM', 'ID Campanha Google', 'Sessões', 'Visitantes', 'Pageviews', 'WhatsApp', 'Leads', 'Taxa Conversão'],
    rows: (gAdsMetrics.campaigns || []).map((c: any) => [
      c.campaign_name || c.utm_campaign || '(não definido)',
      c.google_campaign_id || '-',
      c.sessions,
      c.unique_visitors,
      c.pageviews,
      c.whatsapp_clicks,
      c.leads,
      c.conversion_rate
    ])
  }

  tables.google_ads_keywords = {
    key: 'google_ads_keywords',
    title: 'Google Ads — Termos e Palavras-chave',
    headers: ['Palavra-chave / Termo', 'Sessões', 'Visitantes', 'Pageviews', 'WhatsApp', 'Leads', 'Taxa'],
    rows: (gAdsMetrics.keywords || []).map((k: any) => [
      k.keyword,
      k.sessions,
      k.unique_visitors,
      k.pageviews,
      k.whatsapp_clicks,
      k.leads,
      k.conversion_rate
    ])
  }

  // 4. WhatsApp
  tables.whatsapp = {
    key: 'whatsapp',
    title: 'WhatsApp e Atribuições',
    headers: ['Data/Hora', 'Código Curto', 'Canal', 'Campanha', 'Origem', 'Página', 'Status Atribuição', 'Match'],
    rows: rawWhatsappAttrs.map(w => [
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

  // 5. Leads (com proteção de privacidade)
  tables.leads = {
    key: 'leads',
    title: 'Leads Comerciais',
    headers: ['ID Lead', 'Data/Hora', 'Canal', 'Campanha', 'Serviço', 'Status', 'Nome', 'Telefone', 'Email'],
    rows: rawLeads.map(l => [
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

  // 6. Campaign KPIs (Fase 7)
  tables.campaign_kpis = {
    key: 'campaign_kpis',
    title: 'KPIs de Campanhas (Fase 7)',
    headers: ['Plataforma', 'Campanha', 'UTM', 'Início', 'Fim', 'Orçamento R$', 'Gasto R$', 'Cliques', 'WhatsApp', 'Leads', 'Vendas', 'Receita R$', 'ROAS', 'CPL R$'],
    rows: rawKpis.map(k => [
      k.platform, k.campaign_name, k.utm_campaign || '-', k.period_start, k.period_end,
      Number(k.planned_budget || 0), Number(k.spend || 0), Number(k.clicks || 0), Number(k.whatsapp_contacts || 0),
      Number(k.leads || 0), Number(k.sales || 0), Number(k.revenue || 0),
      Number(k.spend) > 0 ? (Number(k.revenue) / Number(k.spend)).toFixed(2) : '-',
      Number(k.leads) > 0 ? (Number(k.spend) / Number(k.leads)).toFixed(2) : '-'
    ])
  }

  // 7. Pageviews & Sessões detalhadas
  tables.page_views = {
    key: 'page_views',
    title: 'Pageviews Detalhados',
    headers: ['ID', 'Data/Hora', 'Canal', 'Página', 'Origem UTM', 'Campanha UTM', 'Dispositivo', 'GCLID', 'ID Sessão', 'ID Visitante'],
    rows: rawViews.map(v => [
      v.id, v.created_at, v.channel || '-', v.path || v.landing_path || '/', v.utm_source || '-',
      v.utm_campaign || '-', v.device_type || '-', v.gclid ? 'SIM' : '-', v.session_id || '-', v.visitor_id || '-'
    ])
  }

  return tables as Record<ExportDatasetKey, ExportTable>
}

