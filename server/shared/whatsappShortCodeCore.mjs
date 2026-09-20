/**
 * Utilitário Central do Gerador de Short Code para WhatsApp
 * Arquivo: server/shared/whatsappShortCodeCore.mjs
 *
 * ESPECIFICAÇÃO FASE 1.1 PARTE 3A:
 * - Exatamente 8 caracteres
 * - Alfabeto legível de 30 caracteres (sem 0, O, 1, I, L)
 * - Criptografia segura (crypto.getRandomValues com amostragem uniforme)
 * - Regex: ^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$
 */

export const SHORT_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'
export const SHORT_CODE_LENGTH = 8
export const SHORT_CODE_REGEX = /^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/

/**
 * Gera short code criptograficamente seguro de 8 caracteres
 */
export function generateShortCode() {
  const alphabet = SHORT_CODE_ALPHABET
  const targetLen = SHORT_CODE_LENGTH
  let code = ''
  
  // Amostragem com rejeição para eliminar viés de módulo (256 - (256 % 30) = 240)
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
      if (b < maxValidByte) {
        code += alphabet[b % alphabet.length]
      }
    }
  }

  return code.toUpperCase()
}

/**
 * Valida se a string é um short code de 8 caracteres válido
 */
export function isValidShortCode(code) {
  if (!code || typeof code !== 'string') return false
  return SHORT_CODE_REGEX.test(code.trim().toUpperCase())
}

/**
 * Limpa qualquer código de referência previamente anexado à URL do WhatsApp,
 * restaurando a mensagem original.
 */
export function cleanWhatsappUrl(rawUrl) {
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

/**
 * Anexa o short code de forma não-intrusiva à mensagem do WhatsApp.
 * Preserva integralmente o texto original pré-configurado no botão/página.
 * Se replaceExisting for true, substitui código anterior pelo novo.
 */
export function appendShortCodeToWhatsappUrl(rawUrl, shortCode, options = {}) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl
  if (!isValidShortCode(shortCode)) return rawUrl

  try {
    const parsed = new URL(rawUrl, 'https://wa.me')
    let existingText = parsed.searchParams.get('text') || ''

    // Se já possui Ref e replaceExisting não foi solicitado, mantém
    if (!options.replaceExisting && /Ref:\s*[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}/i.test(existingText)) {
      return rawUrl
    }

    // Se replaceExisting for true, limpa o Ref antigo antes de anexar o novo
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

/**
 * Extrai o short code de 8 caracteres a partir de uma mensagem livre recebida
 */
export function extractShortCodeFromMessage(message) {
  if (!message || typeof message !== 'string') return null
  const match = message.match(/Ref:\s*([23456789ABCDEFGHJKMNPQRSTVWXYZ]{8})/i)
  if (match && match[1]) {
    return match[1].toUpperCase()
  }
  return null
}
