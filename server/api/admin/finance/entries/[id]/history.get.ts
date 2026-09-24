import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { financeDb } from '../../../../../utils/financeDb'
import { financeUuid } from '../../../../../shared/financeCore.mjs'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  setHeader(event, 'Cache-Control', 'no-store')
  const id = financeUuid(getRouterParam(event, 'id'))
  return { history: await financeDb(`finance_history?entry_id=eq.${id}&select=id,action,before_data,after_data,created_at&order=created_at.desc,id.desc&limit=100`) }
})
