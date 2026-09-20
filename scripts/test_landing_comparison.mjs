/**
 * Suíte de Testes Automatizados para a FASE 1.1 — Comparador "Antes x Depois"
 * Arquivo: scripts/test_landing_comparison.mjs
 */

import {
  calculateComparisonWindow,
  computeLandingComparison,
  formatPpDelta,
  formatCountDelta,
  matchesPathPrefix,
  matchesExactOrSubpath,
  safeRate,
  safeRateNum
} from '../server/shared/adminLandingComparison.mjs'

let totalTests = 0
let passedTests = 0
let failedTests = 0

function assert(condition, message) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ✅ PASS: ${message}`)
  } else {
    failedTests++
    console.error(`  ❌ FAIL: ${message}`)
  }
}

console.log('\n🧪 INICIANDO SUÍTE DE TESTES: COMPARADOR ANTES X DEPOIS\n')

const CUTOFF_ISO = '2026-09-20T18:51:51.000Z'

// -------------------------------------------------------------
// TESTE 1: Janela simétrica exata com mesma duração
// -------------------------------------------------------------
console.log('--- TESTE 1: Janela Simétrica Exata ---')
{
  const nowIso = '2026-09-21T18:51:51.000Z' // 24h após cutoff
  const win = calculateComparisonWindow(CUTOFF_ISO, { windowHours: 12 }, nowIso, 30)
  
  assert(win.isSymmetric === true, 'Janela deve ser marcada como simétrica')
  assert(win.durationHours === 12, 'Duração deve ser 12 horas')
  
  const beforeDurationMs = new Date(win.beforeEndUtc).getTime() - new Date(win.beforeStartUtc).getTime()
  const afterDurationMs = new Date(win.afterEndUtc).getTime() - new Date(win.afterStartUtc).getTime()
  assert(beforeDurationMs === afterDurationMs, 'Duração de Antes deve ser exatamente igual a Depois')
}

// -------------------------------------------------------------
// TESTE 2: Janela com poucas horas pós-lançamento e truncamento simétrico
// -------------------------------------------------------------
console.log('\n--- TESTE 2: Poucas Horas Pós-Lançamento (Truncamento) ---')
{
  // 3 horas e 30 minutos após cutoff
  const cutoffMs = new Date(CUTOFF_ISO).getTime()
  const nowMs = cutoffMs + 3.5 * 3600 * 1000
  const nowIso = new Date(nowMs).toISOString()
  
  // Buffer de 30 min reduz para 3.0 horas disponíveis
  const win = calculateComparisonWindow(CUTOFF_ISO, { windowHours: 24 }, nowIso, 30)
  
  assert(win.durationHours === 3.0, 'Duração deve ser truncada em 3 horas devido ao buffer de maturação')
  const beforeDurationMs = new Date(win.beforeEndUtc).getTime() - new Date(win.beforeStartUtc).getTime()
  const afterDurationMs = new Date(win.afterEndUtc).getTime() - new Date(win.afterStartUtc).getTime()
  assert(beforeDurationMs === afterDurationMs, 'Janela Antes deve espelhar as 3 horas exatas pós-maturação')
}

// -------------------------------------------------------------
// TESTE 3 & 4: Divisão por Zero e Nenhum Visitante
// -------------------------------------------------------------
console.log('\n--- TESTE 3 & 4: Divisão por Zero e Período Vazio ---')
{
  const win = calculateComparisonWindow(CUTOFF_ISO, { windowHours: 6 }, '2026-09-21T02:00:00.000Z', 30)
  const res = computeLandingComparison([], [], [], win)
  
  assert(res.before.landing_unique_visitors === 0, 'Antes: 0 visitantes')
  assert(res.after.landing_unique_visitors === 0, 'Depois: 0 visitantes')
  assert(res.before.taxa_intencao === '0.0%', 'Antes: taxa_intencao deve ser 0.0% sem NaN')
  assert(res.after.taxa_intencao === '0.0%', 'Depois: taxa_intencao deve ser 0.0% sem NaN')
  assert(res.delta.taxa_intencao.formatted === '0.0 p.p.', 'Delta de taxa com zero visitantes deve ser 0.0 p.p. neutro')
  assert(res.delta.taxa_intencao.is_neutral === true, 'Delta deve ser marcado como is_neutral: true')
  assert(res.sampleQuality.level === 'very_small', 'Qualidade de amostra deve ser "very_small"')
  assert(res.sampleQuality.label === 'Muito pequena', 'Rótulo deve ser "Muito pequena"')
}

// -------------------------------------------------------------
// TESTE 5: Desduplicação Estrita de Intenção Comercial (União)
// -------------------------------------------------------------
console.log('\n--- TESTE 5: Desduplicação Estrita de Intenção ---')
{
  const win = calculateComparisonWindow(CUTOFF_ISO, { windowHours: 6 }, '2026-09-21T02:00:00.000Z', 30)
  const views = [
    { id: 'v1', created_at: '2026-09-20T20:00:00Z', visitor_id: 'user_alpha', session_id: 's1', path: '/lp/telas-mosquiteiras', landing_path: '/lp/telas-mosquiteiras', channel: 'google_ads', is_bot: false, device_type: 'mobile' }
  ]
  const clicks = [
    { id: 'c1', created_at: '2026-09-20T20:01:00Z', visitor_id: 'user_alpha', session_id: 's1', tipo: 'quote_cta', channel: 'google_ads', is_bot: false, device_type: 'mobile' },
    { id: 'c2', created_at: '2026-09-20T20:02:00Z', visitor_id: 'user_alpha', session_id: 's1', tipo: 'whatsapp', channel: 'google_ads', is_bot: false, device_type: 'mobile' },
    { id: 'c3', created_at: '2026-09-20T20:03:00Z', visitor_id: 'user_alpha', session_id: 's1', tipo: 'form_start', channel: 'google_ads', is_bot: false, device_type: 'mobile' }
  ]
  const leads = [
    { id: 'l1', created_at: '2026-09-20T20:04:00Z', visitor_id: 'user_alpha', session_id: 's1', nome: 'Cliente Real', telefone: '11988881234', session_channel: 'google_ads', device_type: 'mobile' }
  ]

  const res = computeLandingComparison(views, clicks, leads, win)
  assert(res.after.landing_unique_visitors === 1, 'Depois deve ter 1 visitante')
  assert(res.after.whatsapp_unique_visitors === 1, 'WhatsApp: 1 visitante único')
  assert(res.after.form_start_unique_visitors === 1, 'Form Start: 1 visitante único')
  assert(res.after.real_lead_unique_visitors === 1, 'Lead Real: 1 visitante único')
  assert(res.after.contact_intent_unique_visitors === 1, 'União de Intenção deve ser estritamente 1 (não 4)')
  assert(res.after.taxa_intencao === '100.0%', 'Taxa de Intenção deve ser 100.0%')
}

// -------------------------------------------------------------
// TESTE 6: Exclusão Rigorosa de Bots
// -------------------------------------------------------------
console.log('\n--- TESTE 6: Exclusão de Bots ---')
{
  const win = calculateComparisonWindow(CUTOFF_ISO, { windowHours: 6 }, '2026-09-21T02:00:00.000Z', 30)
  const views = [
    { id: 'v1', created_at: '2026-09-20T20:00:00Z', visitor_id: 'bot_google', session_id: 'sb1', path: '/lp/telas-mosquiteiras', landing_path: '/lp/telas-mosquiteiras', channel: 'google_ads', is_bot: true, device_type: 'desktop' },
    { id: 'v2', created_at: '2026-09-20T20:05:00Z', visitor_id: 'human_user', session_id: 'sh1', path: '/lp/telas-mosquiteiras', landing_path: '/lp/telas-mosquiteiras', channel: 'google_ads', is_bot: false, device_type: 'desktop' }
  ]
  const clicks = [
    { id: 'c1', created_at: '2026-09-20T20:01:00Z', visitor_id: 'bot_google', session_id: 'sb1', tipo: 'whatsapp', channel: 'google_ads', is_bot: true }
  ]

  const res = computeLandingComparison(views, clicks, [], win)
  assert(res.after.landing_unique_visitors === 1, 'Apenas 1 visitante humano considerado')
  assert(res.after.whatsapp_clicks === 0, 'Clique de bot não deve ser contabilizado')
}

// -------------------------------------------------------------
// TESTE 7 & 8: Filtro Google Ads vs Todos os Canais
// -------------------------------------------------------------
console.log('\n--- TESTE 7 & 8: Filtro Google Ads vs Todos os Canais ---')
{
  const win = calculateComparisonWindow(CUTOFF_ISO, { windowHours: 6 }, '2026-09-21T02:00:00.000Z', 30)
  const views = [
    { id: 'v1', created_at: '2026-09-20T20:00:00Z', visitor_id: 'u_ads', session_id: 's_ads', path: '/lp/telas-mosquiteiras', landing_path: '/lp/telas-mosquiteiras', channel: 'google_ads', is_bot: false },
    { id: 'v2', created_at: '2026-09-20T20:10:00Z', visitor_id: 'u_org', session_id: 's_org', path: '/lp/telas-mosquiteiras', landing_path: '/lp/telas-mosquiteiras', channel: 'google_organic', is_bot: false }
  ]

  // Com filtro Google Ads (padrão)
  const resAds = computeLandingComparison(views, [], [], win, { channelFilter: 'google_ads' })
  assert(resAds.after.landing_unique_visitors === 1, 'Google Ads: apenas 1 visitante computado')

  // Com filtro Todos
  const resAll = computeLandingComparison(views, [], [], win, { channelFilter: 'all' })
  assert(resAll.after.landing_unique_visitors === 2, 'Todos os Canais: 2 visitantes computados')
}

// -------------------------------------------------------------
// TESTE 9 & 10: Taxas e Deltas em Pontos Percentuais (p.p.)
// -------------------------------------------------------------
console.log('\n--- TESTE 9 & 10: Deltas em Pontos Percentuais (p.p.) ---')
{
  const win = calculateComparisonWindow(CUTOFF_ISO, { windowHours: 6 }, '2026-09-21T02:00:00.000Z', 30)
  
  // Antes: 10 visitantes, 2 com intenção (20.0%)
  const beforeViews = Array.from({ length: 10 }, (_, i) => ({
    id: `vb_${i}`,
    created_at: '2026-09-20T16:00:00Z',
    visitor_id: `ub_${i}`,
    session_id: `sb_${i}`,
    path: '/servicos/telas',
    landing_path: '/servicos/telas',
    channel: 'google_ads',
    is_bot: false,
    device_type: 'mobile'
  }))
  const beforeClicks = [
    { id: 'cb_1', created_at: '2026-09-20T16:05:00Z', visitor_id: 'ub_0', session_id: 'sb_0', tipo: 'whatsapp', channel: 'google_ads', is_bot: false, device_type: 'mobile' },
    { id: 'cb_2', created_at: '2026-09-20T16:10:00Z', visitor_id: 'ub_1', session_id: 'sb_1', tipo: 'form_start', channel: 'google_ads', is_bot: false, device_type: 'mobile' }
  ]

  // Depois: 10 visitantes, 5 com intenção (50.0%)
  const afterViews = Array.from({ length: 10 }, (_, i) => ({
    id: `va_${i}`,
    created_at: '2026-09-20T20:00:00Z',
    visitor_id: `ua_${i}`,
    session_id: `sa_${i}`,
    path: '/lp/telas-mosquiteiras',
    landing_path: '/lp/telas-mosquiteiras',
    channel: 'google_ads',
    is_bot: false,
    device_type: 'mobile'
  }))
  const afterClicks = [
    { id: 'ca_1', created_at: '2026-09-20T20:05:00Z', visitor_id: 'ua_0', session_id: 'sa_0', tipo: 'whatsapp', channel: 'google_ads', is_bot: false, device_type: 'mobile' },
    { id: 'ca_2', created_at: '2026-09-20T20:10:00Z', visitor_id: 'ua_1', session_id: 'sa_1', tipo: 'whatsapp', channel: 'google_ads', is_bot: false, device_type: 'mobile' },
    { id: 'ca_3', created_at: '2026-09-20T20:15:00Z', visitor_id: 'ua_2', session_id: 'sa_2', tipo: 'quote_cta', channel: 'google_ads', is_bot: false, device_type: 'mobile' },
    { id: 'ca_4', created_at: '2026-09-20T20:20:00Z', visitor_id: 'ua_3', session_id: 'sa_3', tipo: 'form_start', channel: 'google_ads', is_bot: false, device_type: 'mobile' },
    { id: 'ca_5', created_at: '2026-09-20T20:25:00Z', visitor_id: 'ua_4', session_id: 'sa_4', tipo: 'form_start', channel: 'google_ads', is_bot: false, device_type: 'mobile' }
  ]

  const res = computeLandingComparison([...beforeViews, ...afterViews], [...beforeClicks, ...afterClicks], [], win)
  assert(res.before.taxa_intencao === '20.0%', 'Antes: taxa_intencao 20.0%')
  assert(res.after.taxa_intencao === '50.0%', 'Depois: taxa_intencao 50.0%')
  assert(res.delta.taxa_intencao.diff_pp === 30.0, 'Variação numérica de 30.0 p.p.')
  assert(res.delta.taxa_intencao.formatted === '+30.0 p.p.', 'Variação formatada com sinal e p.p.')
}

// -------------------------------------------------------------
// TESTE 11: Breakdown por Dispositivo (mobile vs desktop)
// -------------------------------------------------------------
console.log('\n--- TESTE 11: Breakdown por Dispositivo ---')
{
  const win = calculateComparisonWindow(CUTOFF_ISO, { windowHours: 6 }, '2026-09-21T02:00:00.000Z', 30)
  const views = [
    { id: 'v_m', created_at: '2026-09-20T20:00:00Z', visitor_id: 'u_mob', session_id: 's_mob', path: '/lp/telas-mosquiteiras', landing_path: '/lp/telas-mosquiteiras', channel: 'google_ads', is_bot: false, device_type: 'mobile' },
    { id: 'v_d', created_at: '2026-09-20T20:05:00Z', visitor_id: 'u_desk', session_id: 's_desk', path: '/lp/telas-mosquiteiras', landing_path: '/lp/telas-mosquiteiras', channel: 'google_ads', is_bot: false, device_type: 'desktop' }
  ]

  const res = computeLandingComparison(views, [], [], win)
  assert(res.deviceBreakdown.mobile.after.visitors === 1, 'Mobile Depois deve ter 1 visitante')
  assert(res.deviceBreakdown.desktop.after.visitors === 1, 'Desktop Depois deve ter 1 visitante')
  assert(res.deviceBreakdown.tablet.after.visitors === 0, 'Tablet Depois deve ter 0 visitantes')
}

// -------------------------------------------------------------
// TESTE 12: Descarte de Leads Sintéticos / Testes Automatizados
// -------------------------------------------------------------
console.log('\n--- TESTE 12: Descarte de Leads de Teste ---')
{
  const win = calculateComparisonWindow(CUTOFF_ISO, { windowHours: 6 }, '2026-09-21T02:00:00.000Z', 30)
  const views = [
    { id: 'v1', created_at: '2026-09-20T20:00:00Z', visitor_id: 'u_test', session_id: 's_test', path: '/lp/telas-mosquiteiras', landing_path: '/lp/telas-mosquiteiras', channel: 'google_ads', is_bot: false }
  ]
  const leads = [
    { id: 'l_synth', created_at: '2026-09-20T20:02:00Z', visitor_id: 'u_test', session_id: 's_test', nome: 'Lead WhatsApp Automático', telefone: '11999999999', session_channel: 'google_ads' },
    { id: 'l_auto', created_at: '2026-09-20T20:03:00Z', visitor_id: 'u_test', session_id: 's_test', nome: 'Teste Automatizado E2E', email: 'teste_auto@test.com', session_channel: 'google_ads' }
  ]

  const res = computeLandingComparison(views, [], leads, win)
  assert(res.after.real_leads_count === 0, 'Leads de teste e sintéticos devem ser descartados')
  assert(res.after.real_lead_unique_visitors === 0, 'Visitantes de lead real deve ser 0')
}

// -------------------------------------------------------------
// TESTE 13: Coorte de Sessão (Ações fora da coorte descartadas)
// -------------------------------------------------------------
console.log('\n--- TESTE 13: Isolamento Estrito de Coortes de Sessão ---')
{
  const win = calculateComparisonWindow(CUTOFF_ISO, { windowHours: 6 }, '2026-09-21T02:00:00.000Z', 30)
  
  // Sessão 1: entrou na LP
  // Sessão 2: entrou em outra página (/contato) que não é da coorte
  const views = [
    { id: 'v1', created_at: '2026-09-20T20:00:00Z', visitor_id: 'u1', session_id: 's_lp', path: '/lp/telas-mosquiteiras', landing_path: '/lp/telas-mosquiteiras', channel: 'google_ads', is_bot: false },
    { id: 'v2', created_at: '2026-09-20T20:00:00Z', visitor_id: 'u2', session_id: 's_other', path: '/contato', landing_path: '/contato', channel: 'google_ads', is_bot: false }
  ]
  
  const clicks = [
    { id: 'c1', created_at: '2026-09-20T20:05:00Z', visitor_id: 'u1', session_id: 's_lp', tipo: 'whatsapp', channel: 'google_ads', is_bot: false },
    { id: 'c2', created_at: '2026-09-20T20:05:00Z', visitor_id: 'u2', session_id: 's_other', tipo: 'whatsapp', channel: 'google_ads', is_bot: false }
  ]

  const res = computeLandingComparison(views, clicks, [], win)
  assert(res.after.landing_unique_visitors === 1, 'Apenas 1 visitante na coorte da landing')
  assert(res.after.whatsapp_unique_visitors === 1, 'Apenas o clique da sessão da coorte da landing é computado')
  assert(res.after.whatsapp_clicks === 1, 'Clique de sessão fora da coorte é devidamente descartado')
}

// -------------------------------------------------------------
// TESTE 14: Prefixo de Rotas Anteriores (/servicos/telas/*)
// -------------------------------------------------------------
console.log('\n--- TESTE 14: Prefixo de Rotas Anteriores ---')
{
  assert(matchesPathPrefix('/servicos/telas', ['/servicos/telas']) === true, 'Deve coincidir rota exata')
  assert(matchesPathPrefix('/servicos/telas/janelas', ['/servicos/telas']) === true, 'Deve coincidir subrota /janelas')
  assert(matchesPathPrefix('/servicos/telas/removivel', ['/servicos/telas']) === true, 'Deve coincidir subrota /removivel')
  assert(matchesPathPrefix('/servicos/redes', ['/servicos/telas']) === false, 'Não deve coincidir rota não relacionada')
}

// -------------------------------------------------------------
// TESTE 15: Níveis de Amostra (Requisito 4: Muito pequena, Pequena, Moderada, Maior)
// -------------------------------------------------------------
console.log('\n--- TESTE 15: Níveis de Amostra Atualizados ---')
{
  const win = calculateComparisonWindow(CUTOFF_ISO, { windowHours: 6 }, '2026-09-21T02:00:00.000Z', 30)
  
  const makeViews = (count) => Array.from({ length: count }, (_, i) => ({
    id: `v_${i}`,
    created_at: '2026-09-20T20:00:00Z',
    visitor_id: `u_${i}`,
    session_id: `s_${i}`,
    path: '/lp/telas-mosquiteiras',
    landing_path: '/lp/telas-mosquiteiras',
    channel: 'google_ads',
    is_bot: false
  }))

  const makeBeforeViews = (count) => Array.from({ length: count }, (_, i) => ({
    id: `vb_${i}`,
    created_at: '2026-09-20T16:00:00Z',
    visitor_id: `ub_${i}`,
    session_id: `sb_${i}`,
    path: '/servicos/telas',
    landing_path: '/servicos/telas',
    channel: 'google_ads',
    is_bot: false
  }))

  const res10 = computeLandingComparison([...makeBeforeViews(10), ...makeViews(10)], [], [], win)
  assert(res10.sampleQuality.label === 'Muito pequena', '10 visitantes = Muito pequena')

  const res30 = computeLandingComparison([...makeBeforeViews(30), ...makeViews(30)], [], [], win)
  assert(res30.sampleQuality.label === 'Pequena', '30 visitantes = Pequena')

  const res100 = computeLandingComparison([...makeBeforeViews(100), ...makeViews(100)], [], [], win)
  assert(res100.sampleQuality.label === 'Moderada', '100 visitantes = Moderada')

  const res250 = computeLandingComparison([...makeBeforeViews(250), ...makeViews(250)], [], [], win)
  assert(res250.sampleQuality.label === 'Maior', '250 visitantes = Maior (não representativa)')
}

// -------------------------------------------------------------
// TESTE 16: Fallback Conservador de Atribuição Legada (Sem session_id)
// -------------------------------------------------------------
console.log('\n--- TESTE 16: Fallback Conservador de Atribuição Legada ---')
{
  const win = calculateComparisonWindow(CUTOFF_ISO, { windowHours: 6 }, '2026-09-21T02:00:00.000Z', 30)
  const views = [
    { id: 'v1', created_at: '2026-09-20T20:00:00Z', visitor_id: 'user_cohort', session_id: 's_lp', path: '/lp/telas-mosquiteiras', landing_path: '/lp/telas-mosquiteiras', channel: 'google_ads', is_bot: false }
  ]

  // C1: sem session_id, mas tem landing_path da nova LP e visitor_id na janela -> VÁLIDO PELO FALLBACK
  // C2: sem session_id, mesmo visitor_id, mas com landing_path incompatível (/contato) -> REJEITADO
  // C3: sem session_id, mesmo visitor_id, mas sem landing_path/origem -> REJEITADO
  const clicks = [
    { id: 'c_valid', created_at: '2026-09-20T20:05:00Z', visitor_id: 'user_cohort', session_id: null, landing_path: '/lp/telas-mosquiteiras', tipo: 'whatsapp', channel: 'google_ads', is_bot: false },
    { id: 'c_incompatible', created_at: '2026-09-20T20:06:00Z', visitor_id: 'user_cohort', session_id: null, landing_path: '/outra-pagina', tipo: 'whatsapp', channel: 'google_ads', is_bot: false },
    { id: 'c_no_path', created_at: '2026-09-20T20:07:00Z', visitor_id: 'user_cohort', session_id: null, landing_path: null, origem: null, tipo: 'whatsapp', channel: 'google_ads', is_bot: false }
  ]

  const res = computeLandingComparison(views, clicks, [], win)
  assert(res.after.whatsapp_clicks === 1, 'Apenas 1 clique aceito pelo fallback conservador (os outros 2 rejeitados)')
  assert(res.after.whatsapp_unique_visitors === 1, 'Apenas 1 visitante único contabilizado no WhatsApp')
}

console.log(`\n==================================================`)
console.log(`RESULTADO FINAL DOS TESTES:`)
console.log(`Total: ${totalTests}`)
console.log(`Aprovados: ${passedTests}`)
console.log(`Falhas: ${failedTests}`)
console.log(`==================================================\n`)

if (failedTests > 0) {
  process.exit(1)
} else {
  process.exit(0)
}
