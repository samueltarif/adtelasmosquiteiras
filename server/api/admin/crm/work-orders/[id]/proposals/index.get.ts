import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../../utils/crm'

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
  if (!workOrderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID da ordem de serviço é obrigatório'
    })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Busca dados da OS para saber accepted_proposal_id
  const woList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${workOrderId}&select=id,numero_os,status_os,accepted_proposal_id,updated_at`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(woList) || woList.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ordem de serviço não encontrada'
    })
  }

  const wo = woList[0]

  // 2. Busca histórico de propostas ordenado por versão decrescente
  const selectQuery = 'id,version_number,status,generation_status,issued_at,valid_until,accepted_at,created_at,pdf_size_bytes,pdf_sha256'
  const proposals = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_order_proposals?work_order_id=eq.${workOrderId}&select=${selectQuery}&order=version_number.desc`,
    { headers }
  ).catch((err) => {
    console.error('[ProposalsList] Erro ao buscar propostas:', err)
    return []
  })

  const formattedProposals = (proposals || []).map((p) => ({
    id: p.id,
    versionNumber: p.version_number,
    versionLabel: `Rev. ${String(p.version_number).padStart(2, '0')}`,
    status: p.status,
    generationStatus: p.generation_status,
    issuedAt: p.issued_at,
    validUntil: p.valid_until,
    acceptedAt: p.accepted_at,
    createdAt: p.created_at,
    pdfSizeBytes: p.pdf_size_bytes,
    hasPdf: p.generation_status === 'ready' && !!p.pdf_sha256,
    isAccepted: p.id === wo.accepted_proposal_id
  }))

  return {
    workOrderId: wo.id,
    numeroOs: wo.numero_os,
    statusOs: wo.status_os,
    acceptedProposalId: wo.accepted_proposal_id,
    proposals: formattedProposals
  }
})
