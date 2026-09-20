import { getSaoPauloDateRange, fetchAllPaginated } from '../../../../utils/adminAnalytics'
import { requireActiveAdmin } from '../../../../utils/adminAuth'

const CTA_LABELS: Record<string, string> = {
  lp_hero: 'Hero (Topo da Landing)',
  lp_header: 'Header (Cabeçalho)',
  lp_sticky: 'Barra Fixa Mobile (Rodapé)',
  lp_bottom: 'Seção Final de Contato',
  lp_form: 'Formulário da Landing',
  floating_whatsapp: 'WhatsApp Flutuante',
  sticky_mobile: 'CTA Fixo Mobile',
  service_card: 'Card de Serviço',
  other: 'Outros / Não Especificado'
}

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
    const viewQuery = `date_sp=gte.${spStartDate}&date_sp=lte.${spEndDate}&order=total_clicks.desc`
    const rows = await fetchAllPaginated<any>(
      config.supabaseUrl,
      'view_admin_landing_cta_metrics',
      viewQuery,
      headers
    )

    let totalClicks = 0
    const map: Record<string, any> = {}
    for (const r of rows) {
      const loc = r.cta_location
      const key = `${loc}:::${r.tipo}`
      if (!map[key]) {
        map[key] = {
          cta_location: loc,
          tipo: r.tipo,
          label: CTA_LABELS[loc] || loc,
          clicks: 0,
          unique_visitors: 0
        }
      }
      const cCount = Number(r.total_clicks) || 0
      map[key].clicks += cCount
      map[key].unique_visitors += Number(r.unique_visitors) || 0
      totalClicks += cCount
    }

    const ctas = Object.values(map).map((cta) => ({
      ...cta,
      pct_of_total_clicks: totalClicks > 0 ? ((cta.clicks / totalClicks) * 100).toFixed(1) + '%' : '0.0%'
    })).sort((a, b) => b.clicks - a.clicks)

    return {
      success: true,
      meta: { preset, date_label: label, sp_start_date: spStartDate, sp_end_date: spEndDate, total_clicks: totalClicks },
      ctas
    }
  } catch (error: any) {
    console.error('[analytics/google-ads/ctas] Erro:', error?.message)
    return { success: false, error: error?.message || 'Erro ao consultar desempenho de CTAs da Landing' }
  }
})
