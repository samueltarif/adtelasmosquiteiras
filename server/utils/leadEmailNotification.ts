import { sendLeadNotificationEmail } from './emailService'
import type { H3Event } from 'h3'

export interface LeadBackgroundEmailPayload {
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

/**
 * Dispara notificação por e-mail em background com estado durável em public.leads.
 * Executa de forma assíncrona/não-bloqueante (via event.waitUntil quando suportado).
 */
export function triggerLeadBackgroundNotification(
  event: H3Event,
  payload: LeadBackgroundEmailPayload
): void {
  const { leadId, leadData, config } = payload

  const emailHeaders = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  }

  const runBackgroundNotification = async () => {
    const t4_smtpStart = performance.now()
    try {
      await $fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, {
        method: 'PATCH',
        headers: emailHeaders,
        body: {
          notification_email_status: 'sending',
          notification_email_attempts: 1,
          notification_email_last_attempt_at: new Date().toISOString()
        }
      })

      const emailResult = await sendLeadNotificationEmail(leadData, {
        gmailEmail: config.gmailEmail,
        gmailAppPassword: config.gmailAppPassword,
        leadNotificationEmail: config.leadNotificationEmail
      })

      const t5_smtpEnd = performance.now()
      if (import.meta.dev) {
        console.log(`[send-lead] SMTP concluído em ${(t5_smtpEnd - t4_smtpStart).toFixed(1)}ms (Sucesso: ${emailResult.success})`)
      }

      if (emailResult.success) {
        await $fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, {
          method: 'PATCH',
          headers: emailHeaders,
          body: {
            notification_email_status: 'sent',
            notification_email_sent_at: new Date().toISOString(),
            notification_email_last_error: null
          }
        })
      } else {
        await $fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, {
          method: 'PATCH',
          headers: emailHeaders,
          body: {
            notification_email_status: 'failed',
            notification_email_last_error: emailResult.error || 'Erro desconhecido'
          }
        })
      }
    } catch (err: any) {
      console.error('[send-lead] Erro no background email notification:', err?.message || err)
      try {
        await $fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, {
          method: 'PATCH',
          headers: emailHeaders,
          body: {
            notification_email_status: 'failed',
            notification_email_last_error: err?.message || 'Falha no processo'
          }
        })
      } catch {}
    }
  }

  if (typeof (event as any).waitUntil === 'function') {
    (event as any).waitUntil(runBackgroundNotification())
  } else {
    runBackgroundNotification()
  }
}
