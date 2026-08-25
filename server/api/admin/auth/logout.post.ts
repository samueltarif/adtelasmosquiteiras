import { clearAdminAuthCookies } from '../../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  clearAdminAuthCookies(event)
  return {
    success: true,
    message: 'Sessão encerrada com sucesso.'
  }
})
