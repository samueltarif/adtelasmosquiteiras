/**
 * Dicionário Canônico de Mapeamento de Erros de Domínio e Banco para CRM Agenda
 * Arquivo: server/shared/appointmentErrorMap.mjs
 *
 * PATCH 5.0C.1: Cobertura integral das exceções da Migration 012.
 */

export const APPOINTMENT_ERROR_MAP = {
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
  ERR_STAFF_INACTIVE: {
    status: 409,
    code: 'ERR_STAFF_INACTIVE',
    message: 'O membro da equipe está inativo ou indisponível.'
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
    message: 'Não é possível desativar o membro da equipe pois ele possui agendamentos ativos.'
  },
  ERR_APPOINTMENT_DRIFT: {
    status: 409,
    code: 'ERR_APPOINTMENT_DRIFT',
    message: 'Inconsistência de integridade detectada no agendamento. Recarregue os dados.'
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
  ERR_QUOTE_WORK_ORDER_STATUS: {
    status: 400,
    code: 'ERR_QUOTE_WORK_ORDER_STATUS',
    message: 'Visita técnica ou medição permitida apenas em OS com status orçamento, aprovada ou aguardando agendamento.'
  },
  ERR_MAINTENANCE_WORK_ORDER_STATUS: {
    status: 400,
    code: 'ERR_MAINTENANCE_WORK_ORDER_STATUS',
    message: 'Manutenção exige ordem de serviço operacional em aberto.'
  },
  ERR_WARRANTY_WORK_ORDER_STATUS: {
    status: 400,
    code: 'ERR_WARRANTY_WORK_ORDER_STATUS',
    message: 'Agendamento de garantia exige ordem de serviço com status concluída.'
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
  ERR_INVALID_APPOINTMENT_TIPO: {
    status: 400,
    code: 'ERR_INVALID_APPOINTMENT_TIPO',
    message: 'Tipo de agendamento informado é inválido.'
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
  },
  ERR_HARD_DELETE_FORBIDDEN: {
    status: 400,
    code: 'ERR_HARD_DELETE_FORBIDDEN',
    message: 'Exclusão física é proibida. Utilize cancelamento auditável ou desativação lógica.'
  },
  ERR_ACTIVE_APPOINTMENTS_EXIST: {
    status: 409,
    code: 'ERR_ACTIVE_APPOINTMENTS_EXIST',
    message: 'Existem agendamentos ativos incompatíveis vinculados a esta ordem de serviço. Conclua ou cancele esses agendamentos antes de finalizar a OS.'
  }
}
