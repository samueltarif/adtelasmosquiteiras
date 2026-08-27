import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../../../utils/crm'
import { generateProposalSignedDownloadUrl } from '../../../../../../../utils/r2ProposalStorage'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
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

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  const list = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_order_proposals?id=eq.${proposalId}&work_order_id=eq.${workOrderId}&select=id,generation_status,pdf_storage_key`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(list) || list.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Proposta não encontrada'
    })
  }

  const p = list[0]

  if (p.generation_status !== 'ready' || !p.pdf_storage_key) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O PDF desta proposta ainda não está pronto para download'
    })
  }

  const signedUrl = await generateProposalSignedDownloadUrl(p.pdf_storage_key, 300)

  return {
    proposalId: p.id,
    signedUrl,
    expiresInSeconds: 300
  }
})
