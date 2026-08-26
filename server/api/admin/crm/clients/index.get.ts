import { requireActiveAdmin } from '../../../../utils/adminAuth'
import {
  ALLOWED_CLIENT_SORT_FIELDS,
  ALLOWED_SORT_DIRECTIONS,
  ALLOWED_CLIENT_TIPOS,
  getSupabaseHeaders
} from '../../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const query = getQuery(event)

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const page = Math.max(1, parseInt(query.page as string, 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize as string, 10) || 20))
  const offset = (page - 1) * pageSize

  const tipo = typeof query.tipo === 'string' && ALLOWED_CLIENT_TIPOS.includes(query.tipo) ? query.tipo : null
  const archived = query.archived === 'true' || query.archived === true

  const sortBy = ALLOWED_CLIENT_SORT_FIELDS.includes(query.sortBy as string) ? (query.sortBy as string) : 'created_at'
  const sortDirection = ALLOWED_SORT_DIRECTIONS.includes(query.sortDirection as string) ? (query.sortDirection as string) : 'desc'

  const headers = {
    ...getSupabaseHeaders(config.supabaseServiceRoleKey),
    'Prefer': 'count=exact'
  }

  const queryParams = new URLSearchParams()
  queryParams.set('select', 'id,lead_id,tipo_cliente,nome,cpf_cnpj,telefone_principal,telefone_secundario,email,status,is_archived,created_at,updated_at,client_addresses(id,cidade,uf,is_principal),work_orders(id)')
  queryParams.set('is_archived', `eq.${archived}`)
  queryParams.set('order', `${sortBy}.${sortDirection}`)
  queryParams.set('offset', String(offset))
  queryParams.set('limit', String(pageSize))

  if (tipo) {
    queryParams.set('tipo_cliente', `eq.${tipo}`)
  }

  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/clients?${queryParams.toString()}`, {
      headers
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[clients/list] Erro ao consultar clients no Supabase:', errText)
      throw createError({ statusCode: response.status, message: 'Erro ao listar clientes.' })
    }

    const contentRange = response.headers.get('content-range')
    let total = 0
    if (contentRange && contentRange.includes('/')) {
      total = parseInt(contentRange.split('/')[1], 10) || 0
    }

    const rawClients: any[] = await response.json()

    const clients = rawClients.map(c => {
      const principalAddr = (c.client_addresses || []).find((a: any) => a.is_principal) || c.client_addresses?.[0]
      return {
        id: c.id,
        lead_id: c.lead_id,
        tipo_cliente: c.tipo_cliente,
        nome: c.nome,
        cpf_cnpj: c.cpf_cnpj,
        telefone_principal: c.telefone_principal,
        telefone_secundario: c.telefone_secundario,
        email: c.email,
        status: c.status,
        is_archived: c.is_archived,
        created_at: c.created_at,
        updated_at: c.updated_at,
        cidade_principal: principalAddr ? `${principalAddr.cidade || 'São Paulo'} - ${principalAddr.uf || 'SP'}` : 'Não informada',
        total_work_orders: Array.isArray(c.work_orders) ? c.work_orders.length : 0
      }
    })

    return {
      success: true,
      clients,
      total,
      page,
      pageSize
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[clients/list] Erro inesperado:', err)
    throw createError({ statusCode: 500, message: 'Erro interno ao listar clientes.' })
  }
})
