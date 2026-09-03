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
    return 'Os dados deste agendamento foram atualizados desde que esta tela foi carregada. Os dados foram recarregados; tente novamente.'
  }
  if (err?.statusCode === 403) return 'Acesso negado para esta operação.'
  if (err?.statusCode === 404) return 'Agendamento ou recurso não encontrado.'
  if (err?.statusCode === 503) return 'Serviço temporariamente indisponível. Tente novamente em instantes.'
  return code || 'Falha na operação de agendamento.'
}

export function getAppointmentTipoWarning(status: string | undefined | null, tipo: string): string | null {
  if (!status) return null
  if (['visita_tecnica', 'medicao'].includes(tipo) && !['orcamento', 'aprovada', 'aguardando_agendamento'].includes(status)) {
    return `Visita técnica e medição são permitidas apenas para OS em 'Orçamento', 'Aprovada' ou 'Aguardando Agendamento' (atual: '${status}').`
  }
  if (tipo === 'instalacao' && !['aprovada', 'aguardando_agendamento'].includes(status)) {
    return `Agendamento de instalação exige que a OS esteja 'Aprovada' ou 'Aguardando Agendamento' (atual: '${status}').`
  }
  if (tipo === 'manutencao' && !['aprovada', 'aguardando_agendamento', 'agendada', 'em_execucao'].includes(status)) {
    return `Manutenção exige ordem de serviço operacional em aberto (atual: '${status}').`
  }
  if (tipo === 'garantia' && status !== 'concluida') {
    return `Agendamento de garantia exige ordem de serviço 'Concluída' com garantia ativa.`
  }
  return null
}
