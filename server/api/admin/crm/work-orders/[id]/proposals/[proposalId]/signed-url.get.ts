import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../../../utils/crm'
import {
  generateProposalSignedDownloadUrl,
  headProposalObjectInR2,
  uploadProposalPdfToR2
} from '../../../../../../../utils/r2ProposalStorage'
import { generateProposalPdfBuffer } from '../../../../../../../utils/proposalPdf'

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

  if (p.generation_status !== 'ready' || !p.pdf_storage_key) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O PDF desta proposta ainda não está pronto para download'
    })
  }

  // Auto-recuperação: se a proposta foi emitida antes da configuração do R2 ou o arquivo foi perdido,
  // regenera o PDF a partir dos snapshots congelados no banco e envia para o R2 de forma transparente.
  try {
    const head = await headProposalObjectInR2(p.pdf_storage_key).catch(() => ({ exists: false }))
    if (!head.exists) {
      const woList = await $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${workOrderId}&select=numero_os`,
        { headers }
      ).catch(() => [])
      const wo = Array.isArray(woList) && woList.length > 0 ? woList[0] : null

      const pdfBuffer = await generateProposalPdfBuffer({
        isPreview: false,
        versionNumber: p.version_number,
        numeroOs: wo?.numero_os || '',
        issuedAt: p.issued_at ? new Date(p.issued_at) : new Date(p.created_at || Date.now()),
        validUntil: p.valid_until,
        companySnapshot: p.company_snapshot || {},
        clientSnapshot: p.client_snapshot || {},
        addressSnapshot: p.address_snapshot || null,
        itemsSnapshot: p.items_snapshot || [],
        totalsSnapshot: p.totals_snapshot || {},
        commercialTerms: p.commercial_terms || {}
      })

      await uploadProposalPdfToR2(p.pdf_storage_key, pdfBuffer)
    }
  } catch (healErr) {
    console.warn('[signed-url] Falha na auto-recuperação do PDF no R2:', healErr)
  }

  const signedUrl = await generateProposalSignedDownloadUrl(p.pdf_storage_key, 300)

  return {
    proposalId: p.id,
    signedUrl,
    expiresInSeconds: 300
  }
})
