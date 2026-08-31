/**
 * Mapeador de Erros de Domínio para Agenda e Agendamentos CRM
 * Arquivo: app/utils/crmAgendaErrors.ts
 * LOC <= 200
 */

export function extractAppointmentErrorMessage(err: any): string {
  const code = String(err?.data?.statusMessage || err?.data?.message || err?.message || '')
  if (err?.statusCode === 409) {
    if (code.includes('ERR_STAFF_SCHEDULE_CONFLICT')) {
      return 'Conflito de agenda: o técnico já possui outro compromisso ativo no horário selecionado.'
    }
    if (code.includes('ERR_ACTIVE_INSTALLATION_EXISTS')) {
      return 'Esta Ordem de Serviço já possui uma instalação ativa agendada ou em andamento.'
    }
    return 'Os dados deste agendamento foram alterados por outro usuário. Recarregamos as informações mais recentes.'
  }
  if (err?.statusCode === 403) return 'Acesso negado para esta operação.'
  if (err?.statusCode === 404) return 'Agendamento ou recurso não encontrado.'
  if (err?.statusCode === 503) return 'Serviço temporariamente indisponível. Tente novamente em instantes.'
  return code || 'Falha na operação de agendamento.'
}
