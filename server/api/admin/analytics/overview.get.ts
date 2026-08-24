import { 
  getSaoPauloDateRange, 
  fetchAllPaginated, 
  classifyLeadRecord, 
  safeRate, 
  safeRateNum,
  PHASE_B_START_ISO 
} from '../../../utils/adminAnalytics'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const preset = (query.preset as string) || 'today'
  const customFrom = query.dateFrom as string | undefined
  const customTo = query.dateTo as string | undefined

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return { success: false, error: 'Supabase não configurado' }
  }

  const headers = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
  }

  const dateRange = getSaoPauloDateRange(preset, customFrom, customTo)
  const { startUtc, endUtc, identityStartUtc, label, isLegacyOverlap } = dateRange

  try {
    // 1. Buscar Pageviews no intervalo solicitado
    const viewsQuery = `select=id,created_at,visitor_id,session_id,path,device_type,is_bot&created_at=gte.${startUtc}&created_at=lt.${endUtc}&order=created_at.asc`
    const rawViews = await fetchAllPaginated<any>(config.supabaseUrl, 'page_views', viewsQuery, headers)

    // 2. Buscar Cliques de intenção no intervalo solicitado
    const clicksQuery = `select=id,created_at,tipo,origem,cta_location,service_key,service_name,visitor_id,session_id,is_bot,channel&created_at=gte.${startUtc}&created_at=lt.${endUtc}&order=created_at.asc`
    const rawClicks = await fetchAllPaginated<any>(config.supabaseUrl, 'lead_clicks', clicksQuery, headers)

    // 3. Leads cadastrados no período
    const leadsQuery = `select=id,created_at,nome,servico,cidade,bairro,status,visitor_id,session_id,email,telefone,mensagem,observacoes,landing_path,utm_campaign,session_channel&created_at=gte.${startUtc}&created_at=lt.${endUtc}&order=created_at.asc`
    const rawLeads = await fetchAllPaginated<any>(config.supabaseUrl, 'leads', leadsQuery, headers)

    // 4. Buscar histórico de visitor_ids (a partir de Phase B) para cálculo exato de New vs Returning
    const historyQuery = `select=visitor_id,created_at&visitor_id=not.is.null&created_at=gte.${PHASE_B_START_ISO}&order=created_at.asc`
    const rawHistory = await fetchAllPaginated<any>(config.supabaseUrl, 'page_views', historyQuery, headers)

    // ── FILTROS HUMANOS & IDENTIDADE PHASE B ──
    const humanViews = rawViews.filter(v => v.is_bot !== true)
    const humanClicks = rawClicks.filter(c => c.is_bot !== true)

    // Mapear primeira aparição histórica global de cada visitante identificado
    const firstSeenMap = new Map<string, number>()
    for (const h of rawHistory) {
      if (h.visitor_id && !firstSeenMap.has(h.visitor_id)) {
        firstSeenMap.set(h.visitor_id, new Date(h.created_at).getTime())
      }
    }

    // Identidade: Visitantes e Sessões usam identityStartUtc como piso
    const uniqueVisitorIds = new Set<string>()
    const sessionIds = new Set<string>()
    const activePeriodStartMs = new Date(identityStartUtc).getTime()

    let newVisitorsCount = 0
    let returningVisitorsCount = 0

    for (const v of humanViews) {
      const vTime = new Date(v.created_at).getTime()
      // Contar sessões e visitantes estritamente dentro do piso de identidade
      if (vTime >= activePeriodStartMs) {
        if (v.session_id) sessionIds.add(v.session_id)
        if (v.visitor_id) {
          if (!uniqueVisitorIds.has(v.visitor_id)) {
            uniqueVisitorIds.add(v.visitor_id)
            const firstTime = firstSeenMap.get(v.visitor_id) || vTime
            if (firstTime >= activePeriodStartMs) {
              newVisitorsCount++
            } else {
              returningVisitorsCount++
            }
          }
        }
      }
    }

    // Classificação Centralizada de Leads
    const realLeads: any[] = []
    const legacySyntheticLeads: any[] = []
    const automatedTestLeads: any[] = []
    const manualValidationLeads: any[] = []

    for (const l of rawLeads) {
      const cls = classifyLeadRecord(l)
      if (cls.category === 'REAL') realLeads.push(l)
      else if (cls.category === 'LEGACY_SYNTHETIC') legacySyntheticLeads.push(l)
      else if (cls.category === 'AUTOMATED_TEST') automatedTestLeads.push(l)
      else if (cls.category === 'MANUAL_VALIDATION_TEST') manualValidationLeads.push(l)
    }

    const realLeadsCount = realLeads.length
    const realLeadVisitors = new Set(realLeads.map(l => l.visitor_id).filter(Boolean)).size

    // Cliques e Intenções de contato
    let whatsappClicksCount = 0
    let phoneClicksCount = 0
    const contactIntentVisitorIds = new Set<string>()
    const whatsappVisitorIds = new Set<string>()

    for (const c of humanClicks) {
      const cTime = new Date(c.created_at).getTime()
      if (c.tipo === 'whatsapp') {
        whatsappClicksCount++
        if (c.visitor_id && cTime >= activePeriodStartMs) whatsappVisitorIds.add(c.visitor_id)
      }
      if (c.tipo === 'telefone') {
        phoneClicksCount++
      }
      if ((c.tipo === 'whatsapp' || c.tipo === 'telefone') && c.visitor_id && cTime >= activePeriodStartMs) {
        contactIntentVisitorIds.add(c.visitor_id)
      }
    }

    const uniqueVisitorsTotal = uniqueVisitorIds.size
    const sessionsTotal = sessionIds.size
    const totalPageviews = humanViews.length

    // Taxas de conversão canônicas por visitante único
    const leadConversionRate = safeRate(realLeadVisitors, uniqueVisitorsTotal)
    const contactIntentRate = safeRate(contactIntentVisitorIds.size, uniqueVisitorsTotal)
    const whatsappRate = safeRate(whatsappVisitorIds.size, uniqueVisitorsTotal)
    const avgPagesPerSession = sessionsTotal > 0 ? Number((totalPageviews / sessionsTotal).toFixed(1)) : 0

    // Série temporal diária (gráfico de evolução)
    const dailyMap: Record<string, {
      date: string
      unique_visitors: Set<string>
      sessions: Set<string>
      pageviews: number
      leads: number
      whatsapp: number
    }> = {}

    for (const v of humanViews) {
      const spDateStr = new Date(new Date(v.created_at).getTime() - 3 * 3600 * 1000).toISOString().split('T')[0]
      if (!dailyMap[spDateStr]) {
        dailyMap[spDateStr] = {
          date: spDateStr,
          unique_visitors: new Set(),
          sessions: new Set(),
          pageviews: 0,
          leads: 0,
          whatsapp: 0
        }
      }
      dailyMap[spDateStr].pageviews++
      if (v.session_id) dailyMap[spDateStr].sessions.add(v.session_id)
      if (v.visitor_id) dailyMap[spDateStr].unique_visitors.add(v.visitor_id)
    }

    for (const c of humanClicks) {
      const spDateStr = new Date(new Date(c.created_at).getTime() - 3 * 3600 * 1000).toISOString().split('T')[0]
      if (dailyMap[spDateStr] && c.tipo === 'whatsapp') {
        dailyMap[spDateStr].whatsapp++
      }
    }

    for (const l of realLeads) {
      const spDateStr = new Date(new Date(l.created_at).getTime() - 3 * 3600 * 1000).toISOString().split('T')[0]
      if (dailyMap[spDateStr]) {
        dailyMap[spDateStr].leads++
      }
    }

    const dailySeries = Object.values(dailyMap).map(d => ({
      date: d.date.split('-').slice(1).reverse().join('/'),
      unique_visitors: d.unique_visitors.size,
      sessions: d.sessions.size,
      pageviews: d.pageviews,
      leads: d.leads,
      whatsapp: d.whatsapp
    }))

    // Distribuição de dispositivos
    const deviceMap: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0, Outros: 0 }
    for (const v of humanViews) {
      const d = (v.device_type || '').toLowerCase()
      if (d === 'mobile') deviceMap.Mobile++
      else if (d === 'desktop') deviceMap.Desktop++
      else if (d === 'tablet') deviceMap.Tablet++
      else deviceMap.Outros++
    }

    const devices = Object.entries(deviceMap)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        count,
        percentage: safeRateNum(count, totalPageviews)
      }))

    // Data Quality Health
    const missingVisitorIdCount = rawViews.filter(v => !v.visitor_id && v.is_bot !== true).length
    const missingSessionIdCount = rawViews.filter(v => !v.session_id && v.is_bot !== true).length
    const missingCtaLocationCount = rawClicks.filter(c => !c.cta_location && c.is_bot !== true).length
    const serviceCardsMissingKeyCount = rawClicks.filter(c => c.cta_location === 'service_card' && !c.service_key).length
    const botsDetectedCount = rawViews.filter(v => v.is_bot === true).length + rawClicks.filter(c => c.is_bot === true).length

    return {
      success: true,
      meta: {
        preset,
        date_label: label,
        requested_start_utc: startUtc,
        requested_end_utc: endUtc,
        identity_start_utc: identityStartUtc,
        phase_b_start_at: PHASE_B_START_ISO,
        is_legacy_overlap: isLegacyOverlap
      },
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
          lead_conversion_rate: leadConversionRate,
          contact_intent_rate: contactIntentRate,
          whatsapp_rate: whatsappRate,
          avg_pages_per_session: avgPagesPerSession
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
        missing_visitor_id: missingVisitorIdCount,
        missing_session_id: missingSessionIdCount,
        missing_cta_location: missingCtaLocationCount,
        service_cards_missing_key: serviceCardsMissingKeyCount,
        bots_detected: botsDetectedCount,
        legacy_synthetic_leads: legacySyntheticLeads.length,
        automated_test_leads: automatedTestLeads.length,
        manual_validation_leads: manualValidationLeads.length
      }
    }
  } catch (error: any) {
    console.error('[analytics/overview] Erro:', error?.message)
    return { success: false, error: error?.message || 'Erro ao processar overview' }
  }
})
