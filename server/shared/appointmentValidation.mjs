/**
 * Validações e Constantes de Domínio para Agenda e Equipe Operacional
 * Arquivo: server/shared/appointmentValidation.mjs
 */

export const ALLOWED_APPOINTMENT_TIPOS = [
  'visita_tecnica',
  'medicao',
  'instalacao',
  'manutencao',
  'garantia'
]

export const ALLOWED_APPOINTMENT_STATUSES = [
  'agendado',
  'confirmado',
  'em_deslocamento',
  'realizado',
  'reagendado',
  'cancelado'
]

export const ACTIVE_APPOINTMENT_STATUSES = [
  'agendado',
  'confirmado',
  'em_deslocamento'
]

export const TERMINAL_APPOINTMENT_STATUSES = [
  'realizado',
  'reagendado',
  'cancelado'
]

export const ALLOWED_STAFF_ROLES = [
  'instalador',
  'vistoriador',
  'atendente',
  'gestor'
]

export const APPOINTMENT_CALENDAR_MAX_RANGE_DAYS = 62

export function isValidAppointmentType(tipo) {
  return typeof tipo === 'string' && ALLOWED_APPOINTMENT_TIPOS.includes(tipo)
}

export function isValidAppointmentStatus(status) {
  return typeof status === 'string' && ALLOWED_APPOINTMENT_STATUSES.includes(status)
}

export function isValidStaffRole(funcao) {
  return typeof funcao === 'string' && ALLOWED_STAFF_ROLES.includes(funcao)
}

export function isValidIsoDateTime(dtStr) {
  if (!dtStr || typeof dtStr !== 'string') return false
  const d = new Date(dtStr)
  return !isNaN(d.getTime())
}

export function isValidAppointmentDateRange(startStr, endStr, maxDays = APPOINTMENT_CALENDAR_MAX_RANGE_DAYS) {
  if (!isValidIsoDateTime(startStr) || !isValidIsoDateTime(endStr)) return false
  const start = new Date(startStr).getTime()
  const end = new Date(endStr).getTime()
  if (start >= end) return false
  const diffDays = (end - start) / (1000 * 60 * 60 * 24)
  return diffDays <= maxDays
}
