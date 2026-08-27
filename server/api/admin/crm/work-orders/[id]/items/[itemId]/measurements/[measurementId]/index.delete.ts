import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../../../../../utils/crm'

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
  const measurementId = getRouterParam(event, 'measurementId')
  if (!id || !itemId || !measurementId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'IDs de OS, item e medição são obrigatórios'
    })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Validação de estado da OS
  const woList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&select=id,status_os`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(woList) || woList.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ordem de serviço não encontrada'
    })
  }

  const wo = woList[0]
  if (['concluida', 'cancelada'].includes(wo.status_os)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Não é permitida a exclusão de medições no status '${wo.status_os}'`
    })
  }

  // 2. Valida existência da medição para o item
  const mCheck = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_order_measurements?id=eq.${measurementId}&work_order_item_id=eq.${itemId}&select=id`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(mCheck) || mCheck.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Medição não encontrada para este item'
    })
  }

  try {
    await $fetch(
      `${config.supabaseUrl}/rest/v1/work_order_measurements?id=eq.${measurementId}`,
      {
        method: 'DELETE',
        headers
      }
    )

    return { success: true }
  } catch (err: any) {
    console.error('[MeasurementDelete] Erro ao deletar medição:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao excluir medição técnica'
    })
  }
})
