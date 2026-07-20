import { createHash } from 'crypto'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const headers = getHeaders(event)

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return { success: false }
  }

  // Não rastrear rotas do admin
  if (body.path?.startsWith('/admin')) {
    return { success: true, tracked: false }
  }

  // Hash do IP para privacidade (sem armazenar IP real)
  const forwarded = headers['x-forwarded-for'] || headers['x-real-ip'] || '0.0.0.0'
  const rawIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim()
  const ipHash = createHash('sha256').update(rawIp + 'adt-salt').digest('hex').substring(0, 16)

  try {
    await $fetch(`${config.supabaseUrl}/rest/v1/page_views`, {
      method: 'POST',
      headers: {
        'apikey': config.supabaseServiceRoleKey,
        'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: {
        path: body.path || '/',
        referrer: body.referrer || null,
        user_agent: (headers['user-agent'] || '').substring(0, 500),
        ip_hash: ipHash,
        session_id: body.sessionId || null
      }
    })

    return { success: true, tracked: true }
  } catch (error: any) {
    console.error('[track-visit] Erro:', error?.message)
    return { success: false }
  }
})
