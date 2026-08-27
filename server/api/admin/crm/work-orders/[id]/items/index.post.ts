import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../utils/adminAuth'
import {
  getSupabaseHeaders,
  ALLOWED_OS_CATEGORIAS
} from '../../../../../../utils/crm'

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

  const body = await readBody(event).catch(() => ({}))
  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Validação de estado da OS
  const woList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&select=id,status_os,client_id,valor_total,valor_desconto,valor_final,updated_at`,
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
      statusMessage: `Não é possível adicionar itens a uma ordem de serviço '${wo.status_os}'`
    })
  }

  // 2. Validação dos campos do item
  if (!body.descricao || typeof body.descricao !== 'string' || body.descricao.trim().length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Descrição do item deve conter no mínimo 2 caracteres'
    })
  }

  const categoria = body.categoria_operacional || 'outro'
  if (!ALLOWED_OS_CATEGORIAS.includes(categoria)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Categoria operacional inválida. Permitidas: ${ALLOWED_OS_CATEGORIAS.join(', ')}`
    })
  }

  const quantidade = parseInt(String(body.quantidade || '1'), 10)
  if (isNaN(quantidade) || quantidade <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Quantidade deve ser um número inteiro positivo'
    })
  }

  const precoUnitario = Number(body.preco_unitario || 0)
  if (isNaN(precoUnitario) || precoUnitario < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Preço unitário não pode ser negativo'
    })
  }

  const itemPayload = {
    work_order_id: id,
    service_key: body.service_key ? String(body.service_key).trim() : null,
    categoria_operacional: categoria,
    descricao: body.descricao.trim(),
    quantidade,
    preco_unitario: precoUnitario,
    observacoes: body.observacoes ? String(body.observacoes).trim() : null,
    sort_order: parseInt(String(body.sort_order || '0'), 10) || 0
  }

  try {
    const createdItemRes = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_order_items`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: itemPayload
      }
    )

    const createdItem = createdItemRes && createdItemRes[0] ? createdItemRes[0] : null

    // 3. Reconciliação dos totais da OS recalculados pelo trigger do banco
    const updatedWoList = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&select=valor_total,valor_desconto,valor_final,updated_at`,
      { headers }
    )

    const totals = updatedWoList && updatedWoList[0] ? updatedWoList[0] : null

    return {
      success: true,
      item: createdItem,
      workOrderTotals: totals
    }
  } catch (err: any) {
    console.error('[WorkOrderItemCreate] Erro ao adicionar item:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao adicionar item na ordem de serviço'
    })
  }
})
