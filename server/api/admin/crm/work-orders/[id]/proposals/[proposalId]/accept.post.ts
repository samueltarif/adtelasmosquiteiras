import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../../../utils/crm'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase não configurado no servidor'
    })
  }

  const workOrderId = getRouterParam(event, 'id')
  const proposalId = getRouterParam(event, 'proposalId')

  if (!workOrderId || !proposalId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'IDs de ordem de serviço e proposta são obrigatórios'
    })
  }

  const body = await readBody(event).catch(() => ({}))
  const expectedUpdatedAt = body.expectedUpdatedAt ? String(body.expectedUpdatedAt).trim() : null

  if (!expectedUpdatedAt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'expectedUpdatedAt é obrigatório para validação de concorrência no aceite do orçamento'
    })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  const payload = {
    p_proposal_id: proposalId,
    p_work_order_id: workOrderId,
    p_expected_wo_updated_at: expectedUpdatedAt,
    p_actor_id: admin.userId || null
  }

  let acceptRes: any = null
  try {
    acceptRes = await $fetch<any>(`${config.supabaseUrl}/rest/v1/rpc/accept_work_order_proposal_atomic`, {
      method: 'POST',
      headers,
      body: payload
    })
  } catch (err: any) {
    console.error('[ProposalAcceptRoute] Erro na RPC de aceite:', err)
    const msg = err?.data?.message || err?.message || 'Falha ao aceitar proposta comercial'
    const isConflict = msg.includes('CONCURRENCY') || msg.includes('STALE') || msg.includes('STATUS')
    throw createError({
      statusCode: isConflict ? 409 : 400,
      statusMessage: msg
    })
  }

  return {
    success: true,
    result: acceptRes
  }
})
