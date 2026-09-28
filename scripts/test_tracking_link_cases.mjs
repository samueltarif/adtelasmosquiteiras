/**
 * Casos de Teste Canônicos (LINK-01 a LINK-16)
 * Arquivo: scripts/test_tracking_link_cases.mjs
 */

import { buildTrackingUrl, validateTrackingUrl } from '../app/utils/trackingLinkBuilder.ts'
import { CANONICAL_BASE_DOMAIN } from '../app/utils/trackingLinkPresets.ts'

export function runLinkCases(assert) {
  // LINK-01: Instagram Bio -> instagram_organic
  const l1 = buildTrackingUrl({
    platform: 'instagram', trafficType: 'organic', format: 'bio',
    tiktokAdsMode: 'standard', destination: '/', customDestination: '',
    campaign: 'bio', content: 'perfil', term: ''
  })
  assert(
    l1.fullUrl === `${CANONICAL_BASE_DOMAIN}/?utm_source=instagram&utm_medium=organic&utm_campaign=bio&utm_content=perfil` &&
    l1.expectedChannel === 'instagram_organic',
    'LINK-01', 'Instagram Bio gera URL canônica e canal instagram_organic'
  )

  // LINK-02: Instagram Ads template -> instagram_ads
  const l2 = buildTrackingUrl({
    platform: 'instagram', trafficType: 'ads', format: '',
    tiktokAdsMode: 'standard', destination: '/lp/telas-mosquiteiras', customDestination: '',
    campaign: '', content: '', term: ''
  })
  assert(
    l2.fullUrl.includes('utm_source={{site_source_name}}') && l2.expectedChannel === 'instagram_ads',
    'LINK-02', 'Instagram Ads template inclui {{site_source_name}} e define canal instagram_ads'
  )

  // LINK-03: Facebook Ads template -> facebook_ads
  const l3 = buildTrackingUrl({
    platform: 'facebook', trafficType: 'ads', format: '',
    tiktokAdsMode: 'standard', destination: '/lp/telas-mosquiteiras', customDestination: '',
    campaign: '', content: '', term: ''
  })
  assert(
    l3.fullUrl.includes('utm_source={{site_source_name}}') && l3.expectedChannel === 'facebook_ads',
    'LINK-03', 'Facebook Ads template inclui macros Meta e define canal facebook_ads'
  )

  // LINK-04: Facebook Orgânico -> facebook_organic
  const l4 = buildTrackingUrl({
    platform: 'facebook', trafficType: 'organic', format: 'perfil',
    tiktokAdsMode: 'standard', destination: '/', customDestination: '',
    campaign: 'perfil', content: 'perfil', term: ''
  })
  assert(
    l4.fullUrl.includes('utm_source=facebook&utm_medium=organic') && l4.expectedChannel === 'facebook_organic',
    'LINK-04', 'Facebook Orgânico gera parâmetros corretos e canal facebook_organic'
  )

  // LINK-05: TikTok Orgânico -> tiktok_organic
  const l5 = buildTrackingUrl({
    platform: 'tiktok', trafficType: 'organic', format: 'bio',
    tiktokAdsMode: 'standard', destination: '/', customDestination: '',
    campaign: 'bio', content: 'perfil', term: ''
  })
  assert(
    l5.fullUrl.includes('utm_source=tiktok&utm_medium=organic') && l5.expectedChannel === 'tiktok_organic',
    'LINK-05', 'TikTok Orgânico gera utm_source=tiktok e canal tiktok_organic'
  )

  // LINK-06: TikTok Standard -> tiktok_ads
  const l6 = buildTrackingUrl({
    platform: 'tiktok', trafficType: 'ads', format: '',
    tiktokAdsMode: 'standard', destination: '/lp/telas-mosquiteiras', customDestination: '',
    campaign: '', content: '', term: ''
  })
  assert(
    l6.fullUrl.includes('tiktok_creative_id=__CID__') && !l6.fullUrl.includes('tiktok_ad_id=') &&
    l6.expectedChannel === 'tiktok_ads',
    'LINK-06', 'TikTok Standard inclui __CID__ e omite tiktok_ad_id de forma canônica'
  )

  // LINK-07: TikTok Smart+ -> tiktok_ads
  const l7 = buildTrackingUrl({
    platform: 'tiktok', trafficType: 'ads', format: '',
    tiktokAdsMode: 'smart_plus', destination: '/lp/telas-mosquiteiras', customDestination: '',
    campaign: '', content: '', term: ''
  })
  assert(
    l7.fullUrl.includes('tiktok_ad_id=__ADID_V2__') && l7.fullUrl.includes('tiktok_creative_id=__CID__') &&
    l7.expectedChannel === 'tiktok_ads',
    'LINK-07', 'TikTok Smart+ inclui macro oficial __ADID_V2__ como Ad ID separado'
  )

  // LINK-08: Meta macros preservadas literalmente
  const l8 = buildTrackingUrl({
    platform: 'instagram', trafficType: 'ads', format: '',
    tiktokAdsMode: 'standard', destination: '/', customDestination: '',
    campaign: '', content: '', term: ''
  })
  assert(
    !l8.fullUrl.includes('%7B') && l8.fullUrl.includes('{{site_source_name}}') && l8.fullUrl.includes('{{campaign.name}}'),
    'LINK-08', 'Macros Meta preservadas literalmente sem URL-encoding destrutivo'
  )

  // LINK-09: TikTok macros preservadas literalmente
  const l9 = buildTrackingUrl({
    platform: 'tiktok', trafficType: 'ads', format: '',
    tiktokAdsMode: 'smart_plus', destination: '/', customDestination: '',
    campaign: '', content: '', term: ''
  })
  assert(
    l9.fullUrl.includes('__CAMPAIGN_NAME__') && l9.fullUrl.includes('__AID__') && l9.fullUrl.includes('__ADID_V2__'),
    'LINK-09', 'Macros oficiais TikTok preservadas literalmente sem corrupção'
  )

  // LINK-10: Nenhum Click ID artificial
  const l10 = buildTrackingUrl({
    platform: 'instagram', trafficType: 'ads', format: '',
    tiktokAdsMode: 'standard', destination: '/', customDestination: '',
    campaign: '', content: '', term: ''
  })
  assert(
    !l10.fullUrl.includes('fbclid') && !l10.fullUrl.includes('gclid') && !l10.fullUrl.includes('ttclid'),
    'LINK-10', 'Nenhum Click ID artificial gerado nos templates de produção'
  )

  // LINK-11: Domínio externo neutralizado
  const l11 = buildTrackingUrl({
    platform: 'instagram', trafficType: 'organic', format: 'bio',
    tiktokAdsMode: 'standard', destination: 'custom',
    customDestination: 'https://malicious-external-site.com/phishing',
    campaign: 'bio', content: 'perfil', term: ''
  })
  assert(
    l11.fullUrl.startsWith(CANONICAL_BASE_DOMAIN) && !l11.fullUrl.includes('malicious-external-site.com'),
    'LINK-11', 'Tentativa de domínio externo é neutralizada e ancorada no domínio oficial'
  )

  // LINK-12: Sanitização robusta
  const l12 = buildTrackingUrl({
    platform: 'instagram', trafficType: 'organic', format: 'outro',
    tiktokAdsMode: 'standard', destination: '/', customDestination: '',
    campaign: 'Promoção Telas 2026! <script>', content: 'Stories Especial #1 "Segurança"', term: ''
  })
  assert(
    !l12.utm_campaign.includes('<') && !l12.utm_campaign.includes('script') && !l12.utm_content.includes('"'),
    'LINK-12', 'Valores com espaço e caracteres perigosos sanitizados corretamente'
  )

  // LINK-13: Query pré-existente preservada
  const l13 = buildTrackingUrl({
    platform: 'instagram', trafficType: 'organic', format: 'bio',
    tiktokAdsMode: 'standard', destination: 'custom',
    customDestination: '/servicos/telas?tipo=fixa&cor=branca',
    campaign: 'bio', content: 'perfil', term: ''
  })
  assert(
    l13.fullUrl.includes('tipo=fixa&cor=branca&utm_source=instagram'),
    'LINK-13', 'Query pré-existente no destino concatenada perfeitamente com &'
  )

  // LINK-14: Fragment/hash preservado
  const l14 = buildTrackingUrl({
    platform: 'tiktok', trafficType: 'organic', format: 'bio',
    tiktokAdsMode: 'standard', destination: 'custom',
    customDestination: '/lp/telas-mosquiteiras#faq',
    campaign: 'bio', content: 'perfil', term: ''
  })
  assert(
    l14.fullUrl.endsWith('#faq') && l14.fullUrl.includes('utm_source=tiktok'),
    'LINK-14', 'Fragment #faq preservado rigorosamente na extremidade da URL'
  )

  // LINK-15: Classificador canônico e simulação
  const vOrg = validateTrackingUrl(`${CANONICAL_BASE_DOMAIN}/?utm_source=instagram&utm_medium=organic&utm_campaign=bio`, 'instagram_organic')
  const vMeta = validateTrackingUrl(`${CANONICAL_BASE_DOMAIN}/?utm_source={{site_source_name}}&utm_medium=paid_social`, 'instagram_ads')
  assert(
    vOrg.isChannelMatched && vMeta.runtimeSimulations?.simulatedChannel === 'instagram_ads',
    'LINK-15', 'Classificador canônico valida canais e simulação em tempo de execução'
  )

  // LINK-16: Validação estática client-side sem efeitos colaterais
  const vPure = validateTrackingUrl(`${CANONICAL_BASE_DOMAIN}/lp/telas-mosquiteiras?utm_source=facebook&utm_medium=organic`)
  assert(
    vPure.isValid && vPure.detectedChannel === 'facebook_organic' && vPure.domain === CANONICAL_BASE_DOMAIN,
    'LINK-16', 'Validação estática client-side é pura, instantânea e sem efeito colateral'
  )
}
