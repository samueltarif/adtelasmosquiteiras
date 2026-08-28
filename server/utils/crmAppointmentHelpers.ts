/**
 * Helpers Reutilizáveis para Consultas da Agenda e Proteções de Estado
 * Arquivo: server/utils/crmAppointmentHelpers.ts
 */

import { SupabaseConfig, getSupabaseHeaders } from './crm'

export const APPOINTMENT_DETAIL_SELECT = [
  'id',
  'work_order_id',
  'client_id',
  'address_id',
  'staff_id',
  'tipo_agendamento',
  'data_hora_inicio',
  'data_hora_fim',
  'status_agendamento',
  'observacoes',
  'rescheduled_from_id',
  'motivo_reagendamento_cancelamento',
  'created_by',
  'created_at',
  'updated_at',
  'client:clients(id,nome,telefone_principal,email,tipo_cliente)',
  'work_order:work_orders(id,numero_os,status_os,valor_final)',
  'address:client_addresses(id,rotulo,logradouro,numero,complemento,bairro,cidade,uf)',
  'staff:crm_staff(id,nome,funcao,telefone)'
].join(',')

/**
 * Consulta se uma Ordem de Serviço possui agendamento de instalação ativo
 * (status: agendado, confirmado, em_deslocamento).
 */
export async function hasActiveInstallation(
  config: SupabaseConfig,
  workOrderId: string
): Promise<boolean> {
  if (!config.url || !config.serviceRoleKey || !workOrderId) return false

  try {
    const res = await $fetch<any[]>(
      `${config.url}/rest/v1/appointments?work_order_id=eq.${workOrderId}&tipo_agendamento=eq.instalacao&status_agendamento=in.(agendado,confirmado,em_deslocamento)&select=id&limit=1`,
      {
        headers: getSupabaseHeaders(config.serviceRoleKey)
      }
    )
    return Array.isArray(res) && res.length > 0
  } catch (err: any) {
    console.error('[hasActiveInstallation] Erro ao consultar instalação ativa:', err?.message || err)
    return false
  }
}

/**
 * Obtém os dados do agendamento de instalação ativo de uma Ordem de Serviço, se existir.
 */
export async function getActiveInstallation(
  config: SupabaseConfig,
  workOrderId: string
): Promise<any | null> {
  if (!config.url || !config.serviceRoleKey || !workOrderId) return null

  try {
    const res = await $fetch<any[]>(
      `${config.url}/rest/v1/appointments?work_order_id=eq.${workOrderId}&tipo_agendamento=eq.instalacao&status_agendamento=in.(agendado,confirmado,em_deslocamento)&select=${APPOINTMENT_DETAIL_SELECT}&limit=1`,
      {
        headers: getSupabaseHeaders(config.serviceRoleKey)
      }
    )
    return Array.isArray(res) && res.length > 0 ? res[0] : null
  } catch (err: any) {
    console.error('[getActiveInstallation] Erro ao consultar instalação ativa:', err?.message || err)
    return null
  }
}
