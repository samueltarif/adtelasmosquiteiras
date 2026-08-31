import { ref, onUnmounted, type Ref } from 'vue'
import { useImageCompressor } from './useImageCompressor'
import type { UploadQueueItem } from '~/types/siteMedia'

export function useSiteMediaUpload(
  selectedServiceKey: Ref<string>,
  currentServiceName: Ref<string>,
  onUploadSuccess: () => Promise<void>
) {
  const uploadQueue = ref<UploadQueueItem[]>([])
  const isUploading = ref<boolean>(false)
  const { compressImage } = useImageCompressor()

  function enqueueFiles(files: FileList | File[]) {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return { success: false, error: 'Nenhum arquivo selecionado' }
    const remainingSlots = 10 - uploadQueue.value.filter((i) => i.status !== 'completed').length
    if (remainingSlots <= 0) return { success: false, error: 'Limite de 10 arquivos simultâneos atingido.' }

    const allowedPhotos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const allowedVideos = ['video/mp4', 'video/webm']
    const newItems: UploadQueueItem[] = []

    for (const file of fileArray.slice(0, remainingSlots)) {
      const mime = (file.type || '').toLowerCase()
      const isPhoto = allowedPhotos.includes(mime)
      const isVideo = allowedVideos.includes(mime)
      if (!isPhoto && !isVideo) continue
      if (isPhoto && file.size > 10 * 1024 * 1024) continue
      if (isVideo && file.size > 50 * 1024 * 1024) continue

      newItems.push({
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        mediaType: isPhoto ? 'photo' : 'video',
        mimeType: mime,
        originalSize: file.size,
        altText: `Instalação de ${currentServiceName.value}`,
        caption: '',
        title: '',
        status: 'idle',
        progress: 0
      })
    }
    uploadQueue.value.push(...newItems)
    return { success: true, count: newItems.length }
  }

  function uploadToPresignedUrl(url: string, blob: Blob, mime: string, onProgress: (pct: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', url, true)
      xhr.setRequestHeader('Content-Type', mime)
      xhr.setRequestHeader('Cache-Control', 'public, max-age=31536000, immutable')
      xhr.upload.onprogress = (evt) => { if (evt.lengthComputable) onProgress(Math.round((evt.loaded / evt.total) * 100)) }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)))
      xhr.onerror = () => reject(new Error('Falha no upload'))
      xhr.send(blob)
    })
  }

  async function processQueueItem(item: UploadQueueItem) {
    if (item.status === 'completed' || item.status === 'uploading') return
    const currentKey = selectedServiceKey.value

    try {
      let finalBlob: Blob = item.file
      let finalMime: string = item.mimeType
      let finalWidth: number | null = null
      let finalHeight: number | null = null

      if (item.mediaType === 'photo') {
        item.status = 'optimizing'
        item.progress = 10
        try {
          const compressed = await compressImage(item.file, { maxWidth: 1920, format: 'image/webp', quality: 0.85 })
          finalBlob = compressed.blob
          finalMime = compressed.type || 'image/webp'
          finalWidth = compressed.width || null
          finalHeight = compressed.height || null
          item.finalSize = compressed.size
        } catch {
          finalBlob = item.file
          finalMime = item.file.type || 'image/jpeg'
          item.finalSize = item.file.size
        }
      } else {
        item.finalSize = item.file.size
      }

      item.status = 'authorizing'
      item.progress = 25
      const authRes = await $fetch<any>('/api/admin/media/site/authorize-upload', {
        method: 'POST',
        body: { service_key: currentKey, media_type: item.mediaType, mime_type: finalMime, file_size_bytes: finalBlob.size }
      })
      if (!authRes?.success || !authRes.uploadUrl || !authRes.storageKey) throw new Error('Falha na autorização')

      item.storageKey = authRes.storageKey
      item.status = 'uploading'
      item.progress = 30
      await uploadToPresignedUrl(authRes.uploadUrl, finalBlob, finalMime, (pct) => {
        item.progress = 30 + Math.round((pct * 55) / 100)
      })

      item.status = 'validating'
      item.progress = 90
      const finalizeRes = await $fetch<any>('/api/admin/media/site/finalize-upload', {
        method: 'POST',
        body: {
          service_key: currentKey,
          storage_key: authRes.storageKey,
          media_type: item.mediaType,
          mime_type: finalMime,
          width: finalWidth || (item.mediaType === 'photo' ? 1280 : null),
          height: finalHeight || (item.mediaType === 'photo' ? 720 : null),
          alt_text: (item.altText || '').trim() || `Instalação de ${currentServiceName.value}`,
          caption: (item.caption || '').trim() || null,
          title: (item.title || '').trim() || null
        }
      })
      if (!finalizeRes?.success) throw new Error('Falha na finalização')

      item.status = 'completed'
      item.progress = 100
      item.error = undefined
      try { URL.revokeObjectURL(item.previewUrl) } catch {}
    } catch (err: any) {
      console.error('[SiteMediaUpload] Erro no upload de mídia')
      item.status = 'error'
      item.error = err?.data?.message || err?.message || 'Falha no upload do arquivo'
    }
  }

  async function processUploadQueue() {
    if (isUploading.value) return
    isUploading.value = true
    while (true) {
      const pending = uploadQueue.value.filter((i) => i.status === 'idle' || i.status === 'error')
      const active = uploadQueue.value.filter((i) => ['optimizing', 'authorizing', 'uploading', 'validating'].includes(i.status))
      if (pending.length === 0 && active.length === 0) break
      const available = 2 - active.length
      if (available > 0 && pending.length > 0) {
        for (const item of pending.slice(0, available)) processQueueItem(item)
      }
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    isUploading.value = false
    await onUploadSuccess()
  }

  async function retryQueueItem(id: string) {
    const item = uploadQueue.value.find((i) => i.id === id)
    if (!item) return
    item.status = 'idle'
    item.error = undefined
    item.progress = 0
    await processUploadQueue()
  }

  function removeQueueItem(id: string) {
    const index = uploadQueue.value.findIndex((i) => i.id === id)
    if (index !== -1) {
      try { URL.revokeObjectURL(uploadQueue.value[index].previewUrl) } catch {}
      uploadQueue.value.splice(index, 1)
    }
  }

  function clearCompletedQueue() {
    uploadQueue.value = uploadQueue.value.filter((i) => {
      if (i.status === 'completed') {
        try { URL.revokeObjectURL(i.previewUrl) } catch {}
        return false
      }
      return true
    })
  }

  onUnmounted(() => {
    for (const item of uploadQueue.value) {
      try { URL.revokeObjectURL(item.previewUrl) } catch {}
    }
  })

  return { uploadQueue, isUploading, enqueueFiles, processUploadQueue, retryQueueItem, removeQueueItem, clearCompletedQueue }
}
