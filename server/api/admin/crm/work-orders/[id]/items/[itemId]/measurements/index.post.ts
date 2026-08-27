import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../../../utils/adminAuth'
import {
  getSupabaseHeaders,
  ALLOWED_VAO_TIPOS,
  isValidDimensionMm
} from '../../../../../../../../utils/crm'

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
      statusMessage: `Não é possível adicionar medições a uma ordem de serviço '${wo.status_os}'`
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

  // 3. Validação dos campos da medição
  if (!body.ambiente || typeof body.ambiente !== 'string' || body.ambiente.trim().length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ambiente é obrigatório e deve ter no mínimo 2 caracteres'
    })
  }

  const tipoVao = body.tipo_vao || 'janela'
  if (!ALLOWED_VAO_TIPOS.includes(tipoVao)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Tipo de vão inválido. Permitidos: ${ALLOWED_VAO_TIPOS.join(', ')}`
    })
  }

  const larguraMm = parseInt(String(body.largura_mm), 10)
  if (!isValidDimensionMm(larguraMm)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Largura (mm) deve ser um número inteiro positivo em milímetros'
    })
  }

  const alturaMm = parseInt(String(body.altura_mm), 10)
  if (!isValidDimensionMm(alturaMm)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Altura (mm) deve ser um número inteiro positivo em milímetros'
    })
  }

  const quantidade = parseInt(String(body.quantidade || '1'), 10)
  if (isNaN(quantidade) || quantidade <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Quantidade deve ser maior que zero'
    })
  }

  const measurementPayload = {
    work_order_item_id: itemId,
    ambiente: body.ambiente.trim(),
    tipo_vao: tipoVao,
    largura_mm: larguraMm,
    altura_mm: alturaMm,
    quantidade,
    cor_estrutura: body.cor_estrutura ? String(body.cor_estrutura).trim() : 'Branco',
    tipo_material: body.tipo_material ? String(body.tipo_material).trim() : null,
    observacoes: body.observacoes ? String(body.observacoes).trim() : null,
    sort_order: parseInt(String(body.sort_order || '0'), 10) || 0
  }

  try {
    const createdRes = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_order_measurements`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: measurementPayload
      }
    )

    const measurement = createdRes && createdRes[0] ? createdRes[0] : null

    return {
      success: true,
      measurement
    }
  } catch (err: any) {
    console.error('[MeasurementCreate] Erro ao adicionar medição:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao adicionar medição técnica'
    })
  }
})
