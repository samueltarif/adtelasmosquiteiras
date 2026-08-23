import { createHash } from 'crypto'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event) || {}
  const headers = getHeaders(event)

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return { success: false }
  }

  const isTestMode = body.isTest === true || headers['x-test-mode'] === 'true'

  if (isTestMode) {
    return { success: true, isTest: true }
  }

  const forwarded = headers['x-forwarded-for'] || headers['x-real-ip'] || '0.0.0.0'
  const rawIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim()
  const ipHash = createHash('sha256').update(rawIp + 'adt-salt-2026').digest('hex').substring(0, 16)

  const path = body.path || '/'
  const referrer = body.referrer || null
  const sessionId = body.sessionId || null
  const userAgent = (headers['user-agent'] || '').substring(0, 500)

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
        path,
        referrer,
        user_agent: userAgent,
        ip_hash: ipHash,
        session_id: sessionId
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error('[track-visit] Erro ao gravar pageview:', error?.message)
    return { success: false }
  }
})
