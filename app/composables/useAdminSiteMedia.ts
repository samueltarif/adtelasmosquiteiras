import { ref, computed, watch, onUnmounted } from 'vue'
import { useImageCompressor } from './useImageCompressor'
import {
  SERVICE_FAMILIES,
  ALL_SERVICES_MAP
} from '../../server/shared/siteMediaTaxonomy.mjs'

export { SERVICE_FAMILIES, ALL_SERVICES_MAP }

export interface ServiceItem {
  key: string
  name: string
}

export interface ServiceFamily {
  id: 'telas' | 'redes' | 'vidracaria'
  name: string
  icon: string
  services: ServiceItem[]
}

export interface SiteMedia {
  id: string
  service_key: string
  storage_key: string
  media_type: 'photo' | 'video'
  mime_type: string
  title: string | null
  alt_text: string
  caption: string | null
  sort_order: number
  is_featured: boolean
  is_active: boolean
  width: number | null
  height: number | null
  file_size_bytes: number
  created_by?: string
  created_at: string
  updated_at?: string
  publicUrl: string
}

export type UploadStatus =
  | 'idle'
  | 'optimizing'
  | 'authorizing'
  | 'uploading'
  | 'validating'
  | 'completed'
  | 'error'

export interface UploadQueueItem {
  id: string
  file: File
  previewUrl: string
  mediaType: 'photo' | 'video'
  mimeType: string
  originalSize: number
  finalSize?: number
  width?: number
  height?: number
  altText: string
  caption: string
  title: string
  status: UploadStatus
  progress: number // 0 a 100
  error?: string
  storageKey?: string
  processedBlob?: Blob
}

export function useAdminSiteMedia() {
  const selectedFamilyId = ref<'telas' | 'redes' | 'vidracaria'>('telas')
  const selectedServiceKey = ref<string>('telas_janelas')

  const mediaList = ref<SiteMedia[]>([])
  const isLoading = ref<boolean>(false)
  const loadError = ref<string | null>(null)

  const uploadQueue = ref<UploadQueueItem[]>([])
  const isUploading = ref<boolean>(false)
  const activeUploadsCount = ref<number>(0)

  const { compressImage } = useImageCompressor()

  // Retorna os serviços pertencentes à família selecionada
  const currentFamilyServices = computed(() => {
    const family = SERVICE_FAMILIES.find((f) => f.id === selectedFamilyId.value)
    return family ? family.services : []
  })

  // Informações do serviço atual
  const currentService = computed(() => {
    return ALL_SERVICES_MAP[selectedServiceKey.value] || {
      key: selectedServiceKey.value,
      name: selectedServiceKey.value,
      family: selectedFamilyId.value
    }
  })

  // Sincroniza a família quando a serviceKey muda
  watch(selectedServiceKey, (newKey) => {
    const info = ALL_SERVICES_MAP[newKey]
    if (info && info.family !== selectedFamilyId.value) {
      selectedFamilyId.value = info.family as any
    }
    fetchMediaList(newKey)
  })

  // Sincroniza a serviceKey quando a família muda
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

  // 1. Carregar lista de mídias do serviço selecionado
  async function fetchMediaList(serviceKey = selectedServiceKey.value) {
    if (!serviceKey) return
    isLoading.value = true
    loadError.value = null

    try {
      const response = await $fetch<{ success: boolean; count: number; media: SiteMedia[] }>(
        `/api/admin/media/site/list?service_key=${encodeURIComponent(serviceKey)}`
      )

      if (response?.success) {
        mediaList.value = response.media || []
      } else {
        mediaList.value = []
      }
    } catch (err: any) {
      console.error('Erro ao carregar lista de mídias de serviços:', err)
      loadError.value = err?.data?.message || err?.message || 'Falha ao carregar mídias do serviço'
      mediaList.value = []
    } finally {
      isLoading.value = false
    }
  }

  // 2. Definir mídia como destaque
  async function setFeatured(mediaId: string) {
    const currentServiceKey = selectedServiceKey.value
    try {
      const res = await $fetch<{ success: boolean; featuredMediaId: string }>(
        '/api/admin/media/site/set-featured',
        {
          method: 'POST',
          body: {
            id: mediaId,
            service_key: currentServiceKey
          }
        }
      )

      if (res?.success) {
        // Atualiza estado local imediatamente
        mediaList.value = mediaList.value.map((item) => ({
          ...item,
          is_featured: item.id === mediaId
        }))
        return { success: true }
      }
      return { success: false, error: 'Resposta inválida do servidor' }
    } catch (err: any) {
      console.error('Erro ao definir destaque:', err)
      await fetchMediaList()
      return {
        success: false,
        error: err?.data?.message || err?.message || 'Erro ao definir mídia de destaque'
      }
    }
  }

  // 3. Alternar status ativo / inativo
  async function toggleActive(mediaId: string, currentActive: boolean) {
    const newActive = !currentActive
    // Atualização otimista
    const originalList = [...mediaList.value]
    mediaList.value = mediaList.value.map((item) =>
      item.id === mediaId ? { ...item, is_active: newActive } : item
    )

    try {
      const res = await $fetch<{ success: boolean; media: SiteMedia }>(
        '/api/admin/media/site/update',
        {
          method: 'POST',
          body: {
            id: mediaId,
            is_active: newActive
          }
        }
      )

      if (!res?.success) {
        // Reverte se falhar
        mediaList.value = originalList
        return { success: false, error: 'Falha ao atualizar visibilidade' }
      }
      return { success: true }
    } catch (err: any) {
      console.error('Erro ao alternar status ativo:', err)
      mediaList.value = originalList
      return {
        success: false,
        error: err?.data?.message || err?.message || 'Erro ao atualizar status da mídia'
      }
    }
  }

  // 4. Atualizar metadados (Alt Text, Título, Legenda)
  async function updateMetadata(
    mediaId: string,
    data: { alt_text: string; title?: string | null; caption?: string | null }
  ) {
    try {
      const res = await $fetch<{ success: boolean; media: SiteMedia }>(
        '/api/admin/media/site/update',
        {
          method: 'POST',
          body: {
            id: mediaId,
            alt_text: data.alt_text,
            title: data.title !== undefined ? data.title : null,
            caption: data.caption !== undefined ? data.caption : null
          }
        }
      )

      if (res?.success && res.media) {
        mediaList.value = mediaList.value.map((item) =>
          item.id === mediaId
            ? {
                ...item,
                alt_text: res.media.alt_text,
                title: res.media.title,
                caption: res.media.caption
              }
            : item
        )
        return { success: true }
      }
      return { success: false, error: 'Falha ao atualizar metadados' }
    } catch (err: any) {
      console.error('Erro ao atualizar metadados:', err)
      return {
        success: false,
        error: err?.data?.message || err?.message || 'Erro ao salvar alterações da mídia'
      }
    }
  }

  // 5. Reordenar mídia (Mover para cima ou para baixo)
  async function reorderMedia(mediaId: string, direction: 'up' | 'down') {
    const currentIndex = mediaList.value.findIndex((m) => m.id === mediaId)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= mediaList.value.length) return

    const currentItem = mediaList.value[currentIndex]
    const targetItem = mediaList.value[targetIndex]

    // Troca os sort_orders
    const newCurrentOrder = targetItem.sort_order
    const newTargetOrder = currentItem.sort_order

    // Se forem iguais (empate prévio), ajusta ordenação determinística
    const finalCurrentOrder = newCurrentOrder === newTargetOrder
      ? (direction === 'up' ? Math.max(0, newCurrentOrder - 1) : newCurrentOrder + 1)
      : newCurrentOrder

    // Atualização otimista da lista
    const updatedList = [...mediaList.value]
    updatedList[currentIndex] = { ...currentItem, sort_order: finalCurrentOrder }
    updatedList[targetIndex] = { ...targetItem, sort_order: newTargetOrder }
    updatedList.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1
      if (!a.is_featured && b.is_featured) return 1
      return a.sort_order - b.sort_order
    })
    mediaList.value = updatedList

    try {
      await Promise.all([
        $fetch('/api/admin/media/site/update', {
          method: 'POST',
          body: { id: currentItem.id, sort_order: finalCurrentOrder }
        }),
        $fetch('/api/admin/media/site/update', {
          method: 'POST',
          body: { id: targetItem.id, sort_order: newTargetOrder }
        })
      ])
      return { success: true }
    } catch (err: any) {
      console.error('Erro ao persistir reordenação:', err)
      await fetchMediaList()
      return {
        success: false,
        error: err?.data?.message || err?.message || 'Falha ao reordenar mídias'
      }
    }
  }

  // 6. Excluir mídia
  async function deleteMedia(mediaId: string) {
    try {
      const res = await $fetch<{ success: boolean; deletedMediaId: string }>(
        '/api/admin/media/site/delete',
        {
          method: 'POST',
          body: { id: mediaId }
        }
      )

      if (res?.success) {
        mediaList.value = mediaList.value.filter((m) => m.id !== mediaId)
        return { success: true }
      }
      return { success: false, error: 'Falha ao excluir mídia' }
    } catch (err: any) {
      console.error('Erro ao excluir mídia:', err)
      return {
        success: false,
        error: err?.data?.message || err?.message || 'Erro ao excluir mídia'
      }
    }
  }

  // 7. Enfileirar arquivos selecionados (máximo 10 por lote)
  function enqueueFiles(files: FileList | File[]) {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return { success: false, error: 'Nenhum arquivo selecionado' }

    const remainingSlots = 10 - uploadQueue.value.filter((i) => i.status !== 'completed').length
    if (remainingSlots <= 0) {
      return { success: false, error: 'A fila de upload já atingiu o limite de 10 arquivos simultâneos.' }
    }

    const allowedPhotos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const allowedVideos = ['video/mp4', 'video/webm']
    const maxPhotoBytes = 10 * 1024 * 1024
    const maxVideoBytes = 50 * 1024 * 1024

    const filesToEnqueue = fileArray.slice(0, remainingSlots)
    const newItems: UploadQueueItem[] = []

    for (const file of filesToEnqueue) {
      const mime = (file.type || '').toLowerCase()
      const isPhoto = allowedPhotos.includes(mime)
      const isVideo = allowedVideos.includes(mime)

      if (!isPhoto && !isVideo) {
        alert(`Formato não suportado para "${file.name}". Use JPG, PNG, WebP para fotos ou MP4, WebM para vídeos.`)
        continue
      }

      if (isPhoto && file.size > maxPhotoBytes) {
        alert(`A foto "${file.name}" excede o limite máximo de 10 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`)
        continue
      }

      if (isVideo && file.size > maxVideoBytes) {
        alert(`O vídeo "${file.name}" excede o limite máximo de 50 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`)
        continue
      }

      const previewUrl = URL.createObjectURL(file)
      const serviceName = currentService.value.name

      newItems.push({
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        mediaType: isPhoto ? 'photo' : 'video',
        mimeType: mime,
        originalSize: file.size,
        altText: `Instalação de ${serviceName}`,
        caption: '',
        title: '',
        status: 'idle',
        progress: 0
      })
    }

    uploadQueue.value.push(...newItems)
    return { success: true, count: newItems.length }
  }

  // 8. PUT via XMLHttpRequest para capturar progresso real
  function uploadToPresignedUrl(
    url: string,
    dataBlob: Blob,
    mimeType: string,
    onProgress: (pct: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', url, true)
      xhr.setRequestHeader('Content-Type', mimeType)
      xhr.setRequestHeader('Cache-Control', 'public, max-age=31536000, immutable')

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100)
          onProgress(pct)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`Erro no upload HTTP ${xhr.status}: ${xhr.statusText}`))
        }
      }

      xhr.onerror = () => {
        reject(new Error('Falha de rede ou CORS no upload R2'))
      }

      xhr.send(dataBlob)
    })
  }

  // 9. Processar item individual da fila
  async function processQueueItem(item: UploadQueueItem) {
    if (item.status === 'completed' || item.status === 'uploading') return

    const currentServiceKey = selectedServiceKey.value

    try {
      let finalBlob: Blob = item.file
      let finalMime: string = item.mimeType
      let finalWidth: number | null = null
      let finalHeight: number | null = null

      // A. Otimização de Fotos
      if (item.mediaType === 'photo') {
        item.status = 'optimizing'
        item.progress = 10

        try {
          const compressed = await compressImage(item.file, {
            maxWidth: 1920,
            format: 'image/webp',
            quality: 0.85
          })

          finalBlob = compressed.blob
          finalMime = compressed.type || 'image/webp'
          finalWidth = compressed.width || null
          finalHeight = compressed.height || null
          item.finalSize = compressed.size
          item.processedBlob = compressed.blob
        } catch (compErr: any) {
          console.warn('Falha na compressão, enviando arquivo original:', compErr)
          finalBlob = item.file
          finalMime = item.file.type || 'image/jpeg'
          item.finalSize = item.file.size
        }
      } else {
        // Para vídeos, mantemos tamanho original
        item.finalSize = item.file.size
      }

      // B. Autorização de Upload (Presigned PUT)
      item.status = 'authorizing'
      item.progress = 25

      const authRes = await $fetch<{
        success: boolean
        uploadUrl: string
        storageKey: string
        serviceKey: string
        mimeType: string
      }>('/api/admin/media/site/authorize-upload', {
        method: 'POST',
        body: {
          service_key: currentServiceKey,
          media_type: item.mediaType,
          mime_type: finalMime,
          file_size_bytes: finalBlob.size
        }
      })

      if (!authRes?.success || !authRes.uploadUrl || !authRes.storageKey) {
        throw new Error('Falha na autorização de upload pelo servidor')
      }

      item.storageKey = authRes.storageKey

      // C. Upload via Presigned PUT
      item.status = 'uploading'
      item.progress = 30

      await uploadToPresignedUrl(authRes.uploadUrl, finalBlob, finalMime, (pct) => {
        // Mapeia 0-100% do PUT para 30-85% da barra total
        item.progress = 30 + Math.round((pct * 55) / 100)
      })

      // D. Finalização e Validação no Backend
      item.status = 'validating'
      item.progress = 90

      // Garante alt_text válido (mínimo 3 caracteres)
      const cleanAlt = (item.altText || '').trim() || `Instalação de ${currentService.value.name}`

      const finalizeRes = await $fetch<{ success: boolean; media: SiteMedia }>(
        '/api/admin/media/site/finalize-upload',
        {
          method: 'POST',
          body: {
            service_key: currentServiceKey,
            storage_key: authRes.storageKey,
            media_type: item.mediaType,
            mime_type: finalMime,
            width: finalWidth || (item.mediaType === 'photo' ? 1280 : null),
            height: finalHeight || (item.mediaType === 'photo' ? 720 : null),
            alt_text: cleanAlt,
            caption: (item.caption || '').trim() || null,
            title: (item.title || '').trim() || null
          }
        }
      )

      if (!finalizeRes?.success) {
        throw new Error('Falha na validação e registro no banco de dados')
      }

      // E. Concluído com Sucesso
      item.status = 'completed'
      item.progress = 100
      item.error = undefined

      // Limpa Object URL do preview temporário
      try {
        URL.revokeObjectURL(item.previewUrl)
      } catch {}

    } catch (err: any) {
      console.error('Erro no upload de mídia:', err)
      item.status = 'error'
      item.error = err?.data?.message || err?.message || 'Falha no upload do arquivo'
    }
  }

  // 10. Processar Fila com Pool de Concorrência = 2
  async function processUploadQueue() {
    if (isUploading.value) return
    isUploading.value = true

    const CONCURRENCY_LIMIT = 2

    while (true) {
      const pendingItems = uploadQueue.value.filter(
        (i) => i.status === 'idle' || i.status === 'error'
      )

      const activeItems = uploadQueue.value.filter(
        (i) =>
          i.status === 'optimizing' ||
          i.status === 'authorizing' ||
          i.status === 'uploading' ||
          i.status === 'validating'
      )

      if (pendingItems.length === 0 && activeItems.length === 0) {
        break
      }

      const availableSlots = CONCURRENCY_LIMIT - activeItems.length
      if (availableSlots > 0 && pendingItems.length > 0) {
        const batch = pendingItems.slice(0, availableSlots)
        for (const item of batch) {
          processQueueItem(item)
        }
      }

      // Aguarda 250ms antes de checar próximo slot
      await new Promise((resolve) => setTimeout(resolve, 250))
    }

    isUploading.value = false
    // Recarrega a galeria ao concluir uploads
    await fetchMediaList()
  }

  // 11. Retry de item específico
  async function retryQueueItem(id: string) {
    const item = uploadQueue.value.find((i) => i.id === id)
    if (!item) return

    item.status = 'idle'
    item.error = undefined
    item.progress = 0

    await processUploadQueue()
  }

  // 12. Remover item da fila
  function removeQueueItem(id: string) {
    const index = uploadQueue.value.findIndex((i) => i.id === id)
    if (index !== -1) {
      const item = uploadQueue.value[index]
      try {
        URL.revokeObjectURL(item.previewUrl)
      } catch {}
      uploadQueue.value.splice(index, 1)
    }
  }

  // 13. Limpar concluídos da fila
  function clearCompletedQueue() {
    uploadQueue.value = uploadQueue.value.filter((i) => {
      if (i.status === 'completed') {
        try {
          URL.revokeObjectURL(i.previewUrl)
        } catch {}
        return false
      }
      return true
    })
  }

  // Cleanup de memória ao desmontar componente
  onUnmounted(() => {
    for (const item of uploadQueue.value) {
      try {
        URL.revokeObjectURL(item.previewUrl)
      } catch {}
    }
  })

  return {
    selectedFamilyId,
    selectedServiceKey,
    currentService,
    currentFamilyServices,
    mediaList,
    isLoading,
    loadError,
    uploadQueue,
    isUploading,
    setFamily,
    fetchMediaList,
    setFeatured,
    toggleActive,
    updateMetadata,
    reorderMedia,
    deleteMedia,
    enqueueFiles,
    processUploadQueue,
    retryQueueItem,
    removeQueueItem,
    clearCompletedQueue
  }
}
