/**
 * POST /api/admin/crm/work-orders/:id/status
 * Transição de Status da Ordem de Serviço com Concorrência Atômica CAS e Prevenção Preventiva.
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth.ts'
import {
  getSupabaseHeaders,
  logCrmActivity,
  isValidStatusTransition,
  TERMINAL_WORK_ORDER_STATUSES,
  ALLOWED_WORK_ORDER_STATUSES
} from '../../../../../utils/crm.ts'
import { isValidRfc3339, isValidUUID } from '../../../../../shared/appointmentValidation.mjs'
import { hasActiveInstallation, hasAnyActiveAppointment } from '../../../../../utils/crmAppointmentHelpers.ts'
import { handleRpcError } from '../../../../../utils/crmAppointmentErrors.ts'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || !isValidUUID(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID da ordem de serviço inválido: formato UUID esperado.' })
  }

  const body = await readBody(event).catch(() => ({}))
  const newStatus = body.newStatus || body.status

  if (!newStatus || !ALLOWED_WORK_ORDER_STATUSES.includes(newStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Status inválido. Status permitidos: ${ALLOWED_WORK_ORDER_STATUSES.join(', ')}`
    })
  }

  if (newStatus === 'agendada') {
    throw createError({
      statusCode: 400,
      statusMessage: 'ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED: O status "agendada" é gerenciado automaticamente pela Agenda através de agendamentos.',
      data: { error: { code: 'ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED', message: 'O status "agendada" é gerenciado automaticamente pela Agenda através de agendamentos. Utilize o módulo de Agenda para agendar instalações.' } }
    })
  }

  const rawExpectedUpdated = body.expected_updated_at || body.expectedUpdatedAt
  if (!rawExpectedUpdated || typeof rawExpectedUpdated !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'O campo "expected_updated_at" é obrigatório para controle de concorrência.' })
  }

  if (!isValidRfc3339(rawExpectedUpdated)) {
    throw createError({ statusCode: 400, statusMessage: 'expected_updated_at deve ser um timestamp RFC3339 válido com timezone explícito.' })
  }

  if (newStatus === 'cancelada') {
    const reason = body.reason ? String(body.reason).trim() : ''
    if (!reason || reason.length < 3) {
      throw createError({ statusCode: 400, statusMessage: 'Justificativa do cancelamento é obrigatória (mínimo 3 caracteres).' })
    }
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)
  const currentList = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&select=*`, { headers }).catch(() => [])
  if (!Array.isArray(currentList) || currentList.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Ordem de serviço não encontrada' })
  }

  const currentWo = currentList[0]
  const currentStatus = currentWo.status_os

  if (TERMINAL_WORK_ORDER_STATUSES.includes(currentStatus)) {
    throw createError({ statusCode: 400, statusMessage: `A ordem de serviço está no status terminal '${currentStatus}' e não pode ser reaberta ou alterada.` })
  }

  if (currentStatus === 'agendada' && newStatus === 'aguardando_agendamento') {
    const activeInst = await hasActiveInstallation({ url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey }, id)
    if (activeInst) {
      throw createError({
        statusCode: 409,
        statusMessage: 'ERR_ACTIVE_INSTALLATION_EXISTS: Não é possível regredir manualmente o status para aguardando_agendamento enquanto houver um agendamento de instalação ativo.',
        data: { error: { code: 'ERR_ACTIVE_INSTALLATION_EXISTS', message: 'Não é possível regredir manualmente o status para aguardando_agendamento enquanto houver um agendamento de instalação ativo. Cancele ou reagende o compromisso na Agenda.' } }
      })
    }
  }

  if (!isValidStatusTransition(currentStatus, newStatus)) {
    throw createError({ statusCode: 400, statusMessage: `Transição de status inválida: não é permitido alterar de '${currentStatus}' para '${newStatus}'.` })
  }

  // PATCH 5.0C.4: WORK_ORDER_TERMINAL_STATUS_ACTIVE_APPOINTMENT_POLICY = BLOCK
  if (TERMINAL_WORK_ORDER_STATUSES.includes(newStatus)) {
    const hasActiveAppt = await hasAnyActiveAppointment(
      { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
      id
    )
    if (hasActiveAppt) {
      throw createError({
        statusCode: 409,
        statusMessage: 'ERR_ACTIVE_APPOINTMENTS_EXIST: Esta Ordem de Serviço possui agendamentos ativos. Finalize ou cancele os compromissos na Agenda antes de concluir ou cancelar a OS.',
        data: {
          error: {
            code: 'ERR_ACTIVE_APPOINTMENTS_EXIST',
            message: 'Esta Ordem de Serviço possui agendamentos ativos. Finalize ou cancele os compromissos na Agenda antes de concluir ou cancelar a OS.'
          }
        }
      })
    }
  }

  const updates: Record<string, any> = { status_os: newStatus }
  if (currentStatus === 'aprovada' && newStatus === 'orcamento') updates.accepted_proposal_id = null
  if (newStatus === 'concluida') {
    updates.data_conclusao = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  }

  // 1. ATOMIC COMPARE-AND-SET (CAS) FIRST: Match by id AND updated_at
  let updatedWo: any = null
  try {
    const patched = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&updated_at=eq.${encodeURIComponent(rawExpectedUpdated)}`,
      { method: 'PATCH', headers: { ...headers, 'Prefer': 'return=representation' }, body: updates }
    )

    if (!Array.isArray(patched) || patched.length === 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'WORK_ORDER_STALE_VERSION: A ordem de serviço foi modificada por outro usuário. Recarregue a página.'
      })
    }
    updatedWo = patched[0]
  } catch (err: any) {
    if (err?.statusMessage?.includes('WORK_ORDER_STALE_VERSION')) {
      throw err
    }
    handleRpcError(err)
  }

  // 2. SIDE EFFECTS ONLY AFTER WINNING CAS
  let reasonNoteId: string | null = null
  if (newStatus === 'cancelada') {
    const reason = String(body.reason).trim()
    try {
      const noteRes = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/crm_notes`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: { client_id: currentWo.client_id, work_order_id: currentWo.id, categoria: 'atendimento', conteudo: `Cancelamento da OS: ${reason}`, author_id: admin.userId || null }
      })
      if (Array.isArray(noteRes) && noteRes.length > 0) reasonNoteId = noteRes[0].id
    } catch {
      console.warn('[WorkOrderStatus] Falha ao registrar justificativa em crm_notes')
    }
  }

  await logCrmActivity(
    { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
    {
      clientId: currentWo.client_id,
      workOrderId: currentWo.id,
      entityType: 'work_order',
      entityId: currentWo.id,
      acao: newStatus === 'cancelada' ? 'work_order_cancelled' : newStatus === 'concluida' ? 'work_order_completed' : 'work_order_status_changed',
      descricaoHumana: `Status da OS ${currentWo.numero_os} alterado de '${currentStatus}' para '${newStatus}'`,
      dadosAnteriores: { status_anterior: currentStatus },
      dadosNovos: { status_novo: newStatus, reason_note_id: reasonNoteId, reason_recorded: Boolean(reasonNoteId) },
      actorId: admin.userId
    }
  )

  return { success: true, workOrder: updatedWo }
})
