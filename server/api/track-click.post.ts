import { 
  classifyDevice, 
  classifyBot, 
  generateIpHash,
  validateCtaLocation,
  normalizeActionType,
  resolveCanonicalService
} from '../utils/analytics'
import { validateCanonicalChannel } from '../utils/channelValidation'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event) || {}
  const headers = getHeaders(event)

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return { success: false }
  }

  const {
    event_id, visitor_id, session_id, tipo = 'whatsapp', origem = '/', cta_location,
    service_key, landing_path, referrer, channel,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    google_campaign_id, google_adgroup_id, google_creative_id,
    google_match_type, google_network, google_device, google_target_id,
    gclid, gbraid, wbraid, fbclid, msclkid,
    meta_campaign_id, meta_adset_id, meta_ad_id, meta_placement,
    ttclid, tiktok_campaign_id, tiktok_adgroup_id, tiktok_ad_id, tiktok_creative_id, tiktok_placement
  } = body

  const userAgent = headers['user-agent'] || ''
  const forwarded = headers['x-forwarded-for'] || headers['x-real-ip'] || '0.0.0.0'
  const rawIp = (Array.isArray(forwarded) ? (forwarded[0] || '0.0.0.0') : (forwarded.split(',')[0] || '0.0.0.0')).trim()
  const ipHash = generateIpHash(rawIp)

  const deviceType = classifyDevice(userAgent)
  const botInfo = classifyBot(userAgent)
  const validatedChannel = validateCanonicalChannel(channel)

  // Validações e Resoluções Canônicas de Servidor
  const validatedCtaLocation = validateCtaLocation(cta_location)
  const canonicalActionType = normalizeActionType(tipo)
  const { service_key: canonicalServiceKey, service_name: canonicalServiceName } = resolveCanonicalService(service_key)

  const path = (origem === '/' || origem === '') ? 'Home (/)' : origem
  const resolvedLanding = landing_path || path

  try {
    // Para cliques de WhatsApp com short_code, executa a RPC atômica v3
    if (canonicalActionType === 'whatsapp' && body.short_code && /^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/i.test(String(body.short_code).trim())) {
      const rpcResult = await $fetch<any>(`${config.supabaseUrl}/rest/v1/rpc/create_whatsapp_click_attribution_atomic_v3`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseServiceRoleKey,
          'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: {
          p_event_id: event_id || null,
          p_short_code: String(body.short_code).trim().toUpperCase(),
          p_visitor_id: visitor_id || null,
          p_session_id: session_id || null,
          p_origem: path,
          p_cta_location: validatedCtaLocation,
          p_service_key: canonicalServiceKey,
          p_service_name: canonicalServiceName,
          p_landing_path: resolvedLanding,
          p_device_type: deviceType,
          p_google_device: google_device || null,
          p_is_bot: botInfo.isBot,
          p_bot_name: botInfo.botName,
          p_user_agent: userAgent.substring(0, 500),
          p_ip_hash: ipHash,
          p_channel: validatedChannel,
          p_utm_source: utm_source || null,
          p_utm_medium: utm_medium || null,
          p_utm_campaign: utm_campaign || null,
          p_utm_content: utm_content || null,
          p_utm_term: utm_term || null,
          p_google_campaign_id: google_campaign_id || null,
          p_google_adgroup_id: google_adgroup_id || null,
          p_google_creative_id: google_creative_id || null,
          p_google_match_type: google_match_type || null,
          p_google_network: google_network || null,
          p_google_target_id: google_target_id || null,
          p_gclid: gclid || null,
          p_gbraid: gbraid || null,
          p_wbraid: wbraid || null,
          p_referrer: referrer || null,
          p_clicked_at: new Date().toISOString(),
          p_fbclid: fbclid || null,
          p_msclkid: msclkid || null,
          p_meta_campaign_id: meta_campaign_id || null,
          p_meta_adset_id: meta_adset_id || null,
          p_meta_ad_id: meta_ad_id || null,
          p_meta_placement: meta_placement || null,
          p_ttclid: ttclid || null,
          p_tiktok_campaign_id: tiktok_campaign_id || null,
          p_tiktok_adgroup_id: tiktok_adgroup_id || null,
          p_tiktok_ad_id: tiktok_ad_id || null,
          p_tiktok_creative_id: tiktok_creative_id || null,
          p_tiktok_placement: tiktok_placement || null
        }
      })

      return {
        success: true,
        idempotent: rpcResult?.idempotent || false,
        attribution_id: rpcResult?.attribution_id || null
      }
    }

    // Para cliques de outros tipos (quote_cta, telefone, etc.), preserva o fluxo padrão
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
        tipo: canonicalActionType,
        origem: path,
        url_origem: path,
        cta_location: validatedCtaLocation,
        service_key: canonicalServiceKey,
        service_name: canonicalServiceName,
        landing_path: resolvedLanding,
        device_type: deviceType,
        google_device: google_device || null,
        is_bot: botInfo.isBot,
        bot_name: botInfo.botName,
        user_agent: userAgent.substring(0, 500),
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
        tiktok_placement: tiktok_placement || null,
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
