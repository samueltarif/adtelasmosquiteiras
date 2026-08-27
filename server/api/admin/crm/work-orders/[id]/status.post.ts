import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import {
  getSupabaseHeaders,
  logCrmActivity,
  isValidStatusTransition,
  TERMINAL_WORK_ORDER_STATUSES,
  ALLOWED_WORK_ORDER_STATUSES
} from '../../../../../utils/crm'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
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
  const newStatus = body.newStatus ? String(body.newStatus).trim() : ''

  if (!newStatus || !ALLOWED_WORK_ORDER_STATUSES.includes(newStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Status inválido. Permitidos: ${ALLOWED_WORK_ORDER_STATUSES.join(', ')}`
    })
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
  const currentStatus = currentWo.status_os

  // 2. Concorrência Otimista
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

  // 3. Validação de Terminalidade
  if (TERMINAL_WORK_ORDER_STATUSES.includes(currentStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: `A ordem de serviço está no status terminal '${currentStatus}' e não pode ser reaberta ou alterada.`
    })
  }

  // 4. Validação da Máquina de Estados
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Transição de status inválida: não é permitido alterar de '${currentStatus}' para '${newStatus}'.`
    })
  }

  const updates: Record<string, any> = {
    status_os: newStatus
  }

  // 4b. Reabertura (aprovada -> orcamento): limpa accepted_proposal_id da OS preservando a proposta histórica
  if (currentStatus === 'aprovada' && newStatus === 'orcamento') {
    updates.accepted_proposal_id = null
  }

  // 5. Regra para status 'agendada': data_prevista obrigatória
  if (newStatus === 'agendada') {
    const dataPrevista = body.dataPrevista ? String(body.dataPrevista).trim() : currentWo.data_prevista
    if (!dataPrevista) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Para definir o status como Agendada, a data prevista da instalação deve ser informada.'
      })
    }
    if (body.dataPrevista) {
      updates.data_prevista = dataPrevista
    }
  }

  // 6. Regra para status 'concluida': data_conclusao automática no timezone de São Paulo
  if (newStatus === 'concluida') {
    const nowSp = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date()) // Retorna YYYY-MM-DD
    updates.data_conclusao = nowSp
  }

  // 7. Regra para status 'cancelada': Justificativa obrigatória em crm_notes
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
      const notePayload = {
        client_id: currentWo.client_id,
        work_order_id: currentWo.id,
        categoria: 'atendimento',
        conteudo: `Cancelamento da OS: ${reason}`,
        author_id: admin.userId || null
      }

      const noteRes = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/crm_notes`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: notePayload
      })

      if (Array.isArray(noteRes) && noteRes.length > 0) {
        reasonNoteId = noteRes[0].id
      }
    } catch (noteErr: any) {
      console.warn('[StatusMutation] Falha ao registrar nota de cancelamento:', noteErr?.message || noteErr)
      // Prossegue mantendo auditoria
    }
  }

  // 8. Executa a mutação do status no banco
  let updatedWo: any = null
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

    updatedWo = patched && patched[0] ? patched[0] : { ...currentWo, ...updates }
  } catch (err: any) {
    console.error('[StatusMutation] Erro ao atualizar status da OS:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao atualizar status da ordem de serviço'
    })
  }

  // 9. Registro de Auditoria no Activity Log
  try {
    let actionName = 'work_order_status_changed'
    let humanDesc = `Status da OS ${currentWo.numero_os} alterado de '${currentStatus}' para '${newStatus}'`

    if (newStatus === 'concluida') {
      actionName = 'work_order_completed'
      humanDesc = `Ordem de Serviço ${currentWo.numero_os} concluída com sucesso`
    } else if (newStatus === 'cancelada') {
      actionName = 'work_order_cancelled'
      humanDesc = `Ordem de Serviço ${currentWo.numero_os} cancelada`
    }

    const activityPayload: Record<string, any> = {
      status_anterior: currentStatus,
      status_novo: newStatus
    }

    if (reasonNoteId) {
      activityPayload.reason_note_id = reasonNoteId
      activityPayload.reason_recorded = true
    }

    await logCrmActivity(config, {
      clientId: currentWo.client_id,
      workOrderId: currentWo.id,
      entityType: 'work_order',
      entityId: currentWo.id,
      acao: actionName,
      descricaoHumana: humanDesc,
      dadosAnteriores: { status_os: currentStatus },
      dadosNovos: activityPayload,
      actorId: admin.userId
    })
  } catch (logErr: any) {
    console.error('[StatusMutation] AUDIT_LOG_WRITE_FAILED_AFTER_MUTATION:', logErr?.message || logErr)
  }

  return {
    success: true,
    workOrder: updatedWo
  }
})
