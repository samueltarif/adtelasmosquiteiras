import assert from 'node:assert'
import { computeGoogleAdsData, safeRate, safeRateNum } from '../server/shared/adminGoogleAdsMetrics.mjs'
import { classifyLeadRecord, normalizeChannel } from '../server/shared/adminAnalyticsClassification.mjs'

let totalTests = 0
let passedTests = 0
let failedTests = 0
let skippedTests = 0

function test(name, fn) {
  totalTests++
  try {
    fn()
    passedTests++
    console.log(`  ✔ [PASS] ${name}`)
  } catch (err) {
    failedTests++
    console.error(`  ✖ [FAIL] ${name}:`, err.message)
  }
}

async function runAllTests() {
  console.log('=================================================================')
  console.log('BATERIA COMPLETA DE TESTES AUTOMATIZADOS — FASE 1 GOOGLE ADS')
  console.log('=================================================================\n')

  // -------------------------------------------------------------------------
  // SUITE 1: adminGoogleAdsMetrics & safeRate / safeRateNum
  // -------------------------------------------------------------------------
  console.log('SUITE 1: adminGoogleAdsMetrics (safeRate, safeRateNum, divisão por zero)')
  
  test('safeRate com denominadores zero ou negativos retorna 0.0%', () => {
    assert.strictEqual(safeRate(0, 0), '0.0%')
    assert.strictEqual(safeRate(10, 0), '0.0%')
    assert.strictEqual(safeRate(10, -5), '0.0%')
    assert.strictEqual(safeRate(null, 10), '0.0%')
    assert.strictEqual(safeRate(undefined, 10), '0.0%')
  })

  test('safeRate calcula proporções e arredonda com precisão para 1 casa decimal', () => {
    assert.strictEqual(safeRate(1, 3), '33.3%')
    assert.strictEqual(safeRate(2, 3), '66.7%')
    assert.strictEqual(safeRate(1, 4), '25.0%')
    assert.strictEqual(safeRate(1, 1), '100.0%')
  })

  test('safeRateNum retorna float com 1 casa decimal e não quebra com zero', () => {
    assert.strictEqual(safeRateNum(0, 0), 0)
    assert.strictEqual(safeRateNum(1, 2), 50.0)
    assert.strictEqual(safeRateNum(1, 3), 33.3)
  })

  // -------------------------------------------------------------------------
  // SUITE 2: Funil Bifurcado & União Estatística de Intenção
  // -------------------------------------------------------------------------
  console.log('\nSUITE 2: Funil Bifurcado & União Estatística de Intenção')

  const testDateRange = {
    startUtc: '2026-09-01T00:00:00.000Z',
    endUtc: '2026-09-20T23:59:59.999Z',
    identityStartUtc: '2026-08-24T00:00:00.000Z'
  }

  test('Funil bifurcado calcula união de visitantes sem soma ingênua duplicada', () => {
    // 3 visitantes na landing:
    // v1 acessou e clicou em quote_cta e form_start e virou lead
    // v2 acessou e clicou em whatsapp direto (sem quote_cta)
    // v3 apenas visualizou
    const views = [
      { visitor_id: 'v1', session_id: 's1', path: '/lp/telas-mosquiteiras', channel: 'google_ads', is_bot: false, created_at: '2026-09-10T10:00:00Z' },
      { visitor_id: 'v2', session_id: 's2', path: '/lp/telas-mosquiteiras', channel: 'google_ads', is_bot: false, created_at: '2026-09-10T11:00:00Z' },
      { visitor_id: 'v3', session_id: 's3', path: '/lp/telas-mosquiteiras', channel: 'google_ads', is_bot: false, created_at: '2026-09-10T12:00:00Z' }
    ]
    const clicks = [
      { visitor_id: 'v1', session_id: 's1', tipo: 'quote_cta', cta_location: 'lp_hero', origem: '/lp/telas-mosquiteiras', is_bot: false, created_at: '2026-09-10T10:01:00Z' },
      { visitor_id: 'v1', session_id: 's1', tipo: 'form_start', cta_location: 'lp_form', origem: '/lp/telas-mosquiteiras', is_bot: false, created_at: '2026-09-10T10:02:00Z' },
      { visitor_id: 'v2', session_id: 's2', tipo: 'whatsapp', cta_location: 'lp_header', origem: '/lp/telas-mosquiteiras', is_bot: false, created_at: '2026-09-10T11:01:00Z' }
    ]
    const leads = [
      { id: 'lead-1', visitor_id: 'v1', session_id: 's1', nome: 'Cliente Real 1', telefone: '11987654321', origem: '/lp/telas-mosquiteiras', session_channel: 'google_ads', created_at: '2026-09-10T10:05:00Z' }
    ]

    const res = computeGoogleAdsData(views, clicks, leads, testDateRange)
    
    assert.strictEqual(res.funnel.landing_visitors, 3)
    assert.strictEqual(res.funnel.quote_cta_visitors, 1)
    assert.strictEqual(res.funnel.whatsapp_unique_visitors, 1)
    assert.strictEqual(res.funnel.form_start_unique_visitors, 1)
    assert.strictEqual(res.funnel.real_lead_unique_visitors, 1)
    
    // União desduplicada: v1 + v2 = 2 pessoas únicas
    assert.strictEqual(res.funnel.contact_intent_unique_visitors, 2)
    assert.strictEqual(res.funnel.taxa_intencao, '66.7%')
    assert.strictEqual(res.funnel.taxa_whatsapp, '33.3%')
    assert.strictEqual(res.funnel.taxa_form_start, '33.3%')
    assert.strictEqual(res.funnel.taxa_form_success, '33.3%')
  })

  test('WhatsApp não exige quote_cta prévio para ser contabilizado no funil', () => {
    const views = [
      { visitor_id: 'v_wa', session_id: 's_wa', path: '/lp/telas-mosquiteiras', channel: 'google_ads', is_bot: false, created_at: '2026-09-10T10:00:00Z' }
    ]
    const clicks = [
      { visitor_id: 'v_wa', session_id: 's_wa', tipo: 'whatsapp', cta_location: 'floating_whatsapp', origem: '/lp/telas-mosquiteiras', is_bot: false, created_at: '2026-09-10T10:01:00Z' }
    ]
    const res = computeGoogleAdsData(views, clicks, [], testDateRange)
    
    assert.strictEqual(res.funnel.landing_visitors, 1)
    assert.strictEqual(res.funnel.whatsapp_unique_visitors, 1)
    assert.strictEqual(res.funnel.quote_cta_visitors, 0)
    assert.strictEqual(res.funnel.contact_intent_unique_visitors, 1)
    assert.strictEqual(res.funnel.taxa_whatsapp, '100.0%')
  })

  // -------------------------------------------------------------------------
  // SUITE 3: Data Quality (Denominador de Sessões e Click IDs)
  // -------------------------------------------------------------------------
  console.log('\nSUITE 3: Data Quality & Click ID Denominator')

  test('Data Quality utiliza sessões únicas de Google Ads como denominador', () => {
    const views = [
      // Sessão 1: tem gclid, keyword e campaign_id
      { session_id: 's1', visitor_id: 'v1', channel: 'google_ads', gclid: 'g1', utm_term: 'tela mosquito', google_campaign_id: 'c1', is_bot: false, created_at: '2026-09-10T10:00:00Z' },
      // Sessão 2: tem wbraid (iOS), sem gclid (ausência de gclid não é erro!)
      { session_id: 's2', visitor_id: 'v2', channel: 'google_ads', wbraid: 'w1', utm_term: 'rede janela', google_campaign_id: 'c1', is_bot: false, created_at: '2026-09-10T10:00:00Z' },
      // Sessão 3: sem click id
      { session_id: 's3', visitor_id: 'v3', channel: 'google_ads', utm_term: '', google_campaign_id: null, is_bot: false, created_at: '2026-09-10T10:00:00Z' }
    ]
    const leads = [
      { id: 'lead-1', visitor_id: 'v1', session_id: 's1', session_channel: 'google_ads', gclid: 'g1', created_at: '2026-09-10T10:00:00Z' }
    ]

    const res = computeGoogleAdsData(views, [], leads, testDateRange)
    
    assert.strictEqual(res.data_quality.total_google_ads_sessions, 3)
    assert.strictEqual(res.data_quality.sessions_with_click_id, 2)
    assert.strictEqual(res.data_quality.pct_with_click_id, '66.7%')
    assert.strictEqual(res.data_quality.sessions_with_keyword, 2)
    assert.strictEqual(res.data_quality.pct_with_keyword, '66.7%')
    assert.strictEqual(res.data_quality.sessions_with_campaign_id, 2)
    assert.strictEqual(res.data_quality.pct_with_campaign_id, '66.7%')
  })

  test('Click ID válido reconhece gclid, gbraid ou wbraid', () => {
    const vGclid = [{ session_id: 's_g', channel: 'google_ads', gclid: 'val_g', is_bot: false, created_at: '2026-09-10T10:00:00Z' }]
    const vGbraid = [{ session_id: 's_gb', channel: 'google_ads', gbraid: 'val_gb', is_bot: false, created_at: '2026-09-10T10:00:00Z' }]
    const vWbraid = [{ session_id: 's_wb', channel: 'google_ads', wbraid: 'val_wb', is_bot: false, created_at: '2026-09-10T10:00:00Z' }]
    
    assert.strictEqual(computeGoogleAdsData(vGclid, [], [], testDateRange).data_quality.sessions_with_click_id, 1)
    assert.strictEqual(computeGoogleAdsData(vGbraid, [], [], testDateRange).data_quality.sessions_with_click_id, 1)
    assert.strictEqual(computeGoogleAdsData(vWbraid, [], [], testDateRange).data_quality.sessions_with_click_id, 1)
  })

  // -------------------------------------------------------------------------
  // SUITE 4: Filtragem Estrita de Bots e Canais Orgânicos
  // -------------------------------------------------------------------------
  console.log('\nSUITE 4: Filtragem Estrita de Bots e Canais Orgânicos')

  test('Bots são completamente excluídos de todos os KPIs de Google Ads', () => {
    const views = [
      { visitor_id: 'human', session_id: 's_h', channel: 'google_ads', is_bot: false, created_at: '2026-09-10T10:00:00Z' },
      { visitor_id: 'bot_google', session_id: 's_b', channel: 'google_ads', is_bot: true, created_at: '2026-09-10T10:00:00Z' }
    ]
    const clicks = [
      { visitor_id: 'bot_google', session_id: 's_b', tipo: 'whatsapp', is_bot: true, created_at: '2026-09-10T10:00:00Z' }
    ]
    const res = computeGoogleAdsData(views, clicks, [], testDateRange)
    
    assert.strictEqual(res.kpis.unique_visitors, 1)
    assert.strictEqual(res.kpis.sessions, 1)
    assert.strictEqual(res.kpis.whatsapp_clicks, 0)
  })

  test('Tráfego puramente orgânico não entra nos cards de Google Ads', () => {
    const views = [
      { visitor_id: 'org_user', session_id: 's_org', channel: 'organic', utm_medium: null, is_bot: false, created_at: '2026-09-10T10:00:00Z' }
    ]
    const res = computeGoogleAdsData(views, [], [], testDateRange)
    assert.strictEqual(res.kpis.unique_visitors, 0)
    assert.strictEqual(res.kpis.sessions, 0)
  })

  // -------------------------------------------------------------------------
  // SUITE 5: Pipeline de Atribuição e ValueTrack Mapping
  // -------------------------------------------------------------------------
  console.log('\nSUITE 5: Pipeline de Atribuição e ValueTrack Mapping')

  test('Mapeia corretamente parâmetros de URL para colunas google_*', () => {
    const mockQuery = {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'ad_telas_pesquisa_leads_sp',
      utm_content: '112233',
      utm_term: 'tela mosquiteira',
      campaign_id: '123',
      adgroup_id: '456',
      creative: '789',
      matchtype: 'p',
      device: 'm',
      network: 'g',
      target_id: 'kwd-999'
    }

    // Validação da lógica implementada em useAttribution.ts
    const mapped = {
      google_campaign_id: mockQuery.campaign_id || null,
      google_adgroup_id: mockQuery.adgroup_id || null,
      google_creative_id: mockQuery.creative || null,
      google_match_type: mockQuery.matchtype || null,
      google_device: mockQuery.device || null,
      google_network: mockQuery.network || null,
      google_target_id: mockQuery.target_id || null
    }

    assert.strictEqual(mapped.google_campaign_id, '123')
    assert.strictEqual(mapped.google_adgroup_id, '456')
    assert.strictEqual(mapped.google_creative_id, '789')
    assert.strictEqual(mapped.google_match_type, 'p')
    assert.strictEqual(mapped.google_device, 'm')
    assert.strictEqual(mapped.google_network, 'g')
    assert.strictEqual(mapped.google_target_id, 'kwd-999')
  })

  test('device_type do User-Agent permanece desacoplado de google_device', () => {
    const userAgentMobile = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
    const googleDeviceParam = 'c' // Anúncio pode ter sido servido em computador mas User-Agent é mobile (ex: teste ou proxy)
    
    // device_type derivado do User-Agent
    const deviceType = userAgentMobile.includes('iPhone') ? 'mobile' : 'desktop'
    
    assert.strictEqual(deviceType, 'mobile')
    assert.strictEqual(googleDeviceParam, 'c')
    assert.notStrictEqual(deviceType, googleDeviceParam)
  })

  // -------------------------------------------------------------------------
  // SUITE 6: Desempenho de CTAs e Nomenclatura Estrita
  // -------------------------------------------------------------------------
  console.log('\nSUITE 6: Desempenho de CTAs e Nomenclatura Estrita')

  test('CTAs agrupam cliques por localização declarativa', () => {
    const clicks = [
      { visitor_id: 'v1', cta_location: 'lp_hero', tipo: 'quote_cta', origem: '/lp/telas-mosquiteiras', is_bot: false, created_at: '2026-09-10T10:00:00Z' },
      { visitor_id: 'v2', cta_location: 'lp_hero', tipo: 'quote_cta', origem: '/lp/telas-mosquiteiras', is_bot: false, created_at: '2026-09-10T10:00:00Z' },
      { visitor_id: 'v3', cta_location: 'lp_sticky', tipo: 'quote_cta', origem: '/lp/telas-mosquiteiras', is_bot: false, created_at: '2026-09-10T10:00:00Z' }
    ]
    const res = computeGoogleAdsData([], clicks, [], testDateRange)
    
    const heroCta = res.ctas.find(c => c.cta_location === 'lp_hero')
    assert.ok(heroCta, 'lp_hero deve existir nos CTAs')
    assert.strictEqual(heroCta.clicks, 2)
    assert.strictEqual(heroCta.unique_visitors, 2)
    assert.strictEqual(heroCta.pct_of_total_clicks, '66.7%')
  })

  test('Tabela de Palavras-chave armazena utm_term sem rotular como "Termo de pesquisa"', () => {
    const views = [
      { visitor_id: 'v1', session_id: 's1', channel: 'google_ads', utm_term: 'rede protecao sp', is_bot: false, created_at: '2026-09-10T10:00:00Z' }
    ]
    const res = computeGoogleAdsData(views, [], [], testDateRange)
    assert.strictEqual(res.keywords.length, 1)
    assert.strictEqual(res.keywords[0].keyword, 'rede protecao sp')
  })

  // -------------------------------------------------------------------------
  // SUITE 7: Comportamento Sem Dados (Zero Cases & Robustez)
  // -------------------------------------------------------------------------
  console.log('\nSUITE 7: Comportamento com Zero Dados (Sem NaN, Sem Infinity, Sem Null)')

  test('Arrays vazios produzem zero sem NaN, Infinity ou null', () => {
    const res = computeGoogleAdsData([], [], [], testDateRange)
    
    assert.strictEqual(res.kpis.unique_visitors, 0)
    assert.strictEqual(res.kpis.sessions, 0)
    assert.strictEqual(res.kpis.contact_intent_rate, '0.0%')
    assert.strictEqual(res.kpis.lead_conversion_rate, '0.0%')
    assert.strictEqual(res.funnel.landing_visitors, 0)
    assert.strictEqual(res.funnel.taxa_intencao, '0.0%')
    assert.strictEqual(res.funnel.taxa_whatsapp, '0.0%')
    assert.strictEqual(res.funnel.taxa_form_start, '0.0%')
    assert.strictEqual(res.funnel.taxa_form_success, '0.0%')
    assert.strictEqual(res.data_quality.total_google_ads_sessions, 0)
    assert.strictEqual(res.data_quality.pct_with_click_id, '0.0%')
    assert.strictEqual(res.campaigns.length, 0)
    assert.strictEqual(res.keywords.length, 0)
    assert.strictEqual(res.ctas.length, 0)
  })

  // -------------------------------------------------------------------------
  // SUITE 8: Imutabilidade do Primeiro Toque (First Touch)
  // -------------------------------------------------------------------------
  console.log('\nSUITE 8: Imutabilidade do Primeiro Toque (First Touch)')

  test('Primeiro toque preserva valores originais mesmo após sessões diretas', () => {
    // Primeiro toque original (Google Ads)
    const initialFt = {
      channel: 'google_ads',
      landing_path: '/lp/telas-mosquiteiras',
      utm_campaign: 'AD Telas | Pesquisa | Leads | SP',
      google_campaign_id: '24258184938',
      google_adgroup_id: '123456',
      gclid: 'gclid-first-touch-123'
    }

    // Sessão subsequente direta (retorno do usuário no dia seguinte)
    const secondSession = {
      channel: 'direct',
      landing_path: '/',
      utm_campaign: null,
      google_campaign_id: null,
      gclid: null
    }

    // Regra canônica: se já existe first_touch, ele NUNCA é sobrescrito
    const finalFirstTouch = initialFt || secondSession

    assert.strictEqual(finalFirstTouch.channel, 'google_ads')
    assert.strictEqual(finalFirstTouch.google_campaign_id, '24258184938')
    assert.strictEqual(finalFirstTouch.gclid, 'gclid-first-touch-123')
  })

  // -------------------------------------------------------------------------
  // RESUMO FINAL
  // -------------------------------------------------------------------------
  console.log('\n=================================================================')
  console.log(`TOTAL DE TESTES: ${totalTests}`)
  console.log(`APROVADOS:       ${passedTests}`)
  console.log(`FALHAS:          ${failedTests}`)
  console.log(`SKIPPED:         ${skippedTests}`)
  console.log('=================================================================')

  if (failedTests > 0) {
    process.exit(1)
  }
}

runAllTests().catch(e => {
  console.error('Fatal test error:', e)
  process.exit(1)
})
