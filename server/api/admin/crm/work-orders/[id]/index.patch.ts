/**
 * PATCH /api/admin/crm/work-orders/:id
 * Atualização de dados cadastrais da Ordem de Serviço com Concorrência Atômica CAS.
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth.ts'
import { getSupabaseHeaders, isValidDiscount } from '../../../../../utils/crm.ts'
import { isValidUUID, isValidRfc3339, isStrictBoolean } from '../../../../../shared/appointmentValidation.mjs'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || !isValidUUID(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID da ordem de serviço inválido: formato UUID esperado.' })
  }

  const body = await readBody(event).catch(() => ({}))

  if (body.status_os !== undefined || body.status !== undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Alteração de status deve ser realizada através do endpoint dedicado /api/admin/crm/work-orders/:id/status'
    })
  }

  if (body.data_prevista !== undefined || body.dataPrevista !== undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ERR_DATA_PREVISTA_MANAGED_BY_AGENDA: A data prevista de instalação é gerenciada automaticamente pela Agenda através de agendamentos.',
      data: { error: { code: 'ERR_DATA_PREVISTA_MANAGED_BY_AGENDA', message: 'A data prevista de instalação é gerenciada automaticamente pela Agenda através de agendamentos.' } }
    })
  }

  // Concorrência Otimista Obrigatória Atômica
  const rawExpectedUpdated = body.expected_updated_at || body.expectedUpdatedAt
  if (!rawExpectedUpdated || typeof rawExpectedUpdated !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'O campo "expected_updated_at" é obrigatório para controle de concorrência.' })
  }

  if (!isValidRfc3339(rawExpectedUpdated)) {
    throw createError({ statusCode: 400, statusMessage: 'expected_updated_at deve ser um timestamp RFC3339 válido com timezone explícito.' })
  }

  const forbiddenFields = ['numero_os', 'client_id', 'valor_total', 'valor_final', 'created_by', 'created_at', 'data_conclusao']
  for (const field of forbiddenFields) {
    if (body[field] !== undefined) {
      throw createError({ statusCode: 400, statusMessage: `O campo '${field}' não pode ser alterado diretamente` })
    }
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)
  const currentList = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&select=*`, { headers }).catch(() => [])
  if (!Array.isArray(currentList) || currentList.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Ordem de serviço não encontrada' })
  }

  const currentWo = currentList[0]
  if (currentWo.is_archived && body.is_archived !== false) {
    throw createError({ statusCode: 400, statusMessage: 'Não é permitido alterar uma ordem de serviço arquivada.' })
  }

  const updates: Record<string, any> = {}

  if (body.responsible_staff_id !== undefined) {
    if (body.responsible_staff_id === null || body.responsible_staff_id === '') {
      updates.responsible_staff_id = null
    } else {
      const staffId = String(body.responsible_staff_id).trim()
      if (!isValidUUID(staffId)) {
        throw createError({ statusCode: 400, statusMessage: 'responsible_staff_id deve ser um UUID válido.' })
      }
      const staffCheck = await $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/crm_staff?id=eq.${staffId}&is_active=eq.true&select=id`,
        { headers }
      ).catch(() => [])
      if (!staffCheck || staffCheck.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'O responsável técnico informado não está ativo ou não foi encontrado' })
      }
      updates.responsible_staff_id = staffId
    }
  }

  if (body.valor_desconto !== undefined) {
    const desconto = Number(body.valor_desconto)
    const valorTotal = Number(currentWo.valor_total) || 0
    if (!isValidDiscount(desconto, valorTotal)) {
      throw createError({ statusCode: 400, statusMessage: `Valor de desconto inválido. Deve ser entre R$ 0,00 e o valor total (R$ ${valorTotal.toFixed(2)})` })
    }
    updates.valor_desconto = desconto
  }

  if (body.proposal_issued_at !== undefined) updates.proposal_issued_at = body.proposal_issued_at ? String(body.proposal_issued_at).trim() : null
  if (body.proposal_valid_until !== undefined) updates.proposal_valid_until = body.proposal_valid_until ? String(body.proposal_valid_until).trim() : null
  if (body.observacoes_gerais !== undefined) updates.observacoes_gerais = body.observacoes_gerais ? String(body.observacoes_gerais).trim() : null
  if (body.is_archived !== undefined) {
    if (!isStrictBoolean(body.is_archived)) {
      throw createError({ statusCode: 400, statusMessage: 'O campo is_archived deve ser um booleano estrito (true ou false).' })
    }
    updates.is_archived = body.is_archived
    updates.archived_at = body.is_archived ? new Date().toISOString() : null
  }

  if (Object.keys(updates).length === 0) {
    return { success: true, workOrder: currentWo }
  }

  // ATOMIC COMPARE-AND-SET (CAS): Match by both id AND updated_at
  try {
    const patched = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&updated_at=eq.${encodeURIComponent(rawExpectedUpdated)}`,
      {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: updates
      }
    )

    if (!Array.isArray(patched) || patched.length === 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'WORK_ORDER_STALE_VERSION: A ordem de serviço foi modificada por outro usuário. Recarregue a página.'
      })
    }

    return { success: true, workOrder: patched[0] }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('[WorkOrderPatch] Mutation failure:', err?.statusCode || 'unknown')
    throw createError({ statusCode: 500, statusMessage: 'Falha ao atualizar dados da ordem de serviço' })
  }
})
