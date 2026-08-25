/**
 * Composable para compressão e validação rápida e segura de imagens no client-side.
 * Otimizado para alta performance e baixo consumo de memória:
 * - Utiliza URL.createObjectURL em vez de FileReader (sem conversão Base64 massiva).
 * - PHOTO_COMPRESSION_SKIP_THRESHOLD = 120 KB (não re-comprime arquivos já pequenos).
 * - Proteção estrita contra 0-byte blobs.
 * - Limpeza garantida de Object URLs.
 */
export function useImageCompressor() {
  const MAX_RAW_FILE_SIZE_BYTES = 15 * 1024 * 1024 // 15 MB antes de comprimir
  const MAX_DIMENSION = 1280 // Largura ou altura máxima em pixels
  const JPEG_QUALITY = 0.8 // Qualidade de compressão
  const SKIP_COMPRESSION_THRESHOLD_BYTES = 120 * 1024 // 120 KB

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  /**
   * Comprime um arquivo File individual usando HTML5 Canvas de forma eficiente.
   * @param {File} file Arquivo de imagem selecionado pelo usuário
   * @param {object} [options] Opções personalizadas
   * @returns {Promise<{ name: string, type: string, size: number, dataUrl: string, blob: Blob }>}
   */
  const compressImage = (file, options = {}) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error('Nenhum arquivo fornecido.'))
      }

      const mime = (file.type || '').toLowerCase()
      if (!ALLOWED_TYPES.includes(mime)) {
        return reject(new Error(`O arquivo "${file.name}" não é suportado. Use JPG, PNG ou WebP.`))
      }

      if (file.size > MAX_RAW_FILE_SIZE_BYTES) {
        return reject(new Error(`O arquivo "${file.name}" é muito grande (${Math.round(file.size / 1024 / 1024)}MB). O limite é 15MB.`))
      }

      const maxDim = options.maxWidth || MAX_DIMENSION
      const quality = options.quality || JPEG_QUALITY
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
      const safeName = `${baseName || 'foto'}.jpg`

      const objectUrl = URL.createObjectURL(file)
      const img = new Image()

      const cleanup = () => {
        try {
          URL.revokeObjectURL(objectUrl)
        } catch {}
      }

      img.onerror = () => {
        cleanup()
        reject(new Error(`Erro ao decodificar a imagem "${file.name}".`))
      }

      img.onload = () => {
        try {
          const width = img.naturalWidth || img.width
          const height = img.naturalHeight || img.height

          // 1. Fast-Path: se já for JPEG/WebP pequeno (< 120 KB) e com dimensões <= 1280px, não re-comprime
          if (
            file.size <= SKIP_COMPRESSION_THRESHOLD_BYTES &&
            (mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'image/webp') &&
            width <= maxDim &&
            height <= maxDim
          ) {
            cleanup()
            const previewDataUrl = URL.createObjectURL(file)
            return resolve({
              name: safeName,
              type: file.type,
              size: file.size,
              dataUrl: previewDataUrl,
              blob: file,
              skippedCompression: true
            })
          }

          // 2. Redimensionamento Proporcional
          let targetWidth = width
          let targetHeight = height

          if (targetWidth > maxDim || targetHeight > maxDim) {
            if (targetWidth > targetHeight) {
              targetHeight = Math.round((targetHeight * maxDim) / targetWidth)
              targetWidth = maxDim
            } else {
              targetWidth = Math.round((targetWidth * maxDim) / targetHeight)
              targetHeight = maxDim
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = targetWidth
          canvas.height = targetHeight
          const ctx = canvas.getContext('2d', { alpha: false })

          if (!ctx) {
            cleanup()
            return reject(new Error('Canvas 2D context indisponível.'))
          }

          // Fundo branco sólido para conversão limpa em JPEG
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, targetWidth, targetHeight)
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

          cleanup()

          canvas.toBlob((blob) => {
            if (!blob || blob.size === 0) {
              return reject(new Error(`Falha na compressão da imagem "${file.name}" (0 bytes gerados).`))
            }

            const previewUrl = URL.createObjectURL(blob)

            resolve({
              name: safeName,
              type: 'image/jpeg',
              size: blob.size,
              dataUrl: previewUrl,
              blob: blob,
              skippedCompression: false
            })
          }, 'image/jpeg', quality)

        } catch (canvasErr) {
          cleanup()
          reject(new Error(`Falha ao processar imagem "${file.name}": ${canvasErr.message}`))
        }
      }

      img.src = objectUrl
    })
  }

  return {
    compressImage,
    ALLOWED_TYPES,
    MAX_RAW_FILE_SIZE_BYTES,
    MAX_DIMENSION,
    JPEG_QUALITY,
    SKIP_COMPRESSION_THRESHOLD_BYTES
  }
}
