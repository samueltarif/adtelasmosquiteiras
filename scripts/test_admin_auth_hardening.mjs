import assert from 'assert'
import { isTestAuthEnabled, resolveSupabaseUser } from '../server/utils/adminAuthSession.ts'

const mockConfig = {
  supabaseUrl: 'https://test.supabase.co',
  supabaseServiceRoleKey: 'test-key',
  anonKey: 'test-anon'
}

const mockEvent = {
  node: { req: {}, res: {} },
  context: {}
}

async function runTestAuthMatrix() {
  console.log('=================================================================')
  console.log('TEST AUTH FAIL-CLOSED MATRIX VALIDATION (7 SCENARIOS)')
  console.log('=================================================================\n')

  const originalNodeEnv = process.env.NODE_ENV
  const originalEnableTestAuth = process.env.ENABLE_TEST_AUTH

  try {
    // 1. NODE_ENV=production + ENABLE_TEST_AUTH=true -> REJEITADO
    process.env.NODE_ENV = 'production'
    process.env.ENABLE_TEST_AUTH = 'true'
    assert.strictEqual(isTestAuthEnabled(), false, '1. isTestAuthEnabled deve ser false em production')
    const res1 = await resolveSupabaseUser(mockEvent, mockConfig, 'dev_mock_admin_token', null)
    assert.strictEqual(res1, null, '1. dev_mock_admin_token deve ser rejeitado em production')
    console.log('  [PASS] 1. NODE_ENV=production + ENABLE_TEST_AUTH=true -> REJEITADO (IMPOSSIBLE IN PROD)')

    // 2. NODE_ENV=production + ENABLE_TEST_AUTH=false -> REJEITADO
    process.env.NODE_ENV = 'production'
    process.env.ENABLE_TEST_AUTH = 'false'
    assert.strictEqual(isTestAuthEnabled(), false, '2. isTestAuthEnabled deve ser false em production')
    const res2 = await resolveSupabaseUser(mockEvent, mockConfig, 'dev_mock_admin_token', null)
    assert.strictEqual(res2, null, '2. dev_mock_admin_token deve ser rejeitado')
    console.log('  [PASS] 2. NODE_ENV=production + ENABLE_TEST_AUTH=false -> REJEITADO')

    // 3. NODE_ENV undefined + ENABLE_TEST_AUTH=true -> REJEITADO
    delete process.env.NODE_ENV
    process.env.ENABLE_TEST_AUTH = 'true'
    assert.strictEqual(isTestAuthEnabled(), false, '3. isTestAuthEnabled deve ser false com NODE_ENV indefinido')
    const res3 = await resolveSupabaseUser(mockEvent, mockConfig, 'dev_mock_admin_token', null)
    assert.strictEqual(res3, null, '3. dev_mock_admin_token deve ser rejeitado')
    console.log('  [PASS] 3. NODE_ENV undefined + ENABLE_TEST_AUTH=true -> REJEITADO')

    // 4. NODE_ENV=development + ENABLE_TEST_AUTH ausente -> REJEITADO
    process.env.NODE_ENV = 'development'
    delete process.env.ENABLE_TEST_AUTH
    assert.strictEqual(isTestAuthEnabled(), false, '4. isTestAuthEnabled deve ser false sem opt-in explícito')
    const res4 = await resolveSupabaseUser(mockEvent, mockConfig, 'dev_mock_admin_token', null)
    assert.strictEqual(res4, null, '4. dev_mock_admin_token deve ser rejeitado')
    console.log('  [PASS] 4. NODE_ENV=development + ENABLE_TEST_AUTH ausente -> REJEITADO')

    // 5. NODE_ENV=development + ENABLE_TEST_AUTH=false -> REJEITADO
    process.env.NODE_ENV = 'development'
    process.env.ENABLE_TEST_AUTH = 'false'
    assert.strictEqual(isTestAuthEnabled(), false, '5. isTestAuthEnabled deve ser false com ENABLE_TEST_AUTH=false')
    const res5 = await resolveSupabaseUser(mockEvent, mockConfig, 'dev_mock_admin_token', null)
    assert.strictEqual(res5, null, '5. dev_mock_admin_token deve ser rejeitado')
    console.log('  [PASS] 5. NODE_ENV=development + ENABLE_TEST_AUTH=false -> REJEITADO')

    // 6. NODE_ENV=development + ENABLE_TEST_AUTH=true -> ACEITO
    process.env.NODE_ENV = 'development'
    process.env.ENABLE_TEST_AUTH = 'true'
    assert.strictEqual(isTestAuthEnabled(), true, '6. isTestAuthEnabled deve ser true em dev com opt-in')
    const res6 = await resolveSupabaseUser(mockEvent, mockConfig, 'dev_mock_admin_token', null)
    assert.ok(res6 && res6.id === 'a0000000-0000-0000-0000-000000000001', '6. dev_mock_admin_token aceito em dev com opt-in')
    assert.strictEqual(res6.email, 'test-admin@adt-crm.invalid', '6. mock email deve ser sintético .invalid')
    console.log('  [PASS] 6. NODE_ENV=development + ENABLE_TEST_AUTH=true -> ACEITO (MOCK VÁLIDO)')

    // 7. NODE_ENV=test + ENABLE_TEST_AUTH=true -> ACEITO
    process.env.NODE_ENV = 'test'
    process.env.ENABLE_TEST_AUTH = 'true'
    assert.strictEqual(isTestAuthEnabled(), true, '7. isTestAuthEnabled deve ser true em test com opt-in')
    const res7 = await resolveSupabaseUser(mockEvent, mockConfig, 'dev_mock_admin_token', null)
    assert.ok(res7 && res7.id === 'a0000000-0000-0000-0000-000000000001', '7. dev_mock_admin_token aceito em test com opt-in')
    assert.strictEqual(res7.email, 'test-admin@adt-crm.invalid', '7. mock email deve ser sintético .invalid')
    console.log('  [PASS] 7. NODE_ENV=test + ENABLE_TEST_AUTH=true -> ACEITO (MOCK VÁLIDO)')

    console.log('\n=================================================================')
    console.log('TODOS OS 7 CENÁRIOS DA MATRIZ TEST AUTH PASSARAM COM SUCESSO!')
    console.log('TEST_AUTH_POLICY=EXPLICIT_NON_PRODUCTION_AND_OPT_IN')
    console.log('TEST_AUTH_PRODUCTION_BYPASS=IMPOSSIBLE')
    console.log('PRODUCTION_MOCK_TOKEN_TEST=PASS')
    console.log('=================================================================\n')
  } finally {
    process.env.NODE_ENV = originalNodeEnv
    process.env.ENABLE_TEST_AUTH = originalEnableTestAuth
  }
}

runTestAuthMatrix().catch(err => {
  console.error('ERRO FATAL NO TESTE DE AUTH HARDENING:', err)
  process.exit(1)
})
