/**
 * Isomorphic Short Code Helper para Frontend e Backend
 * Arquivo: app/utils/whatsappShortCode.ts
 */

export const SHORT_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'
export const SHORT_CODE_LENGTH = 8
export const SHORT_CODE_REGEX = /^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/

export function generateShortCode(): string {
  const alphabet = SHORT_CODE_ALPHABET
  const targetLen = SHORT_CODE_LENGTH
  let code = ''
  const maxValidByte = 240
  const buffer = new Uint8Array(32)

  while (code.length < targetLen) {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(buffer)
    } else {
      throw new Error('WebCrypto getRandomValues is required for secure short_code generation')
    }

    for (let i = 0; i < buffer.length && code.length < targetLen; i++) {
      const b = buffer[i]
      if (b !== undefined && b < maxValidByte) {
        code += alphabet[b % alphabet.length]
      }
    }
  }

  return code.toUpperCase()
}

export function isValidShortCode(code?: string | null): boolean {
  if (!code || typeof code !== 'string') return false
  return SHORT_CODE_REGEX.test(code.trim().toUpperCase())
}

export function cleanWhatsappUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl
  try {
    const parsed = new URL(rawUrl, 'https://wa.me')
    const existingText = parsed.searchParams.get('text')
    if (existingText) {
      const cleaned = existingText.replace(/\s*Ref:\s*[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}/gi, '').trim()
      if (cleaned) {
        parsed.searchParams.set('text', cleaned)
      } else {
        parsed.searchParams.delete('text')
      }
      return parsed.toString()
    }
    return rawUrl
  } catch {
    return rawUrl
  }
}

export function appendShortCodeToWhatsappUrl(rawUrl: string, shortCode: string, options: { replaceExisting?: boolean } = {}): string {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl
  if (!isValidShortCode(shortCode)) return rawUrl

  try {
    const parsed = new URL(rawUrl, 'https://wa.me')
    let existingText = parsed.searchParams.get('text') || ''

    if (!options.replaceExisting && /Ref:\s*[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}/i.test(existingText)) {
      return rawUrl
    }

    if (options.replaceExisting && /Ref:\s*[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}/i.test(existingText)) {
      existingText = existingText.replace(/\s*Ref:\s*[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}/gi, '').trim()
    }

    const cleanCode = shortCode.trim().toUpperCase()
    const separator = existingText ? ' ' : ''
    const updatedText = `${existingText.trim()}${separator}Ref: ${cleanCode}`

    parsed.searchParams.set('text', updatedText)
    return parsed.toString()
  } catch {
    return rawUrl
  }
}

export function extractShortCodeFromMessage(message?: string | null): string | null {
  if (!message || typeof message !== 'string') return null
  const match = message.match(/Ref:\s*([23456789ABCDEFGHJKMNPQRSTVWXYZ]{8})/i)
  if (match && match[1]) {
    return match[1].toUpperCase()
  }
  return null
}
