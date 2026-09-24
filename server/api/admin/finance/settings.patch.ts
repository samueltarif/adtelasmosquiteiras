import { requireActiveAdmin } from '../../../utils/adminAuth'
import { financeDb } from '../../../utils/financeDb'
import { financeVersion, validateFinanceSettings } from '../../../shared/financeCore.mjs'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const body = await readBody(event)
  const version = financeVersion(body?.version), fields = validateFinanceSettings(body)
  const rows = await financeDb(`finance_settings?id=eq.1&version=eq.${version}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { ...fields, version: version + 1, updated_at: new Date().toISOString() } })
  if (!rows?.[0]) throw createError({ statusCode: 409, message: 'As configurações mudaram. Atualize a página antes de salvar.' })
  return { settings: rows[0] }
})
