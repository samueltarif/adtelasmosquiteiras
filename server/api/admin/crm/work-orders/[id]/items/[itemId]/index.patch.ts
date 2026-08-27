import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../../utils/adminAuth'
import {
  getSupabaseHeaders,
  ALLOWED_OS_CATEGORIAS
} from '../../../../../../../utils/crm'

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

  const body = await readBody(event).catch(() => ({}))
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
  if (['concluida', 'cancelada'].includes(wo.status_os)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Não é possível editar itens em uma ordem de serviço '${wo.status_os}'`
    })
  }

  // 2. Busca item existente e valida propriedade
  const itemList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_order_items?id=eq.${itemId}&work_order_id=eq.${id}&select=*`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(itemList) || itemList.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item não encontrado nesta ordem de serviço'
    })
  }

  const currentItem = itemList[0]

  // 3. Concorrência otimista no item (expected_updated_at)
  if (body.expected_updated_at && typeof body.expected_updated_at === 'string') {
    const currentTs = new Date(currentItem.updated_at).getTime()
    const expectedTs = new Date(body.expected_updated_at).getTime()
    if (Math.abs(currentTs - expectedTs) > 1000) {
      throw createError({
        statusCode: 409,
        statusMessage: 'ITEM_STALE_VERSION: O item foi modificado por outro usuário. Recarregue a página.'
      })
    }
  }

  const updates: Record<string, any> = {}

  if (body.descricao !== undefined) {
    if (!body.descricao || typeof body.descricao !== 'string' || body.descricao.trim().length < 2) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Descrição do item deve conter no mínimo 2 caracteres'
      })
    }
    updates.descricao = body.descricao.trim()
  }

  if (body.categoria_operacional !== undefined) {
    if (!ALLOWED_OS_CATEGORIAS.includes(body.categoria_operacional)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Categoria operacional inválida. Permitidas: ${ALLOWED_OS_CATEGORIAS.join(', ')}`
      })
    }
    updates.categoria_operacional = body.categoria_operacional
  }

  if (body.quantidade !== undefined) {
    const qtd = parseInt(String(body.quantidade), 10)
    if (isNaN(qtd) || qtd <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Quantidade deve ser maior que zero'
      })
    }
    updates.quantidade = qtd
  }

  if (body.preco_unitario !== undefined) {
    const preco = Number(body.preco_unitario)
    if (isNaN(preco) || preco < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Preço unitário não pode ser negativo'
      })
    }
    updates.preco_unitario = preco
  }

  if (body.service_key !== undefined) {
    updates.service_key = body.service_key ? String(body.service_key).trim() : null
  }

  if (body.observacoes !== undefined) {
    updates.observacoes = body.observacoes ? String(body.observacoes).trim() : null
  }

  if (body.sort_order !== undefined) {
    updates.sort_order = parseInt(String(body.sort_order), 10) || 0
  }

  if (Object.keys(updates).length === 0) {
    return {
      success: true,
      item: currentItem
    }
  }

  try {
    const patchedRes = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_order_items?id=eq.${itemId}`,
      {
        method: 'PATCH',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: updates
      }
    )

    const updatedItem = patchedRes && patchedRes[0] ? patchedRes[0] : { ...currentItem, ...updates }

    // 4. Reconciliação dos totais recalculados da OS
    const updatedWoList = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&select=valor_total,valor_desconto,valor_final,updated_at`,
      { headers }
    )
    const totals = updatedWoList && updatedWoList[0] ? updatedWoList[0] : null

    return {
      success: true,
      item: updatedItem,
      workOrderTotals: totals
    }
  } catch (err: any) {
    console.error('[WorkOrderItemPatch] Erro ao editar item:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao atualizar dados do item'
    })
  }
})
