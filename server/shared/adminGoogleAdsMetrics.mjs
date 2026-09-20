/**
 * Cálculos e Métricas dedicados para a Campanha Google Ads e Landing Page
 * Arquivo: server/shared/adminGoogleAdsMetrics.mjs
 */

import { classifyLeadRecord } from './adminAnalyticsClassification.mjs'

export function safeRate(numerator, denominator) {
  if (!denominator || denominator <= 0 || !numerator || numerator <= 0) return '0.0%'
  return ((numerator / denominator) * 100).toFixed(1) + '%'
}

export function safeRateNum(numerator, denominator) {
  if (!denominator || denominator <= 0 || !numerator || numerator <= 0) return 0
  return Number(((numerator / denominator) * 100).toFixed(1))
}

const CTA_LABELS = {
  lp_hero: 'Hero (Topo da Landing)',
  lp_header: 'Header (Cabeçalho)',
  lp_sticky: 'Barra Fixa Mobile (Rodapé)',
  lp_bottom: 'Seção Final de Contato',
  lp_form: 'Formulário da Landing',
  floating_whatsapp: 'WhatsApp Flutuante',
  sticky_mobile: 'CTA Fixo Mobile',
  service_card: 'Card de Serviço',
  header: 'Cabeçalho Geral',
  hero: 'Hero Principal',
  footer: 'Rodapé Geral',
  other: 'Outros / Não Especificado'
}

export function computeGoogleAdsData(rawViews, rawClicks, rawLeads, dateRange) {
  const { startUtc, endUtc, identityStartUtc } = dateRange
  const activePeriodStartMs = new Date(identityStartUtc).getTime()

  // 1. Filtragem estrita de bots
  const humanViews = (rawViews || []).filter(v => v.is_bot !== true)
  const humanClicks = (rawClicks || []).filter(c => c.is_bot !== true)

  // 2. Classificação de leads reais (exclui sintéticos e testes)
  const realLeads = (rawLeads || []).filter(l => classifyLeadRecord(l).category === 'REAL')

  // 3. Identificação de Tráfego Google Ads (channel = 'google_ads' ou presença de click id)
  const isGoogleAdsView = (v) => {
    return v.channel === 'google_ads' || !!(v.gclid || v.gbraid || v.wbraid) || (v.utm_medium || '').toLowerCase().includes('cpc')
  }

  const isGoogleAdsClick = (c) => {
    return c.channel === 'google_ads' || !!(c.gclid || c.gbraid || c.wbraid) || (c.utm_medium || '').toLowerCase().includes('cpc')
  }

  const isGoogleAdsLead = (l) => {
    return l.session_channel === 'google_ads' || l.first_touch_channel === 'google_ads' || !!(l.gclid || l.first_touch_gclid)
  }

  // Visualizações e Sessões Google Ads
  const gAdsViews = humanViews.filter(isGoogleAdsView)
  const gAdsClicks = humanClicks.filter(isGoogleAdsClick)
  const gAdsLeads = realLeads.filter(isGoogleAdsLead)

  const gAdsVisitorIds = new Set()
  const gAdsSessionIds = new Set()

  for (const v of gAdsViews) {
    const vTime = new Date(v.created_at).getTime()
    if (vTime >= activePeriodStartMs) {
      if (v.visitor_id) gAdsVisitorIds.add(v.visitor_id)
      if (v.session_id) gAdsSessionIds.add(v.session_id)
    }
  }

  // KPIs de Cliques Google Ads
  let gAdsWhatsappClicksCount = 0
  const gAdsWhatsappVisitors = new Set()
  let gAdsFormStartsCount = 0
  const gAdsFormStartVisitors = new Set()
  const gAdsContactIntentVisitors = new Set()

  for (const c of gAdsClicks) {
    const cTime = new Date(c.created_at).getTime()
    if (c.tipo === 'whatsapp') {
      gAdsWhatsappClicksCount++
      if (c.visitor_id && cTime >= activePeriodStartMs) {
        gAdsWhatsappVisitors.add(c.visitor_id)
        gAdsContactIntentVisitors.add(c.visitor_id)
      }
    } else if (c.tipo === 'form_start') {
      gAdsFormStartsCount++
      if (c.visitor_id && cTime >= activePeriodStartMs) {
        gAdsFormStartVisitors.add(c.visitor_id)
        gAdsContactIntentVisitors.add(c.visitor_id)
      }
    } else if (c.tipo === 'quote_cta' || c.tipo === 'telefone' || c.tipo === 'internal_cta') {
      if (c.visitor_id && cTime >= activePeriodStartMs) {
        gAdsContactIntentVisitors.add(c.visitor_id)
      }
    }
  }

  const gAdsLeadVisitors = new Set()
  for (const l of gAdsLeads) {
    if (l.visitor_id) {
      gAdsLeadVisitors.add(l.visitor_id)
      gAdsContactIntentVisitors.add(l.visitor_id)
    }
  }

  const totalGAdsVisitors = gAdsVisitorIds.size
  const totalGAdsSessions = gAdsSessionIds.size

  // 4. FUNIL ESPECÍFICO DA LANDING PAGE (/lp/telas-mosquiteiras)
  const landingVisitorIds = new Set()
  const landingSessionIds = new Set()
  for (const v of humanViews) {
    const p = (v.path || '').toLowerCase()
    const lp = (v.landing_path || '').toLowerCase()
    if (p.includes('/lp/telas-mosquiteiras') || lp.includes('/lp/telas-mosquiteiras')) {
      const vTime = new Date(v.created_at).getTime()
      if (vTime >= activePeriodStartMs) {
        if (v.visitor_id) landingVisitorIds.add(v.visitor_id)
        if (v.session_id) landingSessionIds.add(v.session_id)
      }
    }
  }

  let lpQuoteCtaClicks = 0
  const lpQuoteCtaVisitors = new Set()
  let lpWhatsappClicks = 0
  const lpWhatsappVisitors = new Set()
  let lpFormStartClicks = 0
  const lpFormStartVisitors = new Set()

  for (const c of humanClicks) {
    const o = (c.origem || '').toLowerCase()
    const lp = (c.landing_path || '').toLowerCase()
    const isLp = o.includes('/lp/telas-mosquiteiras') || lp.includes('/lp/telas-mosquiteiras') || (c.cta_location && c.cta_location.startsWith('lp_'))

    if (isLp) {
      const cTime = new Date(c.created_at).getTime()
      if (c.tipo === 'quote_cta') {
        lpQuoteCtaClicks++
        if (c.visitor_id && cTime >= activePeriodStartMs) lpQuoteCtaVisitors.add(c.visitor_id)
      } else if (c.tipo === 'whatsapp') {
        lpWhatsappClicks++
        if (c.visitor_id && cTime >= activePeriodStartMs) lpWhatsappVisitors.add(c.visitor_id)
      } else if (c.tipo === 'form_start') {
        lpFormStartClicks++
        if (c.visitor_id && cTime >= activePeriodStartMs) lpFormStartVisitors.add(c.visitor_id)
      }
    }
  }

  let lpRealLeadsCount = 0
  const lpRealLeadVisitors = new Set()
  for (const l of realLeads) {
    const o = (l.origem || '').toLowerCase()
    const cp = (l.conversion_path || '').toLowerCase()
    const lp = (l.landing_path || '').toLowerCase()
    const isLp = o.includes('/lp/telas-mosquiteiras') || cp.includes('/lp/telas-mosquiteiras') || lp.includes('/lp/telas-mosquiteiras')

    if (isLp) {
      lpRealLeadsCount++
      if (l.visitor_id) lpRealLeadVisitors.add(l.visitor_id)
    }
  }

  // UNIÃO ESTATISTICAMENTE CORRETA DE INTENÇÃO (Sem soma ingênua duplicada)
  const lpContactIntentVisitors = new Set([
    ...lpQuoteCtaVisitors,
    ...lpWhatsappVisitors,
    ...lpFormStartVisitors,
    ...lpRealLeadVisitors
  ])

  const totalLandingVisitors = landingVisitorIds.size || totalGAdsVisitors || 1

  const funnel = {
    landing_visitors: landingVisitorIds.size,
    landing_sessions: landingSessionIds.size,
    quote_cta_visitors: lpQuoteCtaVisitors.size,
    quote_cta_clicks: lpQuoteCtaClicks,
    contact_intent_unique_visitors: lpContactIntentVisitors.size,
    whatsapp_unique_visitors: lpWhatsappVisitors.size,
    whatsapp_clicks: lpWhatsappClicks,
    form_start_unique_visitors: lpFormStartVisitors.size,
    form_start_clicks: lpFormStartClicks,
    real_lead_unique_visitors: lpRealLeadVisitors.size,
    real_leads_count: lpRealLeadsCount,
    taxa_intencao: safeRate(lpContactIntentVisitors.size, totalLandingVisitors),
    taxa_whatsapp: safeRate(lpWhatsappVisitors.size, totalLandingVisitors),
    taxa_form_start: safeRate(lpFormStartVisitors.size, totalLandingVisitors),
    taxa_form_success: safeRate(lpRealLeadVisitors.size, totalLandingVisitors)
  }

  // 5. DATA QUALITY (Denominador Padrão = Sessões Únicas Google Ads)
  let sessionsWithClickId = 0
  let sessionsWithKeyword = 0
  let sessionsWithCampaignId = 0

  // Mapeia atributos por sessão única de Google Ads
  const sessionAttrMap = new Map()
  for (const v of gAdsViews) {
    if (v.session_id && !sessionAttrMap.has(v.session_id)) {
      sessionAttrMap.set(v.session_id, {
        hasClickId: !!(v.gclid || v.gbraid || v.wbraid),
        hasKeyword: !!(v.utm_term && v.utm_term.trim() !== ''),
        hasCampaignId: !!(v.google_campaign_id && v.google_campaign_id.trim() !== '')
      })
    } else if (v.session_id && sessionAttrMap.has(v.session_id)) {
      const entry = sessionAttrMap.get(v.session_id)
      if (v.gclid || v.gbraid || v.wbraid) entry.hasClickId = true
      if (v.utm_term && v.utm_term.trim() !== '') entry.hasKeyword = true
      if (v.google_campaign_id && v.google_campaign_id.trim() !== '') entry.hasCampaignId = true
    }
  }

  for (const s of sessionAttrMap.values()) {
    if (s.hasClickId) sessionsWithClickId++
    if (s.hasKeyword) sessionsWithKeyword++
    if (s.hasCampaignId) sessionsWithCampaignId++
  }

  const denomSessions = sessionAttrMap.size || totalGAdsSessions || 1
  let leadsWithAttribution = 0
  for (const l of realLeads) {
    if (l.session_channel || l.first_touch_channel || l.utm_campaign || l.first_touch_utm_campaign || l.gclid) {
      leadsWithAttribution++
    }
  }

  const dataQuality = {
    total_google_ads_sessions: sessionAttrMap.size,
    sessions_with_click_id: sessionsWithClickId,
    sessions_with_keyword: sessionsWithKeyword,
    sessions_with_campaign_id: sessionsWithCampaignId,
    pct_with_click_id: safeRate(sessionsWithClickId, denomSessions),
    pct_with_keyword: safeRate(sessionsWithKeyword, denomSessions),
    pct_with_campaign_id: safeRate(sessionsWithCampaignId, denomSessions),
    total_real_leads: realLeads.length,
    leads_with_attribution: leadsWithAttribution,
    pct_leads_with_attribution: safeRate(leadsWithAttribution, realLeads.length)
  }

  // 6. TABELA DE CAMPANHAS GOOGLE ADS (Cruzando utm_campaign e google_campaign_id)
  const campaignMap = {}
  for (const v of gAdsViews) {
    const cName = v.utm_campaign || '(sem_nome_utm)'
    const cId = v.google_campaign_id || null
    const key = `${cName}:::${cId || 'null'}`

    if (!campaignMap[key]) {
      campaignMap[key] = {
        utm_campaign: cName,
        google_campaign_id: cId,
        unique_visitors: new Set(),
        sessions: new Set(),
        pageviews: 0,
        whatsapp_clicks: 0,
        form_starts: 0,
        leads_count: 0,
        intent_visitors: new Set(),
        lead_visitors: new Set()
      }
    }
    campaignMap[key].pageviews++
    if (v.visitor_id) campaignMap[key].unique_visitors.add(v.visitor_id)
    if (v.session_id) campaignMap[key].sessions.add(v.session_id)
  }

  for (const c of gAdsClicks) {
    const cName = c.utm_campaign || '(sem_nome_utm)'
    const cId = c.google_campaign_id || null
    const key = `${cName}:::${cId || 'null'}`
    if (campaignMap[key]) {
      if (c.tipo === 'whatsapp') campaignMap[key].whatsapp_clicks++
      if (c.tipo === 'form_start') campaignMap[key].form_starts++
      if (c.visitor_id) campaignMap[key].intent_visitors.add(c.visitor_id)
    }
  }

  for (const l of gAdsLeads) {
    const cName = l.utm_campaign || l.first_touch_utm_campaign || '(sem_nome_utm)'
    const cId = l.google_campaign_id || l.first_touch_google_campaign_id || null
    const key = `${cName}:::${cId || 'null'}`
    if (campaignMap[key]) {
      campaignMap[key].leads_count++
      if (l.visitor_id) campaignMap[key].lead_visitors.add(l.visitor_id)
    }
  }

  const campaigns = Object.values(campaignMap).map(cmp => {
    const vCount = cmp.unique_visitors.size
    return {
      utm_campaign: cmp.utm_campaign,
      google_campaign_id: cmp.google_campaign_id,
      unique_visitors: vCount,
      sessions: cmp.sessions.size,
      pageviews: cmp.pageviews,
      whatsapp_clicks: cmp.whatsapp_clicks,
      form_starts: cmp.form_starts,
      leads_count: cmp.leads_count,
      contact_intent_rate: safeRate(cmp.intent_visitors.size, vCount),
      lead_conversion_rate: safeRate(cmp.lead_visitors.size, vCount)
    }
  }).sort((a, b) => b.unique_visitors - a.unique_visitors)

  // 7. TABELA DE PALAVRAS-CHAVE GOOGLE ADS (utm_term = {keyword})
  const keywordMap = {}
  for (const v of gAdsViews) {
    const kw = v.utm_term ? v.utm_term.trim() : '(palavra_chave_nao_capturada)'
    if (!keywordMap[kw]) {
      keywordMap[kw] = {
        keyword: kw,
        utm_campaign: v.utm_campaign || null,
        unique_visitors: new Set(),
        sessions: new Set(),
        pageviews: 0,
        whatsapp_clicks: 0,
        form_starts: 0,
        leads_count: 0,
        intent_visitors: new Set(),
        lead_visitors: new Set()
      }
    }
    keywordMap[kw].pageviews++
    if (v.visitor_id) keywordMap[kw].unique_visitors.add(v.visitor_id)
    if (v.session_id) keywordMap[kw].sessions.add(v.session_id)
  }

  for (const c of gAdsClicks) {
    const kw = c.utm_term ? c.utm_term.trim() : '(palavra_chave_nao_capturada)'
    if (keywordMap[kw]) {
      if (c.tipo === 'whatsapp') keywordMap[kw].whatsapp_clicks++
      if (c.tipo === 'form_start') keywordMap[kw].form_starts++
      if (c.visitor_id) keywordMap[kw].intent_visitors.add(c.visitor_id)
    }
  }

  for (const l of gAdsLeads) {
    const kw = (l.utm_term || l.first_touch_utm_term) ? (l.utm_term || l.first_touch_utm_term).trim() : '(palavra_chave_nao_capturada)'
    if (keywordMap[kw]) {
      keywordMap[kw].leads_count++
      if (l.visitor_id) keywordMap[kw].lead_visitors.add(l.visitor_id)
    }
  }

  const keywords = Object.values(keywordMap).map(kw => {
    const vCount = kw.unique_visitors.size
    return {
      keyword: kw.keyword,
      utm_campaign: kw.utm_campaign,
      unique_visitors: vCount,
      sessions: kw.sessions.size,
      pageviews: kw.pageviews,
      whatsapp_clicks: kw.whatsapp_clicks,
      form_starts: kw.form_starts,
      leads_count: kw.leads_count,
      contact_intent_rate: safeRate(kw.intent_visitors.size, vCount),
      lead_conversion_rate: safeRate(kw.lead_visitors.size, vCount)
    }
  }).sort((a, b) => b.unique_visitors - a.unique_visitors)

  // 8. DESEMPENHO DOS CTAs DA LANDING PAGE
  const ctaMap = {}
  let totalLandingClicks = 0
  for (const c of humanClicks) {
    const o = (c.origem || '').toLowerCase()
    const lp = (c.landing_path || '').toLowerCase()
    const isLp = o.includes('/lp/telas-mosquiteiras') || lp.includes('/lp/telas-mosquiteiras') || (c.cta_location && c.cta_location.startsWith('lp_'))

    if (isLp) {
      const loc = c.cta_location || 'other'
      const key = `${loc}:::${c.tipo}`
      if (!ctaMap[key]) {
        ctaMap[key] = {
          cta_location: loc,
          tipo: c.tipo,
          label: CTA_LABELS[loc] || loc,
          clicks: 0,
          unique_visitors: new Set()
        }
      }
      ctaMap[key].clicks++
      totalLandingClicks++
      if (c.visitor_id) ctaMap[key].unique_visitors.add(c.visitor_id)
    }
  }

  const ctas = Object.values(ctaMap).map(cta => ({
    cta_location: cta.cta_location,
    tipo: cta.tipo,
    label: cta.label,
    clicks: cta.clicks,
    unique_visitors: cta.unique_visitors.size,
    pct_of_total_clicks: safeRate(cta.clicks, totalLandingClicks)
  })).sort((a, b) => b.clicks - a.clicks)

  return {
    kpis: {
      unique_visitors: totalGAdsVisitors,
      sessions: totalGAdsSessions,
      pageviews: gAdsViews.length,
      whatsapp_clicks: gAdsWhatsappClicksCount,
      whatsapp_unique_visitors: gAdsWhatsappVisitors.size,
      form_starts: gAdsFormStartsCount,
      form_starts_unique_visitors: gAdsFormStartVisitors.size,
      real_leads: gAdsLeads.length,
      real_lead_unique_visitors: gAdsLeadVisitors.size,
      contact_intent_events: gAdsWhatsappClicksCount + gAdsFormStartsCount,
      contact_intent_unique_visitors: gAdsContactIntentVisitors.size,
      contact_intent_rate: safeRate(gAdsContactIntentVisitors.size, totalGAdsVisitors),
      lead_conversion_rate: safeRate(gAdsLeadVisitors.size, totalGAdsVisitors),
      whatsapp_rate: safeRate(gAdsWhatsappVisitors.size, totalGAdsVisitors),
      form_start_rate: safeRate(gAdsFormStartVisitors.size, totalGAdsVisitors)
    },
    funnel,
    data_quality: dataQuality,
    campaigns,
    keywords,
    ctas
  }
}
