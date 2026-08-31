/**
 * Paginação e Cálculo de Métricas e KPIs de Overview para Analytics
 * Arquivo: server/shared/adminAnalyticsMetrics.mjs
 */

import { PHASE_B_START_ISO, classifyLeadRecord } from './adminAnalyticsClassification.mjs'

export async function fetchAllPaginated(baseUrl, table, queryParams, headers, batchSize = 1000, customFetch) {
  const fetcher = customFetch || globalThis.$fetch
  if (!fetcher) throw new Error('[fetchAllPaginated] Nenhum fetcher disponível')

  const allRows = []
  let offset = 0
  let hasMore = true
  const cleanQuery = queryParams.startsWith('&') ? queryParams : `&${queryParams}`

  while (hasMore) {
    const url = `${baseUrl}/rest/v1/${table}?limit=${batchSize}&offset=${offset}${cleanQuery}`
    let chunk
    try {
      chunk = await fetcher(url, { headers })
    } catch {
      // ANALYTICS_RAW_ERROR_EXPOSURE=NONE: zero upstream message propagada
      console.error(`[fetchAllPaginated] PAGINATED_FETCH_FAILED table=${table} offset=${offset}`)
      throw new Error(`ANALYTICS_PAGINATED_FETCH_FAILED`)
    }

    if (!Array.isArray(chunk) || chunk.length === 0) break
    allRows.push(...chunk)
    offset += chunk.length
    if (chunk.length < batchSize) hasMore = false
  }

  return allRows
}

export function safeRate(numerator, denominator) {
  if (!denominator || denominator <= 0 || !numerator || numerator <= 0) return '0.0%'
  return ((numerator / denominator) * 100).toFixed(1) + '%'
}

export function safeRateNum(numerator, denominator) {
  if (!denominator || denominator <= 0 || !numerator || numerator <= 0) return 0
  return Number(((numerator / denominator) * 100).toFixed(1))
}

export function computeOverviewData(rawViews, rawClicks, rawLeads, rawHistory, dateRange, preset) {
  const { startUtc, endUtc, identityStartUtc, label, isLegacyOverlap } = dateRange
  const humanViews = (rawViews || []).filter(v => v.is_bot !== true)
  const humanClicks = (rawClicks || []).filter(c => c.is_bot !== true)

  const firstSeenMap = new Map()
  for (const h of (rawHistory || [])) {
    if (h.visitor_id && !firstSeenMap.has(h.visitor_id)) {
      firstSeenMap.set(h.visitor_id, new Date(h.created_at).getTime())
    }
  }

  const uniqueVisitorIds = new Set()
  const sessionIds = new Set()
  const activePeriodStartMs = new Date(identityStartUtc).getTime()

  let newVisitorsCount = 0
  let returningVisitorsCount = 0

  for (const v of humanViews) {
    const vTime = new Date(v.created_at).getTime()
    if (vTime >= activePeriodStartMs) {
      if (v.session_id) sessionIds.add(v.session_id)
      if (v.visitor_id && !uniqueVisitorIds.has(v.visitor_id)) {
        uniqueVisitorIds.add(v.visitor_id)
        const firstTime = firstSeenMap.get(v.visitor_id) || vTime
        if (firstTime >= activePeriodStartMs) newVisitorsCount++
        else returningVisitorsCount++
      }
    }
  }

  const realLeads = []
  const legacySyntheticLeads = []
  const automatedTestLeads = []
  const manualValidationLeads = []

  for (const l of (rawLeads || [])) {
    const cls = classifyLeadRecord(l)
    if (cls.category === 'REAL') realLeads.push(l)
    else if (cls.category === 'LEGACY_SYNTHETIC') legacySyntheticLeads.push(l)
    else if (cls.category === 'AUTOMATED_TEST') automatedTestLeads.push(l)
    else if (cls.category === 'MANUAL_VALIDATION_TEST') manualValidationLeads.push(l)
  }

  const realLeadsCount = realLeads.length
  const realLeadVisitors = new Set(realLeads.map(l => l.visitor_id).filter(Boolean)).size

  let whatsappClicksCount = 0
  let phoneClicksCount = 0
  const contactIntentVisitorIds = new Set()
  const whatsappVisitorIds = new Set()

  for (const c of humanClicks) {
    const cTime = new Date(c.created_at).getTime()
    if (c.tipo === 'whatsapp') {
      whatsappClicksCount++
      if (c.visitor_id && cTime >= activePeriodStartMs) whatsappVisitorIds.add(c.visitor_id)
    }
    if (c.tipo === 'telefone') phoneClicksCount++
    if ((c.tipo === 'whatsapp' || c.tipo === 'telefone') && c.visitor_id && cTime >= activePeriodStartMs) {
      contactIntentVisitorIds.add(c.visitor_id)
    }
  }

  const uniqueVisitorsTotal = uniqueVisitorIds.size
  const sessionsTotal = sessionIds.size
  const totalPageviews = humanViews.length

  const dailyMap = {}
  for (const v of humanViews) {
    const spDateStr = new Date(new Date(v.created_at).getTime() - 3 * 3600 * 1000).toISOString().split('T')[0]
    if (!dailyMap[spDateStr]) {
      dailyMap[spDateStr] = { date: spDateStr, unique_visitors: new Set(), sessions: new Set(), pageviews: 0, leads: 0, whatsapp: 0 }
    }
    dailyMap[spDateStr].pageviews++
    if (v.session_id) dailyMap[spDateStr].sessions.add(v.session_id)
    if (v.visitor_id) dailyMap[spDateStr].unique_visitors.add(v.visitor_id)
  }
  for (const c of humanClicks) {
    const spDateStr = new Date(new Date(c.created_at).getTime() - 3 * 3600 * 1000).toISOString().split('T')[0]
    if (dailyMap[spDateStr] && c.tipo === 'whatsapp') dailyMap[spDateStr].whatsapp++
  }
  for (const l of realLeads) {
    const spDateStr = new Date(new Date(l.created_at).getTime() - 3 * 3600 * 1000).toISOString().split('T')[0]
    if (dailyMap[spDateStr]) dailyMap[spDateStr].leads++
  }

  const dailySeries = Object.values(dailyMap).map(d => ({
    date: d.date.split('-').slice(1).reverse().join('/'),
    unique_visitors: d.unique_visitors.size,
    sessions: d.sessions.size,
    pageviews: d.pageviews,
    leads: d.leads,
    whatsapp: d.whatsapp
  }))

  const deviceMap = { Mobile: 0, Desktop: 0, Tablet: 0, Outros: 0 }
  for (const v of humanViews) {
    const d = (v.device_type || '').toLowerCase()
    if (d === 'mobile') deviceMap.Mobile++
    else if (d === 'desktop') deviceMap.Desktop++
    else if (d === 'tablet') deviceMap.Tablet++
    else deviceMap.Outros++
  }

  const devices = Object.entries(deviceMap)
    .filter(([_, count]) => count > 0)
    .map(([name, count]) => ({ name, count, percentage: safeRateNum(count, totalPageviews) }))

  return {
    success: true,
    meta: { preset, date_label: label, requested_start_utc: startUtc, requested_end_utc: endUtc, identity_start_utc: identityStartUtc, phase_b_start_at: PHASE_B_START_ISO, is_legacy_overlap: isLegacyOverlap },
    kpis: {
      unique_visitors: uniqueVisitorsTotal,
      sessions: sessionsTotal,
      pageviews: totalPageviews,
      real_leads: realLeadsCount,
      real_lead_visitors: realLeadVisitors,
      whatsapp_clicks: whatsappClicksCount,
      phone_clicks: phoneClicksCount,
      contact_intent_events: whatsappClicksCount + phoneClicksCount,
      contact_intent_visitors: contactIntentVisitorIds.size,
      rates: {
        lead_conversion_rate: safeRate(realLeadVisitors, uniqueVisitorsTotal),
        contact_intent_rate: safeRate(contactIntentVisitorIds.size, uniqueVisitorsTotal),
        whatsapp_rate: safeRate(whatsappVisitorIds.size, uniqueVisitorsTotal),
        avg_pages_per_session: sessionsTotal > 0 ? Number((totalPageviews / sessionsTotal).toFixed(1)) : 0
      }
    },
    retention: {
      new_visitors: newVisitorsCount,
      returning_visitors: returningVisitorsCount,
      new_percentage: safeRateNum(newVisitorsCount, uniqueVisitorsTotal),
      returning_percentage: safeRateNum(returningVisitorsCount, uniqueVisitorsTotal)
    },
    devices,
    daily_series: dailySeries,
    data_quality: {
      missing_visitor_id: (rawViews || []).filter(v => !v.visitor_id && v.is_bot !== true).length,
      missing_session_id: (rawViews || []).filter(v => !v.session_id && v.is_bot !== true).length,
      missing_cta_location: (rawClicks || []).filter(c => !c.cta_location && c.is_bot !== true).length,
      service_cards_missing_key: (rawClicks || []).filter(c => c.cta_location === 'service_card' && !c.service_key).length,
      bots_detected: (rawViews || []).filter(v => v.is_bot === true).length + (rawClicks || []).filter(c => c.is_bot === true).length,
      legacy_synthetic_leads: legacySyntheticLeads.length,
      automated_test_leads: automatedTestLeads.length,
      manual_validation_leads: manualValidationLeads.length
    }
  }
}
