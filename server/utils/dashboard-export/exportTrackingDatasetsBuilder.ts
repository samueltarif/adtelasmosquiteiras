/**
 * Construtor dos Datasets Adicionais de Tracking (Dimensões Ads, Orgânico, Sessões, Cliques, Jornadas)
 * Arquivo: server/utils/dashboard-export/exportTrackingDatasetsBuilder.ts
 * Limite: <= 200 linhas
 */

import { normalizeChannel } from '../../shared/adminAnalyticsCore.mjs'
import type { ExportTable } from './exportDataBuilder.ts'

export function buildTrackingAdditionalTables(rawViews: any[], rawClicks: any[]): Record<string, ExportTable> {
  const tables: Record<string, ExportTable> = {}

  // 1. Google Ads - Dimensões (Dispositivo, Rede, Match Type, IDs de Campanha/AdGroup/Creative)
  const gAdsViews = (rawViews || []).filter(v => v.channel === 'google_ads' || !!(v.gclid || v.gbraid || v.wbraid) || v.google_campaign_id)
  tables.google_ads_dimensions = {
    key: 'google_ads_dimensions' as any,
    title: 'Google Ads — Dimensões',
    headers: ['Data/Hora', 'ID Sessão', 'ID Campanha Google', 'ID Grupo Anúncio', 'ID Criativo', 'Match Type', 'Rede', 'Dispositivo', 'Target ID', 'GCLID', 'Landing Page'],
    rows: gAdsViews.map(v => [
      v.created_at || '-',
      v.session_id || '-',
      v.google_campaign_id || '-',
      v.google_adgroup_id || '-',
      v.google_creative_id || '-',
      v.google_match_type || '-',
      v.google_network || '-',
      v.google_device || '-',
      v.google_target_id || '-',
      v.gclid || '-',
      v.landing_path || v.path || '/'
    ])
  }

  // 2. Tráfego Orgânico & Direto
  const organicChannels = ['google_organic', 'instagram_organic', 'facebook_organic', 'tiktok_organic', 'direct', 'referral']
  const organicViews = (rawViews || []).filter(v => organicChannels.includes(normalizeChannel(v.channel)))
  tables.organic = {
    key: 'organic' as any,
    title: 'Tráfego Orgânico e Direto',
    headers: ['Data/Hora', 'Canal Canônico', 'Referrer', 'Página', 'ID Sessão', 'Dispositivo'],
    rows: organicViews.map(v => [
      v.created_at || '-',
      normalizeChannel(v.channel),
      v.referrer || '-',
      v.path || v.landing_path || '/',
      v.session_id || '-',
      v.device_type || '-'
    ])
  }

  // 3. Sessões Detalhadas
  const sessionMap = new Map<string, {
    sessionId: string
    visitorId: string
    firstSeen: string
    channel: string
    landingPath: string
    utmSource: string
    utmCampaign: string
    gclid: string
    pvs: number
  }>()

  for (const v of rawViews || []) {
    if (!v.session_id) continue
    if (!sessionMap.has(v.session_id)) {
      sessionMap.set(v.session_id, {
        sessionId: v.session_id,
        visitorId: v.visitor_id || '-',
        firstSeen: v.created_at,
        channel: v.channel || '-',
        landingPath: v.landing_path || v.path || '/',
        utmSource: v.utm_source || '-',
        utmCampaign: v.utm_campaign || '-',
        gclid: v.gclid || '-',
        pvs: 1
      })
    } else {
      sessionMap.get(v.session_id)!.pvs++
    }
  }

  tables.sessions = {
    key: 'sessions' as any,
    title: 'Sessões Detalhadas',
    headers: ['ID Sessão', 'ID Visitante', 'Primeiro Acesso', 'Canal', 'Página Entrada', 'Origem UTM', 'Campanha UTM', 'GCLID', 'Total Pageviews'],
    rows: Array.from(sessionMap.values()).map(s => [
      s.sessionId,
      s.visitorId,
      s.firstSeen,
      s.channel,
      s.landingPath,
      s.utmSource,
      s.utmCampaign,
      s.gclid,
      s.pvs
    ])
  }

  // 4. Cliques / CTAs
  tables.cta_clicks = {
    key: 'cta_clicks' as any,
    title: 'Cliques e Interações CTA',
    headers: ['Data/Hora', 'ID Clique', 'Tipo Interação', 'Localização CTA', 'Página', 'Canal', 'ID Sessão', 'ID Visitante'],
    rows: (rawClicks || []).map(c => [
      c.created_at || '-',
      c.id || '-',
      c.tipo || c.click_type || '-',
      c.cta_location || c.origem || '-',
      c.landing_path || '-',
      c.channel || '-',
      c.session_id || '-',
      c.visitor_id || '-'
    ])
  }

  // 5. Jornadas Cronológicas de Sessão
  const timelineEvents: Array<{ time: string; sessionId: string; visitorId: string; type: string; detail: string; channel: string; utmCampaign: string }> = []
  for (const v of rawViews || []) {
    if (v.session_id) {
      timelineEvents.push({
        time: v.created_at,
        sessionId: v.session_id,
        visitorId: v.visitor_id || '-',
        type: 'PAGEVIEW',
        detail: v.path || v.landing_path || '/',
        channel: v.channel || '-',
        utmCampaign: v.utm_campaign || '-'
      })
    }
  }
  for (const c of rawClicks || []) {
    if (c.session_id) {
      timelineEvents.push({
        time: c.created_at,
        sessionId: c.session_id,
        visitorId: c.visitor_id || '-',
        type: `CLIQUE_${(c.tipo || 'CTA').toUpperCase()}`,
        detail: c.cta_location || c.origem || c.landing_path || '-',
        channel: c.channel || '-',
        utmCampaign: c.utm_campaign || '-'
      })
    }
  }

  timelineEvents.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  tables.journeys = {
    key: 'journeys' as any,
    title: 'Jornadas de Sessão',
    headers: ['Data/Hora', 'ID Sessão', 'ID Visitante', 'Evento', 'Detalhe / Caminho', 'Canal', 'Campanha'],
    rows: timelineEvents.map(e => [
      e.time,
      e.sessionId,
      e.visitorId,
      e.type,
      e.detail,
      e.channel,
      e.utmCampaign
    ])
  }

  return tables
}
