import nodemailer from 'nodemailer'
import { randomUUID } from 'node:crypto'
import { financeDb } from './financeDb'
import { runFinanceReminderBatch } from '../shared/financeReminderRunner.mjs'

export async function sendFinanceReminders() {
  const config = useRuntimeConfig()
  const settings = (await financeDb('finance_settings?id=eq.1&select=enabled'))?.[0]
  if (!settings?.enabled) return { sent: 0, disabled: true }
  if (!config.gmailEmail || !config.gmailAppPassword) throw createError({ statusCode: 503, message: 'Configure o remetente Gmail e a senha de aplicativo no servidor.' })
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: config.gmailEmail, pass: config.gmailAppPassword }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 })
  try {
    return await runFinanceReminderBatch({
      runId: randomUUID(),
      claim: (runId: string) => financeDb('rpc/claim_finance_reminders', { method: 'POST', body: { p_run_id: runId } }),
      send: async (recipient: string, message: { subject: string; text: string }) => {
        const result = await transporter.sendMail({ from: { name: 'AD Telas e Redes', address: config.gmailEmail }, to: recipient, ...message })
        if (!result.accepted?.length || result.rejected?.length) throw new Error('SMTP não confirmou o destinatário.')
      },
      finish: (runId: string, status: string, error: string | null) => financeDb(`finance_reminders?run_id=eq.${runId}&status=eq.processing`, { method: 'PATCH', body: { status, error, sent_at: status === 'sent' ? new Date().toISOString() : null } })
    })
  } catch {
    throw createError({ statusCode: 503, message: 'Não foi possível concluir os avisos. Confira as configurações e o histórico de envios.' })
  } finally { transporter.close() }
}
