import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../../../../utils/adminAuth'
import {
  getSupabaseHeaders,
  ALLOWED_VAO_TIPOS,
  isValidDimensionMm
} from '../../../../../../../../../utils/crm'

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

  const body = await readBody(event).catch(() => ({}))
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
      statusMessage: `Não é possível editar medições em uma ordem de serviço '${wo.status_os}'`
    })
  }

  // 2. Busca medição existente e valida relacionamento
  const mList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_order_measurements?id=eq.${measurementId}&work_order_item_id=eq.${itemId}&select=*`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(mList) || mList.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Medição não encontrada para este item'
    })
  }

  const currentM = mList[0]

  // 3. Concorrência otimista na medição (expected_updated_at)
  if (body.expected_updated_at && typeof body.expected_updated_at === 'string') {
    const currentTs = new Date(currentM.updated_at).getTime()
    const expectedTs = new Date(body.expected_updated_at).getTime()
    if (Math.abs(currentTs - expectedTs) > 1000) {
      throw createError({
        statusCode: 409,
        statusMessage: 'MEASUREMENT_STALE_VERSION: A medição foi modificada por outro usuário. Recarregue a página.'
      })
    }
  }

  const updates: Record<string, any> = {}

  if (body.ambiente !== undefined) {
    if (!body.ambiente || typeof body.ambiente !== 'string' || body.ambiente.trim().length < 2) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ambiente deve ter no mínimo 2 caracteres'
      })
    }
    updates.ambiente = body.ambiente.trim()
  }

  if (body.tipo_vao !== undefined) {
    if (!ALLOWED_VAO_TIPOS.includes(body.tipo_vao)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Tipo de vão inválido. Permitidos: ${ALLOWED_VAO_TIPOS.join(', ')}`
      })
    }
    updates.tipo_vao = body.tipo_vao
  }

  if (body.largura_mm !== undefined) {
    const largura = parseInt(String(body.largura_mm), 10)
    if (!isValidDimensionMm(largura)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Largura (mm) deve ser um número inteiro positivo'
      })
    }
    updates.largura_mm = largura
  }

  if (body.altura_mm !== undefined) {
    const altura = parseInt(String(body.altura_mm), 10)
    if (!isValidDimensionMm(altura)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Altura (mm) deve ser um número inteiro positivo'
      })
    }
    updates.altura_mm = altura
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

  if (body.cor_estrutura !== undefined) {
    updates.cor_estrutura = body.cor_estrutura ? String(body.cor_estrutura).trim() : 'Branco'
  }

  if (body.tipo_material !== undefined) {
    updates.tipo_material = body.tipo_material ? String(body.tipo_material).trim() : null
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
      measurement: currentM
    }
  }

  try {
    const patchedRes = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_order_measurements?id=eq.${measurementId}`,
      {
        method: 'PATCH',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: updates
      }
    )

    const updatedM = patchedRes && patchedRes[0] ? patchedRes[0] : { ...currentM, ...updates }

    return {
      success: true,
      measurement: updatedM
    }
  } catch (err: any) {
    console.error('[MeasurementPatch] Erro ao editar medição:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao atualizar dados da medição técnica'
    })
  }
})
