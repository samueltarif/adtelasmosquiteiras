import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID do cliente é obrigatório.' })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const page = Math.max(1, parseInt(query.page as string, 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize as string, 10) || 20))
  const offset = (page - 1) * pageSize

  const headers = {
    ...getSupabaseHeaders(config.supabaseServiceRoleKey),
    'Prefer': 'count=exact'
  }

  const queryParams = new URLSearchParams()
  queryParams.set('select', 'id,numero_os,status_os,valor_total,valor_desconto,valor_final,proposal_issued_at,data_prevista,data_conclusao,created_at,updated_at,client_addresses(id,rotulo,logradouro,numero,bairro,cidade)')
  queryParams.set('client_id', `eq.${id}`)
  queryParams.set('order', 'created_at.desc')
  queryParams.set('offset', String(offset))
  queryParams.set('limit', String(pageSize))

  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/work_orders?${queryParams.toString()}`, {
      headers
    })

    if (!response.ok) {
      throw createError({ statusCode: response.status, message: 'Erro ao buscar ordens de serviço.' })
    }

    const contentRange = response.headers.get('content-range')
    let total = 0
    if (contentRange && contentRange.includes('/')) {
      total = parseInt(contentRange.split('/')[1], 10) || 0
    }

    const workOrders = await response.json()

    return {
      success: true,
      workOrders,
      total,
      page,
      pageSize
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[clients/work-orders] Erro ao carregar ordens de serviço:', err)
    throw createError({ statusCode: 500, message: 'Erro interno ao buscar ordens de serviço.' })
  }
})
