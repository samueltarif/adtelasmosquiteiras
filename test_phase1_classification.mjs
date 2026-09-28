/**
 * Suíte de Testes Canônicos de Classificação de Tráfego (Fase 1 / Fase 4.5 / Fase 5)
 * Arquivo: test_phase1_classification.mjs
 *
 * Executa as 27 asserções de canais, normalização, anti-spoofing e precedência.
 * Teste 100% puro e determinístico sem efeitos colaterais no banco de dados.
 */

import { classifyClientChannel } from './app/utils/trafficChannelClassifier.ts'

let passCount = 0
let failCount = 0

function ok(label, cond, detail = '') {
  if (cond) {
    console.log(`  [PASS] ${label}${detail ? ' | ' + detail : ''}`)
    passCount++
  } else {
    console.error(`  [FAIL] ${label}${detail ? ' | ' + detail : ''}`)
    failCount++
  }
}

function testClassify(label, params, expected) {
  const got = classifyClientChannel(params)
  ok(label, got === expected, `expected=${expected} got=${got}`)
}

console.log('='.repeat(70))
console.log('SUÍTE DE TESTES: CLASSIFICAÇÃO CANÔNICA DE TRÁFEGO (27 TESTES)')
console.log('='.repeat(70))

// 1. CANAIS PRINCIPAIS E NORMALIZAÇÃO (14 TESTES)
testClassify('1. Google Ads via gclid', { gclid: 'GCL_01' }, 'google_ads')
testClassify('2. Google Ads via source+cpc', { utm_source: 'google', utm_medium: 'cpc' }, 'google_ads')
testClassify('3. Google Orgânico via referrer', { referrer: 'https://www.google.com.br/search?q=telas' }, 'google_organic')
testClassify('4. Microsoft Ads via msclkid', { msclkid: 'MS_01' }, 'microsoft_ads')
testClassify('5. Microsoft Ads via bing+cpc', { utm_source: 'bing', utm_medium: 'cpc' }, 'microsoft_ads')
testClassify('6. TikTok Ads via ttclid', { ttclid: 'TT_01' }, 'tiktok_ads')
testClassify('7. TikTok Ads via source+paid_social', { utm_source: 'tiktok', utm_medium: 'paid_social' }, 'tiktok_ads')
testClassify('8. TikTok Orgânico via source', { utm_source: 'tiktok', utm_medium: 'organic' }, 'tiktok_organic')
testClassify('9. Instagram Ads via ig normalizado', { utm_source: 'ig', utm_medium: 'paid_social' }, 'instagram_ads')
testClassify('10. Instagram Orgânico via source', { utm_source: 'instagram', utm_medium: 'organic' }, 'instagram_organic')
testClassify('11. Facebook Ads via fb normalizado', { utm_source: 'fb', utm_medium: 'paid_social' }, 'facebook_ads')
testClassify('12. Facebook Orgânico via source', { utm_source: 'facebook', utm_medium: 'organic' }, 'facebook_organic')
testClassify('13. Meta Ads Genérico via fbclid sem source', { fbclid: 'FB_01' }, 'meta_ads')
testClassify('14. Other Paid via medium pago não mapeado', { utm_source: 'linkedin', utm_medium: 'paid_social' }, 'other_paid')

// 2. ANTI-SPOOFING DE HOSTNAME (8 TESTES)
testClassify('15. SPOOF-TK | nottiktok.com != tiktok_organic', { referrer: 'https://nottiktok.com/page' }, 'referral')
testClassify('16. SPOOF-TK | fake-tiktok.com != tiktok_organic', { referrer: 'https://fake-tiktok.com' }, 'referral')
testClassify('17. SPOOF-GG | notgoogle.com != google_organic', { referrer: 'https://notgoogle.com' }, 'referral')
testClassify('18. SPOOF-GG | attacker-google.com != google_organic', { referrer: 'https://attacker-google.com' }, 'referral')
testClassify('19. SPOOF-IG | fakeinstagram.com != instagram_organic', { referrer: 'https://fakeinstagram.com' }, 'referral')
testClassify('20. SPOOF-FB | fakefacebook.com != facebook_organic', { referrer: 'https://fakefacebook.com' }, 'referral')
testClassify('21. REAL-TK | www.tiktok.com = tiktok_organic', { referrer: 'https://www.tiktok.com' }, 'tiktok_organic')
testClassify('22. REAL-GG | www.google.com.br = google_organic', { referrer: 'https://www.google.com.br/search?q=x' }, 'google_organic')

// 3. PRECEDÊNCIA CANÔNICA DE CLICK IDs (5 TESTES)
testClassify('23. PREC-01 | gclid + ttclid => google_ads', { gclid: 'G1', ttclid: 'T1' }, 'google_ads')
testClassify('24. PREC-02 | gclid + fbclid => google_ads', { gclid: 'G1', fbclid: 'F1' }, 'google_ads')
testClassify('25. PREC-03 | msclkid + ttclid => microsoft_ads', { msclkid: 'MS1', ttclid: 'T1' }, 'microsoft_ads')
testClassify('26. PREC-04 | ttclid + fbclid => tiktok_ads', { ttclid: 'T1', fbclid: 'F1' }, 'tiktok_ads')
testClassify('27. PREC-05 | fbclid sem source => meta_ads', { fbclid: 'F1' }, 'meta_ads')

console.log('='.repeat(70))
console.log(`TOTAL DE CLASSIFICAÇÃO: ${passCount} PASS | ${failCount} FAIL`)
console.log('='.repeat(70))

if (failCount > 0) {
  process.exit(1)
} else {
  console.log('TODAS AS 27 ASSERÇÕES DE CLASSIFICAÇÃO PASSARAM COM SUCESSO!\n')
}
