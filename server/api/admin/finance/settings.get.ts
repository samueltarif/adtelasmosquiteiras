import { requireActiveAdmin } from '../../../utils/adminAuth'
import { financeDb } from '../../../utils/financeDb'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  setHeader(event, 'Cache-Control', 'no-store')
  const config = useRuntimeConfig()
  const [settings, reminders] = await Promise.all([
    financeDb('finance_settings?id=eq.1&select=*'),
    financeDb('finance_reminders?select=id,status,created_at,sent_at,error,recipient,stage,finance_entries(description)&order=created_at.desc&limit=20')
  ])
  return { settings: settings[0], reminders, smtpConfigured: Boolean(config.gmailEmail && config.gmailAppPassword), cronConfigured: Boolean(config.cronSecret) }
})
