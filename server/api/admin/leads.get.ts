import { requireActiveAdmin } from '../../utils/adminAuth'
import { classifyLeadRecord } from '../../utils/adminAnalytics'
import { attachAttributionsToLeads, normalizeChannelFilter } from '../../utils/adminLeadsQueries'
import { normalizeLeadStatus } from '../../shared/leadStatusCore.mjs'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const tab = (query.tab as string) || 'whatsapp'
  const page = Math.max(1, parseInt(query.page as string, 10) || 1)
  const limit = Math.min(100, Math.max(5, parseInt(query.limit as string, 10) || 25))
  const search = ((query.search as string) || '').trim().toLowerCase()
  const statusFilter = normalizeLeadStatus(query.status as string)
  const channelFilter = normalizeChannelFilter(query.channel as string)

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Configuração de banco indisponível' })
  }

  const headers = {
    apikey: config.supabaseServiceRoleKey,
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json'
  }

  try {
    // 1. Buscar todos os leads da base para computar KPIs e ordenação consistente
    const url = `${config.supabaseUrl}/rest/v1/leads?select=*&order=created_at.desc`
    const res = await fetch(url, { headers })
    const allLeadsRaw = await res.json()

    if (!Array.isArray(allLeadsRaw)) {
      throw createError({ statusCode: 500, message: 'Falha ao consultar leads' })
    }

    // 2. Classificação de leads (reais vs testes técnicos)
    const classified = allLeadsRaw.map(l => ({
      ...l,
      _classification: classifyLeadRecord(l)
    }))

    // 3. Filtrar por aba
    let tabFiltered = classified
    if (tab === 'technical_history') {
      tabFiltered = classified.filter(l =>
        l._classification.category === 'LEGACY_SYNTHETIC' ||
        l._classification.category === 'AUTOMATED_TEST' ||
        l._classification.category === 'MANUAL_VALIDATION_TEST'
      )
    } else if (tab === 'whatsapp') {
      // Aba principal: Leads reais capturados pelo WhatsApp Gate ou com origem WhatsApp
      tabFiltered = classified.filter(l => l._classification.category === 'REAL')
    } else if (tab === 'real') {
      tabFiltered = classified.filter(l => l._classification.category === 'REAL')
    }

    // 4. Calcular KPIs globais da aba
    const kpiCounts = {
      total: tabFiltered.length,
      novos: tabFiltered.filter(l => (normalizeLeadStatus(l.status) || 'Novo') === 'Novo').length,
      em_contato: tabFiltered.filter(l => normalizeLeadStatus(l.status) === 'Em contato').length,
      sem_resposta: tabFiltered.filter(l => normalizeLeadStatus(l.status) === 'Sem resposta').length,
      fechados: tabFiltered.filter(l => normalizeLeadStatus(l.status) === 'Fechado').length,
      perdidos: tabFiltered.filter(l => normalizeLeadStatus(l.status) === 'Perdido').length
    }

    // 5. Aplicar filtros adicionais (Status, Canal, Busca)
    let filtered = tabFiltered
    if (statusFilter) {
      filtered = filtered.filter(l => (normalizeLeadStatus(l.status) || 'Novo') === statusFilter)
    }

    if (channelFilter) {
      filtered = filtered.filter(l => {
        const leadChan = (l.channel || l.session_channel || l.first_touch_channel || 'direct').toLowerCase()
        return leadChan.includes(channelFilter)
      })
    }

    if (search) {
      // Verificar se o termo parece um REF code (short_code): alfanumérico, 6-12 chars uppercase
      const isRefSearch = /^[A-Z0-9]{6,12}$/.test(search.toUpperCase())
      let refLeadIds: Set<string> | null = null

      if (isRefSearch) {
        try {
          const refRes = await fetch(
            `${config.supabaseUrl}/rest/v1/whatsapp_attributions?short_code=ilike.*${encodeURIComponent(search.toUpperCase())}*&select=lead_id`,
            { headers }
          )
          const refData = await refRes.json()
          if (Array.isArray(refData) && refData.length > 0) {
            refLeadIds = new Set(refData.map((r: any) => r.lead_id).filter(Boolean))
          }
        } catch (err) {
          console.warn('[GET /api/admin/leads] Falha ao buscar REF em attributions:', err)
        }
      }

      filtered = filtered.filter(l => {
        // Se encontrou leads via REF search, incluir esses leads
        if (refLeadIds && refLeadIds.has(l.id)) return true

        const text = [
          l.nome,
          l.telefone,
          l.email,
          l.bairro,
          l.cidade,
          l.servico,
          l.landing_path,
          l.conversion_path,
          l.utm_campaign,
          l.first_touch_utm_campaign,
          l.submission_id
        ].filter(Boolean).join(' ').toLowerCase()
        return text.includes(search)
      })
    }

    const totalCount = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalCount / limit))
    const offset = (page - 1) * limit
    const pageItemsRaw = filtered.slice(offset, offset + limit)

    // 6. Anexar histórico de interações (whatsapp_attributions) apenas para os itens da página atual
    const pageItems = await attachAttributionsToLeads(pageItemsRaw, config.supabaseUrl, headers)

    return {
      success: true,
      leads: pageItems,
      tab,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages
      },
      counts: {
        ...kpiCounts,
        real: classified.filter(l => l._classification.category === 'REAL').length,
        legacy_synthetic: classified.filter(l => l._classification.category === 'LEGACY_SYNTHETIC').length,
        automated_test: classified.filter(l => l._classification.category === 'AUTOMATED_TEST').length,
        manual_validation: classified.filter(l => l._classification.category === 'MANUAL_VALIDATION_TEST').length
      }
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[GET /api/admin/leads] Erro:', err)
    throw createError({ statusCode: 500, message: 'Erro ao listar leads' })
  }
})
