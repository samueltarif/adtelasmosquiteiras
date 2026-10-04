/**
 * Parser e formatador de parâmetros para RPC V4 do WhatsApp Lead Gate
 * Arquivo: server/utils/whatsappLeadParams.ts
 */

export function buildRpcV4Payload(params: {
  submissionId: string
  leadId: string | null
  nome: string
  telefone: string
  origem: string
  eventId: string | null
  shortCode: string
  visitorId: string | null
  sessionId: string | null
  ctaLocation: string
  serviceKey: string | null
  serviceName: string | null
  landingPath: string
  conversionPath: string
  deviceType: string
  googleDevice: string | null
  isBot: boolean
  botName: string | null
  userAgent: string
  ipHash: string
  channel: string
  firstTouchChannel: string | null
  body: Record<string, any>
}) {
  const { body } = params
  const s = (val: any, maxLen = 255) => (val && typeof val === 'string') ? val.trim().slice(0, maxLen) : null

  return {
    p_submission_id: params.submissionId,
    p_lead_id: params.leadId,
    p_nome: params.nome,
    p_telefone: params.telefone,
    p_origem: params.origem,
    p_event_id: params.eventId,
    p_short_code: params.shortCode,
    p_visitor_id: params.visitorId,
    p_session_id: params.sessionId,
    p_cta_location: params.ctaLocation,
    p_service_key: params.serviceKey,
    p_service_name: params.serviceName,
    p_landing_path: params.landingPath,
    p_conversion_path: params.conversionPath,
    p_device_type: params.deviceType,
    p_google_device: params.googleDevice,
    p_is_bot: params.isBot,
    p_bot_name: params.botName,
    p_user_agent: params.userAgent.substring(0, 500),
    p_ip_hash: params.ipHash,
    p_channel: params.channel,
    p_utm_source: body.utm_source || null,
    p_utm_medium: body.utm_medium || null,
    p_utm_campaign: body.utm_campaign || null,
    p_utm_content: body.utm_content || null,
    p_utm_term: body.utm_term || null,
    p_google_campaign_id: body.google_campaign_id || null,
    p_google_adgroup_id: body.google_adgroup_id || null,
    p_google_creative_id: body.google_creative_id || null,
    p_google_match_type: body.google_match_type || null,
    p_google_network: body.google_network || null,
    p_google_target_id: body.google_target_id || null,
    p_gclid: body.gclid || null,
    p_gbraid: body.gbraid || null,
    p_wbraid: body.wbraid || null,
    p_referrer: body.referrer || null,
    p_clicked_at: new Date().toISOString(),
    p_fbclid: body.fbclid || null,
    p_msclkid: body.msclkid || null,
    p_meta_campaign_id: body.meta_campaign_id || null,
    p_meta_adset_id: body.meta_adset_id || null,
    p_meta_ad_id: body.meta_ad_id || null,
    p_meta_placement: body.meta_placement || null,
    p_ttclid: body.ttclid || null,
    p_tiktok_campaign_id: body.tiktok_campaign_id || null,
    p_tiktok_adgroup_id: body.tiktok_adgroup_id || null,
    p_tiktok_ad_id: body.tiktok_ad_id || null,
    p_tiktok_creative_id: body.tiktok_creative_id || null,
    p_tiktok_placement: body.tiktok_placement || null,

    // First Touch Atômico Preservado
    p_first_touch_channel: params.firstTouchChannel,
    p_first_touch_landing_path: s(body.first_touch_landing_path, 1000),
    p_first_touch_referrer: s(body.first_touch_referrer, 1000),
    p_first_touch_utm_source: s(body.first_touch_utm_source),
    p_first_touch_utm_medium: s(body.first_touch_utm_medium),
    p_first_touch_utm_campaign: s(body.first_touch_utm_campaign),
    p_first_touch_utm_content: s(body.first_touch_utm_content),
    p_first_touch_utm_term: s(body.first_touch_utm_term),
    p_first_touch_google_campaign_id: s(body.first_touch_google_campaign_id, 100),
    p_first_touch_google_adgroup_id: s(body.first_touch_google_adgroup_id, 100),
    p_first_touch_google_creative_id: s(body.first_touch_google_creative_id, 100),
    p_first_touch_google_match_type: s(body.first_touch_google_match_type, 50),
    p_first_touch_google_network: s(body.first_touch_google_network, 50),
    p_first_touch_google_device: s(body.first_touch_google_device, 50),
    p_first_touch_google_target_id: s(body.first_touch_google_target_id, 100),
    p_first_touch_gclid: s(body.first_touch_gclid),
    p_first_touch_gbraid: s(body.first_touch_gbraid),
    p_first_touch_wbraid: s(body.first_touch_wbraid),
    p_first_touch_fbclid: s(body.first_touch_fbclid),
    p_first_touch_msclkid: s(body.first_touch_msclkid),
    p_first_touch_ttclid: s(body.first_touch_ttclid)
  }
}
