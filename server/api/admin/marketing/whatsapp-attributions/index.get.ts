import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../utils/crm'
import type { WhatsappAttributionItem, WhatsappAttributionsListResponse } from '~/types/adminWhatsappAttribution'

export default defineEventHandler(async (event): Promise<WhatsappAttributionsListResponse> => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const query = getQuery(event)

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const status = typeof query.status === 'string' ? query.status.trim() : 'all'
  const channel = typeof query.channel === 'string' ? query.channel.trim() : 'all'
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(String(query.pageSize || '20'), 10) || 20))
  const offset = (page - 1) * pageSize

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Contagens agregadas por status
  const counts = {
    total: 0,
    unassigned: 0,
    lead_captured: 0,
    assigned: 0,
    dismissed: 0
  }

  try {
    let countsUrl = `${config.supabaseUrl}/rest/v1/whatsapp_attributions?select=attribution_status`
    if (channel === 'legacy_null') {
      countsUrl += '&channel=is.null'
    } else if (channel && channel !== 'all') {
      countsUrl += `&channel=eq.${encodeURIComponent(channel)}`
    }

    const countsRes = await $fetch<any[]>(countsUrl, { headers })

    if (Array.isArray(countsRes)) {
      counts.total = countsRes.length
      for (const row of countsRes) {
        if (row.attribution_status === 'unassigned') counts.unassigned++
        else if (row.attribution_status === 'lead_captured') counts.lead_captured++
        else if (row.attribution_status === 'assigned') counts.assigned++
        else if (row.attribution_status === 'dismissed') counts.dismissed++
      }
    }
  } catch (err) {
    console.error('[whatsapp-attributions] Erro ao obter contagens:', err)
  }

  // 2. Query de listagem com joins em lead_clicks, clients, leads e admin_users
  const selectQuery = [
    '*',
    'lead_click:lead_clicks!whatsapp_attributions_lead_click_id_fkey(msclkid)',
    'client:clients(id,nome,telefone_principal,email)',
    'lead:leads(id,nome,telefone)',
    'assigned_admin:admin_users!whatsapp_attributions_assigned_by_fkey(id,email)',
    'dismissed_admin:admin_users!whatsapp_attributions_dismissed_by_fkey(id,email)'
  ].join(',')

  const params = new URLSearchParams()
  params.set('select', selectQuery)
  params.set('order', 'clicked_at.desc')
  params.set('limit', String(pageSize))
  params.set('offset', String(offset))

  if (status && status !== 'all') {
    params.set('attribution_status', `eq.${status}`)
  }

  if (channel === 'legacy_null') {
    params.set('channel', 'is.null')
  } else if (channel && channel !== 'all') {
    params.set('channel', `eq.${channel}`)
  }

  if (search) {
    params.set('or', `(short_code.ilike.*${search}*,campaign_name.ilike.*${search}*,landing_path.ilike.*${search}*)`)
  }

  try {
    const listRes = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/whatsapp_attributions?${params.toString()}`, {
      headers
    })

    const items: WhatsappAttributionItem[] = (listRes || []).map((row) => {
      const gclid = row.gclid || null
      const gbraid = row.gbraid || null
      const wbraid = row.wbraid || null
      const fbclid = row.fbclid || null
      const msclkid = row.lead_click?.msclkid || null
      const ttclid = row.ttclid || null

      let clickIdType: 'gclid' | 'gbraid' | 'wbraid' | 'fbclid' | 'msclkid' | 'ttclid' | null = null
      let clickIdValue: string | null = null

      if (gclid) { clickIdType = 'gclid'; clickIdValue = gclid }
      else if (gbraid) { clickIdType = 'gbraid'; clickIdValue = gbraid }
      else if (wbraid) { clickIdType = 'wbraid'; clickIdValue = wbraid }
      else if (ttclid) { clickIdType = 'ttclid'; clickIdValue = ttclid }
      else if (fbclid) { clickIdType = 'fbclid'; clickIdValue = fbclid }
      else if (msclkid) { clickIdType = 'msclkid'; clickIdValue = msclkid }

      return {
        id: row.id,
        short_code: row.short_code,
        lead_click_id: row.lead_click_id,
        visitor_id: row.visitor_id,
        session_id: row.session_id,
        clicked_at: row.clicked_at,

        // Snapshot Multicanal & Atribuição
        channel: row.channel || null,
        utm_source: row.utm_source || null,
        utm_medium: row.utm_medium || null,
        utm_campaign: row.utm_campaign || null,
        utm_content: row.utm_content || null,
        utm_term: row.utm_term || null,
        campaign_name: row.campaign_name || null,
        landing_path: row.landing_path || null,
        cta_location: row.cta_location || null,

        // Click IDs
        gclid,
        gbraid,
        wbraid,
        fbclid,
        msclkid,
        ttclid,

        // Google Ads IDs
        google_campaign_id: row.google_campaign_id || null,
        google_adgroup_id: row.google_adgroup_id || null,
        google_creative_id: row.google_creative_id || null,

        // Meta / Instagram / Facebook IDs
        meta_campaign_id: row.meta_campaign_id || null,
        meta_adset_id: row.meta_adset_id || null,
        meta_ad_id: row.meta_ad_id || null,
        meta_placement: row.meta_placement || null,

        // TikTok Ads IDs
        tiktok_campaign_id: row.tiktok_campaign_id || null,
        tiktok_adgroup_id: row.tiktok_adgroup_id || null,
        tiktok_ad_id: row.tiktok_ad_id || null,
        tiktok_creative_id: row.tiktok_creative_id || null,
        tiktok_placement: row.tiktok_placement || null,

        has_click_id: !!clickIdType,
        click_id_type: clickIdType,
        click_id_value: clickIdValue,

        // CRM Links
        client_id: row.client_id,
        lead_id: row.lead_id,
        client: row.client || null,
        lead: row.lead || null,

        // Status & Metodologia
        attribution_status: row.attribution_status,
        confidence_level: row.confidence_level,
        match_method: row.match_method,

        // Auditoria
        assigned_by: row.assigned_by,
        assigned_at: row.assigned_at,
        assigned_by_email: row.assigned_admin?.email || null,
        dismissed_by: row.dismissed_by,
        dismissed_at: row.dismissed_at,
        dismissed_by_email: row.dismissed_admin?.email || null,
        notes: row.notes,

        created_at: row.created_at,
        updated_at: row.updated_at
      }
    })

    return {
      success: true,
      attributions: items,
      total: status === 'all' ? counts.total : (counts as any)[status] || items.length,
      counts
    }
  } catch (err: any) {
    console.error('[whatsapp-attributions/list] Erro:', err)
    throw createError({ statusCode: 500, message: err?.message || 'Erro ao carregar atribuições do WhatsApp.' })
  }
})
