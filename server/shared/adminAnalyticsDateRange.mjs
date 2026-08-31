/**
 * Funções de Cálculo de Intervalos de Data em Fuso Horário de São Paulo para Analytics
 * Arquivo: server/shared/adminAnalyticsDateRange.mjs
 */

import { PHASE_B_START_ISO, getIdentityStartUtc } from './adminAnalyticsClassification.mjs'

export function getSaoPauloDateRange(preset = 'today', customFrom, customTo) {
  const SP_OFFSET_HOURS = 3 // UTC-3
  const now = new Date()

  const nowUtc = now.getTime()
  const nowSpMs = nowUtc - SP_OFFSET_HOURS * 3600 * 1000
  const spDate = new Date(nowSpMs)

  const curYear = spDate.getUTCFullYear()
  const curMonth = spDate.getUTCMonth()
  const curDay = spDate.getUTCDate()

  const makeUtcFromSpDay = (year, month, day) => {
    return new Date(Date.UTC(year, month, day, SP_OFFSET_HOURS, 0, 0, 0))
  }

  let start
  let end
  let label = 'Hoje'

  switch (preset) {
    case 'today':
      start = makeUtcFromSpDay(curYear, curMonth, curDay)
      end = makeUtcFromSpDay(curYear, curMonth, curDay + 1)
      label = 'Hoje'
      break

    case 'yesterday':
      start = makeUtcFromSpDay(curYear, curMonth, curDay - 1)
      end = makeUtcFromSpDay(curYear, curMonth, curDay)
      label = 'Ontem'
      break

    case 'last7d':
      start = makeUtcFromSpDay(curYear, curMonth, curDay - 6)
      end = makeUtcFromSpDay(curYear, curMonth, curDay + 1)
      label = 'Últimos 7 dias'
      break

    case 'last30d':
      start = makeUtcFromSpDay(curYear, curMonth, curDay - 29)
      end = makeUtcFromSpDay(curYear, curMonth, curDay + 1)
      label = 'Últimos 30 dias'
      break

    case 'thisMonth':
      start = makeUtcFromSpDay(curYear, curMonth, 1)
      end = makeUtcFromSpDay(curYear, curMonth + 1, 1)
      label = 'Este mês'
      break

    case 'lastMonth':
      start = makeUtcFromSpDay(curYear, curMonth - 1, 1)
      end = makeUtcFromSpDay(curYear, curMonth, 1)
      label = 'Mês passado'
      break

    case 'allTime':
      start = new Date('2020-01-01T00:00:00.000Z')
      end = makeUtcFromSpDay(curYear, curMonth, curDay + 1)
      label = 'Todo o período'
      break

    case 'custom':
      if (customFrom && customTo) {
        const [fY, fM, fD] = customFrom.split('-').map(Number)
        const [tY, tM, tD] = customTo.split('-').map(Number)
        start = makeUtcFromSpDay(fY, fM - 1, fD)
        end = makeUtcFromSpDay(tY, tM - 1, tD + 1)
        label = `${customFrom} até ${customTo}`
      } else {
        start = makeUtcFromSpDay(curYear, curMonth, curDay)
        end = makeUtcFromSpDay(curYear, curMonth, curDay + 1)
        label = 'Hoje'
      }
      break

    default:
      start = makeUtcFromSpDay(curYear, curMonth, curDay)
      end = makeUtcFromSpDay(curYear, curMonth, curDay + 1)
      label = 'Hoje'
  }

  const startUtc = start.toISOString()
  const endUtc = end.toISOString()
  const identityStartUtc = getIdentityStartUtc(startUtc)
  const isLegacyOverlap = new Date(startUtc).getTime() < new Date(PHASE_B_START_ISO).getTime()

  return {
    startUtc,
    endUtc,
    identityStartUtc,
    label,
    isHalfOpen: true,
    isLegacyOverlap
  }
}
