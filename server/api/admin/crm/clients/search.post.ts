import { requireActiveAdmin } from '../../../../utils/adminAuth'
import {
  ALLOWED_CLIENT_SORT_FIELDS,
  ALLOWED_SORT_DIRECTIONS,
  ALLOWED_CLIENT_TIPOS,
  normalizePhone,
  getSupabaseHeaders
} from '../../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const body = await readBody(event).catch(() => ({}))

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const page = Math.max(1, parseInt(body.page, 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(body.pageSize, 10) || 20))
  const offset = (page - 1) * pageSize

  const search = typeof body.search === 'string' ? body.search.trim() : ''
  const tipo = typeof body.tipo === 'string' && ALLOWED_CLIENT_TIPOS.includes(body.tipo) ? body.tipo : null
  const archived = body.archived === true || body.archived === 'true'

  const sortBy = ALLOWED_CLIENT_SORT_FIELDS.includes(body.sortBy) ? body.sortBy : 'created_at'
  const sortDirection = ALLOWED_SORT_DIRECTIONS.includes(body.sortDirection) ? body.sortDirection : 'desc'

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

  if (search) {
    const phoneDigits = normalizePhone(search)
    const orFilters: string[] = []
    orFilters.push(`nome.ilike.*${encodeURIComponent(search)}*`)
    orFilters.push(`email.ilike.*${encodeURIComponent(search)}*`)
    if (phoneDigits && phoneDigits.length >= 3) {
      orFilters.push(`telefone_principal.ilike.*${phoneDigits}*`)
    }
    if (search.length >= 3) {
      orFilters.push(`cpf_cnpj.ilike.*${encodeURIComponent(search)}*`)
    }
    queryParams.set('or', `(${orFilters.join(',')})`)
  }

  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/clients?${queryParams.toString()}`, {
      headers
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[clients/search] Erro ao consultar clients no Supabase:', errText)
      throw createError({ statusCode: response.status, message: 'Erro ao listar clientes.' })
    }

    const contentRange = response.headers.get('content-range')
    let total = 0
    if (contentRange && contentRange.includes('/')) {
      total = parseInt(contentRange.split('/')[1], 10) || 0
    }

    const rawClients: any[] = await response.json()

    // Formata campos calculados (cidade principal e contagem de OS)
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
    console.error('[clients/search] Erro inesperado:', err)
    throw createError({ statusCode: 500, message: 'Erro interno ao pesquisar clientes.' })
  }
})
