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

  const id = getRouterParam(event, 'id')
  const itemId = getRouterParam(event, 'itemId')
  if (!id || !itemId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID da OS e ID do item são obrigatórios'
    })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Validação de estado da OS
  const woList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&select=id,status_os,valor_total,valor_desconto,valor_final`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(woList) || woList.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ordem de serviço não encontrada'
    })
  }

  const wo = woList[0]
  if (['em_execucao', 'concluida', 'cancelada'].includes(wo.status_os)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Não é permitida a exclusão de itens no status '${wo.status_os}'`
    })
  }

  // 2. Valida se o item pertence à OS
  const itemCheck = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_order_items?id=eq.${itemId}&work_order_id=eq.${id}&select=id`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(itemCheck) || itemCheck.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item não encontrado nesta ordem de serviço'
    })
  }

  try {
    // 3. Exclusão do item (o PostgreSQL executa CASCADE em work_order_measurements e SET NULL em work_order_media)
    await $fetch(
      `${config.supabaseUrl}/rest/v1/work_order_items?id=eq.${itemId}`,
      {
        method: 'DELETE',
        headers
      }
    )

    // 4. Reconciliação dos totais da OS recalculados pelo trigger do banco
    const updatedWoList = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&select=valor_total,valor_desconto,valor_final,updated_at`,
      { headers }
    )
    const totals = updatedWoList && updatedWoList[0] ? updatedWoList[0] : null

    return {
      success: true,
      workOrderTotals: totals
    }
  } catch (err: any) {
    console.error('[WorkOrderItemDelete] Erro ao deletar item:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao excluir item da ordem de serviço'
    })
  }
})
