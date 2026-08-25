import { createHmac, timingSafeEqual } from 'crypto'

/**
 * ======================================================================
 * MEDIA AUTH CORE — AD Telas e Redes (Módulo Puro e Compartilhável)
 * ======================================================================
 * Gerador e validador de tokens HMAC-SHA256 para autorização de upload.
 * ======================================================================
 */

function getSigningSecret() {
  const secret = process.env.MEDIA_UPLOAD_SIGNING_SECRET
  if (secret && secret.trim() !== '') {
    return secret.trim()
  }
  return 'default_internal_fallback_media_secret_change_in_production'
}

function base64UrlEncode(data) {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return Buffer.from(base64, 'base64').toString('utf-8')
}

export function createMediaUploadToken(params) {
  const secret = getSigningSecret()
  const ttl = params.ttlSeconds || 15 * 60
  const exp = Math.floor(Date.now() / 1000) + ttl

  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    leadId: params.leadId,
    submissionId: params.submissionId,
    maxFiles: params.maxFiles || 6,
    maxBytes: params.maxBytes || 50 * 1024 * 1024,
    exp
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const dataToSign = `${encodedHeader}.${encodedPayload}`

  const signature = createHmac('sha256', secret)
    .update(dataToSign)
    .digest()
  const encodedSignature = base64UrlEncode(signature)

  return `${dataToSign}.${encodedSignature}`
}

export function verifyMediaUploadToken(token) {
  if (!token || typeof token !== 'string') {
    const err = new Error('Token de upload não fornecido')
    err.statusCode = 401
    throw err
  }

  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    const err = new Error('Formato de token de upload inválido')
    err.statusCode = 401
    throw err
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const secret = getSigningSecret()
  const dataToSign = `${encodedHeader}.${encodedPayload}`

  const expectedSignature = createHmac('sha256', secret)
    .update(dataToSign)
    .digest()
  const providedSignature = Buffer.from(
    encodedSignature.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((encodedSignature.length + 3) % 4),
    'base64'
  )

  if (expectedSignature.length !== providedSignature.length || !timingSafeEqual(expectedSignature, providedSignature)) {
    const err = new Error('Assinatura do token de upload inválida ou forjada')
    err.statusCode = 403
    throw err
  }

  let payload
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload))
  } catch {
    const err = new Error('Payload do token de upload corrompido')
    err.statusCode = 401
    throw err
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp < now) {
    const err = new Error('Token de upload expirado. Inicie nova solicitação')
    err.statusCode = 401
    throw err
  }

  if (!payload.leadId || !payload.submissionId) {
    const err = new Error('Token de upload incompleto (lead_id ou submission_id ausente)')
    err.statusCode = 401
    throw err
  }

  return payload
}
