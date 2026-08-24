import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import {
  normalizePhoneForWhatsApp,
  formatDateTimeSP,
  sanitizeEmailError,
  generateEmailSubject,
  generateEmailHTML,
  generateEmailText,
  isEmailConfigured
} from '../shared/leadEmailCore.mjs'

// Re-export pure functions from shared core
export {
  normalizePhoneForWhatsApp,
  formatDateTimeSP,
  sanitizeEmailError,
  generateEmailSubject,
  generateEmailHTML,
  generateEmailText,
  isEmailConfigured
}

// ======================================================================
// EMAIL SERVICE — AD Telas e Redes (Runtime Nitro/Server)
//
// REGRAS DE SEGURANÇA:
// 1. Nunca logar gmailAppPassword, SMTP credentials ou tokens.
// 2. Nunca retornar secrets em payloads HTTP.
// 3. Nunca incluir credenciais em notification_email_last_error.
// 4. Funciona exclusivamente no servidor Nitro (nunca client-side).
// ======================================================================

let cachedTransporter: Transporter | null = null

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
    }
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
 * Envia o e-mail de notificação de lead via SMTP Gmail.
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

    const info = await transporter.sendMail({
      from: `"AD Telas e Redes" <${config.gmailEmail}>`,
      to: recipient,
      subject,
      html,
      text
    })

    return { success: true, messageId: info.messageId }
  } catch (err: any) {
    const sanitizedError = sanitizeEmailError(err)
    console.error('[emailService] Falha no envio SMTP:', sanitizedError)
    return { success: false, error: sanitizedError }
  }
}
