import { getSaoPauloDateRange, fetchAllPaginated } from '../../../../utils/adminAnalytics'
import { requireActiveAdmin } from '../../../../utils/adminAuth'

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
  const { startUtc, endUtc, label } = dateRange

  const spStartDate = new Date(new Date(startUtc).getTime() - 3 * 3600 * 1000).toISOString().split('T')[0]
  const spEndDate = new Date(new Date(endUtc).getTime() - 3 * 3600 * 1000).toISOString().split('T')[0]

  try {
    const viewQuery = `date_sp=gte.${spStartDate}&date_sp=lte.${spEndDate}&order=unique_visitors.desc`
    const rows = await fetchAllPaginated<any>(
      config.supabaseUrl,
      'view_admin_google_ads_keyword_metrics',
      viewQuery,
      headers
    )

    const map: Record<string, any> = {}
    for (const r of rows) {
      const kw = r.keyword
      if (!map[kw]) {
        map[kw] = {
          keyword: kw,
          utm_campaign: r.utm_campaign,
          unique_visitors: 0,
          sessions: 0,
          pageviews: 0
        }
      }
      map[kw].unique_visitors += Number(r.unique_visitors) || 0
      map[kw].sessions += Number(r.sessions) || 0
      map[kw].pageviews += Number(r.pageviews) || 0
    }

    const keywords = Object.values(map).sort((a, b) => b.unique_visitors - a.unique_visitors)

    return {
      success: true,
      meta: { preset, date_label: label, sp_start_date: spStartDate, sp_end_date: spEndDate },
      keywords
    }
  } catch (error: any) {
    console.error('[analytics/google-ads/keywords] Erro:', error?.message)
    return { success: false, error: error?.message || 'Erro ao consultar palavras-chave do Google Ads' }
  }
})
