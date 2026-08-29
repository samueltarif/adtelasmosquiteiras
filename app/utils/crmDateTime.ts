/**
 * Utilitário Centralizado de Datas e Timezone para CRM Agenda
 * Arquivo: app/utils/crmDateTime.ts
 *
 * TIMEZONE_DISPLAY = America/Sao_Paulo
 * HARDCODED_MINUS_03_OFFSET = 0 (Calcula offset dinâmico via Intl/Date)
 * LOC <= 200
 */

export const CRM_TIMEZONE = 'America/Sao_Paulo'

export function getSaoPauloParts(dateInput: Date | string | number): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
} {
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

  const parts = formatter.formatToParts(date)
  const map: Record<string, number> = {}
  for (const p of parts) {
    if (p.type !== 'literal') {
      map[p.type] = parseInt(p.value, 10)
    }
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

export function formatAppointmentDate(isoString?: string | null): string {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: CRM_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d)
}

export function formatAppointmentTime(isoString?: string | null): string {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: CRM_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d)
}

export function formatAppointmentDateTime(isoString?: string | null): string {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '-'
  return `${formatAppointmentDate(isoString)} às ${formatAppointmentTime(isoString)}`
}

export function formatDateRangeDisplay(startIso?: string | null, endIso?: string | null): string {
  if (!startIso || !endIso) return '-'
  const dateStr = formatAppointmentDate(startIso)
  const startTime = formatAppointmentTime(startIso)
  const endTime = formatAppointmentTime(endIso)
  return `${dateStr}, ${startTime} - ${endTime}`
}

export function getSaoPauloDateString(dateInput: Date | string | number = new Date()): string {
  const p = getSaoPauloParts(dateInput)
  const mm = String(p.month).padStart(2, '0')
  const dd = String(p.day).padStart(2, '0')
  return `${p.year}-${mm}-${dd}`
}

export function getSaoPauloTimeString(dateInput: Date | string | number = new Date()): string {
  const p = getSaoPauloParts(dateInput)
  const hh = String(p.hour).padStart(2, '0')
  const mi = String(p.minute).padStart(2, '0')
  return `${hh}:${mi}`
}

export function toSaoPauloIso(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)

  // Determina offset dinâmico sem hardcode
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  const spParts = getSaoPauloParts(utcGuess)
  const localGuessAsUtc = new Date(Date.UTC(spParts.year, spParts.month - 1, spParts.day, spParts.hour, spParts.minute, 0))
  const diffMs = utcGuess.getTime() - localGuessAsUtc.getTime()
  const targetUtc = new Date(utcGuess.getTime() + diffMs)

  return targetUtc.toISOString()
}

export function getCalendarWeekDays(baseDate: Date = new Date()): Date[] {
  const spParts = getSaoPauloParts(baseDate)
  // Cria data no meio do dia local
  const current = new Date(Date.UTC(spParts.year, spParts.month - 1, spParts.day, 12, 0, 0))
  const dayOfWeek = current.getUTCDay() // 0 = Domingo
  const startOffset = -dayOfWeek // Domingo como início da semana

  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(current)
    day.setUTCDate(current.getUTCDate() + startOffset + i)
    days.push(day)
  }
  return days
}

export function getCalendarMonthGrid(year: number, month: number): Date[] {
  // Mês é 1-12
  const firstDay = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0))
  const firstDayOfWeek = firstDay.getUTCDay() // 0 = Domingo

  const days: Date[] = []
  // Dias do mês anterior para completar primeira semana
  for (let i = firstDayOfWeek; i > 0; i--) {
    const prev = new Date(firstDay)
    prev.setUTCDate(firstDay.getUTCDate() - i)
    days.push(prev)
  }

  // Dias do mês atual
  const lastDay = new Date(Date.UTC(year, month, 0, 12, 0, 0))
  const totalDaysInMonth = lastDay.getUTCDate()
  for (let i = 1; i <= totalDaysInMonth; i++) {
    days.push(new Date(Date.UTC(year, month - 1, i, 12, 0, 0)))
  }

  // Dias do próximo mês para fechar grade (máximo 42 dias no total)
  while (days.length % 7 !== 0 || days.length < 35) {
    const next = new Date(days[days.length - 1])
    next.setUTCDate(next.getUTCDate() + 1)
    days.push(next)
    if (days.length >= 42) break
  }

  return days
}

export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  return getSaoPauloDateString(d1) === getSaoPauloDateString(d2)
}

export function isToday(d: Date | string): boolean {
  return isSameDay(d, new Date())
}
