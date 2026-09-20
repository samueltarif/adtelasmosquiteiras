import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'
import { isValidShortCode } from '../../../../../shared/whatsappShortCodeCore.mjs'
import type { WhatsappAttributionByCodeResponse, WhatsappAttributionItem } from '~/types/adminWhatsappAttribution'

export default defineEventHandler(async (event): Promise<WhatsappAttributionByCodeResponse> => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const rawCode = event.context.params?.code || ''

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const cleanCode = rawCode.trim().toUpperCase()
  if (!isValidShortCode(cleanCode)) {
    throw createError({ statusCode: 400, message: 'Código de referência inválido. Deve possuir 8 caracteres alfanuméricos válidos.' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  const selectQuery = [
    '*',
    'client:clients(id,nome,telefone_principal,email)',
    'lead:leads(id,nome,telefone)',
    'assigned_admin:admin_users!whatsapp_attributions_assigned_by_fkey(id,email)',
    'dismissed_admin:admin_users!whatsapp_attributions_dismissed_by_fkey(id,email)'
  ].join(',')

  try {
    const res = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/whatsapp_attributions?short_code=eq.${cleanCode}&select=${selectQuery}`, {
      headers
    })

    if (!Array.isArray(res) || res.length === 0) {
      return {
        success: true,
        attribution: null,
        is_already_assigned: false
      }
    }

    const row = res[0]
    const gclid = row.gclid || null
    const gbraid = row.gbraid || null
    const wbraid = row.wbraid || null

    let clickIdType: 'gclid' | 'gbraid' | 'wbraid' | null = null
    let clickIdValue: string | null = null

    if (gclid) {
      clickIdType = 'gclid'
      clickIdValue = gclid
    } else if (gbraid) {
      clickIdType = 'gbraid'
      clickIdValue = gbraid
    } else if (wbraid) {
      clickIdType = 'wbraid'
      clickIdValue = wbraid
    }

    const attribution: WhatsappAttributionItem = {
      id: row.id,
      short_code: row.short_code,
      lead_click_id: row.lead_click_id,
      visitor_id: row.visitor_id,
      session_id: row.session_id,
      clicked_at: row.clicked_at,

      gclid,
      gbraid,
      wbraid,
      google_campaign_id: row.google_campaign_id,
      google_adgroup_id: row.google_adgroup_id,
      google_creative_id: row.google_creative_id,
      campaign_name: row.campaign_name,
      utm_term: row.utm_term,
      landing_path: row.landing_path,
      cta_location: row.cta_location,

      has_click_id: !!clickIdType,
      click_id_type: clickIdType,
      click_id_value: clickIdValue,

      client_id: row.client_id,
      lead_id: row.lead_id,
      client: row.client || null,
      lead: row.lead || null,

      attribution_status: row.attribution_status,
      confidence_level: row.confidence_level,
      match_method: row.match_method,

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

    return {
      success: true,
      attribution,
      is_already_assigned: attribution.attribution_status === 'assigned'
    }
  } catch (err: any) {
    console.error('[whatsapp-attributions/by-code] Erro:', err)
    throw createError({ statusCode: 500, message: err?.message || 'Erro ao buscar atribuição por código.' })
  }
})
