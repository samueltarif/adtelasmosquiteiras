import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../../../utils/crm'

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
    `${config.supabaseUrl}/rest/v1/work_order_proposals?id=eq.${proposalId}&work_order_id=eq.${workOrderId}&select=*`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(list) || list.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Proposta não encontrada'
    })
  }

  const p = list[0]

  return {
    id: p.id,
    workOrderId: p.work_order_id,
    versionNumber: p.version_number,
    versionLabel: `Rev. ${String(p.version_number).padStart(2, '0')}`,
    status: p.status,
    generationStatus: p.generation_status,
    issuedAt: p.issued_at,
    validUntil: p.valid_until,
    acceptedAt: p.accepted_at,
    acceptedBy: p.accepted_by,
    issuedBy: p.issued_by,
    createdAt: p.created_at,
    pdfSizeBytes: p.pdf_size_bytes,
    pdfSha256: p.pdf_sha256,
    companySnapshot: p.company_snapshot,
    clientSnapshot: p.client_snapshot,
    addressSnapshot: p.address_snapshot,
    itemsSnapshot: p.items_snapshot,
    totalsSnapshot: p.totals_snapshot,
    commercialTerms: p.commercial_terms
  }
})
