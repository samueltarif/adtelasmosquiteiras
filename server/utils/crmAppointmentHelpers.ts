/**
 * Helpers Reutilizáveis para Consultas da Agenda e Proteções de Estado
 * Arquivo: server/utils/crmAppointmentHelpers.ts
 * PATCH 5.0C.5:
 * - APPOINTMENT_CALENDAR_SELECT: projeção minimizada para calendário (sem PII)
 * - APPOINTMENT_DETAIL_SELECT: projeção completa somente para endpoints de detalhe
 * - ACTIVE_INSTALLATION_GUARD_FAILURE_POLICY=FAIL_CLOSED_ALL_PATHS
 */

import { getSupabaseHeaders } from './crm.ts'
import { createError } from 'h3'

export interface SupabaseConfig {
  url: string
  serviceRoleKey: string
}

/**
 * Projeção mínima para renderização do Calendário.
 * CALENDAR_PII_MINIMIZATION=PASS
 * NÃO inclui: telefone, email, observacoes, motivo_reagendamento_cancelamento,
 * created_by, valor_final, telefone do staff, endereço completo além do essencial.
 */
/**
 * APPOINTMENT_CALENDAR_SELECT — projeção mínima para calendário.
 * FKs disambiguadas com !constraint_name (FKs compostas na Migration 012).
 * - work_orders: via !fk_appointments_work_order_client (composta: work_order_id+client_id)
 *   com nested client:clients(id,nome) para obter nome do cliente.
 * - client_addresses: via !fk_appointments_client_address (composta: address_id+client_id)
 * - crm_staff: via FK simples fk_appointments_staff (staff_id)
 * NÃO existe FK direta appointments.client_id -> clients.id.
 */
export const APPOINTMENT_CALENDAR_SELECT = [
  'id',
  'work_order_id',
  'client_id',
  'address_id',
  'staff_id',
  'tipo_agendamento',
  'data_hora_inicio',
  'data_hora_fim',
  'status_agendamento',
  'updated_at',
  'work_order:work_orders!fk_appointments_work_order_client(id,numero_os,status_os,client:clients(id,nome))',
  'staff:crm_staff(id,nome,funcao)',
  'address:client_addresses!fk_appointments_client_address(id,rotulo,bairro,cidade,uf)'
].join(',')

/**
 * Projeção completa para endpoints de detalhe individual.
 * Inclui dados operacionais necessários para o DrawerDetail.
 */
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
  'work_order:work_orders!fk_appointments_work_order_client(id,numero_os,status_os,valor_final,is_archived,client:clients(id,nome,telefone_principal,email,tipo_cliente))',
  'address:client_addresses!fk_appointments_client_address(id,rotulo,logradouro,numero,complemento,bairro,cidade,uf)',
  'staff:crm_staff(id,nome,funcao,telefone)'
].join(',')

/**
 * Projeção minimizada para resultados de busca estruturada.
 * q textual é DEFERRED; resultado usa projeção de calendário por padrão.
 * SEARCH_RESULT_PROJECTION=MINIMIZED
 */
export const APPOINTMENT_SEARCH_SELECT = APPOINTMENT_CALENDAR_SELECT

/**
 * Consulta se uma Ordem de Serviço possui agendamento de instalação ativo
 * (status: agendado, confirmado, em_deslocamento).
 * ACTIVE_INSTALLATION_GUARD_FAILURE_POLICY=FAIL_CLOSED_ALL_PATHS
 */
export async function hasActiveInstallation(
  config: SupabaseConfig,
  workOrderId: string
): Promise<boolean> {
  if (!config.url || !config.serviceRoleKey) {
    throw createError({ statusCode: 503, message: 'HAS_ACTIVE_INSTALLATION_CONFIG_MISSING: Configuração de banco de dados indisponível.' })
  }
  if (!workOrderId || typeof workOrderId !== 'string' || workOrderId.trim() === '') {
    throw createError({ statusCode: 400, message: 'HAS_ACTIVE_INSTALLATION_INVALID_ID: workOrderId é obrigatório.' })
  }

  try {
    const res = await $fetch<any[]>(
      `${config.url}/rest/v1/appointments?work_order_id=eq.${workOrderId}&tipo_agendamento=eq.instalacao&status_agendamento=in.(agendado,confirmado,em_deslocamento)&select=id&limit=1`,
      {
        headers: getSupabaseHeaders(config.serviceRoleKey)
      }
    )
    return Array.isArray(res) && res.length > 0
  } catch (err: any) {
    const upstreamStatus = err?.statusCode || err?.status || (err?.response && err.response.status) || 'unknown'
    console.error('[hasActiveInstallation] Upstream failure:', upstreamStatus)
    throw createError({ statusCode: 503, message: 'Falha ao verificar agendamentos ativos da ordem de serviço' })
  }
}

/**
 * Obtém os dados do agendamento de instalação ativo de uma Ordem de Serviço, se existir.
 * ACTIVE_INSTALLATION_GUARD_FAILURE_POLICY=FAIL_CLOSED_ALL_PATHS
 */
export async function getActiveInstallation(
  config: SupabaseConfig,
  workOrderId: string
): Promise<any | null> {
  if (!config.url || !config.serviceRoleKey) {
    throw createError({ statusCode: 503, message: 'GET_ACTIVE_INSTALLATION_CONFIG_MISSING: Configuração de banco de dados indisponível.' })
  }
  if (!workOrderId || typeof workOrderId !== 'string' || workOrderId.trim() === '') {
    throw createError({ statusCode: 400, message: 'GET_ACTIVE_INSTALLATION_INVALID_ID: workOrderId é obrigatório.' })
  }

  try {
    const res = await $fetch<any[]>(
      `${config.url}/rest/v1/appointments?work_order_id=eq.${workOrderId}&tipo_agendamento=eq.instalacao&status_agendamento=in.(agendado,confirmado,em_deslocamento)&select=${APPOINTMENT_DETAIL_SELECT}&limit=1`,
      {
        headers: getSupabaseHeaders(config.serviceRoleKey)
      }
    )
    return Array.isArray(res) && res.length > 0 ? res[0] : null
  } catch (err: any) {
    const upstreamStatus = err?.statusCode || err?.status || (err?.response && err.response.status) || 'unknown'
    console.error('[getActiveInstallation] Upstream failure:', upstreamStatus)
    throw createError({ statusCode: 503, message: 'Falha ao consultar agendamento ativo da ordem de serviço' })
  }
}

/**
 * Consulta se uma Ordem de Serviço possui QUALQUER agendamento ativo
 * (status: agendado, confirmado, em_deslocamento - qualquer tipo).
 * ACTIVE_APPOINTMENT_GUARD_FAILURE_POLICY=FAIL_CLOSED
 */
export async function hasAnyActiveAppointment(
  config: SupabaseConfig,
  workOrderId: string
): Promise<boolean> {
  if (!config.url || !config.serviceRoleKey) {
    throw createError({ statusCode: 503, message: 'HAS_ANY_ACTIVE_APPOINTMENT_CONFIG_MISSING: Configuração de banco de dados indisponível.' })
  }
  if (!workOrderId || typeof workOrderId !== 'string' || workOrderId.trim() === '') {
    throw createError({ statusCode: 400, message: 'HAS_ANY_ACTIVE_APPOINTMENT_INVALID_ID: workOrderId é obrigatório.' })
  }

  try {
    const res = await $fetch<any[]>(
      `${config.url}/rest/v1/appointments?work_order_id=eq.${workOrderId}&status_agendamento=in.(agendado,confirmado,em_deslocamento)&select=id&limit=1`,
      {
        headers: getSupabaseHeaders(config.serviceRoleKey)
      }
    )
    return Array.isArray(res) && res.length > 0
  } catch (err: any) {
    const upstreamStatus = err?.statusCode || err?.status || (err?.response && err.response.status) || 'unknown'
    console.error('[hasAnyActiveAppointment] Upstream failure:', upstreamStatus)
    throw createError({ statusCode: 503, message: 'Falha ao verificar agendamentos ativos da ordem de serviço' })
  }
}

/**
 * Normaliza o payload de detalhe de agendamento para o contrato CrmAppointmentDetail,
 * extraindo client do work_order nested join e estruturando work_order.
 */
export function normalizeAppointmentDetail(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw
  const clientFromWo = raw?.work_order?.client ?? raw?.client ?? null
  const workOrder = raw?.work_order
    ? {
        id: raw.work_order.id,
        numero_os: raw.work_order.numero_os,
        status_os: raw.work_order.status_os,
        valor_final: raw.work_order.valor_final ?? null,
        is_archived: raw.work_order.is_archived ?? false
      }
    : null

  return {
    ...raw,
    client: clientFromWo,
    work_order: workOrder
  }
}
