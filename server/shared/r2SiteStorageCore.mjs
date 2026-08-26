import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  ALLOWED_SERVICE_KEYS,
  ALLOWED_MIME_TYPES,
  MIME_TO_EXT,
  SITE_MEDIA_LIMITS,
  validateServiceKey,
  validateMediaTypeAndMime,
  validateFileSize,
  generateSiteMediaStorageKey,
  validateStorageKeyFormat,
  validateSiteMediaMagicBytes,
  sanitizeAltText,
  sanitizeCaption,
  sanitizeTitle,
  buildPublicMediaUrl
} from './siteMediaCore.mjs'

// Re-export core helpers
export {
  ALLOWED_SERVICE_KEYS,
  ALLOWED_MIME_TYPES,
  MIME_TO_EXT,
  SITE_MEDIA_LIMITS,
  validateServiceKey,
  validateMediaTypeAndMime,
  validateFileSize,
  generateSiteMediaStorageKey,
  validateStorageKeyFormat,
  validateSiteMediaMagicBytes,
  sanitizeAltText,
  sanitizeCaption,
  sanitizeTitle,
  buildPublicMediaUrl
}

let cachedSiteS3Client = null

/**
 * Lê as configurações exclusivas do Cloudflare R2 para Site Media.
 * NUNCA reutiliza credenciais de adtelas-leads-private.
 */
export function getSiteR2Config() {
  return {
    accountId: process.env.R2_SITE_MEDIA_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_SITE_MEDIA_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SITE_MEDIA_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_SITE_MEDIA_BUCKET_NAME || 'adtelas-site-media',
    endpoint: process.env.R2_SITE_MEDIA_ENDPOINT || '',
    publicBaseUrl: process.env.R2_SITE_MEDIA_PUBLIC_BASE_URL || 'https://media.adtelasmosquiteiras.com.br'
  }
}

/**
 * Verifica se as credenciais do bucket de mídias públicas do site estão devidamente configuradas.
 */
export function isSiteR2Configured(config) {
  const cfg = config || getSiteR2Config()
  return !!(
    cfg.accountId &&
    !cfg.accountId.includes('mock') &&
    !cfg.accountId.includes('your_') &&
    cfg.accessKeyId &&
    !cfg.accessKeyId.includes('mock') &&
    !cfg.accessKeyId.includes('your_') &&
    cfg.secretAccessKey &&
    !cfg.secretAccessKey.includes('mock') &&
    !cfg.secretAccessKey.includes('your_') &&
    cfg.bucketName
  )
}

/**
 * Retorna uma instância dedicada e isolada do S3Client para o bucket de mídias públicas do site.
 */
export function getSiteS3Client(config) {
  if (cachedSiteS3Client && !config) return cachedSiteS3Client

  const cfg = config || getSiteR2Config()
  const endpointUrl = cfg.endpoint && cfg.endpoint.trim() !== ''
    ? cfg.endpoint.trim()
    : `https://${cfg.accountId || 'mock-site-account'}.r2.cloudflarestorage.com`

  const client = new S3Client({
    region: 'auto',
    endpoint: endpointUrl,
    credentials: {
      accessKeyId: cfg.accessKeyId || 'mock-site-key',
      secretAccessKey: cfg.secretAccessKey || 'mock-site-secret'
    }
  })

  if (!config) {
    cachedSiteS3Client = client
  }
  return client
}

/**
 * Gera URL assinada (Presigned PUT) para upload direto do browser ao R2.
 * Assina Content-Type e Cache-Control imutável.
 */
export async function generateSitePresignedUploadUrl(
  storageKey,
  mimeType,
  expiresInSeconds = 900,
  s3ClientOverride
) {
  const config = getSiteR2Config()
  const s3Client = s3ClientOverride || getSiteS3Client(config)

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: storageKey,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000, immutable'
  })

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds })
}

/**
 * Executa HeadObjectCommand no R2 para validar a existência física e metadados do objeto.
 */
export async function headSiteObjectInR2(
  storageKey,
  s3ClientOverride
) {
  const config = getSiteR2Config()
  const s3Client = s3ClientOverride || getSiteS3Client(config)

  try {
    const head = await s3Client.send(
      new HeadObjectCommand({
        Bucket: config.bucketName,
        Key: storageKey
      })
    )

    return {
      exists: true,
      contentLength: head.ContentLength,
      contentType: head.ContentType,
      cacheControl: head.CacheControl,
      etag: head.ETag
    }
  } catch (err) {
    if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404 || err?.statusCode === 404) {
      return { exists: false }
    }
    throw err
  }
}

/**
 * Executa GetObjectCommand com HTTP Range de 512 bytes para ler os Magic Bytes sem baixar o arquivo inteiro.
 */
export async function getSiteObjectMagicBytes(
  storageKey,
  s3ClientOverride
) {
  const config = getSiteR2Config()
  const s3Client = s3ClientOverride || getSiteS3Client(config)

  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: storageKey,
      Range: 'bytes=0-511'
    })
  )

  if (!response.Body) {
    throw new Error('Corpo do objeto vazio na leitura de Magic Bytes')
  }

  // Converter stream do Body para Buffer
  const chunks = []
  for await (const chunk of response.Body) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

/**
 * Exclui com segurança um objeto do bucket de mídias públicas do site.
 */
export async function deleteSiteObjectFromR2(
  storageKey,
  s3ClientOverride
) {
  const config = getSiteR2Config()
  const s3Client = s3ClientOverride || getSiteS3Client(config)

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: storageKey
      })
    )
    return true
  } catch (err) {
    // Se o objeto já não existir (404), trata como sucesso idempotente
    if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
      return true
    }
    console.error('Erro ao excluir objeto do R2 Site Media:', err?.message || err)
    return false
  }
}
