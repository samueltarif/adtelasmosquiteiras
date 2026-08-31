/**
 * Pipeline de upload direto para Cloudflare R2 com concorrência limitada.
 * LOC <= 200
 */

export interface LeadMediaItem {
  id: string
  type: 'photo' | 'video'
  name: string
  mime: string
  size: number
  blob: Blob | File
  previewUrl: string
  status: 'selected' | 'waiting' | 'preparing' | 'uploading' | 'finalizing' | 'uploaded' | 'failed'
  progress: number
  retryCount: number
  errorMessage: string
}

export async function uploadSingleLeadMedia(
  item: LeadMediaItem,
  uploadToken: string,
  signal?: AbortSignal
): Promise<{ success: boolean; alreadyUploaded?: boolean; aborted?: boolean; error?: unknown }> {
  const MAX_AUTO_RETRIES = 1
  let attempt = 0

  while (attempt <= MAX_AUTO_RETRIES) {
    attempt++
    const tStart = performance.now()
    try {
      item.status = 'preparing'
      const t2 = performance.now()

      const authRes = await $fetch<{ alreadyUploaded?: boolean; presignedUrl?: string }>('/api/media/authorize-upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${uploadToken}` },
        body: {
          client_media_id: item.id,
          media_type: item.type,
          mime_type: item.mime,
          file_size_bytes: item.size,
          original_filename: item.name
        },
        signal
      })

      const t3 = performance.now()
      if (authRes?.alreadyUploaded) {
        item.status = 'uploaded'
        return { success: true, alreadyUploaded: true }
      }

      if (!authRes?.presignedUrl) {
        throw new Error('Servidor não retornou URL de upload')
      }

      item.status = 'uploading'
      const t4 = performance.now()

      const uploadResponse = await fetch(authRes.presignedUrl, {
        method: 'PUT',
        body: item.blob,
        headers: { 'Content-Type': item.mime },
        signal
      })

      const t5 = performance.now()
      if (!uploadResponse.ok) {
        throw new Error(`Falha no storage R2 (HTTP ${uploadResponse.status})`)
      }

      item.status = 'finalizing'
      const t6 = performance.now()

      const finalizeRes = await $fetch<{ success?: boolean }>('/api/media/finalize-upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${uploadToken}` },
        body: { client_media_id: item.id },
        signal
      })

      const t7 = performance.now()
      if (finalizeRes?.success) {
        item.status = 'uploaded'
        item.errorMessage = ''

        if (import.meta.dev) {
          const authMs = (t3 - t2).toFixed(1)
          const putMs = (t5 - t4).toFixed(1)
          const finMs = (t7 - t6).toFixed(1)
          const totalMs = (t7 - tStart).toFixed(1)
          console.log(`[MediaTiming] "${item.name}" CONCLUÍDO em ${totalMs}ms (Auth: ${authMs}ms | R2 PUT: ${putMs}ms | Fin: ${finMs}ms)`)
        }
        return { success: true }
      } else {
        throw new Error('Falha na verificação de integridade')
      }
    } catch (err) {
      if (signal?.aborted) {
        item.status = 'failed'
        item.errorMessage = 'Upload cancelado'
        return { success: false, aborted: true }
      }

      if (attempt <= MAX_AUTO_RETRIES) {
        if (import.meta.dev) {
          console.warn('[MediaUploader] Tentativa de envio falhou. Tentando novamente...')
        }
        await new Promise(r => setTimeout(r, 800))
        continue
      }

      console.error('[MediaUploader] Erro definitivo no envio de arquivo')
      item.status = 'failed'
      item.errorMessage = err instanceof Error ? err.message : 'Falha no envio'
      return { success: false, error: err }
    }
  }

  return { success: false }
}

export async function runConcurrentLeadUploads(
  itemsToUpload: LeadMediaItem[],
  uploadToken: string,
  concurrency: number = 2,
  signal?: AbortSignal,
  onItemDone?: () => void
): Promise<any[]> {
  let currentIndex = 0
  const results: any[] = []
  const executing: Promise<void>[] = []

  const enqueue = (): Promise<void> => {
    if (currentIndex >= itemsToUpload.length) return Promise.resolve()
    const item = itemsToUpload[currentIndex++]

    item.status = 'waiting'
    const p = uploadSingleLeadMedia(item, uploadToken, signal)
      .then(res => {
        results.push(res)
      })
      .finally(() => {
        executing.splice(executing.indexOf(p), 1)
        if (onItemDone) onItemDone()
      })

    executing.push(p)

    let r = Promise.resolve()
    if (executing.length >= concurrency) {
      r = Promise.race(executing)
    }
    return r.then(() => enqueue())
  }

  await enqueue().then(() => Promise.all(executing))
  return results
}
