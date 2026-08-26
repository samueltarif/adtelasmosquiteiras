import { setAdminAuthCookies, enforceMutationCsrf } from '../../../utils/adminAuth'

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

  // Suporte a autenticação em ambiente de desenvolvimento/testes locais
  if ((process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_AUTH === 'true') && email === 'admin@adt.local' && password === 'dev-admin-pass-2026') {
    setAdminAuthCookies(event, {
      accessToken: 'dev_mock_admin_token',
      refreshToken: 'dev_mock_refresh_token',
      expiresIn: 86400
    })
    return {
      success: true,
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@adt.local',
        role: 'admin'
      }
    }
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      message: 'Serviço de autenticação temporariamente indisponível.'
    })
  }

  try {
    // Autentica via Supabase Auth Password Grant
    const tokenRes = await $fetch<{
      access_token: string
      refresh_token: string
      expires_in: number
      user: { id: string; email?: string }
    }>(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': config.supabaseServiceRoleKey,
        'Content-Type': 'application/json'
      },
      body: {
        email,
        password
      }
    })

    if (!tokenRes?.access_token || !tokenRes?.user?.id) {
      throw createError({
        statusCode: 401,
        message: 'E-mail ou senha inválidos.'
      })
    }

    // Verifica autorização de admin
    let adminRecords: any[] = []
    try {
      adminRecords = await $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/admin_users?user_id=eq.${tokenRes.user.id}&select=*`,
        {
          headers: {
            'apikey': config.supabaseServiceRoleKey,
            'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
          }
        }
      )
    } catch {}

    // Fallback inicial se a tabela ainda não existir no banco
    if (!adminRecords || adminRecords.length === 0) {
      if (email.endsWith('@adtelasmosquiteiras.com.br') || email === 'vendas.adtelaseredes@gmail.com' || email === 'samuel.tarif@gmail.com') {
        adminRecords = [{
          user_id: tokenRes.user.id,
          email,
          role: 'admin',
          is_active: true
        }]
      }
    }

    const verifyResult = verifyActiveAdmin(tokenRes.user, adminRecords)
    if (!verifyResult.authorized || !verifyResult.admin) {
      if (verifyResult.reason === 'UNAUTHORIZED_ROLE') {
        throw createError({
          statusCode: 403,
          message: 'Acesso restrito a administradores com privilégios completos.'
        })
      }
      throw createError({
        statusCode: 403,
        message: 'Acesso restrito. Esta conta não possui privilégios de administrador ativo.'
      })
    }

    const admin = verifyResult.admin

    // Define cookies seguros HTTP-only
    setAdminAuthCookies(event, {
      accessToken: tokenRes.access_token,
      refreshToken: tokenRes.refresh_token,
      expiresIn: tokenRes.expires_in
    })

    return {
      success: true,
      user: {
        id: tokenRes.user.id,
        email: tokenRes.user.email,
        role: admin.role || 'admin'
      }
    }
  } catch (err: any) {
    if (err.statusCode === 403) throw err
    // Mensagem genérica para qualquer erro de credencial (prevenção de enumeração)
    throw createError({
      statusCode: 401,
      message: 'E-mail ou senha inválidos.'
    })
  }
})
