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

export function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid.trim())
}

export function isValidRfc3339(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false
  const rfc3339Regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)(Z|[+-]\d{2}:\d{2})$/
  const match = dateStr.trim().match(rfc3339Regex)
  if (!match) return false

  const [, yearStr, monthStr, dayStr, hourStr, minStr, secStr] = match
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
  const hour = parseInt(hourStr, 10)
  const min = parseInt(minStr, 10)
  const sec = parseFloat(secStr)

  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  if (hour < 0 || hour > 23) return false
  if (min < 0 || min > 59) return false
  if (sec < 0 || sec >= 60) return false

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (day > daysInMonth) return false

  const timestamp = Date.parse(dateStr)
  return !isNaN(timestamp)
}

export function sanitizePostgrestSearchTerm(rawTerm) {
  if (!rawTerm || typeof rawTerm !== 'string') return null
  const trimmed = rawTerm.trim()
  if (!trimmed) return null
  const escaped = trimmed
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
  return `"*${escaped}*"`
}

export function isStrictBoolean(val) {
  return typeof val === 'boolean'
}
