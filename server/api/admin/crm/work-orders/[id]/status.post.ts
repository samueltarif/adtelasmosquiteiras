import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import {
  getSupabaseHeaders,
  logCrmActivity,
  isValidStatusTransition,
  TERMINAL_WORK_ORDER_STATUSES,
  ALLOWED_WORK_ORDER_STATUSES
} from '../../../../../utils/crm'
import { hasActiveInstallation } from '../../../../../utils/crmAppointmentHelpers'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID da ordem de serviço é obrigatório' })
  }

  const body = await readBody(event).catch(() => ({}))
  const newStatus = body.newStatus ? String(body.newStatus).trim() : ''

  if (!newStatus || !ALLOWED_WORK_ORDER_STATUSES.includes(newStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Status inválido. Permitidos: ${ALLOWED_WORK_ORDER_STATUSES.join(', ')}`
    })
  }

  if (newStatus === 'agendada') {
    throw createError({
      statusCode: 400,
      statusMessage: 'ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED: Para agendar uma OS, crie um agendamento do tipo instalação na Agenda.',
      data: {
        error: {
          code: 'ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED',
          message: 'Para agendar uma OS, crie um agendamento do tipo instalação na Agenda.'
        }
      }
    })
  }

  if (body.dataPrevista !== undefined || body.data_prevista !== undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ERR_DATA_PREVISTA_MANAGED_BY_AGENDA: A data prevista de instalação é gerenciada automaticamente pela Agenda através de agendamentos.',
      data: {
        error: {
          code: 'ERR_DATA_PREVISTA_MANAGED_BY_AGENDA',
          message: 'A data prevista de instalação é gerenciada automaticamente pela Agenda através de agendamentos.'
        }
      }
    })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)
  const currentList = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&select=*`, { headers }).catch(() => [])
  if (!Array.isArray(currentList) || currentList.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Ordem de serviço não encontrada' })
  }

  const currentWo = currentList[0]
  const currentStatus = currentWo.status_os

  if (body.expectedUpdatedAt && typeof body.expectedUpdatedAt === 'string') {
    const currentTs = new Date(currentWo.updated_at).getTime()
    const expectedTs = new Date(body.expectedUpdatedAt).getTime()
    if (Math.abs(currentTs - expectedTs) > 1000) {
      throw createError({
        statusCode: 409,
        statusMessage: 'WORK_ORDER_STALE_VERSION: A ordem de serviço foi modificada por outro usuário. Recarregue a página.'
      })
    }
  }

  if (TERMINAL_WORK_ORDER_STATUSES.includes(currentStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: `A ordem de serviço está no status terminal '${currentStatus}' e não pode ser reaberta ou alterada.`
    })
  }

  if (currentStatus === 'agendada' && newStatus === 'aguardando_agendamento') {
    const activeInst = await hasActiveInstallation({ url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey }, id)
    if (activeInst) {
      throw createError({
        statusCode: 409,
        statusMessage: 'ERR_ACTIVE_INSTALLATION_EXISTS: Não é possível regredir manualmente o status para aguardando_agendamento enquanto houver um agendamento de instalação ativo.',
        data: {
          error: {
            code: 'ERR_ACTIVE_INSTALLATION_EXISTS',
            message: 'Não é possível regredir manualmente o status para aguardando_agendamento enquanto houver um agendamento de instalação ativo. Cancele ou reagende o compromisso na Agenda.'
          }
        }
      })
    }
  }

  if (!isValidStatusTransition(currentStatus, newStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Transição de status inválida: não é permitido alterar de '${currentStatus}' para '${newStatus}'.`
    })
  }

  const updates: Record<string, any> = { status_os: newStatus }
  if (currentStatus === 'aprovada' && newStatus === 'orcamento') {
    updates.accepted_proposal_id = null
  }

  if (newStatus === 'concluida') {
    const nowSp = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date())
    updates.data_conclusao = nowSp
  }

  let reasonNoteId: string | null = null
  if (newStatus === 'cancelada') {
    const reason = body.reason ? String(body.reason).trim() : ''
    if (!reason || reason.length < 3) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Justificativa do cancelamento é obrigatória (mínimo 3 caracteres).'
      })
    }

    try {
      const noteRes = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/crm_notes`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: {
          client_id: currentWo.client_id,
          work_order_id: currentWo.id,
          categoria: 'atendimento',
          conteudo: `Cancelamento da OS: ${reason}`,
          author_id: admin.userId || null
        }
      })
      if (Array.isArray(noteRes) && noteRes.length > 0) {
        reasonNoteId = noteRes[0].id
      }
    } catch (noteErr: any) {
      console.warn('[WorkOrderStatus] Falha ao registrar justificativa em crm_notes:', noteErr?.message || noteErr)
    }
  }

  try {
    const patched = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: updates
    })
    const updatedWo = patched && patched[0] ? patched[0] : currentWo

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
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('[WorkOrderStatus] Erro ao atualizar status:', err?.message || err)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao atualizar status da ordem de serviço' })
  }
})
