import { timingSafeEqual } from 'node:crypto'
import { sendFinanceReminders } from '../../utils/financeReminders'
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const secret = useRuntimeConfig().cronSecret
  const supplied = Buffer.from(getHeader(event, 'authorization') || '')
  const expected = Buffer.from(`Bearer ${secret || ''}`)
  if (!secret || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw createError({ statusCode: 401, message: 'Acesso não autorizado.' })
  return sendFinanceReminders()
})
