import { validateCanonicalChannel } from './channelValidation'
import { classifyDevice } from './analytics'

export interface BuildLeadParams {
  body: Record<string, any>
  effectiveSubmissionId: string
  cleanNome: string
  cleanPhone: string
  cleanEmail: string
  userAgent: string
}

/**
 * Constrói o payload padronizado para inserção do lead em public.leads
 * com validação de canais canônicos e suporte a todos os metadados TikTok, Meta e Google Ads.
 */
export function buildLeadInsertPayload(params: BuildLeadParams): Record<string, any> {
  const { body, effectiveSubmissionId, cleanNome, cleanPhone, cleanEmail, userAgent } = params
  const {
    visitor_id, session_id, landing_path, conversion_path, channel, session_channel,
    first_touch_channel, first_touch_landing_path, first_touch_referrer,
    first_touch_utm_source, first_touch_utm_medium, first_touch_utm_campaign,
    first_touch_utm_content, first_touch_utm_term,
    first_touch_google_campaign_id, first_touch_google_adgroup_id, first_touch_google_creative_id,
    first_touch_google_match_type, first_touch_google_network, first_touch_google_device, first_touch_google_target_id,
    first_touch_gclid, first_touch_gbraid, first_touch_wbraid, first_touch_fbclid, first_touch_msclkid,
    first_touch_ttclid, first_touch_tiktok_campaign_id, first_touch_tiktok_adgroup_id,
    first_touch_tiktok_ad_id, first_touch_tiktok_creative_id, first_touch_tiktok_placement,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    google_campaign_id, google_adgroup_id, google_creative_id,
    google_match_type, google_network, google_device, google_target_id,
    gclid, gbraid, wbraid, fbclid, msclkid,
    meta_campaign_id, meta_adset_id, meta_ad_id, meta_placement,
    ttclid, tiktok_campaign_id, tiktok_adgroup_id, tiktok_ad_id, tiktok_creative_id, tiktok_placement,
    referrer, cidade, bairro, servico, mensagem, origem
  } = body

  const validatedSessionChannel = validateCanonicalChannel(session_channel || channel)
  const validatedFirstTouchChannel = validateCanonicalChannel(first_touch_channel)

  return {
    submission_id: effectiveSubmissionId,
    visitor_id: visitor_id || null,
    session_id: session_id || null,
    landing_path: landing_path || null,
    conversion_path: conversion_path || null,
    session_channel: validatedSessionChannel,

    // Atribuição de Sessão Atual
    device_type: classifyDevice(userAgent),
    referrer: referrer || null,
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
    google_device: google_device || null,
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

    // Atribuição First Touch Completa (preservada)
    first_touch_channel: validatedFirstTouchChannel,
    first_touch_landing_path: first_touch_landing_path || null,
    first_touch_referrer: first_touch_referrer || null,
    first_touch_utm_source: first_touch_utm_source || null,
    first_touch_utm_medium: first_touch_utm_medium || null,
    first_touch_utm_campaign: first_touch_utm_campaign || null,
    first_touch_utm_content: first_touch_utm_content || null,
    first_touch_utm_term: first_touch_utm_term || null,
    first_touch_google_campaign_id: first_touch_google_campaign_id || null,
    first_touch_google_adgroup_id: first_touch_google_adgroup_id || null,
    first_touch_google_creative_id: first_touch_google_creative_id || null,
    first_touch_google_match_type: first_touch_google_match_type || null,
    first_touch_google_network: first_touch_google_network || null,
    first_touch_google_device: first_touch_google_device || null,
    first_touch_google_target_id: first_touch_google_target_id || null,
    first_touch_gclid: first_touch_gclid || null,
    first_touch_gbraid: first_touch_gbraid || null,
    first_touch_wbraid: first_touch_wbraid || null,
    first_touch_fbclid: first_touch_fbclid || null,
    first_touch_msclkid: first_touch_msclkid || null,
    first_touch_ttclid: first_touch_ttclid || null,

    nome: cleanNome,
    cidade: (cidade && String(cidade).trim()) ? String(cidade).trim() : null,
    bairro: bairro || null,
    servico: servico || 'Não especificado',
    telefone: cleanPhone,
    email: cleanEmail,
    mensagem: mensagem ? String(mensagem).slice(0, 2000) : null,
    origem: origem || 'formulario_geral',
    status: 'Novo',
    valor_orcamento: 0,

    // Estado durável de notificação por e-mail
    notification_email_status: 'pending',
    notification_email_attempts: 0
  }
}
