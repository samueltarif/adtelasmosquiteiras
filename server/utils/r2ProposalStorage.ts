/**
 * Utilitário de Armazenamento R2 Privado para Propostas Comerciais
 * Arquivo: server/utils/r2ProposalStorage.ts
 */

import {
  buildProposalStorageKey as buildKeyCore,
  isValidProposalStorageKey as isValidKeyCore,
  uploadProposalPdfToR2 as uploadCore,
  headProposalObjectInR2 as headCore,
  generateProposalSignedDownloadUrl as generateSignedUrlCore
} from '../shared/proposalCore.mjs'
import type { S3Client } from '@aws-sdk/client-s3'

export function buildProposalStorageKey(workOrderId: string, proposalId: string): string {
  return buildKeyCore(workOrderId, proposalId)
}

export function isValidProposalStorageKey(key: string, expectedWorkOrderId?: string, expectedProposalId?: string): boolean {
  return isValidKeyCore(key, expectedWorkOrderId, expectedProposalId)
}

export async function uploadProposalPdfToR2(
  storageKey: string,
  pdfBuffer: Buffer,
  s3ClientOverride?: S3Client
): Promise<{ success: boolean; bytes: number }> {
  return uploadCore(storageKey, pdfBuffer, s3ClientOverride)
}

export async function headProposalObjectInR2(
  storageKey: string,
  s3ClientOverride?: S3Client
): Promise<{ exists: boolean; contentLength?: number; contentType?: string }> {
  return headCore(storageKey, s3ClientOverride)
}

export async function generateProposalSignedDownloadUrl(
  storageKey: string,
  expiresInSeconds = 300,
  s3ClientOverride?: S3Client
): Promise<string> {
  return generateSignedUrlCore(storageKey, expiresInSeconds, s3ClientOverride)
}
