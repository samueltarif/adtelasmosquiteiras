import { requireActiveAdmin } from '../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const query = getQuery(event)

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const rawSessionId = typeof query.session_id === 'string' ? query.session_id.trim() : ''
  if (!rawSessionId || rawSessionId.length < 5 || !/^[a-zA-Z0-9_-]+$/.test(rawSessionId)) {
    throw createError({ statusCode: 400, message: 'Parâmetro session_id inválido ou ausente.' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const [viewsRes, clicksRes, attrsRes, leadsRes] = await Promise.all([
      $fetch<any[]>(`${config.supabaseUrl}/rest/v1/page_views?session_id=eq.${rawSessionId}&select=id,created_at,path,landing_path,channel,utm_source,utm_medium,utm_campaign,device_type,gclid,fbclid,msclkid,ttclid&order=created_at.asc`, { headers }).catch(() => []),
      $fetch<any[]>(`${config.supabaseUrl}/rest/v1/lead_clicks?session_id=eq.${rawSessionId}&select=id,created_at,tipo,origem,cta_location,channel,utm_campaign,event_id,fbclid,msclkid,ttclid,service_name&order=created_at.asc`, { headers }).catch(() => []),
      $fetch<any[]>(`${config.supabaseUrl}/rest/v1/whatsapp_attributions?session_id=eq.${rawSessionId}&select=id,short_code,clicked_at,created_at,channel,utm_campaign,campaign_name,landing_path,cta_location,attribution_status,confidence_level,match_method,client_id,lead_id,notes,ttclid,client:clients(id,nome,telefone_principal,email)&order=created_at.asc`, { headers }).catch(() => []),
      $fetch<any[]>(`${config.supabaseUrl}/rest/v1/leads?session_id=eq.${rawSessionId}&select=id,created_at,nome,email,telefone,servico,session_channel,first_touch_channel,utm_campaign,status,ttclid&order=created_at.asc`, { headers }).catch(() => [])
    ])

    const timeline: any[] = []

    // 1. Pageviews
    viewsRes.forEach((v, index) => {
      timeline.push({
        id: v.id,
        type: index === 0 ? 'landing' : 'pageview',
        title: index === 0 ? 'Entrada / Landing Page' : 'Visualização de Página',
        timestamp: v.created_at,
        path: v.path || v.landing_path || '/',
        channel: v.channel || null,
        campaign: v.utm_campaign || null,
        cta: null,
        short_code: null,
        status: null,
        technical_details: {
          utm_source: v.utm_source,
          utm_medium: v.utm_medium,
          device_type: v.device_type,
          gclid: v.gclid,
          fbclid: v.fbclid,
          msclkid: v.msclkid,
          ttclid: v.ttclid
        }
      })
    })

    // 2. Cliques de Intenção
    clicksRes.forEach((c) => {
      const isWhatsapp = c.tipo === 'whatsapp'
      timeline.push({
        id: c.id,
        type: isWhatsapp ? 'whatsapp_click' : 'intent_click',
        title: isWhatsapp ? 'Clique no Botão WhatsApp' : `Clique: ${c.tipo || 'Interação'}`,
        timestamp: c.created_at,
        path: c.origem || '/',
        channel: c.channel || null,
        campaign: c.utm_campaign || null,
        cta: c.cta_location || null,
        short_code: null,
        status: null,
        technical_details: {
          service_name: c.service_name,
          fbclid: c.fbclid,
          msclkid: c.msclkid,
          ttclid: c.ttclid,
          event_id: c.event_id
        }
      })
    })

    // 3. Atribuições WhatsApp
    attrsRes.forEach((a) => {
      timeline.push({
        id: a.id,
        type: 'whatsapp_attribution',
        title: `Atribuição WhatsApp (Ref: ${a.short_code})`,
        timestamp: a.clicked_at || a.created_at,
        path: a.landing_path || '/',
        channel: a.channel || null,
        campaign: a.campaign_name || a.utm_campaign || null,
        cta: a.cta_location || null,
        short_code: a.short_code,
        status: a.attribution_status,
        technical_details: {
          confidence_level: a.confidence_level,
          match_method: a.match_method,
          notes: a.notes,
          client: a.client || null
        }
      })

      // Se atribuído a cliente, adiciona passo conclusivo da jornada
      if (a.attribution_status === 'assigned' && a.client) {
        timeline.push({
          id: `client-${a.id}`,
          type: 'client_assigned',
          title: `Conciliado com Cliente CRM: ${a.client.nome}`,
          timestamp: a.created_at,
          path: null,
          channel: a.channel || null,
          campaign: a.campaign_name || null,
          cta: null,
          short_code: a.short_code,
          status: 'assigned',
          technical_details: {
            client_id: a.client.id,
            nome: a.client.nome,
            telefone: a.client.telefone_principal,
            email: a.client.email
          }
        })
      }
    })

    // 4. Leads do Formulário Comercial
    leadsRes.forEach((l) => {
      timeline.push({
        id: l.id,
        type: 'lead_submission',
        title: `Formulário Enviado: ${l.nome}`,
        timestamp: l.created_at,
        path: '/orcamento',
        channel: l.session_channel || l.first_touch_channel || null,
        campaign: l.utm_campaign || null,
        cta: 'Formulário',
        short_code: null,
        status: l.status,
        technical_details: {
          servico: l.servico,
          email: l.email,
          telefone: l.telefone
        }
      })
    })

    // Ordenação estritamente cronológica
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    // Identificar primeiro canal da sessão
    const entryChannel = timeline.find((t) => t.channel)?.channel || null
    const entryLanding = timeline.find((t) => t.path)?.path || '/'

    return {
      success: true,
      session_id: rawSessionId,
      summary: {
        total_events: timeline.length,
        entry_channel: entryChannel,
        entry_landing: entryLanding,
        first_event_at: timeline[0]?.timestamp || null,
        last_event_at: timeline[timeline.length - 1]?.timestamp || null
      },
      timeline
    }
  } catch (err: any) {
    console.error('[session-journey] Erro ao buscar jornada:', err)
    throw createError({ statusCode: 500, message: err?.message || 'Erro ao carregar auditoria de jornada da sessão.' })
  }
})
