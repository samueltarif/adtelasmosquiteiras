import { defineEventHandler, getRouterParam, readBody, setHeader, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../../utils/crm'
import { generateProposalPdfBuffer } from '../../../../../../utils/proposalPdf'

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

  const body = await readBody(event).catch(() => ({}))
  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Busca dados completos da OS, cliente, endereço, itens e medições
  const woList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${workOrderId}&select=*,client:clients(*),address:client_addresses(*)`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(woList) || woList.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ordem de serviço não encontrada'
    })
  }

  const wo = woList[0]

  // 2. Busca itens com medições
  const items = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_order_items?work_order_id=eq.${workOrderId}&select=*,measurements:work_order_measurements(*)&order=sort_order.asc,created_at.asc`,
    { headers }
  ).catch(() => [])

  // 3. Busca company_profile (id=1)
  const compList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/company_profile?id=eq.1&select=*`,
    { headers }
  ).catch(() => [])

  const company = compList && compList.length > 0 ? compList[0] : {}

  // 4. Monta snapshots para a prévia
  const commercialTerms = {
    condicoes_pagamento: body.commercialTerms?.condicoes_pagamento || null,
    prazo_instalacao_dias: body.commercialTerms?.prazo_instalacao_dias ? parseInt(String(body.commercialTerms.prazo_instalacao_dias), 10) : null,
    incluir_medicoes: typeof body.commercialTerms?.incluir_medicoes === 'boolean' ? body.commercialTerms.incluir_medicoes : false,
    observacoes_proposta: body.commercialTerms?.observacoes_proposta || null
  }

  const pdfBuffer = await generateProposalPdfBuffer({
    isPreview: true,
    versionNumber: null,
    numeroOs: wo.numero_os,
    issuedAt: new Date(),
    validUntil: body.validUntil || null,
    companySnapshot: company,
    clientSnapshot: wo.client || {},
    addressSnapshot: wo.address || null,
    itemsSnapshot: items || [],
    totalsSnapshot: {
      valor_total: wo.valor_total,
      valor_desconto: wo.valor_desconto,
      valor_final: wo.valor_final
    },
    commercialTerms
  })

  // 5. Retorna o PDF como stream direto (sem salvar nada)
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `inline; filename="previa-orcamento-${wo.numero_os}.pdf"`)
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  setHeader(event, 'Content-Length', pdfBuffer.length)

  return pdfBuffer
})
