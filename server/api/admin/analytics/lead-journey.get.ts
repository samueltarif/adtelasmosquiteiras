import { fetchAllPaginated } from '../../../utils/adminAnalytics'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const leadId = query.leadId as string

  if (!leadId) {
    throw createError({ statusCode: 400, message: 'leadId é obrigatório' })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return { success: false, error: 'Supabase não configurado' }
  }

  const headers = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
  }

  try {
    // 1. Buscar lead completo
    const leadRes: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}&select=*`,
      { headers }
    )
    const lead = leadRes?.[0]
    if (!lead) {
      throw createError({ statusCode: 404, message: 'Lead não encontrado' })
    }

    const { visitor_id, session_id } = lead
    const timeline: any[] = []

    // 2. Buscar pageviews do mesmo visitor_id
    if (visitor_id) {
      const viewsQuery = `select=id,created_at,path,session_id,landing_path,channel,utm_source,utm_medium,utm_campaign,device_type&visitor_id=eq.${visitor_id}&order=created_at.asc`
      const views = await fetchAllPaginated<any>(config.supabaseUrl, 'page_views', viewsQuery, headers)

      for (const v of views) {
        timeline.push({
          type: 'pageview',
          created_at: v.created_at,
          path: v.path || '/',
          session_id: v.session_id,
          is_same_session: v.session_id === session_id,
          channel: v.channel,
          utm_source: v.utm_source,
          utm_medium: v.utm_medium,
          utm_campaign: v.utm_campaign,
          device_type: v.device_type
        })
      }

      // 3. Buscar clicks do mesmo visitor_id
      const clicksQuery = `select=id,created_at,tipo,origem,cta_location,service_key,service_name,session_id,channel&visitor_id=eq.${visitor_id}&order=created_at.asc`
      const clicks = await fetchAllPaginated<any>(config.supabaseUrl, 'lead_clicks', clicksQuery, headers)

      for (const c of clicks) {
        timeline.push({
          type: c.tipo === 'whatsapp' ? 'whatsapp_click' : c.tipo === 'telefone' ? 'phone_click' : 'cta_click',
          created_at: c.created_at,
          path: c.origem,
          session_id: c.session_id,
          is_same_session: c.session_id === session_id,
          cta_location: c.cta_location,
          service_key: c.service_key,
          service_name: c.service_name,
          channel: c.channel
        })
      }
    }

    // 4. Incluir o próprio lead como evento da timeline
    timeline.push({
      type: 'form_submission',
      created_at: lead.created_at,
      path: lead.conversion_path || lead.origem || '/',
      session_id: lead.session_id,
      is_same_session: true,
      service: lead.servico,
      nome: lead.nome,
      status: lead.status
    })

    // Ordenar cronologicamente
    timeline.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    // Extrair atribuição
    const attribution = {
      first_touch: {
        channel: lead.first_touch_channel || lead.channel || 'direct',
        landing_path: lead.first_touch_landing_path || lead.landing_path,
        referrer: lead.first_touch_referrer || lead.referrer,
        utm_source: lead.first_touch_utm_source || lead.utm_source,
        utm_medium: lead.first_touch_utm_medium || lead.utm_medium,
        utm_campaign: lead.first_touch_utm_campaign || lead.utm_campaign
      },
      session_touch: {
        channel: lead.session_channel || lead.channel || 'direct',
        landing_path: lead.landing_path,
        utm_source: lead.utm_source,
        utm_medium: lead.utm_medium,
        utm_campaign: lead.utm_campaign
      },
      is_multi_channel:
        (lead.first_touch_channel || lead.channel) !== (lead.session_channel || lead.channel)
    }

    return {
      success: true,
      lead: {
        id: lead.id,
        nome: lead.nome,
        email: lead.email,
        telefone: lead.telefone,
        servico: lead.servico,
        cidade: lead.cidade,
        bairro: lead.bairro,
        status: lead.status,
        valor_orcamento: lead.valor_orcamento,
        observacoes: lead.observacoes,
        mensagem: lead.mensagem,
        created_at: lead.created_at,
        conversion_path: lead.conversion_path,
        landing_path: lead.landing_path,
        visitor_id: lead.visitor_id,
        session_id: lead.session_id
      },
      attribution,
      timeline
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[analytics/lead-journey] Erro:', error?.message)
    return { success: false, error: error?.message || 'Erro ao processar jornada' }
  }
})
