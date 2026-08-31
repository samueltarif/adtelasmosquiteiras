/**
 * Utilitário Centralizado de Datas e Timezone para CRM Agenda
 * Arquivo: app/utils/crmDateTime.ts
 *
 * TIMEZONE_DISPLAY = America/Sao_Paulo
 * HARDCODED_MINUS_03_OFFSET = 0 (Calcula offset dinâmico via Intl/Date)
 * Semântica de Janela de Calendário: [start, end)
 * LOC <= 200
 */

export const CRM_TIMEZONE = 'America/Sao_Paulo'

export interface SaoPauloParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

export function getSaoPauloParts(dateInput: Date | string | number = new Date()): SaoPauloParts {
  const date = typeof dateInput === 'object' ? dateInput : new Date(dateInput)
  if (isNaN(date.getTime())) {
    throw new Error('Data inválida fornecida para getSaoPauloParts')
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CRM_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  })

  const map: Record<string, number> = {}
  for (const p of formatter.formatToParts(date)) {
    if (p.type !== 'literal') map[p.type] = parseInt(p.value, 10)
  }

  return {
    year: map.year || 1970,
    month: map.month || 1,
    day: map.day || 1,
    hour: map.hour === 24 ? 0 : (map.hour || 0),
    minute: map.minute || 0,
    second: map.second || 0
  }
}

/**
 * Formata campo DATE-ONLY (YYYY-MM-DD) ou timestamp ISO para exibição civil DD/MM/YYYY
 * Garante ZERO deslocamento de timezone em datas civis puras (ex: 2026-08-30 -> 30/08/2026).
 */
export function formatDateOnly(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '-'
  const clean = dateStr.trim()
  if (!clean) return '-'
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const [, year, month, day] = match
    return `${day}/${month}/${year}`
  }
  return formatAppointmentDate(clean)
}

export function formatAppointmentDate(isoString?: string | null): string {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: CRM_TIMEZONE, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

export function formatAppointmentTime(isoString?: string | null): string {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: CRM_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
}

export function formatAppointmentDateTime(isoString?: string | null): string {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '-'
  return `${formatAppointmentDate(isoString)} às ${formatAppointmentTime(isoString)}`
}

export function formatDateRangeDisplay(startIso?: string | null, endIso?: string | null): string {
  if (!startIso || !endIso) return '-'
  return `${formatAppointmentDate(startIso)}, ${formatAppointmentTime(startIso)} - ${formatAppointmentTime(endIso)}`
}

export function getSaoPauloDateString(dateInput: Date | string | number = new Date()): string {
  const p = getSaoPauloParts(dateInput)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

export function getSaoPauloTimeString(dateInput: Date | string | number = new Date()): string {
  const p = getSaoPauloParts(dateInput)
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
}

export function toSaoPauloIso(dateStr: string, timeStr = '00:00'): string {
  const [year = 1970, month = 1, day = 1] = dateStr.split('-').map(Number)
  const [hour = 0, minute = 0] = timeStr.split(':').map(Number)
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  const sp = getSaoPauloParts(utcGuess)
  const localAsUtc = new Date(Date.UTC(sp.year, sp.month - 1, sp.day, sp.hour, sp.minute, 0))
  return new Date(utcGuess.getTime() + (utcGuess.getTime() - localAsUtc.getTime())).toISOString()
}

export function parseDateFromQuery(queryValue?: string | null): string {
  const today = getSaoPauloDateString()
  if (!queryValue || typeof queryValue !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(queryValue.trim())) return today
  const clean = queryValue.trim()
  const [y = 0, m = 0, d = 0] = clean.split('-').map(Number)
  if (m < 1 || m > 12 || d < 1 || d > 31) return today
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return today
  return clean
}

export function addDays(dateStr: string, numDays: number): string {
  const [y = 1970, m = 1, d = 1] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + numDays, 12, 0, 0))
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

export function getCalendarDayRange(dateStr: string): { start: string; end: string } {
  return { start: toSaoPauloIso(dateStr, '00:00'), end: toSaoPauloIso(addDays(dateStr, 1), '00:00') }
}

export function getCalendarWeekDays(baseDate: Date = new Date()): Date[] {
  const sp = getSaoPauloParts(baseDate)
  const current = new Date(Date.UTC(sp.year, sp.month - 1, sp.day, 12, 0, 0))
  const startOffset = -current.getUTCDay()
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(current)
    day.setUTCDate(current.getUTCDate() + startOffset + i)
    return day
  })
}

export function getCalendarWeekRange(baseDate: Date = new Date()): { start: string; end: string } {
  const days = getCalendarWeekDays(baseDate)
  const first = getSaoPauloDateString(days[0] as Date)
  const last = getSaoPauloDateString(days[6] as Date)
  return { start: toSaoPauloIso(first, '00:00'), end: toSaoPauloIso(addDays(last, 1), '00:00') }
}

export function getCalendarMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0))
  const days: Date[] = []
  for (let i = firstDay.getUTCDay(); i > 0; i--) {
    const prev = new Date(firstDay)
    prev.setUTCDate(firstDay.getUTCDate() - i)
    days.push(prev)
  }
  const totalDays = new Date(Date.UTC(year, month, 0, 12, 0, 0)).getUTCDate()
  for (let i = 1; i <= totalDays; i++) days.push(new Date(Date.UTC(year, month - 1, i, 12, 0, 0)))
  while (days.length % 7 !== 0 || days.length < 35) {
    const last = days[days.length - 1] as Date
    const next = new Date(last)
    next.setUTCDate(next.getUTCDate() + 1)
    days.push(next)
    if (days.length >= 42) break
  }
  return days
}

export function getCalendarMonthRange(year: number, month: number): { start: string; end: string } {
  const grid = getCalendarMonthGrid(year, month)
  const first = getSaoPauloDateString(grid[0] as Date)
  const last = getSaoPauloDateString(grid[grid.length - 1] as Date)
  return { start: toSaoPauloIso(first, '00:00'), end: toSaoPauloIso(addDays(last, 1), '00:00') }
}

export function navigateMonthSafe(dateInput: Date | string, delta: number): Date {
  const p = getSaoPauloParts(dateInput)
  let targetYear = p.year
  let targetMonth = p.month + delta
  while (targetMonth > 12) { targetMonth -= 12; targetYear += 1 }
  while (targetMonth < 1) { targetMonth += 12; targetYear -= 1 }
  const maxDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate()
  const targetDay = Math.min(p.day, maxDay)
  return new Date(Date.UTC(targetYear, targetMonth - 1, targetDay, 12, 0, 0))
}

export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  return getSaoPauloDateString(d1) === getSaoPauloDateString(d2)
}

export function isToday(d: Date | string): boolean {
  return isSameDay(d, new Date())
}
