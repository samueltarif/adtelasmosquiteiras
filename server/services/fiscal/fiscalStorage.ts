/**
 * Armazenamento Privado e Download Seguro de Documentos Fiscais (Cloudflare R2)
 */

import crypto from 'crypto'
import { PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Config, isR2Configured, getS3Client } from '../../shared/r2StorageCore.mjs'
import { getSupabaseHeaders, type SupabaseConfig } from '../../utils/crm'

export function buildFiscalStorageKey(
  environment: string,
  docType: string,
  documentId: string,
  fileName: string
): string {
  const env = String(environment).toLowerCase().trim()
  const type = String(docType).toLowerCase().trim()
  const docId = String(documentId).toLowerCase().trim()
  const safeFile = fileName.replace(/[^a-zA-Z0-9._-]/g, '')
  return `fiscal/${env}/${type}/${docId}/${safeFile}`
}

export async function uploadFiscalFileToR2(
  storageKey: string,
  buffer: Buffer,
  contentType: string
): Promise<{ success: boolean; sha256: string; sizeBytes: number }> {
  const cfg = getR2Config()
  const bucketName = process.env.R2_FISCAL_BUCKET_NAME || cfg.bucketName
  const client = getS3Client(cfg)
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')
  const sizeBytes = buffer.length

  if (!isR2Configured(cfg)) {
    return { success: true, sha256, sizeBytes }
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: storageKey,
    ContentType: contentType,
    ContentLength: sizeBytes,
    Body: buffer
  })

  await client.send(command)
  return { success: true, sha256, sizeBytes }
}

export async function generateFiscalPresignedUrl(
  storageKey: string,
  expiresInSeconds = 300
): Promise<string> {
  const cfg = getR2Config()
  const bucketName = process.env.R2_FISCAL_BUCKET_NAME || cfg.bucketName
  const client = getS3Client(cfg)

  if (!isR2Configured(cfg)) {
    return `https://${cfg.accountId || 'mock'}.r2.cloudflarestorage.com/${bucketName}/${storageKey}?X-Amz-Signature=mock_presigned_download_url`
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: storageKey
  })

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}

export const getFiscalFilePresignedUrl = generateFiscalPresignedUrl


export async function saveFiscalFileMetadata(
  config: SupabaseConfig,
  params: {
    documentId: string
    fileType: 'xml_autorizado' | 'xml_cancelamento' | 'danfe_pdf' | 'danfse_pdf'
    storageKey: string
    sha256: string
    sizeBytes: number
    contentType: string
  }
) {
  const headers = getSupabaseHeaders(config.serviceRoleKey)
  await $fetch(`${config.url}/rest/v1/fiscal_document_files`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
    body: {
      fiscal_document_id: params.documentId,
      tipo_arquivo: params.fileType,
      storage_key: params.storageKey,
      sha256: params.sha256,
      size_bytes: params.sizeBytes,
      content_type: params.contentType,
      uploaded_at: new Date().toISOString()
    }
  })
}

export async function persistAuthorizedFiscalFiles(
  config: SupabaseConfig,
  doc: { id: string; ambiente: string; tipo_documento: string },
  xmlContent?: string,
  pdfBuffer?: Buffer
): Promise<boolean> {
  let storagePending = false
  try {
    if (xmlContent) {
      const key = buildFiscalStorageKey(doc.ambiente, doc.tipo_documento, doc.id, 'autorizado.xml')
      const up = await uploadFiscalFileToR2(key, Buffer.from(xmlContent, 'utf-8'), 'application/xml')
      await saveFiscalFileMetadata(config, {
        documentId: doc.id,
        fileType: 'xml_autorizado',
        storageKey: key,
        sha256: up.sha256,
        sizeBytes: up.sizeBytes,
        contentType: 'application/xml'
      })
    }
    if (pdfBuffer) {
      const key = buildFiscalStorageKey(doc.ambiente, doc.tipo_documento, doc.id, 'danfe.pdf')
      const up = await uploadFiscalFileToR2(key, pdfBuffer, 'application/pdf')
      await saveFiscalFileMetadata(config, {
        documentId: doc.id,
        fileType: 'danfe_pdf',
        storageKey: key,
        sha256: up.sha256,
        sizeBytes: up.sizeBytes,
        contentType: 'application/pdf'
      })
    }
  } catch {
    storagePending = true
  }
  return storagePending
}

