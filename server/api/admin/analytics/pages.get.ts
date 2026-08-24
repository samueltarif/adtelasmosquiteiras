import { 
  getSaoPauloDateRange, 
  fetchAllPaginated, 
  classifyLeadRecord, 
  safeRate,
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
  const activePeriodStartMs = new Date(identityStartUtc).getTime()

  try {
    // 1. Pageviews
    const viewsQuery = `select=id,created_at,path,visitor_id,session_id,is_bot&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
    const rawViews = await fetchAllPaginated<any>(config.supabaseUrl, 'page_views', viewsQuery, headers)
    const humanViews = rawViews.filter(v => v.is_bot !== true)

    // 2. Cliques
    const clicksQuery = `select=id,created_at,tipo,origem,visitor_id,session_id,is_bot&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
    const rawClicks = await fetchAllPaginated<any>(config.supabaseUrl, 'lead_clicks', clicksQuery, headers)
    const humanClicks = rawClicks.filter(c => c.is_bot !== true)

    // 3. Leads
    const leadsQuery = `select=id,created_at,landing_path,conversion_path,visitor_id,session_id,nome,email,telefone,mensagem,observacoes&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
    const rawLeads = await fetchAllPaginated<any>(config.supabaseUrl, 'leads', leadsQuery, headers)
    const realLeads = rawLeads.filter(l => classifyLeadRecord(l).category === 'REAL')

    // Top Pages
    const pagesMap: Record<string, {
      path: string
      pageviews: number
      unique_visitors: Set<string>
    }> = {}

    for (const v of humanViews) {
      const p = v.path || '/'
      const vTime = new Date(v.created_at).getTime()
      if (!pagesMap[p]) {
        pagesMap[p] = { path: p, pageviews: 0, unique_visitors: new Set() }
      }
      pagesMap[p].pageviews++
      if (v.visitor_id && vTime >= activePeriodStartMs) {
        pagesMap[p].unique_visitors.add(v.visitor_id)
      }
    }

    const totalViews = humanViews.length
    const topPages = Object.values(pagesMap).map(p => ({
      path: p.path,
      pageviews: p.pageviews,
      unique_visitors: p.unique_visitors.size,
      percentage: totalViews > 0 ? Number(((p.pageviews / totalViews) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.pageviews - a.pageviews)

    // Landing Pages
    const landingMap: Record<string, {
      landing_path: string
      unique_visitors: Set<string>
      sessions: Set<string>
      pageviews: number
      whatsapp_clicks: number
      phone_clicks: number
      leads: any[]
      lead_visitors: Set<string>
      intent_visitors: Set<string>
    }> = {}

    const ensureLanding = (lp: string) => {
      const pathKey = (!lp || lp.trim() === '' || lp === 'null') ? 'Não atribuído / Histórico' : lp.trim()
      if (!landingMap[pathKey]) {
        landingMap[pathKey] = {
          landing_path: pathKey,
          unique_visitors: new Set(),
          sessions: new Set(),
          pageviews: 0,
          whatsapp_clicks: 0,
          phone_clicks: 0,
          leads: [],
          lead_visitors: new Set(),
          intent_visitors: new Set()
        }
      }
      return landingMap[pathKey]
    }

    for (const v of humanViews) {
      const vTime = new Date(v.created_at).getTime()
      const bucket = ensureLanding(v.path)
      bucket.pageviews++
      if (vTime >= activePeriodStartMs) {
        if (v.visitor_id) bucket.unique_visitors.add(v.visitor_id)
        if (v.session_id) bucket.sessions.add(v.session_id)
      }
    }

    for (const c of humanClicks) {
      const cTime = new Date(c.created_at).getTime()
      const bucket = ensureLanding(c.origem)
      if (c.tipo === 'whatsapp') bucket.whatsapp_clicks++
      if (c.tipo === 'telefone') bucket.phone_clicks++
      if (c.visitor_id && cTime >= activePeriodStartMs) {
        bucket.intent_visitors.add(c.visitor_id)
      }
    }

    for (const l of realLeads) {
      const bucket = ensureLanding(l.landing_path || l.conversion_path)
      bucket.leads.push(l)
      if (l.visitor_id) bucket.lead_visitors.add(l.visitor_id)
    }

    const landingPages = Object.values(landingMap).map(lp => {
      const visitorsCount = lp.unique_visitors.size
      return {
        landing_path: lp.landing_path,
        unique_visitors: visitorsCount,
        sessions: lp.sessions.size,
        whatsapp_clicks: lp.whatsapp_clicks,
        phone_clicks: lp.phone_clicks,
        leads_count: lp.leads.length,
        contact_intent_rate: safeRate(lp.intent_visitors.size, visitorsCount),
        lead_conversion_rate: safeRate(lp.lead_visitors.size, visitorsCount)
      }
    }).sort((a, b) => b.unique_visitors - a.unique_visitors || b.whatsapp_clicks - a.whatsapp_clicks)

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
      top_pages: topPages,
      landing_pages: landingPages
    }
  } catch (error: any) {
    console.error('[analytics/pages] Erro:', error?.message)
    return { success: false, error: error?.message || 'Erro ao processar páginas' }
  }
})
