import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { validateMediaMagicBytes } from './leadEmailCore.mjs'

let cachedS3Client = null

export function getR2Config() {
  return {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_LEADS_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'adtelas-leads-private'
  }
}

export function isR2Configured(config) {
  const cfg = config || getR2Config()
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

export function getS3Client(config) {
  if (cachedS3Client) return cachedS3Client

  const cfg = config || getR2Config()
  if (!isR2Configured(cfg)) {
    cachedS3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${cfg.accountId || 'mock-account'}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: cfg.accessKeyId || 'mock-key',
        secretAccessKey: cfg.secretAccessKey || 'mock-secret'
      }
    })
    return cachedS3Client
  }

  cachedS3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey
    }
  })

  return cachedS3Client
}

export async function generatePresignedUploadUrl(tempStorageKey, mimeType, expiresInSeconds = 900, s3ClientOverride) {
  const cfg = getR2Config()
  const client = s3ClientOverride || getS3Client(cfg)

  if (!isR2Configured(cfg) && !s3ClientOverride) {
    return `https://${cfg.accountId || 'account'}.r2.cloudflarestorage.com/${cfg.bucketName}/${tempStorageKey}?X-Amz-Signature=mock_presigned_upload_url`
  }

  const command = new PutObjectCommand({
    Bucket: cfg.bucketName,
    Key: tempStorageKey,
    ContentType: mimeType
  })

  return await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds
  })
}

export async function generatePresignedDownloadUrl(finalStorageKey, expiresInSeconds = 300, s3ClientOverride) {
  const cfg = getR2Config()
  const client = s3ClientOverride || getS3Client(cfg)

  if (!isR2Configured(cfg) && !s3ClientOverride) {
    return `https://${cfg.accountId || 'account'}.r2.cloudflarestorage.com/${cfg.bucketName}/${finalStorageKey}?X-Amz-Signature=mock_presigned_download_url`
  }

  const command = new GetObjectCommand({
    Bucket: cfg.bucketName,
    Key: finalStorageKey
  })

  return await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds
  })
}

export async function verifyObjectInR2(tempStorageKey, expectedMime, maxBytes, s3ClientOverride) {
  const cfg = getR2Config()
  const client = s3ClientOverride || getS3Client(cfg)

  if (!isR2Configured(cfg) && !s3ClientOverride) {
    return { verified: true, actualBytes: 1024, actualMime: expectedMime }
  }

  // 1. HeadObject: Validação rápida de tamanho e existência
  const head = await client.send(new HeadObjectCommand({
    Bucket: cfg.bucketName,
    Key: tempStorageKey
  }))

  const actualBytes = head.ContentLength || 0
  const actualMime = head.ContentType || ''

  if (actualBytes === 0) {
    throw new Error('Objeto no R2 está vazio (0 bytes)')
  }

  if (maxBytes > 0 && actualBytes > maxBytes) {
    throw new Error(`Tamanho do objeto (${Math.round(actualBytes / 1024)} KB) excede o limite autorizado (${Math.round(maxBytes / 1024)} KB)`)
  }

  // 2. GetObject com Range 0-511 bytes: Validação de Magic Bytes sem baixar o arquivo integral
  // (MAGIC_BYTE_RANGE_SIZE = 512_BYTES, SERVER_FULL_VIDEO_DOWNLOAD_DURING_FINALIZE = NO)
  try {
    const rangeRes = await client.send(new GetObjectCommand({
      Bucket: cfg.bucketName,
      Key: tempStorageKey,
      Range: 'bytes=0-511'
    }))

    if (rangeRes?.Body) {
      const chunks = []
      for await (const chunk of rangeRes.Body) {
        chunks.push(chunk)
      }
      const magicBuffer = Buffer.concat(chunks)
      const isMagicValid = validateMediaMagicBytes(magicBuffer, expectedMime)
      if (!isMagicValid) {
        throw new Error(`Assinatura de arquivo (Magic Bytes) incompatível com ${expectedMime}`)
      }
    }
  } catch (rangeErr) {
    // Se a validação de magic bytes falhou explicitamente, propaga o erro
    if (rangeErr?.message?.includes('Magic Bytes')) {
      throw rangeErr
    }
    console.warn('[r2Storage] Aviso ao validar Range de Magic Bytes:', rangeErr?.message || rangeErr)
  }

  return { verified: true, actualBytes, actualMime }
}

export async function verifyAndPromoteObject(params) {
  const cfg = getR2Config()
  const client = params.s3ClientOverride || getS3Client(cfg)

  const t0 = performance.now()
  const { actualBytes } = await verifyObjectInR2(
    params.tempKey,
    params.expectedMime,
    params.maxBytes,
    params.s3ClientOverride
  )
  const tVerify = performance.now()

  let copyMs = 0
  if (params.s3ClientOverride || isR2Configured(cfg)) {
    const tCopyStart = performance.now()
    await client.send(new CopyObjectCommand({
      Bucket: cfg.bucketName,
      CopySource: `${cfg.bucketName}/${params.tempKey}`,
      Key: params.finalKey,
      ContentType: params.expectedMime
    }))
    copyMs = performance.now() - tCopyStart
  }

  return { promoted: true, actualBytes, verifyMs: tVerify - t0, copyMs }
}

export async function deleteObjectImmediately(storageKey, s3ClientOverride) {
  const cfg = getR2Config()
  const client = s3ClientOverride || getS3Client(cfg)

  if (!isR2Configured(cfg) && !s3ClientOverride) {
    return
  }

  try {
    await client.send(new DeleteObjectCommand({
      Bucket: cfg.bucketName,
      Key: storageKey
    }))
  } catch (err) {
    console.warn(`[r2Storage] Falha ao deletar objeto ${storageKey}:`, err?.message || err)
  }
}

export async function deleteLeadObjectsFromR2(storageKeys, s3ClientOverride) {
  if (!storageKeys || storageKeys.length === 0) return

  const cfg = getR2Config()
  const client = s3ClientOverride || getS3Client(cfg)

  if (!isR2Configured(cfg) && !s3ClientOverride) {
    return
  }

  try {
    await client.send(new DeleteObjectsCommand({
      Bucket: cfg.bucketName,
      Delete: {
        Objects: storageKeys.map(k => ({ Key: k })),
        Quiet: true
      }
    }))
  } catch (err) {
    console.error('[r2Storage] Erro ao deletar lote de objetos no R2:', err?.message || err)
  }
}
