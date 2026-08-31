import { ref, computed } from 'vue'
import { useImageCompressor } from '~/composables/useImageCompressor'
import {
  type LeadMediaItem,
  uploadSingleLeadMedia,
  runConcurrentLeadUploads
} from '~/utils/leadMediaPipeline'
import {
  processPhotoFiles,
  processVideoFiles
} from '~/utils/leadMediaSelection'

export function useLeadMediaUploadQueue(props: {
  maxPhotos?: number
  maxVideos?: number
  maxTotalFiles?: number
  uploadConcurrency?: number
}) {
  const maxPhotos = props.maxPhotos ?? 4
  const maxVideos = props.maxVideos ?? 2
  const uploadConcurrency = props.uploadConcurrency ?? 2

  const { compressImage } = useImageCompressor()

  const mediaItems = ref<LeadMediaItem[]>([])
  const isProcessing = ref(false)
  const isUploading = ref(false)
  const uploadProgressText = ref('')
  const uploadErrorMessage = ref('')

  let uploadAbortController: AbortController | null = null

  const photoCount = computed(() => mediaItems.value.filter(m => m.type === 'photo').length)
  const videoCount = computed(() => mediaItems.value.filter(m => m.type === 'video').length)
  const totalCount = computed(() => mediaItems.value.length)
  const hasFiles = computed(() => mediaItems.value.length > 0)

  const handlePhotoSelect = async (event: Event, onCountChange?: (count: number) => void) => {
    const target = event.target as HTMLInputElement
    const files = Array.from(target.files || [])
    if (!files.length) return

    const remaining = maxPhotos - photoCount.value
    isProcessing.value = true
    uploadErrorMessage.value = ''

    const newItems = await processPhotoFiles(files, remaining, compressImage)
    mediaItems.value.push(...newItems)

    isProcessing.value = false
    if (onCountChange) onCountChange(totalCount.value)
  }

  const handleVideoSelect = (event: Event, onCountChange?: (count: number) => void) => {
    const target = event.target as HTMLInputElement
    const files = Array.from(target.files || [])
    if (!files.length) return

    const remaining = maxVideos - videoCount.value
    const newItems = processVideoFiles(files, remaining)
    mediaItems.value.push(...newItems)

    if (onCountChange) onCountChange(totalCount.value)
  }

  const removeItem = (id: string, onCountChange?: (count: number) => void) => {
    const idx = mediaItems.value.findIndex(m => m.id === id)
    if (idx !== -1) {
      const item = mediaItems.value[idx]
      if (item.previewUrl) {
        try { URL.revokeObjectURL(item.previewUrl) } catch {}
      }
      mediaItems.value.splice(idx, 1)
      if (onCountChange) onCountChange(totalCount.value)
    }
  }

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B'
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const updateOverallProgress = () => {
    const uploaded = mediaItems.value.filter(m => m.status === 'uploaded').length
    const total = mediaItems.value.length
    uploadProgressText.value = `Enviando arquivos (${uploaded}/${total} concluídos)...`
  }

  const uploadAllMedia = async (uploadToken: string) => {
    if (!mediaItems.value.length || !uploadToken) {
      return { total: 0, uploaded: 0, failed: 0 }
    }

    isUploading.value = true
    uploadErrorMessage.value = ''
    uploadAbortController = new AbortController()

    const tTotalStart = performance.now()
    const pendingItems = mediaItems.value.filter(m => m.status !== 'uploaded')

    if (pendingItems.length === 0) {
      isUploading.value = false
      return { total: mediaItems.value.length, uploaded: mediaItems.value.length, failed: 0 }
    }

    uploadProgressText.value = `Iniciando envio de ${pendingItems.length} arquivo(s)...`
    await runConcurrentLeadUploads(pendingItems, uploadToken, uploadConcurrency, uploadAbortController.signal, updateOverallProgress)

    const tTotalEnd = performance.now()
    const uploadedCount = mediaItems.value.filter(m => m.status === 'uploaded').length
    const failedCount = mediaItems.value.filter(m => m.status === 'failed').length

    if (import.meta.dev) {
      console.log(`[MediaTiming] TOTAL (${mediaItems.value.length} arquivos): ${(tTotalEnd - tTotalStart).toFixed(1)}ms | Sucesso: ${uploadedCount} | Falha: ${failedCount}`)
    }

    isUploading.value = false
    uploadProgressText.value = ''

    if (failedCount > 0) {
      uploadErrorMessage.value = `${failedCount} arquivo(s) não puderam ser enviados, mas seu pedido de orçamento foi registrado com sucesso!`
    }

    return { total: mediaItems.value.length, uploaded: uploadedCount, failed: failedCount }
  }

  const retryItem = async (item: LeadMediaItem, uploadToken: string) => {
    if (isUploading.value || !uploadToken) return
    isUploading.value = true
    await uploadSingleLeadMedia(item, uploadToken, uploadAbortController?.signal)
    isUploading.value = false
  }

  const cleanup = () => {
    if (uploadAbortController) uploadAbortController.abort()
    mediaItems.value.forEach(item => {
      if (item.previewUrl) {
        try { URL.revokeObjectURL(item.previewUrl) } catch {}
      }
    })
  }

  return {
    mediaItems,
    isProcessing,
    isUploading,
    uploadProgressText,
    uploadErrorMessage,
    photoCount,
    videoCount,
    totalCount,
    hasFiles,
    handlePhotoSelect,
    handleVideoSelect,
    removeItem,
    formatSize,
    uploadAllMedia,
    retryItem,
    cleanup
  }
}
