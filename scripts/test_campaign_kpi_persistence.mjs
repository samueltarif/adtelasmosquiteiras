/**
 * Suíte de Testes de Persistência e RLS (Fase 7)
 * Tabela: public.campaign_kpi_entries
 * Fixtures: F7_KPI_...
 * Arquivo: scripts/test_campaign_kpi_persistence.mjs (<= 200 linhas)
 */

import fs from 'node:fs'

// Carrega .env sem bibliotecas externas
const envContent = fs.readFileSync('.env', 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    env[key] = val
  }
}

const SUPABASE_URL = env.SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  console.error('Configuração do Supabase ausente no .env')
  process.exit(1)
}

const serviceHeaders = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
}

const anonHeaders = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json'
}

let passed = 0
let failed = 0

function assert(condition, desc) {
  if (condition) {
    console.log(`  [PASS] ${desc}`)
    passed++
  } else {
    console.error(`  [FAIL] ${desc}`)
    failed++
  }
}

async function run() {
  console.log('======================================================================')
  console.log('SUÍTE DE TESTES: PERSISTÊNCIA E RLS — FASE 7')
  console.log('======================================================================')

  const base = `${SUPABASE_URL}/rest/v1/campaign_kpi_entries`
  const fixtureName = 'F7_KPI_PERSISTENCE_TEST_01'
  let fixtureId = null

  try {
    // 0. Baseline
    const baseline = await fetch(`${base}?select=id`, { headers: serviceHeaders }).then(r => r.json())
    const baselineCount = Array.isArray(baseline) ? baseline.length : 0
    console.log(`Baseline atual: ${baselineCount} registros em campaign_kpi_entries`)

    // 1. INSERT via service_role
    const insertPayload = {
      platform: 'google_ads',
      campaign_name: fixtureName,
      utm_campaign: 'f7_test_utm',
      period_start: '2026-09-01',
      period_end: '2026-09-30',
      planned_budget: 2000,
      spend: 1500.50,
      impressions: 10000,
      clicks: 500,
      whatsapp_contacts: 50,
      leads: 25,
      sales: 5,
      revenue: 12500,
      target_cpc: 3.50,
      target_roas: 5.0,
      notes: 'Fixture de teste de persistência F7'
    }

    const insertRes = await fetch(base, {
      method: 'POST',
      headers: serviceHeaders,
      body: JSON.stringify(insertPayload)
    })
    const inserted = await insertRes.json()
    assert(insertRes.ok && Array.isArray(inserted) && inserted.length > 0, 'INSERT: Registro fixture F7 criado com sucesso')
    fixtureId = inserted[0]?.id

    // 2. SELECT via service_role
    const selectRes = await fetch(`${base}?id=eq.${fixtureId}`, { headers: serviceHeaders })
    const selected = await selectRes.json()
    assert(
      selectRes.ok && selected.length === 1 && selected[0].campaign_name === fixtureName && Number(selected[0].spend) === 1500.5,
      'SELECT: Registro fixture lido com valores e precisão numérica corretos'
    )

    // 3. UPDATE via service_role
    const updateRes = await fetch(`${base}?id=eq.${fixtureId}`, {
      method: 'PATCH',
      headers: serviceHeaders,
      body: JSON.stringify({ spend: 1800, sales: 8 })
    })
    const updated = await updateRes.json()
    assert(
      updateRes.ok && updated.length === 1 && Number(updated[0].spend) === 1800 && Number(updated[0].sales) === 8,
      'UPDATE: Registro atualizado com sucesso via service_role'
    )

    // 4. RLS / ANON ACCESS REJECTION
    const anonSelectRes = await fetch(`${base}?id=eq.${fixtureId}`, { headers: anonHeaders })
    const anonSelect = await anonSelectRes.json()
    assert(
      !anonSelectRes.ok || (Array.isArray(anonSelect) && anonSelect.length === 0),
      'RLS / ANON SELECT: Chave anônima não consegue ler dados financeiros (bloqueada pelo RLS)'
    )

    const anonInsertRes = await fetch(base, {
      method: 'POST',
      headers: anonHeaders,
      body: JSON.stringify({ platform: 'google_ads', campaign_name: 'F7_ANON_HACK', period_start: '2026-09-01', period_end: '2026-09-30' })
    })
    assert(!anonInsertRes.ok, 'RLS / ANON INSERT: Chave anônima impedida de inserir registros (bloqueada pelo RLS)')

    // 5. DELETE via service_role
    const deleteRes = await fetch(`${base}?id=eq.${fixtureId}`, {
      method: 'DELETE',
      headers: serviceHeaders
    })
    assert(deleteRes.ok, 'DELETE: Fixture F7 removida com sucesso por ID exclusivo')

    // 6. Cleanup Audit
    const auditRes = await fetch(`${base}?campaign_name=like.F7_KPI_%25`, { headers: serviceHeaders }).then(r => r.json())
    const remainingFixtures = Array.isArray(auditRes) ? auditRes.length : 0
    assert(remainingFixtures === 0, 'CLEANUP: Zero fixtures F7 restantes no banco de dados')

    const finalRes = await fetch(`${base}?select=id`, { headers: serviceHeaders }).then(r => r.json())
    const finalCount = Array.isArray(finalRes) ? finalRes.length : 0
    assert(finalCount === baselineCount, `INTEGRIDADE: Contagem final (${finalCount}) idêntica à baseline (${baselineCount})`)

  } catch (err) {
    console.error('Erro na suíte de persistência:', err)
    failed++
  } finally {
    // Garantir remoção de fixture órfã se sobrou por falha no meio
    if (fixtureId) {
      await fetch(`${base}?id=eq.${fixtureId}`, { method: 'DELETE', headers: serviceHeaders }).catch(() => {})
    }
  }

  console.log('======================================================================')
  console.log(`TOTAL PERSISTÊNCIA: ${passed} PASS | ${failed} FAIL`)
  console.log('======================================================================')
  if (failed > 0) process.exit(1)
}

run()
