import { 
  getSaoPauloDateRange, 
  fetchAllPaginated, 
  classifyLeadRecord,
  normalizeChannel,
  getChannelLabel,
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
    // 1. Cliques com taxonomia de serviços e CTAs
    const clicksQuery = `select=id,created_at,tipo,origem,cta_location,service_key,service_name,visitor_id,session_id,channel,is_bot&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
    const rawClicks = await fetchAllPaginated<any>(config.supabaseUrl, 'lead_clicks', clicksQuery, headers)
    const humanClicks = rawClicks.filter(c => c.is_bot !== true)

    // 2. Leads reais
    const leadsQuery = `select=id,created_at,servico,visitor_id,session_id,first_touch_channel,session_channel,nome,email,telefone,mensagem,observacoes&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
    const rawLeads = await fetchAllPaginated<any>(config.supabaseUrl, 'leads', leadsQuery, headers)
    const realLeads = rawLeads.filter(l => classifyLeadRecord(l).category === 'REAL')

    // ── AGRUPAMENTO POR SERVIÇO ──
    const serviceMap: Record<string, {
      service_key: string
      service_name: string
      whatsapp_clicks: number
      phone_clicks: number
      unique_visitors: Set<string>
      channels: Record<string, number>
    }> = {}

    for (const c of humanClicks) {
      const cTime = new Date(c.created_at).getTime()
      const key = c.service_key || 'unknown_legacy'
      const name = c.service_name || (c.service_key ? c.service_key : 'Não classificado / Histórico')

      if (!serviceMap[key]) {
        serviceMap[key] = {
          service_key: key,
          service_name: name,
          whatsapp_clicks: 0,
          phone_clicks: 0,
          unique_visitors: new Set(),
          channels: {}
        }
      }

      if (c.tipo === 'whatsapp') serviceMap[key].whatsapp_clicks++
      if (c.tipo === 'telefone') serviceMap[key].phone_clicks++
      if (c.visitor_id && cTime >= activePeriodStartMs) {
        serviceMap[key].unique_visitors.add(c.visitor_id)
      }

      const ch = normalizeChannel(c.channel)
      serviceMap[key].channels[ch] = (serviceMap[key].channels[ch] || 0) + 1
    }

    const serviceInterest = Object.values(serviceMap).map(s => {
      // Determinar canal dominante sem assumir direct
      let dominantChannelKey = 'unknown_legacy'
      let maxCount = 0
      for (const [ch, cnt] of Object.entries(s.channels)) {
        if (cnt > maxCount) {
          maxCount = cnt
          dominantChannelKey = ch
        }
      }

      const totalIntents = s.whatsapp_clicks + s.phone_clicks
      return {
        service_key: s.service_key,
        service_name: s.service_name,
        whatsapp_clicks: s.whatsapp_clicks,
        phone_clicks: s.phone_clicks,
        total_interactions: totalIntents,
        unique_visitors: s.unique_visitors.size,
        dominant_channel: getChannelLabel(dominantChannelKey)
      }
    }).sort((a, b) => b.total_interactions - a.total_interactions)

    // ── PERFORMANCE POR LOCALIZAÇÃO DE CTA ──
    const ctaLabels: Record<string, string> = {
      floating_whatsapp: 'WhatsApp Flutuante',
      header: 'Cabeçalho (Header)',
      footer: 'Rodapé (Footer)',
      service_card: 'Card de Serviço',
      sticky_mobile: 'Barra Fixa Mobile',
      quote_form: 'Formulário de Orçamento',
      contact_form: 'Formulário de Contato',
      other: 'Outros Pontos',
      unknown_legacy: 'Não atribuído / Histórico'
    }

    const ctaMap: Record<string, {
      cta_location: string
      cta_label: string
      whatsapp_clicks: number
      phone_clicks: number
      unique_visitors: Set<string>
    }> = {}

    let totalIntentsAllCtas = 0

    for (const c of humanClicks) {
      const cTime = new Date(c.created_at).getTime()
      const loc = c.cta_location || 'unknown_legacy'
      const label = ctaLabels[loc] || loc

      if (!ctaMap[loc]) {
        ctaMap[loc] = {
          cta_location: loc,
          cta_label: label,
          whatsapp_clicks: 0,
          phone_clicks: 0,
          unique_visitors: new Set()
        }
      }

      if (c.tipo === 'whatsapp') ctaMap[loc].whatsapp_clicks++
      if (c.tipo === 'telefone') ctaMap[loc].phone_clicks++
      if (c.visitor_id && cTime >= activePeriodStartMs) {
        ctaMap[loc].unique_visitors.add(c.visitor_id)
      }
      totalIntentsAllCtas++
    }

    const ctaPerformance = Object.values(ctaMap).map(cta => {
      const totalIntents = cta.whatsapp_clicks + cta.phone_clicks
      return {
        cta_location: cta.cta_location,
        cta_label: cta.cta_label,
        whatsapp_clicks: cta.whatsapp_clicks,
        phone_clicks: cta.phone_clicks,
        total_intents: totalIntents,
        unique_visitors: cta.unique_visitors.size,
        pct_of_intents: totalIntentsAllCtas > 0 ? Number(((totalIntents / totalIntentsAllCtas) * 100).toFixed(1)) : 0
      }
    }).sort((a, b) => b.total_intents - a.total_intents)

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
      service_interest: serviceInterest,
      cta_performance: ctaPerformance
    }
  } catch (error: any) {
    console.error('[analytics/services] Erro:', error?.message)
    return { success: false, error: error?.message || 'Erro ao processar serviços' }
  }
})
