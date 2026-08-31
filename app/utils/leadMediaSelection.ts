import type { LeadMediaItem } from '~/utils/leadMediaPipeline'

export async function processPhotoFiles(
  files: File[],
  remainingPhotos: number,
  compressImage: (file: File, opts: any) => Promise<any>
): Promise<LeadMediaItem[]> {
  if (remainingPhotos <= 0) {
    alert(`Você já atingiu o limite de fotos.`)
    return []
  }

  const allowedFiles = files.slice(0, remainingPhotos)
  const items: LeadMediaItem[] = []

  for (const file of allowedFiles) {
    if (!file.type.startsWith('image/')) {
      alert(`O arquivo "${file.name}" não é uma imagem válida.`)
      continue
    }

    const t0 = performance.now()
    try {
      const compressed = await compressImage(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.8
      })
      const t1 = performance.now()

      if (import.meta.dev) {
        console.log(`[MediaTiming] Foto "${file.name}": compressão em ${(t1 - t0).toFixed(1)}ms (${Math.round(file.size / 1024)}KB ➔ ${Math.round(compressed.size / 1024)}KB)`)
      }

      items.push({
        id: crypto.randomUUID(),
        type: 'photo',
        name: compressed.name || (file.name.replace(/\.[^/.]+$/, '') + '.jpg'),
        mime: 'image/jpeg',
        size: compressed.size || file.size,
        blob: compressed.blob || file,
        previewUrl: compressed.dataUrl,
        status: 'selected',
        progress: 0,
        retryCount: 0,
        errorMessage: ''
      })
    } catch {
      console.error('[MediaUploader] Erro ao comprimir imagem')
      alert(`Não foi possível processar a foto "${file.name}".`)
    }
  }

  return items
}

export function processVideoFiles(
  files: File[],
  remainingVideos: number
): LeadMediaItem[] {
  if (remainingVideos <= 0) {
    alert(`Você já atingiu o limite de vídeos.`)
    return []
  }

  const allowedFiles = files.slice(0, remainingVideos)
  const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime']
  const items: LeadMediaItem[] = []

  for (const file of allowedFiles) {
    const mime = (file.type || '').toLowerCase()
    const isAllowed = allowedMimes.includes(mime) || file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.mov')

    if (!isAllowed) {
      alert(`O arquivo "${file.name}" não é um vídeo suportado (MP4, WebM ou MOV).`)
      continue
    }

    if (file.size > 25 * 1024 * 1024) {
      alert(`O vídeo "${file.name}" tem ${Math.round(file.size / (1024 * 1024))} MB. O tamanho máximo permitido é 25 MB.`)
      continue
    }

    let effectiveMime = mime
    if (!effectiveMime) {
      if (file.name.endsWith('.mp4')) effectiveMime = 'video/mp4'
      else if (file.name.endsWith('.webm')) effectiveMime = 'video/webm'
      else if (file.name.endsWith('.mov')) effectiveMime = 'video/quicktime'
      else effectiveMime = 'video/mp4'
    }

    items.push({
      id: crypto.randomUUID(),
      type: 'video',
      name: file.name,
      mime: effectiveMime,
      size: file.size,
      blob: file,
      previewUrl: URL.createObjectURL(file),
      status: 'selected',
      progress: 0,
      retryCount: 0,
      errorMessage: ''
    })
  }

  return items
}
