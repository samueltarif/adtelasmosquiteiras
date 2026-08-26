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
  buildPublicMediaUrl,
  getSiteR2Config as getSiteR2ConfigCore,
  isSiteR2Configured as isSiteR2ConfiguredCore,
  getSiteS3Client as getSiteS3ClientCore,
  generateSitePresignedUploadUrl as generateSitePresignedUploadUrlCore,
  headSiteObjectInR2 as headSiteObjectInR2Core,
  getSiteObjectMagicBytes as getSiteObjectMagicBytesCore,
  deleteSiteObjectFromR2 as deleteSiteObjectFromR2Core
} from '../shared/r2SiteStorageCore.mjs'

import type { S3Client } from '@aws-sdk/client-s3'

// Re-export pure helpers
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

export interface SiteR2Config {
  accountId?: string
  accessKeyId?: string
  secretAccessKey?: string
  bucketName?: string
  endpoint?: string
  publicBaseUrl?: string
}

export function getSiteR2Config(): SiteR2Config {
  return getSiteR2ConfigCore()
}

export function isSiteR2Configured(config?: SiteR2Config): boolean {
  return isSiteR2ConfiguredCore(config)
}

export function getSiteS3Client(config?: SiteR2Config): S3Client {
  return getSiteS3ClientCore(config) as S3Client
}

export async function generateSitePresignedUploadUrl(
  storageKey: string,
  mimeType: string,
  expiresInSeconds = 900,
  s3ClientOverride?: S3Client
): Promise<string> {
  return generateSitePresignedUploadUrlCore(storageKey, mimeType, expiresInSeconds, s3ClientOverride)
}

export async function headSiteObjectInR2(
  storageKey: string,
  s3ClientOverride?: S3Client
): Promise<{
  exists: boolean
  contentLength?: number
  contentType?: string
  cacheControl?: string
  etag?: string
}> {
  return headSiteObjectInR2Core(storageKey, s3ClientOverride)
}

export async function getSiteObjectMagicBytes(
  storageKey: string,
  s3ClientOverride?: S3Client
): Promise<Buffer> {
  return getSiteObjectMagicBytesCore(storageKey, s3ClientOverride)
}

export async function deleteSiteObjectFromR2(
  storageKey: string,
  s3ClientOverride?: S3Client
): Promise<boolean> {
  return deleteSiteObjectFromR2Core(storageKey, s3ClientOverride)
}
