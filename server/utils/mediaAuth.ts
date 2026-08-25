import {
  createMediaUploadToken as createTokenCore,
  verifyMediaUploadToken as verifyTokenCore
} from '../shared/mediaAuthCore.mjs'

export interface MediaUploadTokenPayload {
  leadId: string
  submissionId: string
  maxFiles: number
  maxBytes: number
  exp: number
}

export function createMediaUploadToken(params: {
  leadId: string
  submissionId: string
  maxFiles?: number
  maxBytes?: number
  ttlSeconds?: number
}): string {
  return createTokenCore(params)
}

export function verifyMediaUploadToken(token: string): MediaUploadTokenPayload {
  return verifyTokenCore(token) as MediaUploadTokenPayload
}
