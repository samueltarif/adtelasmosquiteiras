/**
 * Testes Unitários do Gerador Canônico de Links de Rastreamento (Fase 6)
 * Arquivo: scripts/test_tracking_link_generator.mjs
 */

import {
  buildTrackingUrl,
  validateTrackingUrl,
  isMacro,
  sanitizeParamValue
} from '../app/utils/trackingLinkBuilder.ts'

import {
  CANONICAL_BASE_DOMAIN,
  ORGANIC_FORMATS,
  META_ADS_PARAMS,
  TIKTOK_STANDARD_PARAMS,
  TIKTOK_SMART_PLUS_PARAMS
} from '../app/utils/trackingLinkPresets.ts'

import { classifyClientChannel } from '../app/utils/trafficChannelClassifier.ts'

let passCount = 0
let failCount = 0

function assert(condition, testCode, description) {
  if (condition) {
    console.log(`  [PASS] ${testCode}: ${description}`)
    passCount++
  } else {
    console.error(`  [FAIL] ${testCode}: ${description}`)
    failCount++
  }
}

console.log('='.repeat(70))
console.log('SUÍTE DE TESTES: GERADOR DE LINKS DE RASTREAMENTO (FASE 6)')
console.log('='.repeat(70))

// LINK-01: Instagram Bio -> instagram_organic
{
  const link = buildTrackingUrl({
    platform: 'instagram',
    trafficType: 'organic',
    format: 'bio',
    tiktokAdsMode: 'standard',
    destination: '/',
    customDestination: '',
    campaign: 'bio',
    content: 'perfil',
    term: ''
  })
  const expectedUrl = `${CANONICAL_BASE_DOMAIN}/?utm_source=instagram&utm_medium=organic&utm_campaign=bio&utm_content=perfil`
  assert(
    link.fullUrl === expectedUrl && link.expectedChannel === 'instagram_organic',
    'LINK-01',
    'Instagram Bio gera URL canônica e canal instagram_organic'
  )
}

// LINK-02: Instagram Ads template -> instagram_ads
{
  const link = buildTrackingUrl({
    platform: 'instagram',
    trafficType: 'ads',
    format: '',
    tiktokAdsMode: 'standard',
    destination: '/lp/telas-mosquiteiras',
    customDestination: '',
    campaign: '',
    content: '',
    term: ''
  })
  assert(
    link.fullUrl.includes('utm_source={{site_source_name}}') &&
    link.fullUrl.includes('utm_medium=paid_social') &&
    link.expectedChannel === 'instagram_ads',
    'LINK-02',
    'Instagram Ads template inclui {{site_source_name}} e define canal instagram_ads'
  )
}

// LINK-03: Facebook Ads template -> facebook_ads
{
  const link = buildTrackingUrl({
    platform: 'facebook',
    trafficType: 'ads',
    format: '',
    tiktokAdsMode: 'standard',
    destination: '/lp/telas-mosquiteiras',
    customDestination: '',
    campaign: '',
    content: '',
    term: ''
  })
  assert(
    link.fullUrl.includes('utm_source={{site_source_name}}') &&
    link.expectedChannel === 'facebook_ads',
    'LINK-03',
    'Facebook Ads template inclui macros Meta e define canal facebook_ads'
  )
}

// LINK-04: Facebook Orgânico -> facebook_organic
{
  const link = buildTrackingUrl({
    platform: 'facebook',
    trafficType: 'organic',
    format: 'perfil',
    tiktokAdsMode: 'standard',
    destination: '/',
    customDestination: '',
    campaign: 'perfil',
    content: 'perfil',
    term: ''
  })
  assert(
    link.fullUrl.includes('utm_source=facebook&utm_medium=organic') &&
    link.expectedChannel === 'facebook_organic',
    'LINK-04',
    'Facebook Orgânico gera parâmetros corretos e canal facebook_organic'
  )
}

// LINK-05: TikTok Orgânico -> tiktok_organic
{
  const link = buildTrackingUrl({
    platform: 'tiktok',
    trafficType: 'organic',
    format: 'bio',
    tiktokAdsMode: 'standard',
    destination: '/',
    customDestination: '',
    campaign: 'bio',
    content: 'perfil',
    term: ''
  })
  assert(
    link.fullUrl.includes('utm_source=tiktok&utm_medium=organic') &&
    link.expectedChannel === 'tiktok_organic',
    'LINK-05',
    'TikTok Orgânico gera utm_source=tiktok e canal tiktok_organic'
  )
}

// LINK-06: TikTok Standard -> tiktok_ads
{
  const link = buildTrackingUrl({
    platform: 'tiktok',
    trafficType: 'ads',
    format: '',
    tiktokAdsMode: 'standard',
    destination: '/lp/telas-mosquiteiras',
    customDestination: '',
    campaign: '',
    content: '',
    term: ''
  })
  assert(
    link.fullUrl.includes('utm_source=tiktok') &&
    link.fullUrl.includes('utm_medium=paid_social') &&
    link.fullUrl.includes('tiktok_creative_id=__CID__') &&
    !link.fullUrl.includes('tiktok_ad_id=') &&
    link.expectedChannel === 'tiktok_ads',
    'LINK-06',
    'TikTok Standard inclui __CID__ e omite tiktok_ad_id de forma canônica'
  )
}

// LINK-07: TikTok Smart+ -> tiktok_ads com __ADID_V2__
{
  const link = buildTrackingUrl({
    platform: 'tiktok',
    trafficType: 'ads',
    format: '',
    tiktokAdsMode: 'smart_plus',
    destination: '/lp/telas-mosquiteiras',
    customDestination: '',
    campaign: '',
    content: '',
    term: ''
  })
  assert(
    link.fullUrl.includes('tiktok_ad_id=__ADID_V2__') &&
    link.fullUrl.includes('tiktok_creative_id=__CID__') &&
    link.expectedChannel === 'tiktok_ads',
    'LINK-07',
    'TikTok Smart+ inclui macro oficial __ADID_V2__ como Ad ID separado'
  )
}

// LINK-08: Meta macros preservadas literalmente (sem %7B%7B)
{
  const link = buildTrackingUrl({
    platform: 'instagram',
    trafficType: 'ads',
    format: '',
    tiktokAdsMode: 'standard',
    destination: '/',
    customDestination: '',
    campaign: '',
    content: '',
    term: ''
  })
  const hasNoEncodedCurly = !link.fullUrl.includes('%7B') && !link.fullUrl.includes('%7D')
  const hasLiteralMacros = link.fullUrl.includes('{{site_source_name}}') &&
                           link.fullUrl.includes('{{campaign.name}}') &&
                           link.fullUrl.includes('{{ad.name}}')
  assert(
    hasNoEncodedCurly && hasLiteralMacros,
    'LINK-08',
    'Macros Meta preservadas literalmente sem URL-encoding destrutivo'
  )
}

// LINK-09: TikTok macros preservadas literalmente
{
  const link = buildTrackingUrl({
    platform: 'tiktok',
    trafficType: 'ads',
    format: '',
    tiktokAdsMode: 'smart_plus',
    destination: '/',
    customDestination: '',
    campaign: '',
    content: '',
    term: ''
  })
  const hasLiteralMacros = link.fullUrl.includes('__CAMPAIGN_NAME__') &&
                           link.fullUrl.includes('__AID__') &&
                           link.fullUrl.includes('__ADID_V2__') &&
                           link.fullUrl.includes('__CID__') &&
                           link.fullUrl.includes('__PLACEMENT__')
  assert(
    hasLiteralMacros,
    'LINK-09',
    'Macros oficiais TikTok preservadas literalmente sem corrupção'
  )
}

// LINK-10: Nenhum gclid/fbclid/ttclid/msclkid inventado
{
  const link1 = buildTrackingUrl({
    platform: 'instagram',
    trafficType: 'ads',
    format: '',
    tiktokAdsMode: 'standard',
    destination: '/',
    customDestination: '',
    campaign: '',
    content: '',
    term: ''
  })
  const link2 = buildTrackingUrl({
    platform: 'tiktok',
    trafficType: 'ads',
    format: '',
    tiktokAdsMode: 'smart_plus',
    destination: '/',
    customDestination: '',
    campaign: '',
    content: '',
    term: ''
  })
  const noFakeClickIds = !link1.fullUrl.includes('fbclid') &&
                         !link1.fullUrl.includes('gclid') &&
                         !link2.fullUrl.includes('ttclid') &&
                         !link2.fullUrl.includes('msclkid')
  assert(
    noFakeClickIds,
    'LINK-10',
    'Nenhum Click ID artificial gerado nos templates de produção'
  )
}

// LINK-11: Domínio externo rejeitado e forçado ao canônico
{
  const link = buildTrackingUrl({
    platform: 'instagram',
    trafficType: 'organic',
    format: 'bio',
    tiktokAdsMode: 'standard',
    destination: 'custom',
    customDestination: 'https://malicious-external-site.com/phishing',
    campaign: 'bio',
    content: 'perfil',
    term: ''
  })
  assert(
    link.fullUrl.startsWith(CANONICAL_BASE_DOMAIN) &&
    !link.fullUrl.includes('malicious-external-site.com'),
    'LINK-11',
    'Tentativa de domínio externo é neutralizada e ancorada no domínio oficial'
  )
}

// LINK-12: Valores com espaço/acento/caracteres perigosos sanitizados
{
  const link = buildTrackingUrl({
    platform: 'instagram',
    trafficType: 'organic',
    format: 'outro',
    tiktokAdsMode: 'standard',
    destination: '/',
    customDestination: '',
    campaign: 'Promoção Telas 2026! <script>',
    content: 'Stories Especial #1 "Segurança"',
    term: ''
  })
  const sanitizedCampaign = link.utm_campaign
  const sanitizedContent = link.utm_content
  assert(
    !sanitizedCampaign.includes('<') &&
    !sanitizedCampaign.includes('script') &&
    sanitizedCampaign.includes('promoção_telas_2026') &&
    !sanitizedContent.includes('"'),
    'LINK-12',
    'Valores com espaço e caracteres perigosos sanitizados corretamente'
  )
}

// LINK-13: Query existente no destino não quebra montagem
{
  const link = buildTrackingUrl({
    platform: 'instagram',
    trafficType: 'organic',
    format: 'bio',
    tiktokAdsMode: 'standard',
    destination: 'custom',
    customDestination: '/servicos/telas?tipo=fixa&cor=branca',
    campaign: 'bio',
    content: 'perfil',
    term: ''
  })
  assert(
    link.fullUrl.includes('tipo=fixa&cor=branca&utm_source=instagram'),
    'LINK-13',
    'Query pré-existente no destino concatenada perfeitamente com &'
  )
}

// LINK-14: Fragment/hash existente no destino preservado no final da URL
{
  const link = buildTrackingUrl({
    platform: 'tiktok',
    trafficType: 'organic',
    format: 'bio',
    tiktokAdsMode: 'standard',
    destination: 'custom',
    customDestination: '/lp/telas-mosquiteiras#faq',
    campaign: 'bio',
    content: 'perfil',
    term: ''
  })
  assert(
    link.fullUrl.endsWith('#faq') && link.fullUrl.includes('utm_source=tiktok'),
    'LINK-14',
    'Fragment #faq preservado rigorosamente na extremidade da URL'
  )
}

// LINK-15: Classificador canônico reconhece o canal esperado
{
  const valOrganic = validateTrackingUrl(
    `${CANONICAL_BASE_DOMAIN}/?utm_source=instagram&utm_medium=organic&utm_campaign=bio`,
    'instagram_organic'
  )
  const valTikTokAds = validateTrackingUrl(
    `${CANONICAL_BASE_DOMAIN}/?utm_source=tiktok&utm_medium=paid_social&utm_campaign=__CAMPAIGN_NAME__`,
    'tiktok_ads'
  )
  const valMetaSim = validateTrackingUrl(
    `${CANONICAL_BASE_DOMAIN}/?utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}`,
    'instagram_ads'
  )

  assert(
    valOrganic.detectedChannel === 'instagram_organic' &&
    valOrganic.isChannelMatched &&
    valTikTokAds.detectedChannel === 'tiktok_ads' &&
    valTikTokAds.isChannelMatched &&
    valMetaSim.runtimeSimulations?.simulatedChannel === 'instagram_ads' &&
    valMetaSim.isChannelMatched,
    'LINK-15',
    'Classificador canônico valida canais e simulação em tempo de execução'
  )
}

// LINK-16: Validação estática sem efeito colateral no banco
{
  const val = validateTrackingUrl(`${CANONICAL_BASE_DOMAIN}/lp/telas-mosquiteiras?utm_source=facebook&utm_medium=organic`)
  assert(
    val.isValid && val.detectedChannel === 'facebook_organic' && val.domain === CANONICAL_BASE_DOMAIN,
    'LINK-16',
    'Validação estática client-side é pura, instantânea e sem efeito colateral'
  )
}

console.log('='.repeat(70))
console.log(`TOTAL DE TESTES DO GERADOR: ${passCount} PASS | ${failCount} FAIL`)
console.log('='.repeat(70))

if (failCount > 0) {
  process.exit(1)
} else {
  console.log('TODOS OS 16 TESTES DO GERADOR DE LINKS FORAM APROVADOS COM SUCESSO!\n')
}
