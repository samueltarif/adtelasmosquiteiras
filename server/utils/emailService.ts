import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  validateLeadName,
  validateLeadPhone,
  validateLeadEmail,
  normalizePhoneForWhatsApp,
  formatDateTimeSP,
  sanitizeEmailError,
  generateEmailSubject,
  generateEmailHTML,
  generateEmailText,
  isEmailConfigured,
  validateMediaMagicBytes
} from '../shared/leadEmailCore.mjs'

// Re-export pure functions from shared core
export {
  validateLeadName,
  validateLeadPhone,
  validateLeadEmail,
  normalizePhoneForWhatsApp,
  formatDateTimeSP,
  sanitizeEmailError,
  generateEmailSubject,
  generateEmailHTML,
  generateEmailText,
  isEmailConfigured,
  validateMediaMagicBytes
}

/**
 * ======================================================================
 * EMAIL SERVICE — AD Telas e Redes (Runtime Nitro/Server)
 * ======================================================================
 * REGRAS DE SEGURANÇA E DATA-ONLY:
 * 1. EMAIL_HAS_ATTACHMENTS = NO (Nenhum anexo binário de cliente).
 * 2. EMAIL_BRAND_ATTACHMENT = CID_LOGO_ONLY (Logo da AD Telas via CID inline).
 * 3. EMAIL_MEDIA_CLAIM = NONE (Nenhuma menção prematura sobre arquivos).
 * 4. Nunca logar senhas de aplicativo ou tokens.
 * ======================================================================
 */

let cachedTransporter: Transporter | null = null
let cachedBrandIcon: Buffer | null = null

/**
 * Obtém o buffer do ícone da marca oficial para anexo inline CID.
 */
export function getBrandIconBuffer(): Buffer {
  if (cachedBrandIcon) return cachedBrandIcon

  const candidates = [
    join(process.cwd(), 'public/images/logo_adt_telas_nova.png'),
    join(process.cwd(), 'public/favicon.ico')
  ]

  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        cachedBrandIcon = readFileSync(p)
        return cachedBrandIcon
      } catch {}
    }
  }

  // Fallback seguro em buffer PNG caso arquivos estáticos estejam em caminho virtual
  cachedBrandIcon = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
  return cachedBrandIcon
}

/**
 * Cria ou reutiliza um transporter SMTP configurado para Gmail.
 */
function getTransporter(config: { gmailEmail: string; gmailAppPassword: string }): Transporter {
  if (cachedTransporter) return cachedTransporter

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.gmailEmail,
      pass: config.gmailAppPassword
    },
    connectionTimeout: 10000, // 10 segundos
    greetingTimeout: 10000,   // 10 segundos
    socketTimeout: 15000      // 15 segundos
  })

  return cachedTransporter
}

export interface LeadNotificationData {
  nome: string
  telefone?: string | null
  email?: string | null
  cidade?: string | null
  bairro?: string | null
  servico?: string | null
  mensagem?: string | null
  origem?: string | null
  submission_id?: string | null
  visitor_id?: string | null
  session_id?: string | null
  session_channel?: string | null
  first_touch_channel?: string | null
  landing_path?: string | null
  conversion_path?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
  gclid?: string | null
}

/**
 * Envia o e-mail de notificação de lead via SMTP Gmail DATA-ONLY com branding inline CID.
 */
export async function sendLeadNotificationEmail(
  lead: LeadNotificationData,
  config: {
    gmailEmail: string
    gmailAppPassword: string
    leadNotificationEmail?: string
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!isEmailConfigured(config)) {
      return { success: false, error: 'Credenciais SMTP não configuradas' }
    }

    const transporter = getTransporter(config)
    const recipient = config.leadNotificationEmail || config.gmailEmail
    const subject = generateEmailSubject(lead.servico)
    const html = generateEmailHTML(lead)
    const text = generateEmailText(lead)

    // Apenas anexo inline do logo corporativo oficial da marca (CID)
    const attachments: Array<{ filename: string; content: Buffer; cid?: string; contentDisposition?: 'inline' }> = [
      {
        filename: 'adtelas-icon.png',
        content: getBrandIconBuffer(),
        cid: 'adtelas-icon',
        contentDisposition: 'inline'
      }
    ]

    const info = await transporter.sendMail({
      from: `"AD Telas e Redes" <${config.gmailEmail}>`,
      to: recipient,
      subject,
      html,
      text,
      attachments
    })

    return { success: true, messageId: info.messageId }
  } catch (err: any) {
    const sanitizedError = sanitizeEmailError(err)
    console.error('[emailService] Falha no envio SMTP:', sanitizedError)
    return { success: false, error: sanitizedError }
  }
}
