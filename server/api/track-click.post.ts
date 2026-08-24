import { classifyDevice, classifyBot, isIdempotentRequest, generateIpHash } from '../utils/analytics'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event) || {}
  const headers = getHeaders(event)

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return { success: false }
  }

  const {
    event_id,
    visitor_id,
    session_id,
    tipo = 'whatsapp',
    origem = '/',
    cta_location,
    landing_path,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    gclid,
    gbraid,
    wbraid,
    fbclid,
    msclkid,
    referrer,
    channel
  } = body

  // 0. VERIFICAR IDEMPOTÊNCIA DE SERVIDOR
  if (event_id && isIdempotentRequest(event_id)) {
    console.log(`[track-click] [IDEMPOTENCY] Clique duplicado ignorado para event_id: ${event_id}`)
    return { success: true, idempotent: true }
  }

  const userAgent = headers['user-agent'] || ''
  const forwarded = headers['x-forwarded-for'] || headers['x-real-ip'] || '0.0.0.0'
  const rawIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim()
  const ipHash = generateIpHash(rawIp)

  const deviceType = classifyDevice(userAgent)
  const botInfo = classifyBot(userAgent)

  const path = (origem === '/' || origem === '') ? 'Home (/)' : origem

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
        event_id: event_id || null,
        visitor_id: visitor_id || null,
        session_id: session_id || null,
        tipo,
        origem: path,
        url_origem: path,
        cta_location: cta_location || null,
        landing_path: landing_path || path,
        device_type: deviceType,
        is_bot: botInfo.isBot,
        bot_name: botInfo.botName,
        user_agent: userAgent.substring(0, 500),
        ip_hash: ipHash,
        channel: channel || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_content: utm_content || null,
        utm_term: utm_term || null,
        gclid: gclid || null,
        gbraid: gbraid || null,
        wbraid: wbraid || null,
        fbclid: fbclid || null,
        msclkid: msclkid || null,
        referrer: referrer || null
      }
    })

    return { success: true }
  } catch (error: any) {
    if (error?.message?.includes('duplicate key') || error?.message?.includes('23505') || error?.status === 409) {
      return { success: true, idempotent: true }
    }
    console.error('[track-click] Erro:', error?.message)
    return { success: false }
  }
})
