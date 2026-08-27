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

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID da ordem de serviço é obrigatório'
    })
  }

  const selectFields = 'id,work_order_id,service_key,categoria_operacional,descricao,quantidade,preco_unitario,preco_total,observacoes,sort_order,created_at,updated_at,measurements:work_order_measurements(*)'

  try {
    const items = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_order_items?work_order_id=eq.${id}&select=${selectFields}&order=sort_order.asc,created_at.asc`,
      {
        headers: getSupabaseHeaders(config.supabaseServiceRoleKey)
      }
    )

    return {
      items: Array.isArray(items) ? items : []
    }
  } catch (err: any) {
    console.error('[WorkOrderItemsList] Erro ao listar itens da OS:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao listar itens da ordem de serviço'
    })
  }
})
