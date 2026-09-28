import { useRoute } from 'vue-router'
import { classifyClientChannel } from '~/utils/trafficChannelClassifier'

const ATTRIBUTION_COOKIE_NAME = 'adt_session_attribution'

export interface SessionAttribution {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  campaign_id?: string | null
  adgroup_id?: string | null
  creative?: string | null
  matchtype?: string | null
  network?: string | null
  device?: string | null
  target_id?: string | null
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  fbclid: string | null
  msclkid: string | null
  meta_campaign_id?: string | null
  meta_adset_id?: string | null
  meta_ad_id?: string | null
  meta_placement?: string | null
  ttclid?: string | null
  tiktok_campaign_id?: string | null
  tiktok_adgroup_id?: string | null
  tiktok_ad_id?: string | null
  tiktok_creative_id?: string | null
  tiktok_placement?: string | null
  referrer: string | null
  channel: string
}

export function useAttribution() {
  const route = useRoute()
  const attributionCookie = useCookie<SessionAttribution | null>(ATTRIBUTION_COOKIE_NAME, {
    maxAge: 1800, // 30 minutos
    path: '/',
    sameSite: 'lax'
  })

  // Estado com escopo da aplicação/documento (sobrevive às navegações SPA)
  const referrerConsumed = typeof useState === 'function'
    ? useState<boolean>('adt_external_referrer_consumed', () => false)
    : { value: false }

  function getOrInitAttribution(): SessionAttribution {
    const query = route.query || {}
    const hasParamsInUrl = !!(
      query.utm_source || query.utm_medium || query.utm_campaign || query.utm_term || query.utm_content ||
      query.campaign_id || query.google_campaign_id || query.adgroup_id || query.google_adgroup_id ||
      query.creative || query.google_creative_id || query.matchtype || query.google_match_type ||
      query.network || query.google_network || query.device || query.google_device ||
      query.target_id || query.targetid || query.google_target_id ||
      query.gclid || query.gbraid || query.wbraid || query.fbclid || query.msclkid ||
      query.meta_campaign_id || query.meta_adset_id || query.meta_ad_id || query.meta_placement ||
      query.ttclid || query.tiktok_campaign_id || query.tiktok_adgroup_id ||
      query.tiktok_ad_id || query.tiktok_creative_id || query.tiktok_placement
    )

    let externalReferrer: string | null = null
    if (import.meta.client && document.referrer) {
      try {
        const refUrl = new URL(document.referrer)
        if (refUrl.hostname !== window.location.hostname) {
          externalReferrer = document.referrer
        }
      } catch (e) {
        // Ignora erros de URL inválida
      }
    }

    let isFreshExternalReferrer = false
    if (import.meta.client) {
      if (externalReferrer && !referrerConsumed.value) {
        isFreshExternalReferrer = true
        referrerConsumed.value = true
      } else if (hasParamsInUrl) {
        referrerConsumed.value = true
      }
    }

    const isNewTouch = hasParamsInUrl || isFreshExternalReferrer

    // Novo snapshot isolado: sem misturar click IDs ou metadados de canais anteriores
    if (isNewTouch || !attributionCookie.value) {
      const newAttr: SessionAttribution = {
        utm_source: (query.utm_source as string) || null,
        utm_medium: (query.utm_medium as string) || null,
        utm_campaign: (query.utm_campaign as string) || null,
        utm_content: (query.utm_content as string) || null,
        utm_term: (query.utm_term as string) || null,
        campaign_id: (query.campaign_id as string) || (query.google_campaign_id as string) || null,
        adgroup_id: (query.adgroup_id as string) || (query.google_adgroup_id as string) || null,
        creative: (query.creative as string) || (query.google_creative_id as string) || null,
        matchtype: (query.matchtype as string) || (query.google_match_type as string) || null,
        network: (query.network as string) || (query.google_network as string) || null,
        device: (query.device as string) || (query.google_device as string) || null,
        target_id: (query.target_id as string) || (query.targetid as string) || (query.google_target_id as string) || null,
        gclid: (query.gclid as string) || null,
        gbraid: (query.gbraid as string) || null,
        wbraid: (query.wbraid as string) || null,
        fbclid: (query.fbclid as string) || null,
        msclkid: (query.msclkid as string) || null,
        meta_campaign_id: (query.meta_campaign_id as string) || null,
        meta_adset_id: (query.meta_adset_id as string) || null,
        meta_ad_id: (query.meta_ad_id as string) || null,
        meta_placement: (query.meta_placement as string) || null,
        ttclid: (query.ttclid as string) || null,
        tiktok_campaign_id: (query.tiktok_campaign_id as string) || null,
        tiktok_adgroup_id: (query.tiktok_adgroup_id as string) || null,
        tiktok_ad_id: (query.tiktok_ad_id as string) || null,
        tiktok_creative_id: (query.tiktok_creative_id as string) || null,
        tiktok_placement: (query.tiktok_placement as string) || null,
        referrer: isFreshExternalReferrer ? externalReferrer : null,
        channel: 'direct'
      }

      newAttr.channel = classifyClientChannel(newAttr)
      attributionCookie.value = newAttr
    }

    return attributionCookie.value || {
      utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, utm_term: null,
      campaign_id: null, adgroup_id: null, creative: null, matchtype: null, network: null, device: null, target_id: null,
      gclid: null, gbraid: null, wbraid: null, fbclid: null, msclkid: null,
      meta_campaign_id: null, meta_adset_id: null, meta_ad_id: null, meta_placement: null,
      ttclid: null, tiktok_campaign_id: null, tiktok_adgroup_id: null, tiktok_ad_id: null,
      tiktok_creative_id: null, tiktok_placement: null, referrer: null, channel: 'direct'
    }
  }

  return {
    getOrInitAttribution,
    classifyClientChannel
  }
}
