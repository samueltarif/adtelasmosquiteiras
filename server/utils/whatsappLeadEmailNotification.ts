import type { H3Event } from 'h3'
import nodemailer from 'nodemailer'
import { isEmailConfigured, getBrandIconBuffer } from './emailService'
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
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,sans-serif;-webkit-text-size-adjust:100%;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;border-top:4px solid #087c38;">
<tr>
<td style="background-color:#0d1d30;padding:22px 26px;text-align:left;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="width:105px;vertical-align:middle;">
<img src="cid:ad-telas-logo" width="96" height="48" alt="AD Telas e Redes" style="display:block;width:96px;height:auto;max-width:96px;border:0;outline:none;" />
</td>
<td style="padding-left:16px;vertical-align:middle;">
<h1 style="color:#ffffff;margin:0;font-size:16px;font-weight:800;letter-spacing:0.3px;line-height:1.25;">NOVO LEAD RECEBIDO<br><span style="color:#25d366;">— WHATSAPP</span></h1>
<p style="color:#94a3b8;margin:4px 0 0;font-size:11px;font-weight:500;">AD Telas e Redes · ${dateStr}</p>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:22px 26px 10px;">
<h2 style="color:#0d1d30;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;">Dados do Lead</h2>
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;line-height:1.6;">
<tr><td style="width:130px;color:#64748b;"><strong>Nome:</strong></td><td style="color:#0f172a;font-weight:700;">${escapeHtml(lead.nome || 'Não informado')}</td></tr>
<tr><td style="color:#64748b;"><strong>WhatsApp:</strong></td><td style="color:#0f172a;font-weight:700;">${escapeHtml(lead.telefone || 'Não informado')}</td></tr>
<tr><td style="color:#64748b;"><strong>E-mail:</strong></td><td style="color:#64748b;">Não informado</td></tr>
<tr><td style="color:#64748b;"><strong>Cidade:</strong></td><td style="color:#0f172a;">${escapeHtml(lead.cidade || 'Não informado')}</td></tr>
<tr><td style="color:#64748b;"><strong>Serviço:</strong></td><td style="color:#234b73;font-weight:700;">${escapeHtml(lead.service_name || lead.servico || 'Atendimento WhatsApp')}</td></tr>
<tr><td style="color:#64748b;"><strong>REF WhatsApp:</strong></td><td><span style="display:inline-block;padding:2px 8px;border-radius:4px;background-color:#f0fdf4;border:1px solid #bbf7d0;color:#087c38;font-family:monospace;font-size:13px;font-weight:700;">${escapeHtml(lead.short_code || '—')}</span></td></tr>
<tr><td style="color:#64748b;padding-top:4px;"><strong>Status:</strong></td><td style="padding-top:4px;"><span style="display:inline-block;padding:2px 8px;border-radius:4px;background-color:#fffbeb;color:#92400e;font-size:12px;font-weight:600;border:1px solid #fde68a;">Lead capturado — aguardando contato</span></td></tr>
</table>
</td>
</tr>
${whatsappLink ? `
<tr>
<td style="padding:10px 26px 14px;" align="center">
<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;width:100%;max-width:380px;">
<tr>
<td align="center" style="background-color:#087c38;border-radius:8px;">
<a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" style="display:block;padding:14px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;letter-spacing:0.3px;text-align:center;border-radius:8px;">
CHAMAR CLIENTE NO WHATSAPP →
</a>
</td>
</tr>
</table>
</td>
</tr>
` : ''}
<tr>
<td style="padding:10px 26px 20px;">
<h2 style="color:#0d1d30;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;">Como Este Lead Chegou Até Você</h2>
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;color:#4b5563;line-height:1.6;">
<tr><td style="width:130px;color:#64748b;"><strong>Página:</strong></td><td>${escapeHtml(lead.conversion_path || lead.landing_path || '/')}</td></tr>
<tr><td style="color:#64748b;"><strong>Canal:</strong></td><td>${escapeHtml(lead.channel || lead.session_channel || 'direct')}</td></tr>
<tr><td style="color:#64748b;"><strong>Campanha:</strong></td><td>${escapeHtml(lead.utm_campaign || '—')}</td></tr>
${lead.utm_term ? `<tr><td style="color:#64748b;"><strong>Termo:</strong></td><td>${escapeHtml(lead.utm_term)}</td></tr>` : ''}
<tr><td style="color:#64748b;"><strong>CTA:</strong></td><td>${escapeHtml(lead.cta_location || '—')}</td></tr>
<tr><td style="color:#64748b;"><strong>Google Ads GCLID:</strong></td><td>${gclidCaptured}</td></tr>
</table>
</td>
</tr>
<tr>
<td style="background-color:#f8fafc;padding:12px 26px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
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
      const claimRes = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}&notification_email_status=eq.pending`, {
        method: 'PATCH',
        headers: { ...emailHeaders, 'Prefer': 'return=representation' },
        body: {
          notification_email_status: 'sending',
          notification_email_attempts: 1,
          notification_email_last_attempt_at: new Date().toISOString()
        }
      })

      if (!Array.isArray(claimRes) || claimRes.length === 0) return

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: config.gmailEmail!, pass: config.gmailAppPassword! },
        connectionTimeout: 10000,
        socketTimeout: 15000
      })

      const targetEmail = 'vendas.adtelaseredes@gmail.com'
      const recipient = (config.leadNotificationEmail && !config.leadNotificationEmail.includes('avyro.com.br'))
        ? config.leadNotificationEmail
        : (config.gmailEmail || targetEmail)
      const subject = `🚨 Novo Lead Recebido: ${leadData.nome || 'Cliente'} — WhatsApp`
      const html = generateWhatsappLeadEmailHTML(leadData)
      const text = `NOVO LEAD WHATSAPP: ${leadData.nome}\nTelefone: ${leadData.telefone}\nREF: ${leadData.short_code}\nPágina: ${leadData.conversion_path || '/'}`

      await transporter.sendMail({
        from: `"AD Telas e Redes" <${config.gmailEmail}>`,
        to: recipient,
        subject,
        html,
        text,
        attachments: [
          {
            filename: 'ad-telas-logo.png',
            content: getBrandIconBuffer(),
            cid: 'ad-telas-logo',
            contentType: 'image/png',
            contentDisposition: 'inline'
          }
        ]
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
