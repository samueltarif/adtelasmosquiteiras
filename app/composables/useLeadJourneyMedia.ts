import { ref, type Ref } from 'vue'

export interface ThumbnailCacheItem {
  url: string
  loading: boolean
  error: boolean
  expiresAt: number
}

/**
 * Composable para gerenciamento de cache de URLs assinadas e thumbnails de mídia do Lead.
 * LOC <= 200
 */
export function useLeadJourneyMedia(leadIdRef: Ref<string | null>) {
  const thumbnailCache = ref<Record<string, ThumbnailCacheItem>>({})

  async function requestSignedUrl(mediaId: string): Promise<string | null> {
    const cached = thumbnailCache.value[mediaId]
    const now = Date.now()

    if (cached && cached.url && cached.expiresAt > now + 20000) {
      return cached.url
    }

    try {
      const data = await $fetch<{ success: boolean; signedUrl: string; expiresInSeconds?: number }>(
        `/api/admin/media/signed-url?media_id=${encodeURIComponent(mediaId)}&lead_id=${encodeURIComponent(leadIdRef.value || '')}`
      )
      if (data?.success && data.signedUrl) {
        const ttlMs = (data.expiresInSeconds || 300) * 1000
        thumbnailCache.value[mediaId] = {
          url: data.signedUrl,
          loading: false,
          error: false,
          expiresAt: now + ttlMs
        }
        return data.signedUrl
      }
    } catch {
      if (thumbnailCache.value[mediaId]) {
        thumbnailCache.value[mediaId].error = true
        thumbnailCache.value[mediaId].loading = false
      }
    }
    return null
  }

  async function loadPhotoThumbnails(mediaList: any[]) {
    const photos = mediaList.filter(m => m.media_type === 'photo' && m.upload_status === 'uploaded')

    for (const photo of photos) {
      const cached = thumbnailCache.value[photo.id]
      if (!cached || cached.expiresAt <= Date.now() + 20000) {
        thumbnailCache.value[photo.id] = {
          url: '',
          loading: true,
          error: false,
          expiresAt: 0
        }
      }
    }

    await Promise.allSettled(
      photos.map(async (photo) => {
        const url = await requestSignedUrl(photo.id)
        if (url && thumbnailCache.value[photo.id]) {
          thumbnailCache.value[photo.id].url = url
          thumbnailCache.value[photo.id].loading = false
          thumbnailCache.value[photo.id].error = false
        }
      })
    )
  }

  async function retryPhotoThumbnail(photoId: string) {
    if (thumbnailCache.value[photoId]) {
      thumbnailCache.value[photoId].loading = true
      thumbnailCache.value[photoId].error = false
    }
    const url = await requestSignedUrl(photoId)
    if (url && thumbnailCache.value[photoId]) {
      thumbnailCache.value[photoId].url = url
      thumbnailCache.value[photoId].loading = false
      thumbnailCache.value[photoId].error = false
    }
  }

  return {
    thumbnailCache,
    requestSignedUrl,
    loadPhotoThumbnails,
    retryPhotoThumbnail
  }
}
