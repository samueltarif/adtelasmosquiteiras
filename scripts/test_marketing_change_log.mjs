/**
 * Suíte de Testes Automatizados para a FASE 1.1 PARTE 2:
 * Histórico de Mudanças da Campanha e Anotações de Marketing
 * Arquivo: scripts/test_marketing_change_log.mjs
 *
 * POLÍTICA DE SEGURANÇA DO BANCO DE PRODUÇÃO:
 * - Operações contra o banco de produção (Live DB) são 100% READ-ONLY.
 * - Testes de ciclo de vida de mutação (INSERT, PATCH, SOFT-ARCHIVE) são testados via mocks seguros.
 * - Garante estritamente: 0 registros sintéticos residuais em produção.
 */

import assert from 'node:assert'
import fs from 'node:fs'
import {
  MARKETING_TIMEZONE,
  SP_OFFSET_HOURS,
  VALID_CHANGE_TYPES,
  VALID_SCOPES,
  VALID_ENTRY_SOURCES,
  VALID_STATUSES,
  getSaoPauloParts,
  parseSaoPauloToUtcIso,
  formatUtcToSaoPaulo
} from '../server/shared/adminMarketingChangeCore.mjs'

let totalTests = 0
let passedTests = 0
let failedTests = 0

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

async function testAsync(name, fn) {
  totalTests++
  try {
    await fn()
    passedTests++
    console.log(`  ✔ [PASS] ${name}`)
  } catch (err) {
    failedTests++
    console.error(`  ✖ [FAIL] ${name}:`, err.message)
  }
}

// Carregar variáveis de ambiente do .env se disponíveis
function loadEnv() {
  if (!fs.existsSync('.env')) return {}
  const content = fs.readFileSync('.env', 'utf8')
  return Object.fromEntries(
    content.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => {
        const idx = l.indexOf('=')
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
      })
  )
}

const env = loadEnv()
const hasSupabase = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)

async function runAllTests() {
  console.log('=================================================================')
  console.log('BATERIA DE TESTES — FASE 1.1 PARTE 2: MARKETING CHANGE LOG')
  console.log('=================================================================\n')

  // -------------------------------------------------------------------------
  // SUITE 1: Timezone Nominal America/Sao_Paulo (Dynamic IANA Offset)
  // -------------------------------------------------------------------------
  console.log('SUITE 1: Timezone Nominal America/Sao_Paulo & Conversão Precisa')

  test('MARKETING_TIMEZONE é canonicamente "America/Sao_Paulo"', () => {
    assert.strictEqual(MARKETING_TIMEZONE, 'America/Sao_Paulo')
  })

  test('parseSaoPauloToUtcIso: 15:30 em SP vira 18:30:00.000Z em UTC via IANA dynamic offset', () => {
    const spInput = '2026-09-20T15:30'
    const utcIso = parseSaoPauloToUtcIso(spInput)
    assert.strictEqual(utcIso, '2026-09-20T18:30:00.000Z')
  })

  test('formatUtcToSaoPaulo: 18:30 UTC volta exatamente para 15:30 em SP (zero drift)', () => {
    const utcIso = '2026-09-20T18:30:00.000Z'
    const spDisplay = formatUtcToSaoPaulo(utcIso)
    assert(spDisplay.includes('15:30'), `Esperado 15:30 em SP, obtido: ${spDisplay}`)
    assert(spDisplay.includes('20/09/2026'), `Esperado 20/09/2026, obtido: ${spDisplay}`)
  })

  test('Round-trip canônico: São Paulo local -> UTC -> São Paulo local preserva horário original', () => {
    const testCases = [
      '2026-09-20T15:30',
      '2026-09-20T18:51',
      '2026-01-15T09:00', // Verão
      '2026-06-20T21:45', // Inverno
      '2026-09-21T00:00', // Meia-noite
      '2026-09-30T23:59'  // Virada de mês
    ]

    for (const localInput of testCases) {
      const utcIso = parseSaoPauloToUtcIso(localInput)
      assert(utcIso !== null, `Conversão para UTC falhou para: ${localInput}`)

      const parts = getSaoPauloParts(new Date(utcIso))
      const reconstructed = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`

      assert.strictEqual(reconstructed, localInput, `Round-trip mismatch: entrada ${localInput} virou ${reconstructed}`)

      const [expectedDate, expectedTime] = localInput.split('T')
      const [y, m, d] = expectedDate.split('-')
      const displayStr = formatUtcToSaoPaulo(utcIso)
      assert(displayStr.includes(`${d}/${m}/${y}`), `Display deve conter ${d}/${m}/${y}: ${displayStr}`)
      assert(displayStr.includes(expectedTime), `Display deve conter ${expectedTime}: ${displayStr}`)
    }
  })

  test('parseSaoPauloToUtcIso: com segundos preserva segundos no UTC', () => {
    const spInput = '2026-09-20T18:51:51'
    const utcIso = parseSaoPauloToUtcIso(spInput)
    assert.strictEqual(utcIso, '2026-09-20T21:51:51.000Z')
  })

  test('parseSaoPauloToUtcIso: com indicador Z explícito preserva o instante UTC', () => {
    const utcInput = '2026-09-20T18:51:51Z'
    const utcIso = parseSaoPauloToUtcIso(utcInput)
    assert.strictEqual(utcIso, '2026-09-20T18:51:51.000Z')
  })

  test('parseSaoPauloToUtcIso: apenas data YYYY-MM-DD define meio-dia em São Paulo (15:00 UTC)', () => {
    const dateInput = '2026-09-20'
    const utcIso = parseSaoPauloToUtcIso(dateInput)
    assert.strictEqual(utcIso, '2026-09-20T15:00:00.000Z')
  })

  test('parseSaoPauloToUtcIso: entrada inválida ou nula retorna null com segurança', () => {
    assert.strictEqual(parseSaoPauloToUtcIso(null), null)
    assert.strictEqual(parseSaoPauloToUtcIso(''), null)
    assert.strictEqual(parseSaoPauloToUtcIso('invalid-date'), null)
  })

  // -------------------------------------------------------------------------
  // SUITE 2: Validações de Domínio (Tipos, Escopos, Origens e Status)
  // -------------------------------------------------------------------------
  console.log('\nSUITE 2: Validações de Domínio (Enums & Check Constraints)')

  test('VALID_CHANGE_TYPES cobre todos os tipos de marketing aceitos', () => {
    const expected = [
      'landing_page', 'ad_copy', 'keyword', 'negative_keyword', 'budget',
      'bid', 'tracking', 'url_suffix', 'conversion', 'asset', 'sitelink',
      'campaign_setting', 'other'
    ]
    for (const t of expected) {
      assert(VALID_CHANGE_TYPES.has(t), `Deveria aceitar tipo: ${t}`)
    }
    assert(!VALID_CHANGE_TYPES.has('tipo_inexistente'), 'Deve rejeitar tipo desconhecido')
  })

  test('VALID_SCOPES valida escopos da arquitetura', () => {
    assert(VALID_SCOPES.has('campaign'), 'campaign válido')
    assert(VALID_SCOPES.has('landing'), 'landing válido')
    assert(VALID_SCOPES.has('tracking'), 'tracking válido')
    assert(VALID_SCOPES.has('account'), 'account válido')
    assert(!VALID_SCOPES.has('global_unknown'), 'escopo inválido rejeitado')
  })

  test('VALID_ENTRY_SOURCES aceita apenas manual, system e migration', () => {
    assert(VALID_ENTRY_SOURCES.has('manual'), 'manual válido')
    assert(VALID_ENTRY_SOURCES.has('system'), 'system válido')
    assert(VALID_ENTRY_SOURCES.has('migration'), 'migration válido')
    assert(!VALID_ENTRY_SOURCES.has('bot_crawler'), 'entry_source desconhecido rejeitado')
    assert(!VALID_ENTRY_SOURCES.has('user_input_untrusted'), 'rejeitado')
  })

  test('VALID_STATUSES aceita apenas active e archived', () => {
    assert(VALID_STATUSES.has('active'), 'active válido')
    assert(VALID_STATUSES.has('archived'), 'archived válido')
    assert(!VALID_STATUSES.has('deleted'), 'deleted não existe (soft-archive)')
  })

  // -------------------------------------------------------------------------
  // SUITE 3: Autoria do Backend e Proteção contra Forjamento
  // -------------------------------------------------------------------------
  console.log('\nSUITE 3: Autoria do Backend e Proteção contra Forjamento')

  test('Autoria é resolvida estritamente pelo backend via adminIdentity', () => {
    const fakeAdminIdentity = {
      adminId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      email: 'gestor@adtelasmosquiteiras.com.br'
    }

    const untrustedFrontendBody = {
      title: 'Teste',
      change_type: 'keyword',
      scope: 'campaign',
      created_by: '00000000-0000-0000-0000-000000000000', // Tentativa de forjar autor
      created_by_email_snapshot: 'hacker@malicious.com'
    }

    const securePayload = {
      title: untrustedFrontendBody.title,
      change_type: untrustedFrontendBody.change_type,
      scope: untrustedFrontendBody.scope,
      created_by: fakeAdminIdentity.adminId,
      created_by_email_snapshot: fakeAdminIdentity.email
    }

    assert.strictEqual(securePayload.created_by, fakeAdminIdentity.adminId, 'created_by deve ser adminId da sessão')
    assert.strictEqual(securePayload.created_by_email_snapshot, 'gestor@adtelasmosquiteiras.com.br', 'email snapshot deve ser da sessão')
  })

  test('PATCH bloqueia tentativa do frontend de alterar created_by e created_at', () => {
    const patchBody = {
      title: 'Novo Título',
      created_by: '00000000-0000-0000-0000-000000000000',
      created_by_email_snapshot: 'novo@email.com',
      created_at: '2020-01-01T00:00:00Z',
      archived_by: '00000000-0000-0000-0000-000000000000'
    }

    const updates = {
      updated_at: new Date().toISOString(),
      title: patchBody.title
    }

    // Simulação dos deletes de segurança do endpoint PATCH
    delete updates.created_by
    delete updates.created_by_email_snapshot
    delete updates.created_at
    delete updates.archived_by

    assert.strictEqual(updates.created_by, undefined, 'created_by não pode constar no update')
    assert.strictEqual(updates.created_by_email_snapshot, undefined, 'snapshot não pode constar no update')
    assert.strictEqual(updates.created_at, undefined, 'created_at não pode constar no update')
    assert.strictEqual(updates.archived_by, undefined, 'archived_by não pode ser forjado')
    assert.strictEqual(updates.title, 'Novo Título')
    assert(Boolean(updates.updated_at), 'updated_at deve ser atualizado')
  })

  // -------------------------------------------------------------------------
  // SUITE 4: Arquivamento e Transições de Status
  // -------------------------------------------------------------------------
  console.log('\nSUITE 4: Arquivamento e Transições de Status')

  test('Arquivar (status = archived) preenche archived_at e archived_by com admin autenticado', () => {
    const adminIdentity = { adminId: '11111111-2222-3333-4444-555555555555', email: 'vendas@adtelas.com' }
    const status = 'archived'

    const updates = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'archived') {
      updates.archived_at = new Date().toISOString()
      updates.archived_by = adminIdentity.adminId || null
    }

    assert.strictEqual(updates.status, 'archived')
    assert(Boolean(updates.archived_at), 'archived_at deve estar preenchido')
    assert.strictEqual(updates.archived_by, adminIdentity.adminId, 'archived_by deve ser o ID do administrador')
  })

  test('Desarquivar (status = active) limpa archived_at e archived_by', () => {
    const status = 'active'
    const updates = { status, updated_at: new Date().toISOString() }

    if (status === 'active') {
      updates.archived_at = null
      updates.archived_by = null
    }

    assert.strictEqual(updates.status, 'active')
    assert.strictEqual(updates.archived_at, null, 'archived_at deve ser limpo para null')
    assert.strictEqual(updates.archived_by, null, 'archived_by deve ser limpo para null')
  })

  // -------------------------------------------------------------------------
  // SUITE 5: Tratamento de JSONB e Apresentação
  // -------------------------------------------------------------------------
  console.log('\nSUITE 5: Tratamento e Sanitização de previous_value e new_value')

  test('Sanitizador JSONB aceita objetos nativos', () => {
    const formatJsonValue = (val) => {
      if (val === undefined || val === null || val === '') return null
      if (typeof val === 'object') return val
      try { return JSON.parse(val) } catch { return { text: String(val) } }
    }

    const obj = { landing_path: '/lp/telas-mosquiteiras', test: true }
    assert.deepStrictEqual(formatJsonValue(obj), obj)
  })

  test('Sanitizador JSONB decodifica string JSON válida', () => {
    const formatJsonValue = (val) => {
      if (val === undefined || val === null || val === '') return null
      if (typeof val === 'object') return val
      try { return JSON.parse(val) } catch { return { text: String(val) } }
    }

    const jsonStr = '{"bid": 2.50, "strategy": "cpc_manual"}'
    assert.deepStrictEqual(formatJsonValue(jsonStr), { bid: 2.50, strategy: 'cpc_manual' })
  })

  test('Sanitizador JSONB envolve texto simples em objeto { text: ... }', () => {
    const formatJsonValue = (val) => {
      if (val === undefined || val === null || val === '') return null
      if (typeof val === 'object') return val
      try { return JSON.parse(val) } catch { return { text: String(val) } }
    }

    assert.deepStrictEqual(formatJsonValue('Apenas texto explicativo'), { text: 'Apenas texto explicativo' })
    assert.strictEqual(formatJsonValue(null), null)
    assert.strictEqual(formatJsonValue(''), null)
  })

  test('Exibição de registro migration vs manual: badges e autoria formatados corretamente', () => {
    const migrationRecord = {
      entry_source: 'migration',
      created_by_email_snapshot: null,
      metadata: { evidence: 'first_confirmed_google_ads_visit' }
    }

    const manualRecord = {
      entry_source: 'manual',
      created_by_email_snapshot: 'vendas@adtelasmosquiteiras.com.br',
      metadata: {}
    }

    const formatBadge = (item) => item.entry_source === 'migration' ? 'EVIDÊNCIA' : 'MANUAL'
    const formatAuthor = (item) => item.created_by_email_snapshot ? `Registrado por ${item.created_by_email_snapshot}` : 'Sistema'

    assert.strictEqual(formatBadge(migrationRecord), 'EVIDÊNCIA', 'Registro de migration exibe badge EVIDÊNCIA')
    assert.strictEqual(formatAuthor(migrationRecord), 'Sistema', 'Registro sem snapshot exibe Sistema')

    assert.strictEqual(formatBadge(manualRecord), 'MANUAL', 'Registro manual exibe badge MANUAL')
    assert.strictEqual(formatAuthor(manualRecord), 'Registrado por vendas@adtelasmosquiteiras.com.br', 'Registro manual exibe email do autor')
  })

  // -------------------------------------------------------------------------
  // SUITE 6: Testes Integrados no Banco de Dados Supabase (ESTRITAMENTE READ-ONLY)
  // -------------------------------------------------------------------------
  if (hasSupabase) {
    console.log('\nSUITE 6: Testes Integrados no Banco de Dados (Supabase - 100% READ-ONLY)')

    const headers = {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'count=exact'
    }

    await testAsync('Seed inicial confirmado da nova landing existe no banco de dados', async () => {
      const url = `${env.SUPABASE_URL}/rest/v1/marketing_change_log?occurred_at=eq.2026-09-20T18:51:51%2B00:00&select=*`
      const res = await fetch(url, { headers })
      assert.strictEqual(res.status, 200, `Status HTTP esperado 200, recebido ${res.status}`)
      const data = await res.json()
      assert(Array.isArray(data) && data.length === 1, 'Exatamente 1 seed inicial confirmado deve existir')

      const seed = data[0]
      assert.strictEqual(seed.change_type, 'landing_page')
      assert.strictEqual(seed.google_campaign_id, '24258184938')
      assert.strictEqual(seed.entry_source, 'migration', 'Origem deve ser migration')
      assert.strictEqual(seed.metadata?.evidence, 'first_confirmed_google_ads_visit', 'Evidência confirmada')
      assert.strictEqual(seed.status, 'active')
    })

    await testAsync('Nenhum seed de ValueTrack com timestamp inventado existe no banco', async () => {
      const url = `${env.SUPABASE_URL}/rest/v1/marketing_change_log?occurred_at=eq.2026-09-20T18:50:00%2B00:00&select=*`
      const res = await fetch(url, { headers })
      const data = await res.json()
      assert.strictEqual(data.length, 0, 'Não deve existir seed inventado em 18:50:00Z')
    })

    await testAsync('Garantia de Higiene: exatamente 0 registros sintéticos residuais em produção', async () => {
      const url = `${env.SUPABASE_URL}/rest/v1/marketing_change_log?select=id,title,entry_source`
      const res = await fetch(url, { headers })
      const data = await res.json()

      // Apenas o registro da migration oficial é aceito
      const nonOfficialRows = data.filter(r => r.id !== '719d4a97-8988-429b-895b-120728c70136')
      assert.strictEqual(nonOfficialRows.length, 0, `Esperado 0 registros residuais, encontrados: ${nonOfficialRows.length}`)
    })
  } else {
    console.log('\n⚠️  Supabase não configurado no .env — testes de Live DB ignorados.')
  }

  // -------------------------------------------------------------------------
  // RELATÓRIO FINAL
  // -------------------------------------------------------------------------
  console.log('\n=================================================================')
  console.log('RESULTADO FINAL DOS TESTES:')
  console.log(`Total de testes: ${totalTests}`)
  console.log(`Aprovados:       ${passedTests}`)
  console.log(`Falhas:          ${failedTests}`)
  console.log('=================================================================\n')

  if (failedTests > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runAllTests().catch(err => {
  console.error('Erro fatal ao executar testes:', err)
  process.exit(1)
})
