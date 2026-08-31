import { defineEventHandler, readBody, createError } from 'h3'
import { setAdminAuthCookies, enforceMutationCsrf } from '../../../utils/adminAuthCookies.ts'
import { verifyActiveAdmin } from '../../../shared/adminAuthCore.mjs'

export default defineEventHandler(async (event) => {
  // 1. Proteção CSRF / Same-Origin para criação de sessão
  enforceMutationCsrf(event)

  const config = useRuntimeConfig()
  const body = await readBody(event)

  const email = (body?.email || '').trim().toLowerCase()
  const password = body?.password || ''

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'E-mail e senha são obrigatórios.'
    })
  }

  // AUTH_PASSWORD_GRANT_LOW_PRIVILEGE_ONLY=YES
  // AUTH_GRANT_SERVICE_ROLE_FALLBACK=REMOVED
  // Password Grant deve utilizar EXCLUSIVAMENTE publishable ou anon key.
  const grantKey = config.supabasePublishableKey || config.supabaseAnonKey
  if (!config.supabaseUrl || !grantKey || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 503,
      message: 'Serviço de autenticação temporariamente indisponível.'
    })
  }
  let tokenRes: { access_token: string; refresh_token: string; expires_in: number; user: { id: string; email?: string } } | null = null
  try {
    tokenRes = await $fetch<{
      access_token: string
      refresh_token: string
      expires_in: number
      user: { id: string; email?: string }
    }>(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': grantKey,
        'Content-Type': 'application/json'
      },
      body: { email, password },
      timeout: 8000
    })
  } catch (authErr: any) {
    const authStatus = authErr?.statusCode || authErr?.status || (authErr?.response && authErr.response.status)
    if (authStatus === 400 || authStatus === 401 || authStatus === 422) {
      throw createError({
        statusCode: 401,
        message: 'E-mail ou senha incorretos.'
      })
    }
    throw createError({
      statusCode: 503,
      message: 'Serviço de autenticação temporariamente indisponível.'
    })
  }

  if (!tokenRes?.access_token || !tokenRes?.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'E-mail ou senha incorretos.'
    })
  }

  // 3. Consulta estrita em public.admin_users (ADMIN_AUTHORIZATION_AUTHORITY = PUBLIC_ADMIN_USERS)
  let adminRecords: any[] = []
  try {
    adminRecords = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/admin_users?user_id=eq.${tokenRes.user.id}&select=*`,
      {
        headers: {
          'apikey': config.supabaseServiceRoleKey,
          'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
        },
        timeout: 7000
      }
    )
  } catch {
    console.error('[login] ADMIN_USERS_LOOKUP_FAILED')
    throw createError({
      statusCode: 503,
      message: 'Serviço de autorização temporariamente indisponível.'
    })
  }

  const verifyResult = verifyActiveAdmin(tokenRes.user, adminRecords)
  if (!verifyResult.authorized || !verifyResult.admin) {
    if (verifyResult.reason === 'INACTIVE_ADMIN') {
      throw createError({ statusCode: 403, message: 'Acesso negado: a conta administrativa está inativa.' })
    }
    if (verifyResult.reason === 'UNAUTHORIZED_ROLE') {
      throw createError({ statusCode: 403, message: 'Acesso restrito a administradores com privilégios completos.' })
    }
    throw createError({ statusCode: 403, message: 'Acesso restrito. Esta conta não possui privilégios de administrador ativo.' })
  }

  const admin = verifyResult.admin

  // 4. Define cookies HTTP-only de sessão administrativa
  setAdminAuthCookies(event, {
    accessToken: tokenRes.access_token,
    refreshToken: tokenRes.refresh_token,
    expiresIn: tokenRes.expires_in
  })

  // LOGIN_RESPONSE_CONTRACT: { success, user: { id, userId, email, role } }
  // Alinhado com GET /api/admin/auth/session que retorna "user"
  return {
    success: true,
    user: {
      id: admin.adminId,
      userId: admin.userId,
      email: admin.email,
      role: admin.role
    }
  }
})
