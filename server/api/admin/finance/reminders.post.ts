import { requireActiveAdmin } from '../../../utils/adminAuth'
import { sendFinanceReminders } from '../../../utils/financeReminders'
export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  return sendFinanceReminders()
})
