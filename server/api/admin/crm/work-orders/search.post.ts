/**
 * POST /api/admin/crm/work-orders/search
 * Busca estruturada de Ordens de Serviço para uso interno (modais, filtros).
 *
 * PHASE_5_0D_0: Removido or=() com client.nome.ilike (PGRST100 — FK relacional
 * não suportada em or= PostgREST). Implementada busca em dois passos no BFF:
 * 1. Busca por numero_os via coluna direta da tabela work_orders.
 * 2. Se o termo parecer nome/telefone, busca client_ids em clients e filtra work_orders.
 * Resultados são deduplicated e limitados.
 *
 * RAW_SUPABASE_ERROR_LOGGING=NO
 * PII_IN_LOGS=NO
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders, normalizePhone } from '../../../../utils/crm'


const WORK_ORDER_SEARCH_SELECT = 'id,numero_os,client_id,address_id,responsible_staff_id,status_os,data_prevista,is_archived,created_at,updated_at,client:clients!inner(id,nome,telefone_principal,tipo_cliente),address:client_addresses(id,rotulo,logradouro,numero,bairro,cidade,uf)'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)

  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado no servidor' })
  }

  const body = await readBody(event).catch(() => ({}))
  const search = typeof body.search === 'string' ? body.search.trim() : ''
  const page = Math.max(1, parseInt(String(body.page || '1'), 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(String(body.limit || '20'), 10) || 20))
  const offset = (page - 1) * limit
  const statusFilter = typeof body.status === 'string' && body.status.trim() ? body.status.trim() : null

  const headers = {
    ...getSupabaseHeaders(config.supabaseServiceRoleKey),
    'Prefer': 'count=exact'
  }

  try {
    // Passo 1: busca por numero_os (coluna direta) e/ou via client_id se houver match por nome/telefone
    const baseFilter = `&is_archived=eq.false${statusFilter ? `&status_os=eq.${statusFilter}` : ''}`
    let workOrderIds: string[] | null = null

    if (search && search.length >= 2) {
      // Tenta resolver client_ids por nome ou telefone (busca na tabela clients)
      const digits = normalizePhone(search)
      const clientOrConditions: string[] = [`nome.ilike.*${encodeURIComponent(search)}*`]
      if (digits && digits.length >= 4) {
        clientOrConditions.push(`telefone_principal.ilike.*${encodeURIComponent(digits)}*`)
      }

      const clientRes = await fetch(
        `${config.supabaseUrl}/rest/v1/clients?select=id&or=(${clientOrConditions.join(',')})&limit=50`,
        { method: 'GET', headers: getSupabaseHeaders(config.supabaseServiceRoleKey) }
      )
      if (clientRes.ok) {
        const clientMatches: any[] = await clientRes.json().catch(() => [])
        if (Array.isArray(clientMatches) && clientMatches.length > 0) {
          workOrderIds = clientMatches.map((c: any) => c.id).filter(Boolean)
        }
      }
    }

    // Construir filtro final
    let searchFilter = ''
    if (search && search.length >= 2) {
      const numOsFilter = `numero_os.ilike.*${encodeURIComponent(search)}*`
      if (workOrderIds && workOrderIds.length > 0) {
        const clientIdFilter = `client_id.in.(${workOrderIds.join(',')})`
        searchFilter = `&or=(${numOsFilter},${clientIdFilter})`
      } else {
        // Apenas por numero_os — sintaxe PostgREST: coluna.ilike dentro de or=()
        searchFilter = `&or=(${numOsFilter})`
      }
    }

    const url = `${config.supabaseUrl}/rest/v1/work_orders?select=${WORK_ORDER_SEARCH_SELECT}${baseFilter}${searchFilter}&order=created_at.desc&limit=${limit}&offset=${offset}`

    const response = await fetch(url, { method: 'GET', headers })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}))
      const safeCode = errBody?.code || response.status
      console.error(`[WorkOrdersSearch] status=${response.status} errorCode=${safeCode}`)
      throw createError({ statusCode: response.status, message: 'Não foi possível pesquisar as ordens de serviço.' })
    }

    const contentRange = response.headers.get('content-range') || ''
    let total = 0
    if (contentRange.includes('/')) {
      total = parseInt(contentRange.split('/')[1] || '0', 10) || 0
    }

    const workOrders = await response.json()

    return {
      workOrders: Array.isArray(workOrders) ? workOrders : [],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error(`[WorkOrdersSearch] status=500 errorCode=UNEXPECTED`)
    throw createError({ statusCode: 500, message: 'Erro interno ao processar busca de ordens de serviço.' })
  }
})
