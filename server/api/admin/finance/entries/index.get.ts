import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { financeDb } from '../../../../utils/financeDb'
import { financeDate } from '../../../../shared/financeCore.mjs'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  setHeader(event, 'Cache-Control', 'no-store')
  const query = getQuery(event)
  const kind = String(query.kind || ''), status = String(query.status || '')
  const search = String(query.search || '').trim(), from = String(query.from || ''), to = String(query.to || '')
  const page = Number(query.page || 1)
  if (!['', 'payable', 'receivable'].includes(kind) || !['', 'open', 'overdue', 'settled', 'cancelled'].includes(status) || search.length > 180 || !Number.isSafeInteger(page) || page < 1 || page > 100000) throw createError({ statusCode: 400, message: 'Filtros inválidos.' })
  if (from) financeDate(from)
  if (to) financeDate(to)
  if (from && to && from > to) throw createError({ statusCode: 400, message: 'O início do período deve ser anterior ao fim.' })
  return financeDb('rpc/finance_overview', { method: 'POST', body: { p_kind: kind, p_status: status, p_search: search, p_from: from, p_to: to, p_page: page } })
})
