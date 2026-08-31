import { ref, computed, watch } from 'vue'
import {
  SERVICE_FAMILIES,
  ALL_SERVICES_MAP
} from '../../server/shared/siteMediaTaxonomy.mjs'
import type { SiteMedia } from '~/types/siteMedia'
import { useSiteMediaUpload } from './useSiteMediaUpload'

export { SERVICE_FAMILIES, ALL_SERVICES_MAP }
export type { SiteMedia, ServiceFamily, ServiceItem, UploadQueueItem, UploadStatus } from '~/types/siteMedia'

/**
 * Composable principal de administração de mídias de serviços do site.
 * LOC <= 200
 */
export function useAdminSiteMedia() {
  const selectedFamilyId = ref<'telas' | 'redes' | 'vidracaria'>('telas')
  const selectedServiceKey = ref<string>('telas_janelas')
  const mediaList = ref<SiteMedia[]>([])
  const isLoading = ref<boolean>(false)
  const loadError = ref<string | null>(null)

  const currentFamilyServices = computed(() => {
    const family = SERVICE_FAMILIES.find((f) => f.id === selectedFamilyId.value)
    return family ? family.services : []
  })

  const currentService = computed(() => {
    return ALL_SERVICES_MAP[selectedServiceKey.value] || {
      key: selectedServiceKey.value,
      name: selectedServiceKey.value,
      family: selectedFamilyId.value
    }
  })

  const currentServiceName = computed(() => currentService.value.name)

  watch(selectedServiceKey, (newKey) => {
    const info = ALL_SERVICES_MAP[newKey]
    if (info && info.family !== selectedFamilyId.value) {
      selectedFamilyId.value = info.family as any
    }
    fetchMediaList(newKey)
  })

  function setFamily(familyId: 'telas' | 'redes' | 'vidracaria') {
    selectedFamilyId.value = familyId
    const family = SERVICE_FAMILIES.find((f) => f.id === familyId)
    if (family && family.services.length > 0) {
      const alreadyInFamily = family.services.some((s) => s.key === selectedServiceKey.value)
      if (!alreadyInFamily) {
        selectedServiceKey.value = family.services[0].key
      }
    }
  }

  async function fetchMediaList(serviceKey = selectedServiceKey.value) {
    if (!serviceKey) return
    isLoading.value = true
    loadError.value = null

    try {
      const response = await $fetch<{ success: boolean; count: number; media: SiteMedia[] }>(
        `/api/admin/media/site/list?service_key=${encodeURIComponent(serviceKey)}`
      )
      mediaList.value = response?.success ? response.media || [] : []
    } catch (err: any) {
      console.error('[AdminSiteMedia] Erro ao carregar mídias de serviços')
      loadError.value = err?.data?.message || err?.message || 'Falha ao carregar mídias do serviço'
      mediaList.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function setFeatured(mediaId: string) {
    try {
      const res = await $fetch<{ success: boolean }>('/api/admin/media/site/set-featured', {
        method: 'POST',
        body: { id: mediaId, service_key: selectedServiceKey.value }
      })
      if (res?.success) {
        mediaList.value = mediaList.value.map((item) => ({ ...item, is_featured: item.id === mediaId }))
        return { success: true }
      }
      return { success: false, error: 'Resposta inválida do servidor' }
    } catch (err: any) {
      console.error('[AdminSiteMedia] Erro ao definir destaque')
      await fetchMediaList()
      return { success: false, error: err?.data?.message || err?.message || 'Erro ao definir mídia de destaque' }
    }
  }

  async function toggleActive(mediaId: string, currentActive: boolean) {
    const newActive = !currentActive
    const originalList = [...mediaList.value]
    mediaList.value = mediaList.value.map((item) => item.id === mediaId ? { ...item, is_active: newActive } : item)

    try {
      const res = await $fetch<{ success: boolean }>('/api/admin/media/site/update', {
        method: 'POST',
        body: { id: mediaId, is_active: newActive }
      })
      if (!res?.success) {
        mediaList.value = originalList
        return { success: false, error: 'Falha ao atualizar visibilidade' }
      }
      return { success: true }
    } catch (err: any) {
      console.error('[AdminSiteMedia] Erro ao alternar status ativo')
      mediaList.value = originalList
      return { success: false, error: err?.data?.message || err?.message || 'Erro ao atualizar status' }
    }
  }

  async function updateMetadata(mediaId: string, data: { alt_text: string; title?: string | null; caption?: string | null }) {
    try {
      const res = await $fetch<{ success: boolean; media: SiteMedia }>('/api/admin/media/site/update', {
        method: 'POST',
        body: { id: mediaId, alt_text: data.alt_text, title: data.title ?? null, caption: data.caption ?? null }
      })
      if (res?.success && res.media) {
        mediaList.value = mediaList.value.map((item) => item.id === mediaId ? { ...item, alt_text: res.media.alt_text, title: res.media.title, caption: res.media.caption } : item)
        return { success: true }
      }
      return { success: false, error: 'Falha ao atualizar metadados' }
    } catch (err: any) {
      console.error('[AdminSiteMedia] Erro ao atualizar metadados')
      return { success: false, error: err?.data?.message || err?.message || 'Erro ao salvar alterações' }
    }
  }

  async function reorderMedia(mediaId: string, direction: 'up' | 'down') {
    const currentIndex = mediaList.value.findIndex((m) => m.id === mediaId)
    if (currentIndex === -1) return
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= mediaList.value.length) return

    const currentItem = mediaList.value[currentIndex]
    const targetItem = mediaList.value[targetIndex]
    const newCurrentOrder = targetItem.sort_order
    const newTargetOrder = currentItem.sort_order
    const finalCurrentOrder = newCurrentOrder === newTargetOrder ? (direction === 'up' ? Math.max(0, newCurrentOrder - 1) : newCurrentOrder + 1) : newCurrentOrder

    const updatedList = [...mediaList.value]
    updatedList[currentIndex] = { ...currentItem, sort_order: finalCurrentOrder }
    updatedList[targetIndex] = { ...targetItem, sort_order: newTargetOrder }
    updatedList.sort((a, b) => (a.is_featured === b.is_featured ? a.sort_order - b.sort_order : a.is_featured ? -1 : 1))
    mediaList.value = updatedList

    try {
      await Promise.all([
        $fetch('/api/admin/media/site/update', { method: 'POST', body: { id: currentItem.id, sort_order: finalCurrentOrder } }),
        $fetch('/api/admin/media/site/update', { method: 'POST', body: { id: targetItem.id, sort_order: newTargetOrder } })
      ])
      return { success: true }
    } catch (err: any) {
      console.error('[AdminSiteMedia] Erro ao persistir reordenação')
      await fetchMediaList()
      return { success: false, error: err?.data?.message || err?.message || 'Falha ao reordenar mídias' }
    }
  }

  async function deleteMedia(mediaId: string) {
    try {
      const res = await $fetch<{ success: boolean }>('/api/admin/media/site/delete', { method: 'POST', body: { id: mediaId } })
      if (res?.success) {
        mediaList.value = mediaList.value.filter((m) => m.id !== mediaId)
        return { success: true }
      }
      return { success: false, error: 'Falha ao excluir mídia' }
    } catch (err: any) {
      console.error('[AdminSiteMedia] Erro ao excluir mídia')
      return { success: false, error: err?.data?.message || err?.message || 'Erro ao excluir mídia' }
    }
  }

  const uploadHelpers = useSiteMediaUpload(selectedServiceKey, currentServiceName, () => fetchMediaList())

  return {
    selectedFamilyId,
    selectedServiceKey,
    currentService,
    currentFamilyServices,
    mediaList,
    isLoading,
    loadError,
    setFamily,
    fetchMediaList,
    setFeatured,
    toggleActive,
    updateMetadata,
    reorderMedia,
    deleteMedia,
    ...uploadHelpers
  }
}
