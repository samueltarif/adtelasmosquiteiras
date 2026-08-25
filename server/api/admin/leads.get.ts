import { 
  getSaoPauloDateRange, 
  fetchAllPaginated, 
  classifyLeadRecord 
} from '../../utils/adminAnalytics'
import { requireActiveAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const tab = (query.tab as string) || 'real'
  const preset = (query.preset as string) || 'allTime'
  const customFrom = query.dateFrom as string | undefined
  const customTo = query.dateTo as string | undefined

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    console.warn('[api/admin/leads] Supabase URL ou Service Role Key não configurados no .env')
    return { success: false, leads: [], tab }
  }

  const headers = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json'
  }

  const dateRange = getSaoPauloDateRange(preset, customFrom, customTo)
  const { startUtc, endUtc } = dateRange

  try {
    const leadsQuery = `select=*&created_at=gte.${startUtc}&created_at=lt.${endUtc}&order=created_at.desc`
    const allLeads = await fetchAllPaginated<any>(
      config.supabaseUrl,
      'leads',
      leadsQuery,
      headers
    )

    // Classificar cada lead
    const classified = allLeads.map(l => ({
      ...l,
      _classification: classifyLeadRecord(l)
    }))

    let filtered: any[]
    if (tab === 'technical_history') {
      // Histórico técnico: legados sintéticos, testes automatizados, validação manual
      filtered = classified.filter(l =>
        l._classification.category === 'LEGACY_SYNTHETIC' ||
        l._classification.category === 'AUTOMATED_TEST' ||
        l._classification.category === 'MANUAL_VALIDATION_TEST'
      )
    } else {
      // Leads reais (tab === 'real')
      filtered = classified.filter(l => l._classification.category === 'REAL')
    }

    return {
      success: true,
      leads: filtered,
      tab,
      counts: {
        real: classified.filter(l => l._classification.category === 'REAL').length,
        legacy_synthetic: classified.filter(l => l._classification.category === 'LEGACY_SYNTHETIC').length,
        automated_test: classified.filter(l => l._classification.category === 'AUTOMATED_TEST').length,
        manual_validation: classified.filter(l => l._classification.category === 'MANUAL_VALIDATION_TEST').length,
        total: allLeads.length
      }
    }
  } catch (error: any) {
    console.error('[api/admin/leads] Erro ao consultar leads no Supabase:', error?.message || error)
    return {
      success: false,
      leads: [],
      tab,
      error: error?.message || 'Erro de conexão'
    }
  }
})
