import { useRoute } from 'vue-router'

const ATTRIBUTION_COOKIE_NAME = 'adt_session_attribution'

export interface SessionAttribution {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  fbclid: string | null
  msclkid: string | null
  referrer: string | null
  channel: string
}

export function classifyClientChannel(params: Partial<SessionAttribution>): string {
  const source = (params.utm_source || '').toLowerCase()
  const medium = (params.utm_medium || '').toLowerCase()
  const ref = (params.referrer || '').toLowerCase()

  if (params.gclid || params.gbraid || params.wbraid || (source.includes('google') && (medium.includes('cpc') || medium.includes('paid')))) {
    return 'google_ads'
  }
  if (params.fbclid || (source.includes('facebook') && (medium.includes('cpc') || medium.includes('paid')))) {
    return 'facebook_ads'
  }
  if (source.includes('instagram') || ref.includes('instagram.com') || ref.includes('l.instagram.com')) {
    return 'instagram'
  }
  if (source.includes('facebook') || ref.includes('facebook.com') || ref.includes('m.facebook.com')) {
    return 'facebook'
  }
  if (source.includes('google') || ref.includes('google.com') || ref.includes('google.com.br')) {
    return 'google_organic'
  }
  if (params.msclkid || source.includes('bing') || ref.includes('bing.com')) {
    return 'bing_organic'
  }
  if (medium.includes('cpc') || medium.includes('paid') || medium.includes('banner') || medium.includes('ppc')) {
    return 'other_paid'
  }
  if (!source && !ref) {
    return 'direct'
  }
  if (ref) {
    return 'referral'
  }
  return 'unknown'
}

export function useAttribution() {
  const route = useRoute()
  const attributionCookie = useCookie<SessionAttribution | null>(ATTRIBUTION_COOKIE_NAME, {
    maxAge: 1800, // 30 minutos
    path: '/',
    sameSite: 'lax'
  })

  function getOrInitAttribution(): SessionAttribution {
    const query = route.query || {}
    const hasParamsInUrl = !!(
      query.utm_source || query.utm_medium || query.utm_campaign || 
      query.gclid || query.gbraid || query.wbraid || query.fbclid || query.msclkid
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

    // Se houver novos parâmetros na URL ou referrer externo ou se a atribuição ainda não existia:
    if (hasParamsInUrl || externalReferrer || !attributionCookie.value) {
      const newAttr: SessionAttribution = {
        utm_source: (query.utm_source as string) || attributionCookie.value?.utm_source || null,
        utm_medium: (query.utm_medium as string) || attributionCookie.value?.utm_medium || null,
        utm_campaign: (query.utm_campaign as string) || attributionCookie.value?.utm_campaign || null,
        utm_content: (query.utm_content as string) || attributionCookie.value?.utm_content || null,
        utm_term: (query.utm_term as string) || attributionCookie.value?.utm_term || null,
        gclid: (query.gclid as string) || attributionCookie.value?.gclid || null,
        gbraid: (query.gbraid as string) || attributionCookie.value?.gbraid || null,
        wbraid: (query.wbraid as string) || attributionCookie.value?.wbraid || null,
        fbclid: (query.fbclid as string) || attributionCookie.value?.fbclid || null,
        msclkid: (query.msclkid as string) || attributionCookie.value?.msclkid || null,
        referrer: externalReferrer || attributionCookie.value?.referrer || null,
        channel: 'direct'
      }

      newAttr.channel = classifyClientChannel(newAttr)
      attributionCookie.value = newAttr
    }

    return attributionCookie.value || {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
      gclid: null,
      gbraid: null,
      wbraid: null,
      fbclid: null,
      msclkid: null,
      referrer: null,
      channel: 'direct'
    }
  }

  return {
    getOrInitAttribution,
    classifyClientChannel
  }
}
