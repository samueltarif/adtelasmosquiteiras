import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import {
  getSupabaseHeaders,
  isValidDiscount
} from '../../../../../utils/crm'

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

  // Rejeição estrita de status_os no PATCH geral (deve usar endpoint dedicado de status)
  if (body.status_os !== undefined || body.status !== undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Alteração de status deve ser realizada através do endpoint dedicado /api/admin/crm/work-orders/:id/status'
    })
  }

  // Rejeição de campos imutáveis/gerados
  const forbiddenFields = ['numero_os', 'client_id', 'valor_total', 'valor_final', 'created_by', 'created_at', 'data_conclusao']
  for (const field of forbiddenFields) {
    if (body[field] !== undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: `O campo '${field}' não pode ser alterado diretamente`
      })
    }
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Busca estado atual da OS
  const currentList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&select=*`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(currentList) || currentList.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ordem de serviço não encontrada'
    })
  }

  const currentWo = currentList[0]

  // 2. Concorrência Otimista (expected_updated_at)
  if (body.expected_updated_at && typeof body.expected_updated_at === 'string') {
    const currentTs = new Date(currentWo.updated_at).getTime()
    const expectedTs = new Date(body.expected_updated_at).getTime()
    if (Math.abs(currentTs - expectedTs) > 1000) {
      throw createError({
        statusCode: 409,
        statusMessage: 'WORK_ORDER_STALE_VERSION: A ordem de serviço foi modificada por outro usuário. Recarregue a página.'
      })
    }
  }

  const updates: Record<string, any> = {}

  // 3. Validação de Endereço
  if (body.address_id !== undefined) {
    if (!['orcamento', 'aprovada', 'aguardando_agendamento', 'agendada'].includes(currentWo.status_os)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Endereço não pode ser alterado no status '${currentWo.status_os}'`
      })
    }

    if (body.address_id === null || body.address_id === '') {
      updates.address_id = null
    } else {
      const addressId = String(body.address_id).trim()
      const addrCheck = await $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/client_addresses?id=eq.${addressId}&client_id=eq.${currentWo.client_id}&select=id`,
        { headers }
      ).catch(() => [])

      if (!addrCheck || addrCheck.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'O endereço informado não pertence ao cliente desta ordem de serviço'
        })
      }
      updates.address_id = addressId
    }
  }

  // 4. Validação de Responsável Técnico
  if (body.responsible_staff_id !== undefined) {
    if (body.responsible_staff_id === null || body.responsible_staff_id === '') {
      updates.responsible_staff_id = null
    } else {
      const staffId = String(body.responsible_staff_id).trim()
      const staffCheck = await $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/crm_staff?id=eq.${staffId}&is_active=eq.true&select=id`,
        { headers }
      ).catch(() => [])

      if (!staffCheck || staffCheck.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'O responsável técnico informado não está ativo ou não foi encontrado'
        })
      }
      updates.responsible_staff_id = staffId
    }
  }

  // 5. Validação de Desconto
  if (body.valor_desconto !== undefined) {
    const desconto = Number(body.valor_desconto)
    const valorTotal = Number(currentWo.valor_total) || 0
    if (!isValidDiscount(desconto, valorTotal)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Valor de desconto inválido. Deve ser entre R$ 0,00 e o valor total (R$ ${valorTotal.toFixed(2)})`
      })
    }
    updates.valor_desconto = desconto
  }

  // 6. Outros campos permitidos
  if (body.data_prevista !== undefined) {
    updates.data_prevista = body.data_prevista ? String(body.data_prevista).trim() : null
  }
  if (body.proposal_issued_at !== undefined) {
    updates.proposal_issued_at = body.proposal_issued_at ? String(body.proposal_issued_at).trim() : null
  }
  if (body.proposal_valid_until !== undefined) {
    updates.proposal_valid_until = body.proposal_valid_until ? String(body.proposal_valid_until).trim() : null
  }
  if (body.observacoes_gerais !== undefined) {
    updates.observacoes_gerais = body.observacoes_gerais ? String(body.observacoes_gerais).trim() : null
  }
  if (body.is_archived !== undefined) {
    const isArchived = Boolean(body.is_archived)
    updates.is_archived = isArchived
    updates.archived_at = isArchived ? new Date().toISOString() : null
  }

  if (Object.keys(updates).length === 0) {
    return {
      success: true,
      workOrder: currentWo
    }
  }

  try {
    const patched = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: updates
      }
    )

    const updatedWo = patched && patched[0] ? patched[0] : currentWo

    return {
      success: true,
      workOrder: updatedWo
    }
  } catch (err: any) {
    console.error('[WorkOrderPatch] Erro ao atualizar OS:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao atualizar dados da ordem de serviço'
    })
  }
})
