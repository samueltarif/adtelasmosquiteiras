/**
 * Composable para Gerenciamento de Histórico de Mudanças de Marketing
 * Arquivo: app/composables/useMarketingChangeLog.ts
 */

import type {
  MarketingChangeLogItem,
  CreateMarketingChangePayload,
  UpdateMarketingChangePayload,
  MarketingChangeLogResponse
} from '../types/adminMarketingChangeLog'

export function useMarketingChangeLog() {
  const items = ref<MarketingChangeLogItem[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  const selectedScope = ref<string>('all')
  const selectedType = ref<string>('all')
  const selectedStatus = ref<string>('active')

  async function fetchChanges() {
    isLoading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (selectedScope.value !== 'all') params.set('scope', selectedScope.value)
      if (selectedType.value !== 'all') params.set('change_type', selectedType.value)
      if (selectedStatus.value !== 'all') params.set('status', selectedStatus.value)

      const url = `/api/admin/marketing/change-log?${params.toString()}`
      const res = await $fetch<MarketingChangeLogResponse>(url)
      if (res?.success && Array.isArray(res.changes)) {
        items.value = res.changes
      } else {
        error.value = res?.error || 'Erro ao carregar histórico'
      }
    } catch (e: any) {
      error.value = e?.message || 'Erro de conexão ao carregar histórico'
    } finally {
      isLoading.value = false
    }
  }

  async function createChange(payload: CreateMarketingChangePayload): Promise<boolean> {
    isSaving.value = true
    error.value = null
    try {
      const res = await $fetch<MarketingChangeLogResponse>('/api/admin/marketing/change-log', {
        method: 'POST',
        body: payload
      })
      if (res?.success && res.item) {
        items.value = [res.item, ...items.value]
        return true
      }
      error.value = res?.error || 'Falha ao salvar alteração'
      return false
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Erro ao registrar alteração'
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function updateChange(id: string, payload: UpdateMarketingChangePayload): Promise<boolean> {
    isSaving.value = true
    error.value = null
    try {
      const res = await $fetch<MarketingChangeLogResponse>(`/api/admin/marketing/change-log/${id}`, {
        method: 'PATCH',
        body: payload
      })
      if (res?.success && res.item) {
        const idx = items.value.findIndex(i => i.id === id)
        if (idx !== -1) {
          if (payload.status === 'archived' && selectedStatus.value === 'active') {
            items.value.splice(idx, 1)
          } else {
            items.value[idx] = res.item
          }
        }
        return true
      }
      error.value = res?.error || 'Falha ao atualizar alteração'
      return false
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Erro ao atualizar alteração'
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function archiveChange(id: string): Promise<boolean> {
    return updateChange(id, { status: 'archived' })
  }

  // Observa alteração dos filtros locais para recarregar
  watch([selectedScope, selectedType, selectedStatus], () => {
    fetchChanges()
  })

  return {
    items,
    isLoading,
    isSaving,
    error,
    selectedScope,
    selectedType,
    selectedStatus,
    fetchChanges,
    createChange,
    updateChange,
    archiveChange
  }
}
