/**
 * Motor de Análise e Comparação "Antes x Depois" da Nova Landing Page
 * Arquivo: server/shared/adminLandingComparison.mjs
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

export function formatPpDelta(afterRateNum, beforeRateNum) {
  const diff = Number((afterRateNum - beforeRateNum).toFixed(1))
  const sign = diff > 0 ? '+' : ''
  return {
    diff_pp: diff,
    formatted: `${sign}${diff.toFixed(1)} p.p.`,
    is_positive: diff > 0,
    is_neutral: diff === 0
  }
}

export function formatCountDelta(afterCount, beforeCount) {
  const diff = afterCount - beforeCount
  const sign = diff > 0 ? '+' : ''
  return {
    diff,
    formatted: `${sign}${diff}`,
    is_positive: diff > 0,
    is_neutral: diff === 0
  }
}

export function matchesPathPrefix(path, prefixes = ['/servicos/telas']) {
  if (!path) return false
  const clean = String(path).toLowerCase().trim()
  for (const prefix of prefixes) {
    if (!prefix) continue
    const p = String(prefix).toLowerCase().trim()
    if (clean === p || clean.startsWith(p + '/') || clean.startsWith(p + '?')) {
      return true
    }
  }
  return false
}

export function matchesExactOrSubpath(path, targetPath = '/lp/telas-mosquiteiras') {
  if (!path) return false
  const clean = String(path).toLowerCase().trim()
  const target = String(targetPath).toLowerCase().trim()
  return clean === target || clean.startsWith(target + '/') || clean.startsWith(target + '?')
}

export function formatFriendlyDuration(durationMs) {
  if (!durationMs || durationMs <= 0) return '0h'
  const hours = durationMs / (3600 * 1000)
  if (hours < 1) {
    const mins = Math.max(1, Math.round(durationMs / (60 * 1000)))
    return `${mins} min`
  }
  if (hours < 24) {
    const rounded = Number(hours.toFixed(1))
    return Number.isInteger(rounded) ? `${Math.round(hours)}h` : `${rounded}h`
  }
  const days = hours / 24
  const roundedDays = Number(days.toFixed(1))
  return Number.isInteger(roundedDays) ? `${Math.round(days)} dias` : `${roundedDays} dias`
}

/**
 * Calcula janelas simétricas e justas considerando o buffer de maturação (30 min)
 */
export function calculateComparisonWindow(cutoffAtIso, options = {}, nowIso = null, maturityBufferMinutes = 30) {
  const cutoffMs = new Date(cutoffAtIso).getTime()
  const nowMs = nowIso ? new Date(nowIso).getTime() : Date.now()
  const bufferMs = maturityBufferMinutes * 60 * 1000
  const maturedEndMs = nowMs - bufferMs

  // Limite máximo de dados maturados pós-cutoff
  const availableMaturedMs = Math.max(0, maturedEndMs - cutoffMs)
  const isPendingMaturity = (nowMs - cutoffMs) < bufferMs

  let effectiveDurationMs = availableMaturedMs

  if (options.windowHours && options.windowHours > 0) {
    const reqMs = options.windowHours * 3600 * 1000
    effectiveDurationMs = Math.min(reqMs, availableMaturedMs)
  } else if (options.endUtc) {
    const reqEndMs = new Date(options.endUtc).getTime()
    const targetEndMs = Math.min(reqEndMs, maturedEndMs)
    const targetDurationMs = Math.max(0, targetEndMs - cutoffMs)
    effectiveDurationMs = Math.min(targetDurationMs, availableMaturedMs)
  }

  const afterStartMs = cutoffMs
  const afterEndMs = cutoffMs + effectiveDurationMs
  const beforeEndMs = cutoffMs
  const beforeStartMs = cutoffMs - effectiveDurationMs

  return {
    cutoffAtIso,
    durationMs: effectiveDurationMs,
    durationHours: Number((effectiveDurationMs / 3600000).toFixed(1)),
    durationFormatted: formatFriendlyDuration(effectiveDurationMs),
    beforeStartUtc: new Date(beforeStartMs).toISOString(),
    beforeEndUtc: new Date(beforeEndMs).toISOString(),
    afterStartUtc: new Date(afterStartMs).toISOString(),
    afterEndUtc: new Date(afterEndMs).toISOString(),
    isSymmetric: true,
    isPendingMaturity,
    maturityBufferMinutes
  }
}

/**
 * Computa as métricas de coorte da landing para um conjunto de dados
 */
export function computeLandingComparison(rawViews, rawClicks, rawLeads, window, config = {}) {
  const {
    landing_path = '/lp/telas-mosquiteiras',
    previous_path_prefixes = ['/servicos/telas'],
    channelFilter = 'google_ads'
  } = config

  // 1. Filtragem estrita de bots
  const humanViews = (rawViews || []).filter(v => v.is_bot !== true)
  const humanClicks = (rawClicks || []).filter(c => c.is_bot !== true)
  const realLeads = (rawLeads || []).filter(l => classifyLeadRecord(l).category === 'REAL')

  // 2. Filtro de canal (Google Ads vs Todos)
  const isGoogleAdsView = (v) => {
    return v.channel === 'google_ads' || !!(v.gclid || v.gbraid || v.wbraid) || (v.utm_medium || '').toLowerCase().includes('cpc')
  }

  const isGoogleAdsClick = (c) => {
    return c.channel === 'google_ads' || !!(c.gclid || c.gbraid || c.wbraid) || (c.utm_medium || '').toLowerCase().includes('cpc')
  }

  const isGoogleAdsLead = (l) => {
    return l.session_channel === 'google_ads' || l.first_touch_channel === 'google_ads' || !!(l.gclid || l.first_touch_gclid)
  }

  const filteredViews = channelFilter === 'google_ads' ? humanViews.filter(isGoogleAdsView) : humanViews
  const filteredClicks = channelFilter === 'google_ads' ? humanClicks.filter(isGoogleAdsClick) : humanClicks
  const filteredLeads = channelFilter === 'google_ads' ? realLeads.filter(isGoogleAdsLead) : realLeads

  const beforeStartMs = new Date(window.beforeStartUtc).getTime()
  const beforeEndMs = new Date(window.beforeEndUtc).getTime()
  const afterStartMs = new Date(window.afterStartUtc).getTime()
  const afterEndMs = new Date(window.afterEndUtc).getTime()

  // 3. Formação das Coortes por Sessão
  // ANTES: sessões com entrada em previous_path_prefixes
  const beforeCohortSessionIds = new Set()
  const beforeCohortVisitorIds = new Set()
  const beforeSessionDeviceMap = new Map()

  // DEPOIS: sessões com entrada em landing_path
  const afterCohortSessionIds = new Set()
  const afterCohortVisitorIds = new Set()
  const afterSessionDeviceMap = new Map()

  const beforeViews = []
  const afterViews = []

  for (const v of filteredViews) {
    const vTime = new Date(v.created_at).getTime()

    // Janela ANTES
    if (vTime >= beforeStartMs && vTime < beforeEndMs) {
      const isBeforeLanding = matchesPathPrefix(v.landing_path, previous_path_prefixes) ||
        (!v.landing_path && matchesPathPrefix(v.path, previous_path_prefixes))

      if (isBeforeLanding) {
        if (v.session_id) {
          beforeCohortSessionIds.add(v.session_id)
          if (v.device_type && !beforeSessionDeviceMap.has(v.session_id)) {
            beforeSessionDeviceMap.set(v.session_id, v.device_type)
          }
        }
        if (v.visitor_id) beforeCohortVisitorIds.add(v.visitor_id)
        beforeViews.push(v)
      }
    }

    // Janela DEPOIS
    if (vTime >= afterStartMs && vTime < afterEndMs) {
      const isAfterLanding = matchesExactOrSubpath(v.landing_path, landing_path) ||
        (!v.landing_path && matchesExactOrSubpath(v.path, landing_path))

      if (isAfterLanding) {
        if (v.session_id) {
          afterCohortSessionIds.add(v.session_id)
          if (v.device_type && !afterSessionDeviceMap.has(v.session_id)) {
            afterSessionDeviceMap.set(v.session_id, v.device_type)
          }
        }
        if (v.visitor_id) afterCohortVisitorIds.add(v.visitor_id)
        afterViews.push(v)
      }
    }
  }

  // 4. Filtragem de Ações Pertencentes Estritamente às Coortes
  const isClickInCohort = (c, cohortSessions, cohortVisitors, landingMatchFn) => {
    if (c.session_id && cohortSessions.has(c.session_id)) return true
    // Fallback seguro: se session_id estiver ausente no evento, valida landing_path e visitor_id da coorte
    if (!c.session_id && landingMatchFn(c.landing_path || c.origem) && c.visitor_id && cohortVisitors.has(c.visitor_id)) {
      return true
    }
    return false
  }

  const isLeadInCohort = (l, cohortSessions, cohortVisitors, landingMatchFn) => {
    if (l.session_id && cohortSessions.has(l.session_id)) return true
    // Fallback seguro documentado
    if (!l.session_id && landingMatchFn(l.landing_path || l.origem || l.conversion_path) && l.visitor_id && cohortVisitors.has(l.visitor_id)) {
      return true
    }
    return false
  }

  const beforeClicks = []
  const afterClicks = []

  for (const c of filteredClicks) {
    const cTime = new Date(c.created_at).getTime()
    if (cTime >= beforeStartMs && cTime < beforeEndMs) {
      if (isClickInCohort(c, beforeCohortSessionIds, beforeCohortVisitorIds, p => matchesPathPrefix(p, previous_path_prefixes))) {
        beforeClicks.push(c)
      }
    } else if (cTime >= afterStartMs && cTime < afterEndMs) {
      if (isClickInCohort(c, afterCohortSessionIds, afterCohortVisitorIds, p => matchesExactOrSubpath(p, landing_path))) {
        afterClicks.push(c)
      }
    }
  }

  const beforeLeads = []
  const afterLeads = []

  for (const l of filteredLeads) {
    const lTime = new Date(l.created_at).getTime()
    if (lTime >= beforeStartMs && lTime < beforeEndMs) {
      if (isLeadInCohort(l, beforeCohortSessionIds, beforeCohortVisitorIds, p => matchesPathPrefix(p, previous_path_prefixes))) {
        beforeLeads.push(l)
      }
    } else if (lTime >= afterStartMs && lTime < afterEndMs) {
      if (isLeadInCohort(l, afterCohortSessionIds, afterCohortVisitorIds, p => matchesExactOrSubpath(p, landing_path))) {
        afterLeads.push(l)
      }
    }
  }

  // Helper para computar métricas da coorte
  function buildCohortMetrics(views, clicks, leads, cohortVisitors, cohortSessions) {
    let whatsappClicksCount = 0
    const whatsappVisitors = new Set()
    let formStartsCount = 0
    const formStartVisitors = new Set()
    let quoteCtaClicksCount = 0
    const quoteCtaVisitors = new Set()

    for (const c of clicks) {
      if (c.tipo === 'whatsapp') {
        whatsappClicksCount++
        if (c.visitor_id) whatsappVisitors.add(c.visitor_id)
      } else if (c.tipo === 'form_start') {
        formStartsCount++
        if (c.visitor_id) formStartVisitors.add(c.visitor_id)
      } else if (c.tipo === 'quote_cta') {
        quoteCtaClicksCount++
        if (c.visitor_id) quoteCtaVisitors.add(c.visitor_id)
      }
    }

    const leadVisitors = new Set()
    for (const l of leads) {
      if (l.visitor_id) leadVisitors.add(l.visitor_id)
    }

    // UNIÃO ESTATÍSTICA DESDUPLICADA (Zero duplicidade)
    const contactIntentVisitors = new Set([
      ...whatsappVisitors,
      ...formStartVisitors,
      ...quoteCtaVisitors,
      ...leadVisitors
    ])

    const totalLandingVisitors = cohortVisitors.size
    const totalLandingSessions = cohortSessions.size

    const taxaIntencaoNum = safeRateNum(contactIntentVisitors.size, totalLandingVisitors)
    const taxaWhatsappNum = safeRateNum(whatsappVisitors.size, totalLandingVisitors)
    const taxaFormStartNum = safeRateNum(formStartVisitors.size, totalLandingVisitors)
    const taxaLeadNum = safeRateNum(leadVisitors.size, totalLandingVisitors)

    return {
      landing_unique_visitors: totalLandingVisitors,
      sessions: totalLandingSessions,
      pageviews: views.length,
      contact_intent_unique_visitors: contactIntentVisitors.size,
      whatsapp_unique_visitors: whatsappVisitors.size,
      whatsapp_clicks: whatsappClicksCount,
      form_start_unique_visitors: formStartVisitors.size,
      form_starts: formStartsCount,
      quote_cta_unique_visitors: quoteCtaVisitors.size,
      quote_cta_clicks: quoteCtaClicksCount,
      real_lead_unique_visitors: leadVisitors.size,
      real_leads_count: leads.length,
      taxa_intencao_num: taxaIntencaoNum,
      taxa_intencao: safeRate(contactIntentVisitors.size, totalLandingVisitors),
      taxa_whatsapp_num: taxaWhatsappNum,
      taxa_whatsapp: safeRate(whatsappVisitors.size, totalLandingVisitors),
      taxa_form_start_num: taxaFormStartNum,
      taxa_form_start: safeRate(formStartVisitors.size, totalLandingVisitors),
      taxa_lead_num: taxaLeadNum,
      taxa_lead: safeRate(leadVisitors.size, totalLandingVisitors)
    }
  }

  const beforeMetrics = buildCohortMetrics(beforeViews, beforeClicks, beforeLeads, beforeCohortVisitorIds, beforeCohortSessionIds)
  const afterMetrics = buildCohortMetrics(afterViews, afterClicks, afterLeads, afterCohortVisitorIds, afterCohortSessionIds)

  // 5. Cálculo dos Deltas (com p.p. para taxas)
  const delta = {
    landing_unique_visitors: formatCountDelta(afterMetrics.landing_unique_visitors, beforeMetrics.landing_unique_visitors),
    sessions: formatCountDelta(afterMetrics.sessions, beforeMetrics.sessions),
    pageviews: formatCountDelta(afterMetrics.pageviews, beforeMetrics.pageviews),
    contact_intent_unique_visitors: formatCountDelta(afterMetrics.contact_intent_unique_visitors, beforeMetrics.contact_intent_unique_visitors),
    whatsapp_unique_visitors: formatCountDelta(afterMetrics.whatsapp_unique_visitors, beforeMetrics.whatsapp_unique_visitors),
    form_start_unique_visitors: formatCountDelta(afterMetrics.form_start_unique_visitors, beforeMetrics.form_start_unique_visitors),
    real_lead_unique_visitors: formatCountDelta(afterMetrics.real_lead_unique_visitors, beforeMetrics.real_lead_unique_visitors),
    taxa_intencao: formatPpDelta(afterMetrics.taxa_intencao_num, beforeMetrics.taxa_intencao_num),
    taxa_whatsapp: formatPpDelta(afterMetrics.taxa_whatsapp_num, beforeMetrics.taxa_whatsapp_num),
    taxa_form_start: formatPpDelta(afterMetrics.taxa_form_start_num, beforeMetrics.taxa_form_start_num),
    taxa_lead: formatPpDelta(afterMetrics.taxa_lead_num, beforeMetrics.taxa_lead_num)
  }

  // 6. Confiabilidade da Amostra (Requisito 4: Muito pequena, Pequena, Moderada, Maior)
  const minSampleSize = Math.min(beforeMetrics.landing_unique_visitors, afterMetrics.landing_unique_visitors)
  let sampleQuality = {
    level: 'very_small',
    label: 'Muito pequena',
    description: 'Volume ainda insuficiente para conclusões definitivas. Aguarde mais tráfego.',
    minSampleSize
  }

  if (minSampleSize >= 200) {
    sampleQuality = {
      level: 'large',
      label: 'Maior',
      description: 'Volume de acessos consistente para observação comparativa.',
      minSampleSize
    }
  } else if (minSampleSize >= 50) {
    sampleQuality = {
      level: 'moderate',
      label: 'Moderada',
      description: 'Amostra em consolidação.',
      minSampleSize
    }
  } else if (minSampleSize >= 20) {
    sampleQuality = {
      level: 'small',
      label: 'Pequena',
      description: 'Tendência preliminar observada.',
      minSampleSize
    }
  }

  // 7. Breakdown por Dispositivo (mobile, desktop, tablet)
  const standardDevices = ['mobile', 'desktop', 'tablet']
  const deviceBreakdown = {}

  for (const dev of standardDevices) {
    const devBeforeViews = beforeViews.filter(v => (v.device_type || 'desktop').toLowerCase() === dev)
    const devAfterViews = afterViews.filter(v => (v.device_type || 'desktop').toLowerCase() === dev)

    const devBeforeVisitors = new Set(devBeforeViews.map(v => v.visitor_id).filter(Boolean))
    const devAfterVisitors = new Set(devAfterViews.map(v => v.visitor_id).filter(Boolean))

    const devBeforeSessions = new Set(devBeforeViews.map(v => v.session_id).filter(Boolean))
    const devAfterSessions = new Set(devAfterViews.map(v => v.session_id).filter(Boolean))

    const devBeforeClicks = beforeClicks.filter(c => (c.device_type || 'desktop').toLowerCase() === dev)
    const devAfterClicks = afterClicks.filter(c => (c.device_type || 'desktop').toLowerCase() === dev)

    const devBeforeLeads = beforeLeads.filter(l => (l.device_type || 'desktop').toLowerCase() === dev)
    const devAfterLeads = afterLeads.filter(l => (l.device_type || 'desktop').toLowerCase() === dev)

    const devBeforeMetrics = buildCohortMetrics(devBeforeViews, devBeforeClicks, devBeforeLeads, devBeforeVisitors, devBeforeSessions)
    const devAfterMetrics = buildCohortMetrics(devAfterViews, devAfterClicks, devAfterLeads, devAfterVisitors, devAfterSessions)

    deviceBreakdown[dev] = {
      device: dev,
      label: dev === 'mobile' ? 'Mobile (Celular)' : dev === 'desktop' ? 'Desktop (Computador)' : 'Tablet',
      before: {
        visitors: devBeforeMetrics.landing_unique_visitors,
        intent_visitors: devBeforeMetrics.contact_intent_unique_visitors,
        leads: devBeforeMetrics.real_lead_unique_visitors,
        taxa_intencao: devBeforeMetrics.taxa_intencao,
        taxa_lead: devBeforeMetrics.taxa_lead
      },
      after: {
        visitors: devAfterMetrics.landing_unique_visitors,
        intent_visitors: devAfterMetrics.contact_intent_unique_visitors,
        leads: devAfterMetrics.real_lead_unique_visitors,
        taxa_intencao: devAfterMetrics.taxa_intencao,
        taxa_lead: devAfterMetrics.taxa_lead
      },
      delta: {
        visitors: formatCountDelta(devAfterMetrics.landing_unique_visitors, devBeforeMetrics.landing_unique_visitors),
        intent_visitors: formatCountDelta(devAfterMetrics.contact_intent_unique_visitors, devBeforeMetrics.contact_intent_unique_visitors),
        leads: formatCountDelta(devAfterMetrics.real_lead_unique_visitors, devBeforeMetrics.real_lead_unique_visitors),
        taxa_intencao: formatPpDelta(devAfterMetrics.taxa_intencao_num, devBeforeMetrics.taxa_intencao_num),
        taxa_lead: formatPpDelta(devAfterMetrics.taxa_lead_num, devBeforeMetrics.taxa_lead_num)
      }
    }
  }

  return {
    cutoffAt: window.cutoffAtIso,
    channelFilter,
    window,
    sampleQuality,
    before: beforeMetrics,
    after: afterMetrics,
    delta,
    deviceBreakdown,
    config: {
      landing_path,
      previous_path_prefixes
    }
  }
}
