import { 
  getSaoPauloDateRange, 
  fetchAllPaginated, 
  classifyLeadRecord, 
  normalizeChannel,
  getChannelLabel,
  safeRate,
  PHASE_B_START_ISO
} from '../../../utils/adminAnalytics'
import { requireActiveAdmin } from '../../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
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
    // 1. Pageviews com canais e UTMs
    const viewsQuery = `select=id,created_at,visitor_id,session_id,channel,utm_source,utm_medium,utm_campaign,is_bot&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
    const rawViews = await fetchAllPaginated<any>(config.supabaseUrl, 'page_views', viewsQuery, headers)
    const humanViews = rawViews.filter(v => v.is_bot !== true)

    // 2. Cliques de intenção
    const clicksQuery = `select=id,created_at,tipo,visitor_id,session_id,channel,utm_source,utm_medium,utm_campaign,is_bot&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
    const rawClicks = await fetchAllPaginated<any>(config.supabaseUrl, 'lead_clicks', clicksQuery, headers)
    const humanClicks = rawClicks.filter(c => c.is_bot !== true)

    // 3. Leads comerciais reais
    const leadsQuery = `select=id,created_at,visitor_id,session_id,session_channel,first_touch_channel,utm_source,utm_medium,utm_campaign,first_touch_utm_campaign,nome,email,telefone,mensagem,observacoes&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
    const rawLeads = await fetchAllPaginated<any>(config.supabaseUrl, 'leads', leadsQuery, headers)
    const realLeads = rawLeads.filter(l => classifyLeadRecord(l).category === 'REAL')

    // ── AGRUPAÇÃO POR CANAL (NORMALIZADA SEM CONVERTER NULL PARA DIRECT) ──
    const channelMap: Record<string, {
      channel: string
      label: string
      unique_visitors: Set<string>
      sessions: Set<string>
      pageviews: number
      whatsapp_clicks: number
      phone_clicks: number
      leads: any[]
      lead_visitors: Set<string>
      intent_visitors: Set<string>
    }> = {}

    const ensureChannel = (ch: string) => {
      const norm = normalizeChannel(ch)
      if (!channelMap[norm]) {
        channelMap[norm] = {
          channel: norm,
          label: getChannelLabel(norm),
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
      return channelMap[norm]
    }

    // Processar Pageviews
    for (const v of humanViews) {
      const vTime = new Date(v.created_at).getTime()
      const ch = normalizeChannel(v.channel || v.session_channel)
      const bucket = ensureChannel(ch)
      bucket.pageviews++
      if (vTime >= activePeriodStartMs) {
        if (v.visitor_id) bucket.unique_visitors.add(v.visitor_id)
        if (v.session_id) bucket.sessions.add(v.session_id)
      }
    }

    // Processar Cliques
    for (const c of humanClicks) {
      const cTime = new Date(c.created_at).getTime()
      const ch = normalizeChannel(c.channel)
      const bucket = ensureChannel(ch)
      if (c.tipo === 'whatsapp') bucket.whatsapp_clicks++
      if (c.tipo === 'telefone') bucket.phone_clicks++
      if (c.visitor_id && cTime >= activePeriodStartMs) {
        bucket.intent_visitors.add(c.visitor_id)
      }
    }

    // Processar Leads Reais
    for (const l of realLeads) {
      const ch = normalizeChannel(l.first_touch_channel || l.session_channel)
      const bucket = ensureChannel(ch)
      bucket.leads.push(l)
      if (l.visitor_id) bucket.lead_visitors.add(l.visitor_id)
    }

    const channelsList = Object.values(channelMap).map(ch => {
      const visitorsCount = ch.unique_visitors.size
      return {
        channel: ch.channel,
        label: ch.label,
        unique_visitors: visitorsCount,
        sessions: ch.sessions.size,
        pageviews: ch.pageviews,
        whatsapp_clicks: ch.whatsapp_clicks,
        phone_clicks: ch.phone_clicks,
        total_intents: ch.whatsapp_clicks + ch.phone_clicks,
        leads_count: ch.leads.length,
        contact_intent_rate: safeRate(ch.intent_visitors.size, visitorsCount),
        lead_conversion_rate: safeRate(ch.lead_visitors.size, visitorsCount)
      }
    }).sort((a, b) => b.unique_visitors - a.unique_visitors || b.total_intents - a.total_intents)

    // Campanhas UTM
    const campaignMap: Record<string, {
      source: string
      medium: string
      campaign: string
      unique_visitors: Set<string>
      sessions: Set<string>
      pageviews: number
      leads: any[]
      intent_visitors: Set<string>
    }> = {}

    for (const v of humanViews) {
      if (v.utm_campaign) {
        const vTime = new Date(v.created_at).getTime()
        const key = `${v.utm_source || 'direct'} / ${v.utm_medium || 'none'} / ${v.utm_campaign}`
        if (!campaignMap[key]) {
          campaignMap[key] = {
            source: v.utm_source || 'direct',
            medium: v.utm_medium || 'none',
            campaign: v.utm_campaign,
            unique_visitors: new Set(),
            sessions: new Set(),
            pageviews: 0,
            leads: [],
            intent_visitors: new Set()
          }
        }
        campaignMap[key].pageviews++
        if (vTime >= activePeriodStartMs) {
          if (v.visitor_id) campaignMap[key].unique_visitors.add(v.visitor_id)
          if (v.session_id) campaignMap[key].sessions.add(v.session_id)
        }
      }
    }

    for (const c of humanClicks) {
      if (c.utm_campaign) {
        const cTime = new Date(c.created_at).getTime()
        const key = `${c.utm_source || 'direct'} / ${c.utm_medium || 'none'} / ${c.utm_campaign}`
        if (campaignMap[key] && c.visitor_id && cTime >= activePeriodStartMs) {
          campaignMap[key].intent_visitors.add(c.visitor_id)
        }
      }
    }

    for (const l of realLeads) {
      if (l.utm_campaign || l.first_touch_utm_campaign) {
        const key = `${l.utm_source || 'direct'} / ${l.utm_medium || 'none'} / ${l.utm_campaign || l.first_touch_utm_campaign}`
        if (campaignMap[key]) {
          campaignMap[key].leads.push(l)
        }
      }
    }

    const campaignsList = Object.values(campaignMap).map(cmp => {
      const visitorsCount = cmp.unique_visitors.size
      return {
        source: cmp.source,
        medium: cmp.medium,
        campaign: cmp.campaign,
        unique_visitors: visitorsCount,
        sessions: cmp.sessions.size,
        pageviews: cmp.pageviews,
        leads_count: cmp.leads.length,
        contact_intent_rate: safeRate(cmp.intent_visitors.size, visitorsCount)
      }
    }).sort((a, b) => b.unique_visitors - a.unique_visitors)

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
      channels: channelsList,
      campaigns: campaignsList
    }
  } catch (error: any) {
    console.error('[analytics/acquisition] Erro:', error?.message)
    return { success: false, error: error?.message || 'Erro ao processar aquisição' }
  }
})
