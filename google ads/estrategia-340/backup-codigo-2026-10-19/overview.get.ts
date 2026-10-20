import { 
  getSaoPauloDateRange, 
  fetchAllPaginated
} from '../../../../utils/adminAnalytics'
import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { computeGoogleAdsData } from '../../../../shared/adminGoogleAdsMetrics.mjs'

export default defineEventHandler(async (event) => {
  // 1. Exige Administrador Ativo
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

  // 2. Intervalo de Datas Compartilhado no fuso horário de São Paulo
  const dateRange = getSaoPauloDateRange(preset, customFrom, customTo)
  const { startUtc, endUtc, identityStartUtc, label, isLegacyOverlap } = dateRange

  try {
    // 3. Buscar page_views no período (incluindo novos campos Google Ads)
    const viewsQuery = `select=id,created_at,visitor_id,session_id,path,landing_path,channel,utm_source,utm_medium,utm_campaign,utm_content,utm_term,google_campaign_id,google_adgroup_id,google_creative_id,google_match_type,google_network,google_device,google_target_id,gclid,gbraid,wbraid,is_bot,device_type&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
    const rawViews = await fetchAllPaginated<any>(config.supabaseUrl, 'page_views', viewsQuery, headers)

    // 4. Buscar lead_clicks no período (incluindo novos campos Google Ads e quote_cta)
    const clicksQuery = `select=id,created_at,tipo,origem,landing_path,cta_location,visitor_id,session_id,channel,utm_source,utm_medium,utm_campaign,utm_content,utm_term,google_campaign_id,google_adgroup_id,google_creative_id,google_match_type,google_network,google_device,google_target_id,gclid,gbraid,wbraid,is_bot,device_type&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
    const rawClicks = await fetchAllPaginated<any>(config.supabaseUrl, 'lead_clicks', clicksQuery, headers)

    // 5. Buscar leads no período
    const leadsQuery = `select=id,created_at,visitor_id,session_id,landing_path,conversion_path,origem,session_channel,first_touch_channel,utm_source,utm_medium,utm_campaign,first_touch_utm_campaign,utm_content,utm_term,first_touch_utm_term,google_campaign_id,first_touch_google_campaign_id,gclid,first_touch_gclid,nome,email,telefone,mensagem,observacoes,status&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
    const rawLeads = await fetchAllPaginated<any>(config.supabaseUrl, 'leads', leadsQuery, headers)

    // 6. Computar métricas, funil bifurcado, campanhas, keywords e data quality
    const metrics = computeGoogleAdsData(rawViews, rawClicks, rawLeads, dateRange)

    return {
      success: true,
      meta: {
        preset,
        date_label: label,
        requested_start_utc: startUtc,
        requested_end_utc: endUtc,
        identity_start_utc: identityStartUtc,
        is_legacy_overlap: isLegacyOverlap
      },
      ...metrics
    }
  } catch (error: any) {
    console.error('[analytics/google-ads/overview] Erro:', error?.message)
    return { success: false, error: error?.message || 'Erro ao processar métricas do Google Ads' }
  }
})
