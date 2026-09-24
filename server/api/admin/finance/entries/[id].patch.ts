import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { financeDb } from '../../../../utils/financeDb'
import { financeUuid, financeVersion, validateFinanceEntry, financeTransition } from '../../../../shared/financeCore.mjs'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const id = financeUuid(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const version = financeVersion(body?.version)
  let patch: Record<string, any>
  if (body.action === 'edit') patch = validateFinanceEntry(body)
  else {
    const entry = (await financeDb(`finance_entries?id=eq.${id}&select=*`))?.[0]
    if (!entry) throw createError({ statusCode: 404, message: 'Conta não encontrada.' })
    if (entry.version !== version) throw createError({ statusCode: 409, message: 'Esta conta mudou em outra sessão. Atualize a lista.' })
    patch = financeTransition(entry, body)
  }
  const condition = body.action === 'edit' ? '&status=eq.open' : ''
  const rows = await financeDb(`finance_entries?id=eq.${id}&version=eq.${version}${condition}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { ...patch, actor_id: admin.userId } })
  if (!rows?.[0]) throw createError({ statusCode: 409, message: 'A conta mudou ou não pode ser editada. Atualize a lista.' })
  return { entry: rows[0] }
})
