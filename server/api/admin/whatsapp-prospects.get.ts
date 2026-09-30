import { requireActiveAdmin } from '../../utils/adminAuth'
import { fetchAllPaginated, getSaoPauloDateRange } from '../../utils/adminAnalytics'
import { whatsappProspects } from '../../shared/whatsappProspects.mjs'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  setHeader(event, 'Cache-Control', 'no-store')
  const config = useRuntimeConfig()
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) throw createError({ statusCode: 503, message: 'Banco indisponível.' })
  const { startUtc, endUtc } = getSaoPauloDateRange('allTime')
  const fields = 'id,event_id,created_at,tipo,is_bot,session_id,service_name,utm_campaign,google_campaign_id,channel,utm_source,landing_path,origem,utm_term,gclid,gbraid,wbraid'
  const clicks = await fetchAllPaginated(config.supabaseUrl, 'lead_clicks', `select=${fields}&tipo=eq.whatsapp&created_at=gte.${startUtc}&created_at=lt.${endUtc}&order=created_at.desc,id.desc`, {
    apikey: config.supabaseServiceRoleKey, Authorization: `Bearer ${config.supabaseServiceRoleKey}`
  })
  return { items: whatsappProspects(clicks) }
})
