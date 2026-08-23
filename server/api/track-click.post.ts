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
  const ipHash = createHash('sha256').update(rawIp + 'adt-click-salt').digest('hex').substring(0, 16)

  const rawPath = body.origem || '/'
  const path = (rawPath === '/' || rawPath === '') ? 'Home (/)' : rawPath

  try {
    // Grava exclusivamente na tabela lead_clicks (NUNCA na tabela leads)
    await $fetch(`${config.supabaseUrl}/rest/v1/lead_clicks`, {
      method: 'POST',
      headers: {
        'apikey': config.supabaseServiceRoleKey,
        'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: {
        tipo: body.tipo || 'whatsapp',
        origem: path,
        url_origem: path,
        user_agent: (headers['user-agent'] || '').substring(0, 500),
        ip_hash: ipHash
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error('[track-click] Erro:', error?.message)
    return { success: false }
  }
})
