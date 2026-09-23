import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'
import { calculateItemTotals, calculateDocumentTotals } from '../../../../../shared/fiscalValidation.mjs'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')

  if (!id) throw createError({ statusCode: 400, message: 'ID do documento é obrigatório' })
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)
  const body = await readBody(event).catch(() => ({}))

  // 1. Confere status do documento
  const docs = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/fiscal_documents?id=eq.${id}&select=*`, { headers })
  const doc = docs?.[0]
  if (!doc) throw createError({ statusCode: 404, message: 'Documento fiscal não encontrado' })

  if (!['rascunho', 'rejeitado'].includes(doc.status)) {
    throw createError({
      statusCode: 409,
      message: `Documento no status "${doc.status}" está congelado e não pode ser editado.`
    })
  }

  // 2. Atualização de itens fiscais (tributação informada pelo operador)
  if (Array.isArray(body.items)) {
    for (const item of body.items) {
      if (!item.id) continue
      const calc = calculateItemTotals(item.quantidade, item.valor_unitario, item.valor_desconto || 0)

      await $fetch(`${config.supabaseUrl}/rest/v1/fiscal_document_items?id=eq.${item.id}&fiscal_document_id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: {
          ncm: item.ncm !== undefined ? item.ncm : undefined,
          cest: item.cest !== undefined ? item.cest : undefined,
          cfop: item.cfop !== undefined ? item.cfop : undefined,
          cst_icms: item.cst_icms !== undefined ? item.cst_icms : undefined,
          csosn: item.csosn !== undefined ? item.csosn : undefined,
          codigo_servico_lc116: item.codigo_servico_lc116 !== undefined ? item.codigo_servico_lc116 : undefined,
          codigo_tributacao_municipio: item.codigo_tributacao_municipio !== undefined ? item.codigo_tributacao_municipio : undefined,
          aliquota_iss: item.aliquota_iss !== undefined ? item.aliquota_iss : undefined,
          iss_retido: item.iss_retido !== undefined ? Boolean(item.iss_retido) : undefined,
          cClassTrib: item.cClassTrib !== undefined ? item.cClassTrib : undefined,
          aliquota_ibs: item.aliquota_ibs !== undefined ? item.aliquota_ibs : undefined,
          aliquota_cbs: item.aliquota_cbs !== undefined ? item.aliquota_cbs : undefined,
          valor_desconto: calc.valor_desconto,
          valor_liquido: calc.valor_liquido
        }
      })
    }

    // Recalcula totais com itens atualizados
    const currentItems = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/fiscal_document_items?fiscal_document_id=eq.${id}`,
      { headers }
    )
    const docTotals = calculateDocumentTotals(currentItems)

    await $fetch(`${config.supabaseUrl}/rest/v1/fiscal_documents?id=eq.${id}`, {
      method: 'PATCH',
      headers,
      body: {
        ...docTotals,
        snapshot_itens: currentItems,
        updated_by: admin.userId,
        updated_at: new Date().toISOString()
      }
    })
  }

  return { success: true, message: 'Documento fiscal atualizado com sucesso' }
})
