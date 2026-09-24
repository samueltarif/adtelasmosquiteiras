import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { financeDb } from '../../../../utils/financeDb'
import { financeUuid, validateFinanceEntry } from '../../../../shared/financeCore.mjs'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const body = await readBody(event)
  const id = financeUuid(body?.id), fields = validateFinanceEntry(body)
  const rows = await financeDb('finance_entries?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' }, body: { ...fields, id, actor_id: admin.userId } })
  if (rows?.[0]) return { entry: rows[0] }
  const existing = (await financeDb(`finance_entries?id=eq.${id}&select=*`))?.[0]
  if (!existing || Object.entries(fields).some(([key, value]) => existing[key] !== value)) throw createError({ statusCode: 409, message: 'O pedido já foi processado com outros dados. Atualize a lista.' })
  return { entry: existing }
})
