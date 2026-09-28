// server/api/admin/marketing/campaign-kpis/tracking-data.get.ts
// GET /api/admin/marketing/campaign-kpis/tracking-data
// Consulta dados EXISTENTES do tracking proprietário para comparação.
// NÃO modifica nenhuma tabela de tracking.

import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const query = getQuery(event)
  const utmCampaign = typeof query.utm_campaign === 'string' ? query.utm_campaign.trim() : ''
  const channel = typeof query.channel === 'string' ? query.channel.trim() : ''
  const fromDate = typeof query.from === 'string' ? query.from.trim() : ''
  const toDate = typeof query.to === 'string' ? query.to.trim() : ''

  if (!fromDate || !/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
    throw createError({ statusCode: 400, message: 'Parâmetro from (data) é obrigatório.' })
  }
  if (!toDate || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
    throw createError({ statusCode: 400, message: 'Parâmetro to (data) é obrigatório.' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)
  const base = config.supabaseUrl

  // Filtros comuns
  const periodFilter = `created_at=gte.${fromDate}T00:00:00Z&created_at=lte.${toDate}T23:59:59Z`
  const botFilter = 'is_bot=neq.true'
  const utmFilter = utmCampaign ? `&utm_campaign=eq.${encodeURIComponent(utmCampaign)}` : ''
  const channelFilter = channel ? `&channel=eq.${encodeURIComponent(channel)}` : ''

  try {
    const [pvRes, clicksRes, leadsRes] = await Promise.all([
      // page_views: contar sessões, pageviews e buscar first/last seen
      $fetch<any[]>(
        `${base}/rest/v1/page_views?select=session_id,created_at,channel,utm_campaign&${periodFilter}&${botFilter}${utmFilter}${channelFilter}&limit=5000`,
        { headers }
      ).catch(() => [] as any[]),

      // lead_clicks: whatsapp e leads de formulário
      $fetch<any[]>(
        `${base}/rest/v1/lead_clicks?select=id,created_at,tipo,session_id&${periodFilter}${utmFilter}${channelFilter}&limit=5000`,
        { headers }
      ).catch(() => [] as any[]),

      // leads: leads reais
      $fetch<any[]>(
        `${base}/rest/v1/leads?select=id,created_at,session_channel,utm_campaign&${periodFilter}${utmFilter.replace('utm_campaign', 'utm_campaign')}&limit=5000`,
        { headers }
      ).catch(() => [] as any[]),
    ])

    const sessions = new Set<string>()
    let firstSeen: string | null = null
    let lastSeen: string | null = null

    for (const pv of pvRes) {
      if (pv.session_id) sessions.add(pv.session_id)
      const t = pv.created_at
      if (t && (!firstSeen || t < firstSeen)) firstSeen = t
      if (t && (!lastSeen || t > lastSeen)) lastSeen = t
    }

    const whatsappClicks = clicksRes.filter(c => c.tipo === 'whatsapp').length
    const formStarts = clicksRes.filter(c => c.tipo === 'form_start' || c.tipo === 'formulario').length

    return {
      data: {
        sessions: sessions.size,
        pageviews: pvRes.length,
        whatsapp_clicks: whatsappClicks,
        lead_form_starts: formStarts,
        leads: leadsRes.length,
        first_seen: firstSeen,
        last_seen: lastSeen,
      }
    }
  } catch (err: any) {
    throw createError({ statusCode: 500, message: 'Erro ao consultar dados de tracking.' })
  }
})
