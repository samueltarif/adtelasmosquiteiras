import { requireActiveAdmin } from '../../../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID do lead é obrigatório' })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Banco indisponível' })
  }

  const headers = {
    apikey: config.supabaseServiceRoleKey,
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json'
  }

  try {
    const fields = [
      'id',
      'short_code',
      'lead_click_id',
      'lead_id',
      'visitor_id',
      'session_id',
      'clicked_at',
      'landing_path',
      'cta_location',
      'channel',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'gclid',
      'campaign_name',
      'google_campaign_id',
      'attribution_status',
      'created_at'
    ].join(',')

    const url = `${config.supabaseUrl}/rest/v1/whatsapp_attributions?lead_id=eq.${encodeURIComponent(id)}&select=${fields}&order=clicked_at.desc,created_at.desc`
    const res = await fetch(url, { headers })
    const interactions = await res.json()

    if (!Array.isArray(interactions)) {
      throw createError({ statusCode: 500, message: 'Erro ao buscar interações do lead' })
    }

    return {
      success: true,
      lead_id: id,
      total: interactions.length,
      interactions
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[GET /api/admin/leads/:id/whatsapp-interactions] Erro:', err)
    throw createError({ statusCode: 500, message: 'Falha ao buscar histórico de interações' })
  }
})
