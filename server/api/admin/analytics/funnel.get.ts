import { 
  getSaoPauloDateRange, 
  fetchAllPaginated, 
  classifyLeadRecord, 
  safeRate,
  PHASE_B_START_ISO
} from '../../../utils/adminAnalytics'
import { requireActiveAdmin } from '../../../utils/adminAuth'

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
  const { startUtc, endUtc, identityStartUtc, label, isLegacyOverlap } = dateRange
  const activePeriodStartMs = new Date(identityStartUtc).getTime()

  try {
    // 1. Pageviews com path para estágio de Serviço
    const viewsQuery = `select=id,created_at,visitor_id,path,is_bot&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
    const rawViews = await fetchAllPaginated<any>(config.supabaseUrl, 'page_views', viewsQuery, headers)
    const humanViews = rawViews.filter(v => v.is_bot !== true)

    // 2. Cliques de intenção
    const clicksQuery = `select=id,created_at,tipo,visitor_id,is_bot&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
    const rawClicks = await fetchAllPaginated<any>(config.supabaseUrl, 'lead_clicks', clicksQuery, headers)
    const humanClicks = rawClicks.filter(c => c.is_bot !== true)

    // 3. Leads reais
    const leadsQuery = `select=id,created_at,status,visitor_id,nome,email,telefone,mensagem,observacoes&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
    const rawLeads = await fetchAllPaginated<any>(config.supabaseUrl, 'leads', leadsQuery, headers)
    const realLeads = rawLeads.filter(l => classifyLeadRecord(l).category === 'REAL')

    // Estágios de conversão baseados em VISITANTES ÚNICOS IDENTIFICADOS (Piso de Identidade)
    const stageAllVisitors = new Set<string>()
    const stageServiceVisitors = new Set<string>()
    const stageIntentVisitors = new Set<string>()
    const stageFormVisitors = new Set<string>()
    const stageProposalVisitors = new Set<string>()
    const stageWonVisitors = new Set<string>()
    const stageLostVisitors = new Set<string>()

    for (const v of humanViews) {
      const vTime = new Date(v.created_at).getTime()
      if (v.visitor_id && vTime >= activePeriodStartMs) {
        stageAllVisitors.add(v.visitor_id)
        if (v.path && (v.path.startsWith('/servicos') || v.path.startsWith('/areas-atendidas'))) {
          stageServiceVisitors.add(v.visitor_id)
        }
      }
    }

    for (const c of humanClicks) {
      const cTime = new Date(c.created_at).getTime()
      if (c.visitor_id && cTime >= activePeriodStartMs) {
        stageAllVisitors.add(c.visitor_id)
        stageIntentVisitors.add(c.visitor_id)
      }
    }

    for (const l of realLeads) {
      const lTime = new Date(l.created_at).getTime()
      const vid = l.visitor_id
      if (vid && lTime >= activePeriodStartMs) {
        stageAllVisitors.add(vid)
        stageFormVisitors.add(vid)

        if (l.status === 'Orçado' || l.status === 'Fechado') {
          stageProposalVisitors.add(vid)
        }
        if (l.status === 'Fechado') {
          stageWonVisitors.add(vid)
        }
        if (l.status === 'Perdido') {
          stageLostVisitors.add(vid)
        }
      }
    }

    const totalVisitors = stageAllVisitors.size
    const serviceVisitors = stageServiceVisitors.size
    const intentVisitors = stageIntentVisitors.size
    const formVisitors = stageFormVisitors.size
    const proposalVisitors = stageProposalVisitors.size
    const wonVisitors = stageWonVisitors.size
    const lostVisitors = stageLostVisitors.size

    const wonCount = realLeads.filter(l => l.status === 'Fechado').length
    const lostCount = realLeads.filter(l => l.status === 'Perdido').length

    const stages = [
      {
        stage: 'VISITORS',
        label: '1. Visitantes Únicos',
        count: totalVisitors,
        rate_from_top: '100.0%',
        rate_from_previous: '100.0%'
      },
      {
        stage: 'SERVICE_VIEW',
        label: '2. Interesse em Serviços',
        count: serviceVisitors,
        rate_from_top: safeRate(serviceVisitors, totalVisitors),
        rate_from_previous: safeRate(serviceVisitors, totalVisitors)
      },
      {
        stage: 'CONTACT_INTENT',
        label: '3. Intenção de Contato (WhatsApp/Tel)',
        count: intentVisitors,
        rate_from_top: safeRate(intentVisitors, totalVisitors),
        rate_from_previous: safeRate(intentVisitors, serviceVisitors || totalVisitors)
      },
      {
        stage: 'FORM_SUBMIT',
        label: '4. Leads Reais (Formulário)',
        count: formVisitors,
        rate_from_top: safeRate(formVisitors, totalVisitors),
        rate_from_previous: safeRate(formVisitors, intentVisitors || totalVisitors)
      },
      {
        stage: 'PROPOSAL',
        label: '5. Orçamentos Apresentados',
        count: proposalVisitors,
        rate_from_top: safeRate(proposalVisitors, totalVisitors),
        rate_from_previous: safeRate(proposalVisitors, formVisitors || totalVisitors)
      },
      {
        stage: 'WON',
        label: '6. Negócios Fechados',
        count: wonVisitors,
        rate_from_top: safeRate(wonVisitors, totalVisitors),
        rate_from_previous: safeRate(wonVisitors, proposalVisitors || totalVisitors)
      }
    ]

    return {
      success: true,
      meta: {
        preset,
        date_label: label,
        requested_start_utc: startUtc,
        requested_end_utc: endUtc,
        identity_start_utc: identityStartUtc,
        phase_b_start_at: PHASE_B_START_ISO,
        is_legacy_overlap: isLegacyOverlap
      },
      stages,
      outcomes: {
        won: { count: wonCount, label: 'Fechado' },
        lost: { count: lostCount, label: 'Perdido' }
      },
      is_consistent: true,
      consistency_warning: null
    }
  } catch (error: any) {
    console.error('[analytics/funnel] Erro:', error?.message)
    return { success: false, error: error?.message || 'Erro ao processar funil' }
  }
})
