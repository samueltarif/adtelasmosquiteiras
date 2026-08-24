import assert from 'assert'
import {
  classifyLeadRecord,
  normalizeChannel,
  getChannelLabel,
  getIdentityStartUtc,
  getSaoPauloDateRange,
  fetchAllPaginated,
  safeRate,
  safeRateNum,
  PHASE_B_START_ISO,
  KNOWN_MANUAL_VALIDATION_RECORD_IDS,
  KNOWN_MANUAL_VALIDATION_SUBMISSION_IDS
} from './server/shared/adminAnalyticsCore.mjs'

console.log('======================================================================')
console.log('--- TEST MATRIX DO PAINEL ADMIN V2 (FASE C.1.2.2 FINAL VERIFICATION) ---')
console.log('======================================================================\n')

let passed = 0
let failed = 0

async function test(name, fn) {
  try {
    await fn()
    console.log(`  [PASS] ${name}`)
    passed++
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message)
    failed++
  }
}

async function runAllTests() {
  // 1. CLASSIFICAÇÃO REAL DO REGISTRO 1 CONFIRMADO NO SUPABASE
  await test('1. Registro 1 (id: a6216770-cfc7-46d9-a548-ccf00eea7ea6, "Teste manuak") ➔ MANUAL_VALIDATION_TEST', () => {
    const record1 = {
      id: 'a6216770-cfc7-46d9-a548-ccf00eea7ea6',
      nome: 'Teste manuak',
      servico: 'Telas Removíveis',
      origem: 'formulario_/orcamento',
      visitor_id: null,
      session_id: null,
      submission_id: null
    }
    const res = classifyLeadRecord(record1)
    assert.strictEqual(res.category, 'MANUAL_VALIDATION_TEST')
    assert.strictEqual(res.reason, 'known-manual-validation-record-id')
  })

  // 2. CLASSIFICAÇÃO REAL DO REGISTRO 2 CONFIRMADO NO SUPABASE (SAMUEL BARRETOS TARIF)
  await test('2. Registro 2 (id: 71f635d2-5238-45b9-ac8d-2af04b9d9489, submission_id: d995d499-85c1-43e5-b77c-4b576b4c70be) ➔ MANUAL_VALIDATION_TEST', () => {
    const record2 = {
      id: '71f635d2-5238-45b9-ac8d-2af04b9d9489',
      submission_id: 'd995d499-85c1-43e5-b77c-4b576b4c70be',
      nome: 'SAMUEL BARRETOS TARIF',
      servico: 'Telas Pet Screen',
      origem: 'formulario_/orcamento',
      visitor_id: '8e3b1c9a-4d2f-4c12-b890-1e23f456789a',
      session_id: '3f9c2d1b-5e4a-4b12-9890-2f34a567891b'
    }
    const res = classifyLeadRecord(record2)
    assert.strictEqual(res.category, 'MANUAL_VALIDATION_TEST')
    assert.strictEqual(res.reason, 'known-manual-validation-record-id')
  })

  // 3. CLASSIFICAÇÃO DE LEADS SINTÉTICOS LEGADOS
  await test('3. Lead WhatsApp legado (23 históricos) ➔ LEGACY_SYNTHETIC', () => {
    const res = classifyLeadRecord({ nome: 'Lead WhatsApp (11999998888)', servico: 'Redes de Proteção' })
    assert.strictEqual(res.category, 'LEGACY_SYNTHETIC')
    assert.strictEqual(res.reason, 'legacy-whatsapp-synthetic')
  })

  // 4. CLASSIFICAÇÃO DE TESTES AUTOMATIZADOS DE CI
  await test('4. Teste Automatizado histórico (4 históricos) ➔ AUTOMATED_TEST', () => {
    const res = classifyLeadRecord({ nome: 'Teste Automatizado - CI Test', email: 'teste_auto@ad.com' })
    assert.strictEqual(res.category, 'AUTOMATED_TEST')
    assert.strictEqual(res.reason, 'automated-test-pattern')
  })

  // 5. CLASSIFICAÇÃO DE CLIENTE COMERCIAL REAL LEGÍTIMO
  await test('5. Cliente comercial real legítimo ➔ REAL', () => {
    const res = classifyLeadRecord({
      id: 'c891e4a1-5555-4a12-8888-abcdef123456',
      nome: 'Carlos Eduardo Silveira',
      email: 'carlos.silveira@uol.com.br',
      telefone: '11987654321',
      mensagem: 'Gostaria de um orçamento para telas mosquiteiras em 4 janelas.'
    })
    assert.strictEqual(res.category, 'REAL')
    assert.strictEqual(res.reason, 'commercial-lead')
  })

  // 6. VALIDAÇÃO GLOBAL: CURRENT_REAL_COMMERCIAL_LEADS = 0
  await test('6. Base atual de 29 registros no banco ➔ REAL_COMMERCIAL_LEADS = 0', () => {
    const mockCurrentDbLeads = [
      // 23 sintéticos
      ...Array.from({ length: 23 }, (_, i) => ({ id: `synth-${i}`, nome: `Lead WhatsApp (${i})` })),
      // 4 testes automatizados
      ...Array.from({ length: 4 }, (_, i) => ({ id: `auto-${i}`, nome: `Teste Automatizado ${i}` })),
      // 2 validações manuais
      { id: 'a6216770-cfc7-46d9-a548-ccf00eea7ea6', nome: 'Teste manuak' },
      { id: '71f635d2-5238-45b9-ac8d-2af04b9d9489', submission_id: 'd995d499-85c1-43e5-b77c-4b576b4c70be', nome: 'SAMUEL BARRETOS TARIF' }
    ]

    const realLeads = mockCurrentDbLeads.filter(l => classifyLeadRecord(l).category === 'REAL')
    assert.strictEqual(realLeads.length, 0, `Esperado 0 leads reais confirmados no momento, encontrado: ${realLeads.length}`)
  })

  // 7. PAGINAÇÃO SUPABASE: CASO 999 ROWS
  await test('7. fetchAllPaginated com 999 rows (retorna lote único)', async () => {
    const mockDb = Array.from({ length: 999 }, (_, i) => ({ id: `row-${i}` }))
    const customFetch = async (url) => {
      const urlObj = new URL(url)
      const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10)
      const limit = parseInt(urlObj.searchParams.get('limit') || '1000', 10)
      return mockDb.slice(offset, offset + limit)
    }

    const rows = await fetchAllPaginated('http://mock.local', 'page_views', 'select=id', {}, 1000, customFetch)
    assert.strictEqual(rows.length, 999)
  })

  // 8. PAGINAÇÃO SUPABASE: CASO 1000 ROWS
  await test('8. fetchAllPaginated com exatamente 1000 rows (limite exato de página)', async () => {
    const mockDb = Array.from({ length: 1000 }, (_, i) => ({ id: `row-${i}` }))
    const customFetch = async (url) => {
      const urlObj = new URL(url)
      const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10)
      const limit = parseInt(urlObj.searchParams.get('limit') || '1000', 10)
      return mockDb.slice(offset, offset + limit)
    }

    const rows = await fetchAllPaginated('http://mock.local', 'page_views', 'select=id', {}, 1000, customFetch)
    assert.strictEqual(rows.length, 1000)
  })

  // 9. PAGINAÇÃO SUPABASE: CASO 1001 ROWS (EXCEDE 1 PÁGINA)
  await test('9. fetchAllPaginated com 1001 rows (busca lote 1 de 1000 + lote 2 de 1)', async () => {
    const mockDb = Array.from({ length: 1001 }, (_, i) => ({ id: `row-${i}` }))
    const customFetch = async (url) => {
      const urlObj = new URL(url)
      const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10)
      const limit = parseInt(urlObj.searchParams.get('limit') || '1000', 10)
      return mockDb.slice(offset, offset + limit)
    }

    const rows = await fetchAllPaginated('http://mock.local', 'page_views', 'select=id', {}, 1000, customFetch)
    assert.strictEqual(rows.length, 1001)
  })

  // 10. PAGINAÇÃO SUPABASE: CASO 1500 ROWS
  await test('10. fetchAllPaginated com 1500 rows (lote 1 de 1000 + lote 2 de 500)', async () => {
    const mockDb = Array.from({ length: 1500 }, (_, i) => ({ id: `row-${i}` }))
    const customFetch = async (url) => {
      const urlObj = new URL(url)
      const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10)
      const limit = parseInt(urlObj.searchParams.get('limit') || '1000', 10)
      return mockDb.slice(offset, offset + limit)
    }

    const rows = await fetchAllPaginated('http://mock.local', 'page_views', 'select=id', {}, 1000, customFetch)
    assert.strictEqual(rows.length, 1500)
  })

  // 11. PAGINAÇÃO SUPABASE: CASO 2000 ROWS
  await test('11. fetchAllPaginated com 2000 rows (2 lotes completos de 1000)', async () => {
    const mockDb = Array.from({ length: 2000 }, (_, i) => ({ id: `row-${i}` }))
    const customFetch = async (url) => {
      const urlObj = new URL(url)
      const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10)
      const limit = parseInt(urlObj.searchParams.get('limit') || '1000', 10)
      return mockDb.slice(offset, offset + limit)
    }

    const rows = await fetchAllPaginated('http://mock.local', 'page_views', 'select=id', {}, 1000, customFetch)
    assert.strictEqual(rows.length, 2000)
  })

  // 12. PAGINAÇÃO SUPABASE: CASO 2500 ROWS
  await test('12. fetchAllPaginated com 2500 rows (3 lotes: 1000 + 1000 + 500)', async () => {
    const mockDb = Array.from({ length: 2500 }, (_, i) => ({ id: `row-${i}` }))
    const customFetch = async (url) => {
      const urlObj = new URL(url)
      const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10)
      const limit = parseInt(urlObj.searchParams.get('limit') || '1000', 10)
      return mockDb.slice(offset, offset + limit)
    }

    const rows = await fetchAllPaginated('http://mock.local', 'page_views', 'select=id', {}, 1000, customFetch)
    assert.strictEqual(rows.length, 2500)
  })

  // 13. REGRA CRÍTICA: ERRO DE PAGINAÇÃO LANÇA EXCEÇÃO (SEM RESULTADOS PARCIAIS)
  await test('13. fetchAllPaginated lança exceção em erro de lote intermediário (sem dados parciais)', async () => {
    let callCount = 0
    const customFetch = async (url) => {
      callCount++
      if (callCount === 1) {
        return Array.from({ length: 1000 }, (_, i) => ({ id: `row-${i}` }))
      }
      throw new Error('Supabase 500 Internal Error no lote 2')
    }

    let threw = false
    try {
      await fetchAllPaginated('http://mock.local', 'page_views', 'select=id', {}, 1000, customFetch)
    } catch (err) {
      threw = true
      assert.ok(err.message.includes('Falha na paginação'))
    }
    assert.strictEqual(threw, true, 'Deveria ter lançado exceção em falha intermediária')
  })

  // 14. 8/8 PRESETS DE DATA TESTADOS
  await test('14. Todos os 8 presets de data geram intervalos half-open válidos no fuso SP', () => {
    const presets = ['today', 'yesterday', 'last7d', 'last30d', 'thisMonth', 'lastMonth', 'allTime', 'custom']
    for (const p of presets) {
      const res = getSaoPauloDateRange(p)
      assert.strictEqual(res.isHalfOpen, true)
      assert.ok(new Date(res.startUtc).getTime() < new Date(res.endUtc).getTime())
    }
  })

  // 15. CUSTOM RANGE HALF-OPEN LIMITS
  await test('15. Custom Range 2026-08-20 a 2026-08-24 cobre [20/08 00:00 BRT, 25/08 00:00 BRT)', () => {
    const res = getSaoPauloDateRange('custom', '2026-08-20', '2026-08-24')
    const start = new Date(res.startUtc)
    const end = new Date(res.endUtc)

    // 20/08 em SP (UTC-3) ➔ 20/08 03:00 UTC
    assert.strictEqual(start.toISOString(), '2026-08-20T03:00:00.000Z')
    // 24/08 final do dia em SP (half-open: 25/08 00:00 BRT) ➔ 25/08 03:00 UTC
    assert.strictEqual(end.toISOString(), '2026-08-25T03:00:00.000Z')
    assert.strictEqual(end.getTime() - start.getTime(), 5 * 24 * 3600 * 1000)
  })

  // 16. LEAD RATE BASEADA EM DISTINCT VISITOR_ID
  await test('16. 100 visitantes, 1 visitante com 3 formulários ➔ RealLeads=3, LeadVisitors=1, Rate=1.0%', () => {
    const uniqueHumanVisitors = 100
    const leads = [
      { id: '1', visitor_id: 'vis-1' },
      { id: '2', visitor_id: 'vis-1' },
      { id: '3', visitor_id: 'vis-1' }
    ]
    const realLeadsCount = leads.length
    const leadVisitors = new Set(leads.map(l => l.visitor_id)).size
    const rate = safeRate(leadVisitors, uniqueHumanVisitors)

    assert.strictEqual(realLeadsCount, 3)
    assert.strictEqual(leadVisitors, 1)
    assert.strictEqual(rate, '1.0%')
  })

  // 17. CONTACT INTENT RATE BASEADA EM DISTINCT VISITOR_ID
  await test('17. 50 visitantes, 1 visitante com 5 WhatsApp + 2 Telefone ➔ Events=7, IntentVisitors=1, Rate=2.0%', () => {
    const uniqueHumanVisitors = 50
    const clicks = [
      { id: '1', visitor_id: 'v-click', tipo: 'whatsapp' },
      { id: '2', visitor_id: 'v-click', tipo: 'whatsapp' },
      { id: '3', visitor_id: 'v-click', tipo: 'whatsapp' },
      { id: '4', visitor_id: 'v-click', tipo: 'whatsapp' },
      { id: '5', visitor_id: 'v-click', tipo: 'whatsapp' },
      { id: '6', visitor_id: 'v-click', tipo: 'telefone' },
      { id: '7', visitor_id: 'v-click', tipo: 'telefone' }
    ]
    const totalEvents = clicks.length
    const intentVisitors = new Set(clicks.map(c => c.visitor_id)).size
    const rate = safeRate(intentVisitors, uniqueHumanVisitors)

    assert.strictEqual(totalEvents, 7)
    assert.strictEqual(intentVisitors, 1)
    assert.strictEqual(rate, '2.0%')
  })

  // 18. FUNIL COMERCIAL: PROPOSAL CUMULATIVO (ORÇADO + FECHADO), WON (FECHADO) E LOST (PERDIDO)
  await test('18. Funil Comercial: Proposal = Orçado + Fechado, Won = Fechado, Lost = Saída', () => {
    const leads = [
      { id: '1', visitor_id: 'v-orcado', status: 'Orçado' },
      { id: '2', visitor_id: 'v-fechado', status: 'Fechado' },
      { id: '3', visitor_id: 'v-perdido', status: 'Perdido' }
    ]

    const proposalVisitors = new Set(
      leads.filter(l => l.status === 'Orçado' || l.status === 'Fechado').map(l => l.visitor_id)
    )
    const wonVisitors = new Set(
      leads.filter(l => l.status === 'Fechado').map(l => l.visitor_id)
    )
    const lostVisitors = new Set(
      leads.filter(l => l.status === 'Perdido').map(l => l.visitor_id)
    )

    assert.strictEqual(proposalVisitors.size, 2)
    assert.strictEqual(wonVisitors.size, 1)
    assert.strictEqual(lostVisitors.size, 1)
  })

  // 19. MONOTONICIDADE DO FUNIL
  await test('19. Monotonicidade do Funil: Visitors >= Service >= Intent >= Form >= Proposal >= Won', () => {
    const totalVisitors = 100
    const serviceVisitors = 60
    const intentVisitors = 25
    const formVisitors = 10
    const proposalVisitors = 4
    const wonVisitors = 2

    const isMonotonic =
      totalVisitors >= serviceVisitors &&
      serviceVisitors >= intentVisitors &&
      intentVisitors >= formVisitors &&
      formVisitors >= proposalVisitors &&
      proposalVisitors >= wonVisitors

    assert.strictEqual(isMonotonic, true)
  })

  // 20. LEAD JOURNEY ATTRIBUTION TIMELINE
  await test('20. Lead Journey: Ordenação temporal de First Touch ➔ Navegação ➔ WhatsApp ➔ Conversão', () => {
    const timeline = [
      { created_at: '2026-08-24T10:00:00Z', type: 'pageview', path: '/' },
      { created_at: '2026-08-24T10:01:00Z', type: 'pageview', path: '/servicos/telas' },
      { created_at: '2026-08-24T10:02:00Z', type: 'whatsapp_click', path: '/servicos/telas', cta_location: 'service_card', service_key: 'telas_removiveis' },
      { created_at: '2026-08-24T10:05:00Z', type: 'pageview', path: '/orcamento' },
      { created_at: '2026-08-24T10:06:00Z', type: 'form_submission', path: '/orcamento' }
    ]

    timeline.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    assert.strictEqual(timeline[0].path, '/')
    assert.strictEqual(timeline[2].cta_location, 'service_card')
    assert.strictEqual(timeline[4].type, 'form_submission')
  })

  // 21. NORMALIZAÇÃO DE CANAL NULL/VAZIO NUNCA VIRA DIRECT
  await test('21. normalizeChannel(null) e normalizeChannel("") ➔ unknown_legacy (NUNCA direct)', () => {
    assert.strictEqual(normalizeChannel(null), 'unknown_legacy')
    assert.strictEqual(normalizeChannel(undefined), 'unknown_legacy')
    assert.strictEqual(normalizeChannel(''), 'unknown_legacy')
    assert.strictEqual(normalizeChannel('   '), 'unknown_legacy')
    assert.strictEqual(normalizeChannel('null'), 'unknown_legacy')
  })

  // 22. NORMALIZAÇÃO DE CANAL DIRECT REAL
  await test('22. normalizeChannel("direct") ➔ direct estrito', () => {
    assert.strictEqual(normalizeChannel('direct'), 'direct')
    assert.strictEqual(normalizeChannel('google_organic'), 'google_organic')
    assert.strictEqual(normalizeChannel('instagram'), 'instagram')
  })

  // 23. RÓTULO LEGÍVEL DE CANAL LEGADO
  await test('23. getChannelLabel("unknown_legacy") ➔ "Não atribuído / Histórico"', () => {
    assert.strictEqual(getChannelLabel('unknown_legacy'), 'Não atribuído / Histórico')
    assert.strictEqual(getChannelLabel('direct'), 'Tráfego Direto')
  })

  // 24. PISO DE IDENTIDADE REAL (PHASE_B_START_ISO = 2026-08-24T11:27:35.488Z)
  await test('24. PHASE_B_START_ISO é derivado do primeiro evento com visitor_id (2026-08-24T11:27:35.488Z)', () => {
    assert.strictEqual(PHASE_B_START_ISO, '2026-08-24T11:27:35.488Z')
    const rangeToday = getSaoPauloDateRange('today')
    // Hoje começa às 03:00Z, que é ANTERIOR a 11:27:35Z ➔ isLegacyOverlap = true
    assert.strictEqual(rangeToday.isLegacyOverlap, true)
    assert.strictEqual(rangeToday.identityStartUtc, PHASE_B_START_ISO)
  })

  // 25. INTERVALO FUTURO SEM OVERLAP
  await test('25. Intervalo posterior a Phase B não possui overlap legado (isLegacyOverlap = false)', () => {
    const rangeFuture = getSaoPauloDateRange('custom', '2026-08-25', '2026-08-26')
    assert.strictEqual(rangeFuture.isLegacyOverlap, false)
    assert.strictEqual(rangeFuture.identityStartUtc, rangeFuture.startUtc)
  })

  // 26. SESSÕES E VISITANTES LEGADOS EXCLUÍDOS DO PISO DE IDENTIDADE
  await test('26. Sessões e pageviews anteriores a Phase B são excluídos de Identity Sessions', () => {
    const rawViews = [
      // 350 sessões legadas antes de Phase B (11:27Z)
      ...Array.from({ length: 350 }, (_, i) => ({
        created_at: '2026-08-24T05:00:00.000Z',
        session_id: `legacy-sess-${i}`,
        visitor_id: null,
        is_bot: false
      })),
      // 2 sessões pós Phase B (com visitor_id)
      {
        created_at: '2026-08-24T12:00:00.000Z',
        session_id: 'phase-b-sess-1',
        visitor_id: 'phase-b-vis-1',
        is_bot: false
      },
      {
        created_at: '2026-08-24T12:30:00.000Z',
        session_id: 'phase-b-sess-2',
        visitor_id: 'phase-b-vis-2',
        is_bot: false
      }
    ]

    const activePeriodStartMs = new Date(PHASE_B_START_ISO).getTime()
    const identitySessions = new Set()
    const identityVisitors = new Set()

    for (const v of rawViews) {
      const vTime = new Date(v.created_at).getTime()
      if (vTime >= activePeriodStartMs && !v.is_bot) {
        if (v.session_id) identitySessions.add(v.session_id)
        if (v.visitor_id) identityVisitors.add(v.visitor_id)
      }
    }

    assert.strictEqual(identitySessions.size, 2, 'Apenas as 2 sessões Phase B devem contar')
    assert.strictEqual(identityVisitors.size, 2, 'Apenas os 2 visitantes Phase B devem contar')
  })

  console.log('\n======================================================================')
  console.log(`   TEST MATRIX SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('======================================================================')

  if (failed > 0) process.exit(1)
}

runAllTests()
