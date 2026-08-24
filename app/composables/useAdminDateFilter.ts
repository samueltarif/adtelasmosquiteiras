/**
 * Global admin date filter composable using useState for cross-component persistence
 */
export interface AdminDatePreset {
  value: string
  label: string
}

export const ADMIN_DATE_PRESETS: AdminDatePreset[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last7d', label: 'Últimos 7 dias' },
  { value: 'last30d', label: 'Últimos 30 dias' },
  { value: 'thisMonth', label: 'Este mês' },
  { value: 'lastMonth', label: 'Mês passado' },
  { value: 'allTime', label: 'Todo o período' },
  { value: 'custom', label: 'Personalizado' }
]

export function useAdminDateFilter() {
  const preset = useState<string>('admin-date-preset', () => 'today')
  const customFrom = useState<string>('admin-date-from', () => '')
  const customTo = useState<string>('admin-date-to', () => '')

  const activeLabel = computed(() => {
    if (preset.value === 'custom' && customFrom.value && customTo.value) {
      return `${customFrom.value} até ${customTo.value}`
    }
    const found = ADMIN_DATE_PRESETS.find(p => p.value === preset.value)
    return found?.label || 'Hoje'
  })

  const queryParams = computed(() => {
    const params: Record<string, string> = { preset: preset.value }
    if (preset.value === 'custom') {
      if (customFrom.value) params.dateFrom = customFrom.value
      if (customTo.value) params.dateTo = customTo.value
    }
    return params
  })

  const queryString = computed(() => {
    const entries = Object.entries(queryParams.value)
    return entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  })

  function setPreset(value: string) {
    preset.value = value
  }

  function setCustomRange(from: string, to: string) {
    customFrom.value = from
    customTo.value = to
    preset.value = 'custom'
  }

  return {
    preset,
    customFrom,
    customTo,
    activeLabel,
    queryParams,
    queryString,
    setPreset,
    setCustomRange,
    presets: ADMIN_DATE_PRESETS
  }
}
