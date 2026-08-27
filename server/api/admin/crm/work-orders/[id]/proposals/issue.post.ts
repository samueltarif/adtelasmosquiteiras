import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../utils/adminAuth'
import { orchestrateProposalIssue } from '../../../../../../utils/proposalOrchestrator'

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
  if (!workOrderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID da ordem de serviço é obrigatório'
    })
  }

  const body = await readBody(event).catch(() => ({}))
  const idempotencyKey = body.idempotencyKey ? String(body.idempotencyKey).trim() : ''

  if (!idempotencyKey || idempotencyKey.length < 10) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Chave de idempotência (idempotencyKey) é obrigatória'
    })
  }

  try {
    const result = await orchestrateProposalIssue({
      workOrderId,
      expectedUpdatedAt: body.expectedUpdatedAt || null,
      idempotencyKey,
      validUntil: body.validUntil || null,
      commercialTerms: body.commercialTerms || null,
      actorId: admin.userId,
      config: {
        url: config.supabaseUrl,
        serviceRoleKey: config.supabaseServiceRoleKey
      }
    })

    return {
      success: true,
      proposal: result
    }
  } catch (err: any) {
    console.error('[ProposalIssueRoute] Erro na emissão da proposta:', err)
    throw createError({
      statusCode: err?.message?.includes('STALE_VERSION') || err?.message?.includes('CONCURRENCY') ? 409 : 400,
      statusMessage: err?.message || 'Falha ao emitir proposta comercial'
    })
  }
})
