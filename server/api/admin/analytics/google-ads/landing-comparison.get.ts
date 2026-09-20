import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSaoPauloDateRange, fetchAllPaginated } from '../../../../utils/adminAnalytics'
import {
  calculateComparisonWindow,
  computeLandingComparison
} from '../../../../shared/adminLandingComparison.mjs'

export default defineEventHandler(async (event) => {
  // 1. Exige Administrador Ativo
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const channelFilter = (query.channel as string) === 'all' ? 'all' : 'google_ads'
  const preset = (query.preset as string) || 'today'
  const customFrom = query.dateFrom as string | undefined
  const customTo = query.dateTo as string | undefined
  const windowHours = query.windowHours ? Number(query.windowHours) : undefined

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return { success: false, error: 'Supabase não configurado' }
  }

  const headers = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
  }

  // 2. Buscar configuração de cutoff da landing no banco (ou fallback seguro)
  let cutoffConfig = {
    landing_key: 'telas_mosquiteiras',
    label: 'Nova Landing Telas Mosquiteiras',
    landing_path: '/lp/telas-mosquiteiras',
    previous_path_prefixes: ['/servicos/telas'],
    comparison_cutoff_at: '2026-09-20T18:51:51.000Z',
    landing_first_seen_at: '2026-09-20T14:42:57.762Z'
  }

  try {
    const cutoffUrl = `${config.supabaseUrl}/rest/v1/marketing_landing_cutoffs?landing_key=eq.telas_mosquiteiras&select=*`
    const res = await $fetch<any[]>(cutoffUrl, { headers })
    if (res && res.length > 0) {
      cutoffConfig = {
        ...cutoffConfig,
        ...res[0]
      }
    }
  } catch (err: any) {
    console.warn('[analytics/landing-comparison] Aviso ao carregar cutoff do Supabase, usando padrão:', err?.message)
  }

  // 3. Cutoff adaptativo por canal (Google Ads: início de campanha / Todos: lançamento técnico)
  const isAllChannels = channelFilter === 'all'
  const effectiveCutoffIso = isAllChannels
    ? (cutoffConfig.landing_first_seen_at || cutoffConfig.comparison_cutoff_at)
    : cutoffConfig.comparison_cutoff_at

  const cutoffExplanation = isAllChannels
    ? 'Comparação baseada no lançamento técnico da nova landing (primeiro acesso registrado).'
    : 'Comparação baseada no início da campanha Google Ads utilizando a nova landing.'

  // 4. Obter intervalo global e calcular janela de comparação simétrica com buffer de maturação (30 min)
  const dateRange = getSaoPauloDateRange(preset, customFrom, customTo)
  const window = calculateComparisonWindow(
    effectiveCutoffIso,
    { windowHours, endUtc: dateRange.endUtc },
    null,
    30 // 30 min buffer de maturação
  )

  try {
    // 5. Se a janela de tempo disponível pós-maturação for válida, buscar os dados
    let rawViews: any[] = []
    let rawClicks: any[] = []
    let rawLeads: any[] = []

    if (window.durationMs > 0) {
      const viewsQuery = `select=id,created_at,visitor_id,session_id,path,landing_path,channel,utm_source,utm_medium,utm_campaign,gclid,gbraid,wbraid,is_bot,device_type&created_at=gte.${window.beforeStartUtc}&created_at=lt.${window.afterEndUtc}`
      const clicksQuery = `select=id,created_at,tipo,origem,landing_path,cta_location,visitor_id,session_id,channel,utm_source,utm_medium,utm_campaign,gclid,gbraid,wbraid,is_bot,device_type&created_at=gte.${window.beforeStartUtc}&created_at=lt.${window.afterEndUtc}`
      const leadsQuery = `select=id,created_at,visitor_id,session_id,landing_path,conversion_path,origem,session_channel,first_touch_channel,utm_source,utm_medium,utm_campaign,gclid,first_touch_gclid,nome,email,telefone,mensagem,observacoes,status,device_type&created_at=gte.${window.beforeStartUtc}&created_at=lt.${window.afterEndUtc}`

      const [views, clicks, leads] = await Promise.all([
        fetchAllPaginated<any>(config.supabaseUrl, 'page_views', viewsQuery, headers),
        fetchAllPaginated<any>(config.supabaseUrl, 'lead_clicks', clicksQuery, headers),
        fetchAllPaginated<any>(config.supabaseUrl, 'leads', leadsQuery, headers)
      ])

      rawViews = views
      rawClicks = clicks
      rawLeads = leads
    }

    // 5. Computar comparação Antes x Depois por Coorte de Sessão
    const comparison = computeLandingComparison(
      rawViews,
      rawClicks,
      rawLeads,
      window,
      {
        landing_path: cutoffConfig.landing_path,
        previous_path_prefixes: cutoffConfig.previous_path_prefixes,
        channelFilter
      }
    )

    return {
      success: true,
      data: {
        ...comparison,
        label: cutoffConfig.label,
        landing_first_seen_at: cutoffConfig.landing_first_seen_at,
        cutoffExplanation
      }
    }
  } catch (error: any) {
    console.error('[analytics/landing-comparison] Erro:', error?.message)
    return {
      success: false,
      error: error?.message || 'Erro ao processar comparação da landing page'
    }
  }
})
