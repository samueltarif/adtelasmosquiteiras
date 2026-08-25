import {
  getR2Config as getR2ConfigCore,
  isR2Configured as isR2ConfiguredCore,
  getS3Client as getS3ClientCore,
  generatePresignedUploadUrl as generatePresignedUploadUrlCore,
  generatePresignedDownloadUrl as generatePresignedDownloadUrlCore,
  verifyObjectInR2 as verifyObjectInR2Core,
  verifyAndPromoteObject as verifyAndPromoteObjectCore,
  deleteObjectImmediately as deleteObjectImmediatelyCore,
  deleteLeadObjectsFromR2 as deleteLeadObjectsFromR2Core
} from '../shared/r2StorageCore.mjs'

import type { S3Client } from '@aws-sdk/client-s3'

export interface R2Config {
  accountId?: string
  accessKeyId?: string
  secretAccessKey?: string
  bucketName?: string
}

export function getR2Config(): R2Config {
  return getR2ConfigCore()
}

export function isR2Configured(config?: R2Config): boolean {
  return isR2ConfiguredCore(config)
}

export function getS3Client(config?: R2Config): S3Client {
  return getS3ClientCore(config) as S3Client
}

export async function generatePresignedUploadUrl(
  tempStorageKey: string,
  mimeType: string,
  expiresInSeconds = 900,
  s3ClientOverride?: S3Client
): Promise<string> {
  return generatePresignedUploadUrlCore(tempStorageKey, mimeType, expiresInSeconds, s3ClientOverride)
}

export async function generatePresignedDownloadUrl(
  finalStorageKey: string,
  expiresInSeconds = 300,
  s3ClientOverride?: S3Client
): Promise<string> {
  return generatePresignedDownloadUrlCore(finalStorageKey, expiresInSeconds, s3ClientOverride)
}

export async function verifyObjectInR2(
  tempStorageKey: string,
  expectedMime: string,
  maxBytes: number,
  s3ClientOverride?: S3Client
): Promise<{ verified: boolean; actualBytes: number; actualMime: string }> {
  return verifyObjectInR2Core(tempStorageKey, expectedMime, maxBytes, s3ClientOverride)
}

export async function verifyAndPromoteObject(params: {
  tempKey: string
  finalKey: string
  expectedMime: string
  maxBytes: number
  s3ClientOverride?: S3Client
}): Promise<{ promoted: boolean; actualBytes: number }> {
  return verifyAndPromoteObjectCore(params)
}

export async function deleteObjectImmediately(
  storageKey: string,
  s3ClientOverride?: S3Client
): Promise<void> {
  return deleteObjectImmediatelyCore(storageKey, s3ClientOverride)
}

export async function deleteLeadObjectsFromR2(
  storageKeys: string[],
  s3ClientOverride?: S3Client
): Promise<void> {
  return deleteLeadObjectsFromR2Core(storageKeys, s3ClientOverride)
}
