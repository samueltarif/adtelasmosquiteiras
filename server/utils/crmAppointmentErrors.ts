/**
 * Mapeador Central de Erros de RPC e Banco de Dados para Agenda/Equipe
 * Arquivo: server/utils/crmAppointmentErrors.ts
 */

import { createError, H3Error } from 'h3'

interface ErrorDefinition {
  status: number
  code: string
  message: string
}

const ERROR_MAP: Record<string, ErrorDefinition> = {
  ERR_ADMIN_NOT_ACTIVE: {
    status: 403,
    code: 'ERR_ADMIN_NOT_ACTIVE',
    message: 'Administrador inativo ou sem permissão de acesso.'
  },
  ERR_WORK_ORDER_NOT_FOUND: {
    status: 404,
    code: 'ERR_WORK_ORDER_NOT_FOUND',
    message: 'Ordem de serviço não encontrada.'
  },
  ERR_APPOINTMENT_NOT_FOUND: {
    status: 404,
    code: 'ERR_APPOINTMENT_NOT_FOUND',
    message: 'Agendamento não encontrado.'
  },
  ERR_STAFF_NOT_FOUND: {
    status: 404,
    code: 'ERR_STAFF_NOT_FOUND',
    message: 'Membro da equipe operacional não encontrado.'
  },
  ERR_WORK_ORDER_ARCHIVED: {
    status: 409,
    code: 'ERR_WORK_ORDER_ARCHIVED',
    message: 'A ordem de serviço está arquivada e não permite novos agendamentos ou alterações operacionais.'
  },
  ERR_APPOINTMENT_TERMINAL: {
    status: 409,
    code: 'ERR_APPOINTMENT_TERMINAL',
    message: 'O agendamento está em estado terminal (realizado, cancelado ou reagendado) e não pode ser modificado.'
  },
  ERR_CONCURRENCY_CONFLICT: {
    status: 409,
    code: 'ERR_CONCURRENCY_CONFLICT',
    message: 'O agendamento foi modificado por outro usuário. Recarregue os dados e tente novamente.'
  },
  ERR_APPOINTMENT_STALE_VERSION: {
    status: 409,
    code: 'ERR_CONCURRENCY_CONFLICT',
    message: 'O agendamento foi modificado por outro usuário. Recarregue os dados e tente novamente.'
  },
  ERR_STAFF_SCHEDULE_CONFLICT: {
    status: 409,
    code: 'ERR_STAFF_SCHEDULE_CONFLICT',
    message: 'Conflito de agenda: o técnico já possui outro compromisso ativo no intervalo de horário selecionado.'
  },
  ERR_ACTIVE_INSTALLATION_EXISTS: {
    status: 409,
    code: 'ERR_ACTIVE_INSTALLATION_EXISTS',
    message: 'Já existe um agendamento de instalação ativo para esta Ordem de Serviço.'
  },
  ERR_STAFF_HAS_ACTIVE_APPOINTMENTS: {
    status: 409,
    code: 'ERR_STAFF_HAS_ACTIVE_APPOINTMENTS',
    message: 'Não é possível desativar o membro da equipe pois ele possui agendamentos futuros pendentes.'
  },
  ERR_ADDRESS_CLIENT_MISMATCH: {
    status: 400,
    code: 'ERR_ADDRESS_CLIENT_MISMATCH',
    message: 'O endereço selecionado não pertence ao cliente desta ordem de serviço.'
  },
  ERR_INSTALLATION_WORK_ORDER_STATUS: {
    status: 400,
    code: 'ERR_INSTALLATION_WORK_ORDER_STATUS',
    message: 'Para agendar instalação, a ordem de serviço deve estar nos status aprovada, aguardando_agendamento ou agendada.'
  },
  ERR_WARRANTY_NOT_ACTIVE: {
    status: 400,
    code: 'ERR_WARRANTY_NOT_ACTIVE',
    message: 'Para agendamento do tipo garantia, a ordem de serviço deve possuir uma garantia ativa e válida.'
  },
  ERR_INVALID_STATUS_TRANSITION: {
    status: 400,
    code: 'ERR_INVALID_STATUS_TRANSITION',
    message: 'Transição de status do agendamento inválida para o fluxo operacional.'
  },
  ERR_INVALID_APPOINTMENT_INTERVAL: {
    status: 400,
    code: 'ERR_INVALID_APPOINTMENT_INTERVAL',
    message: 'Intervalo de agendamento inválido: a data de início deve ser estritamente anterior à data de fim.'
  },
  ERR_RESCHEDULE_REASON_REQUIRED: {
    status: 400,
    code: 'ERR_RESCHEDULE_REASON_REQUIRED',
    message: 'O motivo do reagendamento é obrigatório (mínimo 3 caracteres).'
  },
  ERR_CANCEL_REASON_REQUIRED: {
    status: 400,
    code: 'ERR_CANCEL_REASON_REQUIRED',
    message: 'O motivo do cancelamento é obrigatório (mínimo 3 caracteres).'
  },
  ERR_NO_APPOINTMENT_CHANGES: {
    status: 400,
    code: 'ERR_NO_APPOINTMENT_CHANGES',
    message: 'Nenhum campo para atualização foi informado.'
  },
  ERR_DATA_PREVISTA_MANAGED_BY_AGENDA: {
    status: 400,
    code: 'ERR_DATA_PREVISTA_MANAGED_BY_AGENDA',
    message: 'A data prevista de instalação é gerenciada automaticamente pela Agenda através de agendamentos.'
  },
  ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED: {
    status: 400,
    code: 'ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED',
    message: 'Para agendar uma OS, crie um agendamento do tipo instalação na Agenda.'
  }
}

export function handleRpcError(err: any): never {
  const rawMessage = err?.data?.message || err?.message || String(err || '')
  const rawDetails = err?.data?.details || err?.details || ''
  const fullText = `${rawMessage} ${rawDetails}`

  // 1. Busca por código explícito conhecido
  for (const [key, def] of Object.entries(ERROR_MAP)) {
    if (fullText.includes(key)) {
      throw createError({
        statusCode: def.status,
        statusMessage: def.message,
        data: {
          error: {
            code: def.code,
            message: def.message
          }
        }
      })
    }
  }

  // 2. Trata SQLSTATE específico se retornado pelo PostgreSQL
  if (fullText.includes('23P01') || fullText.includes('unq_appointments_staff_active_period')) {
    const def = ERROR_MAP.ERR_STAFF_SCHEDULE_CONFLICT
    throw createError({
      statusCode: def.status,
      statusMessage: def.message,
      data: { error: { code: def.code, message: def.message } }
    })
  }

  if (fullText.includes('23505') && fullText.includes('unq_active_installation_per_wo')) {
    const def = ERROR_MAP.ERR_ACTIVE_INSTALLATION_EXISTS
    throw createError({
      statusCode: def.status,
      statusMessage: def.message,
      data: { error: { code: def.code, message: def.message } }
    })
  }

  if (fullText.includes('23503')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Violação de integridade referencial: registro associado não existe.',
      data: {
        error: {
          code: 'ERR_FOREIGN_KEY_VIOLATION',
          message: 'Registro associado não foi encontrado.'
        }
      }
    })
  }

  // 3. Fallback genérico sem vazamento de detalhes internos
  console.error('[CRM Appointment RPC Error]', rawMessage)
  throw createError({
    statusCode: err?.statusCode || 500,
    statusMessage: 'Falha ao processar operação na agenda.',
    data: {
      error: {
        code: 'ERR_INTERNAL_SERVER_ERROR',
        message: 'Ocorreu um erro ao processar a solicitação.'
      }
    }
  })
}
