import { randomUUID } from 'crypto'

/**
 * ======================================================================
 * SITE MEDIA CORE — AD Telas e Redes (Módulo Puro e Compartilhável)
 * ======================================================================
 * Regras canônicas de taxonomia, validação de tipos, Magic Bytes, limites
 * e gerador determinístico de storage keys para mídias públicas do site.
 * ======================================================================
 */

export const ALLOWED_SERVICE_KEYS = [
  'redes_janelas',
  'redes_sacadas',
  'redes_pets',
  'redes_criancas',
  'redes_escadas',
  'telas_janelas',
  'telas_portas',
  'telas_sacadas',
  'telas_removiveis',
  'pet_screen',
  'telas_restaurantes',
  'vidracaria'
]

export const ALLOWED_MIME_TYPES = {
  photo: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/webm']
}

export const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm'
}

export const SITE_MEDIA_LIMITS = {
  MAX_PHOTO_BYTES: 10485760, // 10 MB
  MAX_VIDEO_BYTES: 52428800, // 50 MB
  MAX_FILES_PER_UPLOAD: 10
}

/**
 * Valida se a service_key pertence à allowlist canônica estrita.
 */
export function validateServiceKey(key) {
  if (!key || typeof key !== 'string') return false
  return ALLOWED_SERVICE_KEYS.includes(key.trim())
}

/**
 * Valida consistência de media_type e mime_type.
 */
export function validateMediaTypeAndMime(mediaType, mimeType) {
  if (!mediaType || !mimeType) {
    return { valid: false, error: 'media_type e mime_type são obrigatórios' }
  }

  const type = String(mediaType).toLowerCase().trim()
  const mime = String(mimeType).toLowerCase().trim()

  if (!['photo', 'video'].includes(type)) {
    return { valid: false, error: 'media_type deve ser "photo" ou "video"' }
  }

  const allowedForType = ALLOWED_MIME_TYPES[type] || []
  if (!allowedForType.includes(mime)) {
    return {
      valid: false,
      error: `MIME type "${mime}" não é suportado para o tipo "${type}". Permitidos: ${allowedForType.join(', ')}`
    }
  }

  const ext = MIME_TO_EXT[mime]
  if (!ext) {
    return { valid: false, error: `Extensão não mapeada para MIME "${mime}"` }
  }

  return { valid: true, mediaType: type, mimeType: mime, ext }
}

/**
 * Valida o tamanho informado ou real do arquivo em bytes.
 */
export function validateFileSize(mediaType, bytes) {
  const numBytes = parseInt(bytes, 10)
  if (isNaN(numBytes) || numBytes <= 0) {
    return { valid: false, error: 'Tamanho do arquivo inválido ou zero bytes' }
  }

  if (mediaType === 'photo' && numBytes > SITE_MEDIA_LIMITS.MAX_PHOTO_BYTES) {
    return {
      valid: false,
      error: `Foto excede o limite máximo permitido de ${SITE_MEDIA_LIMITS.MAX_PHOTO_BYTES / (1024 * 1024)} MB (${numBytes} bytes)`
    }
  }

  if (mediaType === 'video' && numBytes > SITE_MEDIA_LIMITS.MAX_VIDEO_BYTES) {
    return {
      valid: false,
      error: `Vídeo excede o limite máximo permitido de ${SITE_MEDIA_LIMITS.MAX_VIDEO_BYTES / (1024 * 1024)} MB (${numBytes} bytes)`
    }
  }

  return { valid: true, bytes: numBytes }
}

/**
 * Gera a storage_key padronizada: services/{service_key}/{uuid}.{ext}
 * Zero inclusão do filename do cliente. UUID gerado server-side.
 */
export function generateSiteMediaStorageKey(serviceKey, mimeType, customUuid) {
  if (!validateServiceKey(serviceKey)) {
    throw new Error(`service_key "${serviceKey}" inválida`)
  }

  const mime = String(mimeType).toLowerCase().trim()
  const ext = MIME_TO_EXT[mime]
  if (!ext) {
    throw new Error(`MIME type "${mime}" não suportado para storage key`)
  }

  const uuid = customUuid || randomUUID()
  return `services/${serviceKey}/${uuid}.${ext}`
}

/**
 * Valida se uma storage_key segue estritamente o padrão services/{service_key}/{uuid}.{ext}
 */
export function validateStorageKeyFormat(storageKey, expectedServiceKey) {
  if (!storageKey || typeof storageKey !== 'string') {
    return { valid: false, error: 'storage_key não fornecida' }
  }

  const cleanKey = storageKey.trim()
  const parts = cleanKey.split('/')

  if (parts.length !== 3 || parts[0] !== 'services') {
    return { valid: false, error: 'storage_key deve iniciar com o prefixo "services/" e ter exatamente 3 segmentos' }
  }

  const serviceKey = parts[1]
  if (!validateServiceKey(serviceKey)) {
    return { valid: false, error: `Segmento de service_key "${serviceKey}" inválido na storage_key` }
  }

  if (expectedServiceKey && serviceKey !== expectedServiceKey) {
    return { valid: false, error: `service_key da storage_key ("${serviceKey}") diverge do serviço informado ("${expectedServiceKey}")` }
  }

  const filename = parts[2]
  const fileParts = filename.split('.')
  if (fileParts.length !== 2) {
    return { valid: false, error: 'Nome do arquivo na storage_key inválido' }
  }

  const uuidPart = fileParts[0]
  const extPart = fileParts[1].toLowerCase()

  // Validação de UUID v4 ou formato hexadecimal com traços
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(uuidPart)) {
    return { valid: false, error: 'Identificador do arquivo na storage_key não é um UUID válido' }
  }

  const validExts = Object.values(MIME_TO_EXT)
  if (!validExts.includes(extPart)) {
    return { valid: false, error: `Extensão ".${extPart}" não suportada na storage_key` }
  }

  return { valid: true, serviceKey, uuid: uuidPart, ext: extPart }
}

/**
 * Valida Magic Bytes / Assinatura binária real do arquivo.
 */
export function validateSiteMediaMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 4) return false
  const mime = (mimeType || '').toLowerCase().trim()

  // JPEG: FF D8 FF
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mime === 'image/png') {
    if (buffer.length < 8) return false
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A
    )
  }

  // WebP: Offset 0 'RIFF' (52 49 46 46) + Offset 8 'WEBP' (57 45 42 50)
  if (mime === 'image/webp') {
    if (buffer.length < 12) return false
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    return isRiff && isWebp
  }

  // MP4 (ISO Base Media File Format): Box 'ftyp' nos bytes 4-7 (66 74 79 70)
  if (mime === 'video/mp4') {
    if (buffer.length >= 8) {
      return buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70
    }
  }

  // WebM: EBML Header (1A 45 DF A3)
  if (mime === 'video/webm') {
    return buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3
  }

  return false
}

/**
 * Remove tags HTML e caracteres maliciosos.
 */
function stripHtml(input) {
  if (!input || typeof input !== 'string') return ''
  return input.replace(/<[^>]*>?/gm, '').trim()
}

/**
 * Valida e sanitiza o Alt Text (obrigatório para acessibilidade e SEO).
 */
export function sanitizeAltText(altText) {
  if (!altText || typeof altText !== 'string') {
    throw new Error('alt_text é obrigatório e deve ser uma string')
  }

  const clean = stripHtml(altText)
  if (clean.length < 3) {
    throw new Error('alt_text deve conter no mínimo 3 caracteres válidos')
  }
  if (clean.length > 255) {
    throw new Error('alt_text excede o limite máximo de 255 caracteres')
  }

  return clean
}

/**
 * Sanitiza legenda opcional.
 */
export function sanitizeCaption(caption) {
  if (!caption || typeof caption !== 'string') return null
  const clean = stripHtml(caption)
  return clean.length > 0 ? clean.slice(0, 1000) : null
}

/**
 * Sanitiza título opcional.
 */
export function sanitizeTitle(title) {
  if (!title || typeof title !== 'string') return null
  const clean = stripHtml(title)
  return clean.length > 0 ? clean.slice(0, 255) : null
}

/**
 * Constrói a URL pública final a partir do custom domain CDN.
 */
export function buildPublicMediaUrl(publicBaseUrl, storageKey) {
  const baseUrl = (publicBaseUrl || 'https://media.adtelasmosquiteiras.com.br').replace(/\/+$/, '')
  const cleanKey = (storageKey || '').replace(/^\/+/, '')
  return `${baseUrl}/${cleanKey}`
}
