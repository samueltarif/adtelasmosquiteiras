import { defineEventHandler, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders, normalizePhone } from '../../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase não configurado no servidor'
    })
  }

  const body = await readBody(event).catch(() => ({}))
  const search = typeof body.search === 'string' ? body.search.trim() : ''
  const page = Math.max(1, parseInt(String(body.page || '1'), 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(String(body.limit || '20'), 10) || 20))
  const offset = (page - 1) * limit

  const selectFields = 'id,numero_os,client_id,address_id,responsible_staff_id,status_os,valor_total,valor_desconto,valor_final,proposal_issued_at,proposal_valid_until,data_prevista,data_conclusao,observacoes_gerais,is_archived,created_at,updated_at,client:clients!inner(id,nome,telefone_principal,email,tipo_cliente),address:client_addresses(id,rotulo,logradouro,numero,bairro,cidade,uf),responsible:crm_staff(id,nome,funcao)'

  let filterQuery = '&is_archived.eq.false'
  if (body.status && typeof body.status === 'string') {
    filterQuery += `&status_os.eq.${body.status}`
  }

  if (search) {
    const digits = normalizePhone(search)
    const orConditions: string[] = [
      `numero_os.ilike.*${search}*`,
      `client.nome.ilike.*${search}*`
    ]
    if (digits && digits.length >= 4) {
      orConditions.push(`client.telefone_principal.ilike.*${digits}*`)
    }
    filterQuery += `&or=(${orConditions.join(',')})`
  }

  const url = `${config.supabaseUrl}/rest/v1/work_orders?select=${selectFields}${filterQuery}&order=created_at.desc&limit=${limit}&offset=${offset}`

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
      console.error('[WorkOrdersSearch] Erro Supabase:', errText)
      throw createError({
        statusCode: response.status,
        statusMessage: 'Falha ao buscar ordens de serviço'
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
    console.error('[WorkOrdersSearch] Erro inesperado:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno ao processar busca de ordens de serviço'
    })
  }
})
