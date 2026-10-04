import type { H3Event } from 'h3'
import nodemailer from 'nodemailer'
import { isEmailConfigured, getBrandIconBuffer } from './emailService.ts'
import { normalizePhoneForWhatsApp, formatDateTimeSP, escapeHtml, sanitizeEmailError } from '../shared/leadEmailCore.mjs'

export interface WhatsappLeadEmailPayload {
  leadId: string
  leadData: Record<string, any>
  config: {
    supabaseUrl: string
    supabaseServiceRoleKey: string
    gmailEmail?: string
    gmailAppPassword?: string
    leadNotificationEmail?: string
  }
}

export function generateWhatsappLeadEmailSubject(lead: Record<string, any>): string {
  const nome = (lead.nome || '').trim()
  return nome ? `🚨 Novo Lead Recebido: ${nome} — WhatsApp` : '🚨 Novo Lead Recebido — WhatsApp'
}

export function generateWhatsappLeadEmailHTML(lead: Record<string, any>, now = new Date()): string {
  const whatsappNumber = normalizePhoneForWhatsApp(lead.telefone)
  const defaultMsg = `Olá, ${lead.nome || ''}! Recebemos sua solicitação pelo site da AD Telas. Como podemos ajudar com seu orçamento?`
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMsg)}` : null
  const dateStr = formatDateTimeSP(now)
  const gclidCaptured = lead.gclid ? 'Sim' : 'Não'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Novo Lead WhatsApp — AD Telas</title></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
<tr>
<td style="background:linear-gradient(135deg,#1D7BA6,#0F4F7D);padding:20px 28px;text-align:left;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="width:40px;vertical-align:middle;">
<img src="cid:adtelas-icon" width="36" height="36" alt="AD Telas" style="display:block;border-radius:6px;" />
</td>
<td style="padding-left:12px;vertical-align:middle;">
<h1 style="color:#ffffff;margin:0;font-size:18px;font-weight:700;">NOVO LEAD RECEBIDO — WHATSAPP</h1>
<p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:12px;">AD Telas e Redes · ${dateStr}</p>
</td>
</tr>
</table>
</td>
</tr>

<tr>
<td style="padding:20px 28px 12px;">
<h2 style="color:#0F4F7D;font-size:14px;text-transform:uppercase;margin:0 0 12px;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">Dados do Lead</h2>
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;line-height:1.6;">
<tr><td style="width:130px;color:#6b7280;"><strong>Nome:</strong></td><td style="color:#111827;font-weight:600;">${escapeHtml(lead.nome || 'Não informado')}</td></tr>
<tr><td style="color:#6b7280;"><strong>WhatsApp:</strong></td><td style="color:#111827;font-weight:600;">${escapeHtml(lead.telefone || 'Não informado')}</td></tr>
<tr><td style="color:#6b7280;"><strong>E-mail:</strong></td><td style="color:#6b7280;">Não informado</td></tr>
<tr><td style="color:#6b7280;"><strong>Cidade:</strong></td><td style="color:#111827;">${escapeHtml(lead.cidade || 'Não informado')}</td></tr>
<tr><td style="color:#6b7280;"><strong>Serviço:</strong></td><td style="color:#0F4F7D;font-weight:600;">${escapeHtml(lead.service_name || lead.servico || 'Atendimento WhatsApp')}</td></tr>
<tr><td style="color:#6b7280;"><strong>REF WhatsApp:</strong></td><td style="color:#10b981;font-family:monospace;font-weight:700;">${escapeHtml(lead.short_code || '—')}</td></tr>
<tr><td style="color:#6b7280;"><strong>Status:</strong></td><td style="color:#d97706;font-weight:600;">Lead capturado — aguardando contato</td></tr>
</table>
</td>
</tr>

${whatsappLink ? `
<tr>
<td style="padding:10px 28px 16px;" align="center">
<table cellpadding="0" cellspacing="0">
<tr>
<td style="background-color:#25D366;border-radius:6px;text-align:center;">
<a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">
CHAMAR CLIENTE NO WHATSAPP →
</a>
</td>
</tr>
</table>
</td>
</tr>
` : ''}

<tr>
<td style="padding:12px 28px 20px;">
<h2 style="color:#0F4F7D;font-size:14px;text-transform:uppercase;margin:0 0 12px;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">Como Este Lead Chegou Até Você</h2>
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;color:#4b5563;line-height:1.6;">
<tr><td style="width:130px;color:#6b7280;"><strong>Página:</strong></td><td>${escapeHtml(lead.conversion_path || lead.landing_path || '/')}</td></tr>
<tr><td style="color:#6b7280;"><strong>Canal:</strong></td><td>${escapeHtml(lead.channel || lead.session_channel || 'direct')}</td></tr>
<tr><td style="color:#6b7280;"><strong>Campanha:</strong></td><td>${escapeHtml(lead.utm_campaign || '—')}</td></tr>
${lead.utm_term ? `<tr><td style="color:#6b7280;"><strong>Termo:</strong></td><td>${escapeHtml(lead.utm_term)}</td></tr>` : ''}
<tr><td style="color:#6b7280;"><strong>CTA:</strong></td><td>${escapeHtml(lead.cta_location || '—')}</td></tr>
<tr><td style="color:#6b7280;"><strong>Google Ads GCLID:</strong></td><td>${gclidCaptured}</td></tr>
</table>
</td>
</tr>

<tr>
<td style="background-color:#f9fafb;padding:12px 28px;text-align:center;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;">
AD Telas e Redes · Notificação automática de captura de lead pré-WhatsApp
</td>
</tr>
</table>
</td></tr></table>
</body></html>`
}

export function triggerWhatsappLeadBackgroundNotification(event: H3Event, payload: WhatsappLeadEmailPayload): void {
  const { leadId, leadData, config } = payload
  if (!isEmailConfigured(config) || !leadId) return

  const emailHeaders = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  }

  const runTask = async () => {
    try {
      // Compare-and-Set atômico no banco: reivindica o lead apenas se status for 'pending'
      const claimRes = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}&notification_email_status=eq.pending`, {
        method: 'PATCH',
        headers: {
          ...emailHeaders,
          'Prefer': 'return=representation'
        },
        body: {
          notification_email_status: 'sending',
          notification_email_attempts: 1,
          notification_email_last_attempt_at: new Date().toISOString()
        }
      })

      // Se 0 registros atualizados, outra thread concorrente já reivindicou/processou
      if (!Array.isArray(claimRes) || claimRes.length === 0) {
        return
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: config.gmailEmail!, pass: config.gmailAppPassword! },
        connectionTimeout: 10000,
        socketTimeout: 15000
      })

      const recipient = config.leadNotificationEmail || config.gmailEmail
      const subject = `🚨 Novo Lead Recebido: ${leadData.nome || 'Cliente'} — WhatsApp`
      const html = generateWhatsappLeadEmailHTML(leadData)
      const text = `NOVO LEAD WHATSAPP: ${leadData.nome}\nTelefone: ${leadData.telefone}\nREF: ${leadData.short_code}\nPágina: ${leadData.conversion_path || '/'}`

      await transporter.sendMail({
        from: `"AD Telas e Redes" <${config.gmailEmail}>`,
        to: recipient,
        subject,
        html,
        text,
        attachments: [{ filename: 'adtelas-icon.png', content: getBrandIconBuffer(), cid: 'adtelas-icon', contentDisposition: 'inline' }]
      })

      await $fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, {
        method: 'PATCH',
        headers: emailHeaders,
        body: { notification_email_status: 'sent', notification_email_sent_at: new Date().toISOString(), notification_email_last_error: null }
      })
    } catch (err: any) {
      console.error('[whatsappLeadEmailNotification] Falha no envio:', sanitizeEmailError(err))
      try {
        await $fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, {
          method: 'PATCH',
          headers: emailHeaders,
          body: { notification_email_status: 'failed', notification_email_last_error: sanitizeEmailError(err) }
        })
      } catch {}
    }
  }

  if (typeof (event as any).waitUntil === 'function') {
    (event as any).waitUntil(runTask())
  } else {
    runTask()
  }
}
