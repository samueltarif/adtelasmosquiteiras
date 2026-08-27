import { defineEventHandler, getQuery, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders, ALLOWED_WORK_ORDER_STATUSES, ALLOWED_SORT_DIRECTIONS } from '../../../../utils/crm'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase não configurado no servidor'
    })
  }

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10) || 20))
  const offset = (page - 1) * limit

  const sortFieldAllowed = ['created_at', 'updated_at', 'numero_os', 'data_prevista', 'valor_final', 'status_os']
  const sortField = sortFieldAllowed.includes(String(query.sortField)) ? String(query.sortField) : 'created_at'
  const sortDirection = ALLOWED_SORT_DIRECTIONS.includes(String(query.sortDirection)) ? String(query.sortDirection) : 'desc'

  const conditions: string[] = []

  // Filtro de status
  if (query.status && ALLOWED_WORK_ORDER_STATUSES.includes(String(query.status))) {
    conditions.push(`status_os.eq.${query.status}`)
  }

  // Filtro de arquivado
  if (query.isArchived !== undefined && query.isArchived !== '') {
    const isArchived = query.isArchived === 'true' || query.isArchived === '1'
    conditions.push(`is_archived.eq.${isArchived}`)
  } else {
    conditions.push(`is_archived.eq.false`)
  }

  // Filtro por cliente
  if (query.clientId && typeof query.clientId === 'string') {
    conditions.push(`client_id.eq.${query.clientId}`)
  }

  // Filtro por responsável
  if (query.responsibleStaffId && typeof query.responsibleStaffId === 'string') {
    conditions.push(`responsible_staff_id.eq.${query.responsibleStaffId}`)
  }

  const filterQuery = conditions.length > 0 ? `&${conditions.join('&')}` : ''
  const selectFields = 'id,numero_os,client_id,address_id,responsible_staff_id,status_os,valor_total,valor_desconto,valor_final,proposal_issued_at,proposal_valid_until,data_prevista,data_conclusao,observacoes_gerais,is_archived,created_at,updated_at,client:clients(id,nome,telefone_principal,email,tipo_cliente),address:client_addresses(id,rotulo,logradouro,numero,bairro,cidade,uf),responsible:crm_staff(id,nome,funcao)'

  const url = `${config.supabaseUrl}/rest/v1/work_orders?select=${selectFields}${filterQuery}&order=${sortField}.${sortDirection}&limit=${limit}&offset=${offset}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getSupabaseHeaders(config.supabaseServiceRoleKey),
        'Prefer': 'count=exact'
      }
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[WorkOrdersList] Erro Supabase:', errText)
      throw createError({
        statusCode: response.status,
        statusMessage: 'Falha ao listar ordens de serviço'
      })
    }

    const contentRange = response.headers.get('content-range') || ''
    let total = 0
    if (contentRange.includes('/')) {
      total = parseInt(contentRange.split('/')[1], 10) || 0
    }

    const workOrders = await response.json()
    const totalPages = Math.ceil(total / limit) || 1

    return {
      workOrders: Array.isArray(workOrders) ? workOrders : [],
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[WorkOrdersList] Erro inesperado:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno ao processar listagem de ordens de serviço'
    })
  }
})
