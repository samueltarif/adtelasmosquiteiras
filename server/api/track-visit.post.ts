import { classifyDevice, classifyBot, generateIpHash } from '../utils/analytics'
import { validateCanonicalChannel } from '../utils/channelValidation'

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
    path = '/',
    landing_path,
    referrer,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    google_campaign_id,
    google_adgroup_id,
    google_creative_id,
    google_match_type,
    google_network,
    google_device,
    google_target_id,
    gclid,
    gbraid,
    wbraid,
    fbclid,
    msclkid,
    meta_campaign_id,
    meta_adset_id,
    meta_ad_id,
    meta_placement,
    ttclid,
    tiktok_campaign_id,
    tiktok_adgroup_id,
    tiktok_ad_id,
    tiktok_creative_id,
    tiktok_placement,
    channel
  } = body

  const userAgent = headers['user-agent'] || ''
  const forwarded = headers['x-forwarded-for'] || headers['x-real-ip'] || '0.0.0.0'
  const rawIp = (Array.isArray(forwarded) ? (forwarded[0] || '0.0.0.0') : (forwarded.split(',')[0] || '0.0.0.0')).trim()
  const ipHash = generateIpHash(rawIp)

  const deviceType = classifyDevice(userAgent)
  const botInfo = classifyBot(userAgent)
  const validatedChannel = validateCanonicalChannel(channel)

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
        event_id: event_id || null,
        visitor_id: visitor_id || null,
        session_id: session_id || null,
        path,
        landing_path: landing_path || path,
        referrer: referrer || null,
        user_agent: userAgent.substring(0, 500),
        device_type: deviceType,
        google_device: google_device || null,
        is_bot: botInfo.isBot,
        bot_name: botInfo.botName,
        ip_hash: ipHash,
        channel: validatedChannel,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_content: utm_content || null,
        utm_term: utm_term || null,
        google_campaign_id: google_campaign_id || null,
        google_adgroup_id: google_adgroup_id || null,
        google_creative_id: google_creative_id || null,
        google_match_type: google_match_type || null,
        google_network: google_network || null,
        google_target_id: google_target_id || null,
        gclid: gclid || null,
        gbraid: gbraid || null,
        wbraid: wbraid || null,
        fbclid: fbclid || null,
        msclkid: msclkid || null,
        meta_campaign_id: meta_campaign_id || null,
        meta_adset_id: meta_adset_id || null,
        meta_ad_id: meta_ad_id || null,
        meta_placement: meta_placement || null,
        ttclid: ttclid || null,
        tiktok_campaign_id: tiktok_campaign_id || null,
        tiktok_adgroup_id: tiktok_adgroup_id || null,
        tiktok_ad_id: tiktok_ad_id || null,
        tiktok_creative_id: tiktok_creative_id || null,
        tiktok_placement: tiktok_placement || null
      }
    })

    return { success: true }
  } catch (error: any) {
    if (error?.message?.includes('duplicate key') || error?.message?.includes('23505') || error?.status === 409) {
      return { success: true, idempotent: true }
    }
    console.error('[track-visit] Erro ao gravar pageview:', error?.message)
    return { success: false }
  }
})
