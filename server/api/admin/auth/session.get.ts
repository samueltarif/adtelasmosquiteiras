import { defineEventHandler, createError } from 'h3'
import { requireActiveAdmin } from '../../../utils/adminAuth.ts'

/**
 * GET /api/admin/auth/session
 *
 * SESSION_HANDLER_SEMANTICS (Patch 1.5):
 * - 401/403 → { authenticated: false, user: null }
 * - 503/5xx infra → propaga 503 sanitizado
 * - Nunca transforma falha de infraestrutura em authenticated:false
 */
export default defineEventHandler(async (event) => {
  try {
    const admin = await requireActiveAdmin(event)
    return {
      authenticated: true,
      user: {
        id: admin.adminId,
        userId: admin.userId,
        email: admin.email,
        role: admin.role
      }
    }
  } catch (err: any) {
    const status = err?.statusCode || err?.status || 500
    // 401 / 403 = não autenticado ou não autorizado → unauthenticated (esperado)
    if (status === 401 || status === 403) {
      return { authenticated: false, user: null }
    }
    // SESSION_HANDLER_5XX_POLICY=PROPAGATE_503
    // 503 ou qualquer 5xx inesperado → nunca retornar authenticated:false
    throw createError({
      statusCode: 503,
      message: 'Serviço de autenticação temporariamente indisponível.'
    })
  }
})
