import { defineEventHandler, getQuery, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado no servidor' })
  }

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10) || 20))
  const offset = (page - 1) * limit

  const conditions: string[] = []

  if (query.workOrderId && typeof query.workOrderId === 'string') {
    conditions.push(`work_order_id.eq.${query.workOrderId}`)
  }
  if (query.status && typeof query.status === 'string') {
    conditions.push(`status.eq.${query.status}`)
  }
  if (query.ambiente && typeof query.ambiente === 'string') {
    conditions.push(`ambiente.eq.${query.ambiente}`)
  }
  if (query.tipoDocumento && typeof query.tipoDocumento === 'string') {
    conditions.push(`tipo_documento.eq.${query.tipoDocumento}`)
  }
  if (query.isSimulated !== undefined && query.isSimulated !== '') {
    conditions.push(`is_simulated.eq.${query.isSimulated === 'true'}`)
  }

  const filterQuery = conditions.length > 0 ? `&${conditions.join('&')}` : ''
  const selectFields = 'id,work_order_id,client_id,numero_documento,serie,tipo_documento,ambiente,is_simulated,status,transmission_phase,storage_pending,provider,idempotency_key,chave_acesso,numero_protocolo,data_autorizacao,codigo_status,motivo_status,valor_total,valor_liquido,created_at,updated_at,client:clients(id,nome,documento,tipo_cliente),work_order:work_orders(id,numero_os)'

  const url = `${config.supabaseUrl}/rest/v1/fiscal_documents?select=${selectFields}${filterQuery}&order=created_at.desc&limit=${limit}&offset=${offset}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getSupabaseHeaders(config.supabaseServiceRoleKey),
        Prefer: 'count=exact'
      }
    })

    if (!response.ok) {
      const errText = await response.text()
      throw createError({ statusCode: response.status, message: `Erro ao consultar notas: ${errText}` })
    }

    const items = await response.json()
    const contentRange = response.headers.get('content-range')
    let total = items.length
    if (contentRange) {
      const match = contentRange.match(/\/(\d+)$/)
      if (match && match[1]) total = parseInt(match[1], 10)
    }

    return {
      success: true,
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[fiscal/index.get] Erro:', err)
    throw createError({ statusCode: 500, message: 'Erro ao listar documentos fiscais' })
  }
})
