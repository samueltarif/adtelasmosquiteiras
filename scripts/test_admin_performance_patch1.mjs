/**
 * ======================================================================
 * SUÍTE DE TESTES E BENCHMARK — ADMIN AUTH & PERFORMANCE PATCH 1.7
 * Arquivo: scripts/test_admin_performance_patch1.mjs
 * ======================================================================
 */

import assert from 'assert'
import { performance } from 'perf_hooks'
import { generateKeyPairSync, sign as cryptoSign } from 'crypto'
import { IncomingMessage, ServerResponse } from 'http'
import { ref, computed } from 'vue'
import * as h3 from 'h3'
import {
  getClaims,
  getSupabaseJwks,
  fetchAdminUserSingleFlight,
  resolveSupabaseUser,
  clearJwksCacheForTest,
  JWKS_CACHE_TTL_MS
} from '../server/utils/adminAuthSession.ts'
import {
  validateMutationOrigin,
  verifyActiveAdmin,
  ADMIN_AUTH_COOKIE_NAME,
  ADMIN_REFRESH_COOKIE_NAME
} from '../server/shared/adminAuthCore.mjs'
import { enforceMutationCsrf, clearAdminAuthCookies } from '../server/utils/adminAuthCookies.ts'
import initialAggregatorHandler from '../server/api/admin/analytics/initial.get.ts'
import loginHandler from '../server/api/admin/auth/login.post.ts'
import logoutHandler from '../server/api/admin/auth/logout.post.ts'
import sessionHandler from '../server/api/admin/auth/session.get.ts'
// Configura globals para execução real de Composable e Middleware Nuxt
const nuxtStateMap = new Map()
globalThis.useState = (key, init) => {
  if (!nuxtStateMap.has(key)) nuxtStateMap.set(key, ref(init ? init() : null))
  return nuxtStateMap.get(key)
}
function clearNuxtStateForTest() {
  nuxtStateMap.clear()
}

globalThis.defineNuxtRouteMiddleware = (fn) => fn
globalThis.navigateTo = (path) => ({ action: 'navigate', path })
globalThis.abortNavigation = (err) => ({ action: 'abort', error: err })
globalThis.createError = (opts) => {
  const err = new Error(opts.statusMessage || opts.message || 'Error')
  Object.assign(err, opts)
  return err
}

const { useAdminAuth } = await import('../app/composables/useAdminAuth.ts')
globalThis.useAdminAuth = useAdminAuth
const { default: adminAuthMiddleware } = await import('../app/middleware/admin-auth.global.ts')

console.log('======================================================================')
console.log('--- TESTES AUTOMATIZADOS: ADMIN AUTH & PERFORMANCE PATCH 1.7 ---')
console.log('======================================================================\n')

let passed = 0
let failed = 0
const errors = []

const counts = {
  crypto: 0,
  refresh: 0,
  singleFlight: 0,
  loginHandler: 0,
  sessionHandler: 0,
  composable: 0,
  middleware: 0,
  csrf: 0,
  analytics: 0
}

function test(category, name, fn) {
  try {
    fn()
    console.log(`  [PASS:${category}] ${name}`)
    passed++
    if (counts[category] !== undefined) counts[category]++
  } catch (err) {
    console.error(`  [FAIL:${category}] ${name}:`, err.message)
    errors.push({ name, error: err.message })
    failed++
  }
}

async function asyncTest(category, name, fn) {
  try {
    await fn()
    console.log(`  [PASS:${category}] ${name}`)
    passed++
    if (counts[category] !== undefined) counts[category]++
  } catch (err) {
    console.error(`  [FAIL:${category}] ${name}:`, err.message)
    errors.push({ name, error: err.message })
    failed++
  }
}

function createMockEvent({ method = 'POST', url = '/', headers = {}, body = undefined, context = {} } = {}) {
  const req = new IncomingMessage(null)
  req.method = method
  req.url = url
  req.headers = { host: 'localhost:3000', origin: 'http://localhost:3000', ...headers }

  if (body !== undefined) {
    const jsonStr = JSON.stringify(body)
    req.headers['content-type'] = 'application/json'
    req.headers['content-length'] = String(Buffer.byteLength(jsonStr))
    req.push(jsonStr)
    req.push(null)
  } else {
    req.push(null)
  }

  const res = new ServerResponse(req)
  const event = new h3.H3Event(req, res)
  event.context = { ...context }
  return event
}

function getErrorStatus(err) {
  return err?.statusCode || err?.status || (err?.response && err.response.status) || 500
}

function getSetCookieHeaders(event) {
  const h = event.node.res.getHeader('set-cookie')
  if (!h) return []
  return Array.isArray(h) ? h : [h]
}

async function runTests() {
  const mockSupabaseUrlA = 'https://proj-a.supabase.co'
  const mockSupabaseUrlB = 'https://proj-b.supabase.co'
  const mockConfigA = {
    supabaseUrl: mockSupabaseUrlA,
    supabaseServiceRoleKey: 'test-service-key',
    anonKey: 'test-anon-key',
    publishableKey: 'test-anon-key'
  }

  // Geração local de par de chaves EC (P-256 / ES256)
  const ecKeyA = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const jwkEcA = ecKeyA.publicKey.export({ format: 'jwk' })
  jwkEcA.kid = 'kid-ec-01'
  jwkEcA.alg = 'ES256'
  jwkEcA.use = 'sig'
  jwkEcA.key_ops = ['verify']

  const ecKeyRotated = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const jwkEcRotated = ecKeyRotated.publicKey.export({ format: 'jwk' })
  jwkEcRotated.kid = 'kid-ec-02'
  jwkEcRotated.alg = 'ES256'
  jwkEcRotated.use = 'sig'
  jwkEcRotated.key_ops = ['verify']

  // Geração local de par de chaves RSA 2048 (RS256)
  const rsaKey = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const jwkRsa = rsaKey.publicKey.export({ format: 'jwk' })
  jwkRsa.kid = 'kid-rsa-01'
  jwkRsa.alg = 'RS256'
  jwkRsa.use = 'sig'
  jwkRsa.key_ops = ['verify']

  function createSignedJwt({
    privateKey = ecKeyA.privateKey,
    headerOverrides = {},
    payloadOverrides = {},
    tamperedSig = false,
    issuer = mockSupabaseUrlA,
    isRsa = false
  } = {}) {
    const header = {
      alg: isRsa ? 'RS256' : 'ES256',
      typ: 'JWT',
      kid: isRsa ? 'kid-rsa-01' : 'kid-ec-01',
      ...headerOverrides
    }
    const payload = {
      sub: '00000000-0000-0000-0000-000000000001',
      aud: 'authenticated',
      iss: `${issuer}/auth/v1`,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      email: 'admin@adt.local',
      role: 'authenticated',
      ...payloadOverrides
    }
    const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url')
    const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signingInput = `${b64Header}.${b64Payload}`

    let sig = cryptoSign(
      'SHA256',
      Buffer.from(signingInput),
      isRsa ? privateKey : { key: privateKey, dsaEncoding: 'ieee-p1363' }
    )
    if (tamperedSig) {
      sig = Buffer.from(sig)
      sig[0] = sig[0] ^ 0xff
    }
    return `${signingInput}.${sig.toString('base64url')}`
  }

  const jwksMap = new Map([
    [mockSupabaseUrlA, [jwkEcA]],
    [mockSupabaseUrlB, [jwkEcRotated]]
  ])

  globalThis.$fetch = async (url) => {
    for (const [iss, keys] of jwksMap.entries()) {
      if (url.startsWith(iss) && url.includes('.well-known/jwks.json')) {
        return { keys }
      }
    }
    return []
  }

  console.log('--- 1. CRIPTOGRAFIA REAL JWT / JWKS & CLAIMS HARDENING ---')

  await asyncTest('crypto', '1.1 JWT ES256 válido assinado com chave privada local -> accepted', async () => {
    clearJwksCacheForTest()
    const token = createSignedJwt()
    const claims = await getClaims(token, mockSupabaseUrlA, mockConfigA)
    assert.ok(claims)
    assert.strictEqual(claims.id, '00000000-0000-0000-0000-000000000001')
    assert.strictEqual(claims.email, 'admin@adt.local')
  })

  await asyncTest('crypto', '1.2 JWT RS256 válido assinado com chave RSA local -> accepted', async () => {
    const token = createSignedJwt({ privateKey: rsaKey.privateKey, isRsa: true })
    jwksMap.set(mockSupabaseUrlA, [jwkEcA, jwkRsa])
    const claims = await getClaims(token, mockSupabaseUrlA, mockConfigA)
    assert.ok(claims)
    assert.strictEqual(claims.id, '00000000-0000-0000-0000-000000000001')
  })

  await asyncTest('crypto', '1.3 Assinatura adulterada (tampered signature) -> rejected (null)', async () => {
    const token = createSignedJwt({ tamperedSig: true })
    const claims = await getClaims(token, mockSupabaseUrlA, mockConfigA)
    assert.strictEqual(claims, null)
  })

  await asyncTest('crypto', '1.4 Assinatura com chave não cadastrada no JWKS -> rejected (null)', async () => {
    const otherKey = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
    const token = createSignedJwt({ privateKey: otherKey.privateKey })
    const claims = await getClaims(token, mockSupabaseUrlA, mockConfigA)
    assert.strictEqual(claims, null)
  })

  await asyncTest('crypto', '1.5 Token com exp vencido -> rejected (null)', async () => {
    const token = createSignedJwt({ payloadOverrides: { exp: Math.floor(Date.now() / 1000) - 10 } })
    const claims = await getClaims(token, mockSupabaseUrlA, mockConfigA)
    assert.strictEqual(claims, null)
  })

  await asyncTest('crypto', '1.6 Token com exp ausente -> rejected (null)', async () => {
    const token = createSignedJwt({ payloadOverrides: { exp: undefined } })
    const claims = await getClaims(token, mockSupabaseUrlA, mockConfigA)
    assert.strictEqual(claims, null)
  })

  await asyncTest('crypto', '1.7 Token com sub ausente -> rejected (null)', async () => {
    const token = createSignedJwt({ payloadOverrides: { sub: undefined } })
    const claims = await getClaims(token, mockSupabaseUrlA, mockConfigA)
    assert.strictEqual(claims, null)
  })

  await asyncTest('crypto', '1.8 Token com iss incorreto -> rejected (null)', async () => {
    const token = createSignedJwt({ payloadOverrides: { iss: 'https://evil.supabase.co/auth/v1' } })
    const claims = await getClaims(token, mockSupabaseUrlA, mockConfigA)
    assert.strictEqual(claims, null)
  })

  await asyncTest('crypto', '1.9 Token com aud incorreto -> rejected (null)', async () => {
    const token = createSignedJwt({ payloadOverrides: { aud: 'anon' } })
    const claims = await getClaims(token, mockSupabaseUrlA, mockConfigA)
    assert.strictEqual(claims, null)
  })

  await asyncTest('crypto', '1.10 Token com alg não permitido (none / fake) -> rejected (null)', async () => {
    const tokenNone = createSignedJwt({ headerOverrides: { alg: 'none' } })
    assert.strictEqual(await getClaims(tokenNone, mockSupabaseUrlA, mockConfigA), null)
  })

  await asyncTest('crypto', '1.11 Token com kid inexistente no JWKS -> rejected (null, sem fallback para /user)', async () => {
    let userEndpointCalled = false
    globalThis.$fetch = async (url) => {
      if (url.includes('.well-known/jwks.json')) return { keys: [jwkEcA] }
      if (url.includes('/auth/v1/user')) {
        userEndpointCalled = true
        return { id: 'u1' }
      }
      return []
    }
    const token = createSignedJwt({ headerOverrides: { kid: 'kid-inexistente' } })
    const claims = await getClaims(token, mockSupabaseUrlA, mockConfigA)
    assert.strictEqual(claims, null)
    assert.strictEqual(userEndpointCalled, false, 'ASYMMETRIC_UNKNOWN_KID_USER_ENDPOINT_FALLBACK=NO: zero chamadas a /user')
  })

  await asyncTest('crypto', '1.12 Alg/Key-type mismatch (alg: RS256 com chave EC) -> rejected (null)', async () => {
    const token = createSignedJwt({ headerOverrides: { alg: 'RS256', kid: 'kid-ec-01' } })
    assert.strictEqual(await getClaims(token, mockSupabaseUrlA, mockConfigA), null)
  })

  await asyncTest('crypto', '1.13 Token com nbf no futuro -> rejected (null)', async () => {
    const token = createSignedJwt({ payloadOverrides: { nbf: Math.floor(Date.now() / 1000) + 300 } })
    assert.strictEqual(await getClaims(token, mockSupabaseUrlA, mockConfigA), null)
  })

  await asyncTest('crypto', '1.14 JWKS Cache Scope: Project A cache isolado de Project B cache', async () => {
    clearJwksCacheForTest()
    jwksMap.set(mockSupabaseUrlA, [jwkEcA])
    jwksMap.set(mockSupabaseUrlB, [jwkEcRotated])
    globalThis.$fetch = async (url) => {
      for (const [iss, keys] of jwksMap.entries()) {
        if (url.startsWith(iss) && url.includes('.well-known/jwks.json')) {
          return { keys }
        }
      }
      return []
    }
    const tokenProjA = createSignedJwt({ issuer: mockSupabaseUrlA })
    const claimsA = await getClaims(tokenProjA, mockSupabaseUrlA, mockConfigA)
    assert.ok(claimsA)
    const tokenProjB = createSignedJwt({ privateKey: ecKeyRotated.privateKey, headerOverrides: { kid: 'kid-ec-02' }, issuer: mockSupabaseUrlB })
    const claimsBagainstA = await getClaims(tokenProjB, mockSupabaseUrlA, mockConfigA)
    assert.strictEqual(claimsBagainstA, null)
    const claimsB = await getClaims(tokenProjB, mockSupabaseUrlB, { ...mockConfigA, supabaseUrl: mockSupabaseUrlB })
    assert.ok(claimsB)
  })

  await asyncTest('crypto', '1.15 JWKS Single Flight: 5 chamadas simultâneas executam exatamente 1 fetch upstream', async () => {
    clearJwksCacheForTest()
    let fetchCount = 0
    globalThis.$fetch = async (url) => {
      if (url.includes('.well-known/jwks.json')) {
        fetchCount++
        await new Promise(r => setTimeout(r, 25))
        return { keys: [jwkEcA] }
      }
      return []
    }
    await Promise.all([
      getSupabaseJwks(mockSupabaseUrlA, true),
      getSupabaseJwks(mockSupabaseUrlA, true),
      getSupabaseJwks(mockSupabaseUrlA, true),
      getSupabaseJwks(mockSupabaseUrlA, true),
      getSupabaseJwks(mockSupabaseUrlA, true)
    ])
    assert.strictEqual(fetchCount, 1, 'JWKS_FETCH_SINGLE_FLIGHT=YES: exatamente 1 fetch upstream')
  })

  await asyncTest('crypto', '1.16 JWKS Rate Limiting: 20 tokens com kids aleatórios disparam no máx 1 forced refresh e ZERO chamadas a /user', async () => {
    clearJwksCacheForTest()
    let jwksFetchCount = 0
    let userFetchCount = 0
    globalThis.$fetch = async (url) => {
      if (url.includes('.well-known/jwks.json')) {
        jwksFetchCount++
        return { keys: [jwkEcA] }
      }
      if (url.includes('/auth/v1/user')) {
        userFetchCount++
        return {}
      }
      return []
    }
    await getSupabaseJwks(mockSupabaseUrlA, false)
    assert.strictEqual(jwksFetchCount, 1)

    for (let i = 0; i < 20; i++) {
      const token = createSignedJwt({ headerOverrides: { kid: `random-kid-${i}` } })
      const claims = await getClaims(token, mockSupabaseUrlA, mockConfigA)
      assert.strictEqual(claims, null, `Token com random-kid-${i} deve ser rejeitado`)
    }

    assert.ok(jwksFetchCount <= 2, `JWKS_UNKNOWN_KID_REFRESH_RATE_LIMITED=YES: fetches=${jwksFetchCount} (esperado <= 2)`)
    assert.strictEqual(userFetchCount, 0, 'ASYMMETRIC_UNKNOWN_KID_USER_ENDPOINT_FALLBACK=NO: zero chamadas ao endpoint /user')
  })

  await asyncTest('crypto', '1.17 JWKS Warm-Cache Rotation: kid legítimo passa após rotação', async () => {
    clearJwksCacheForTest()
    jwksMap.set(mockSupabaseUrlA, [jwkEcA])
    await getSupabaseJwks(mockSupabaseUrlA, false)

    jwksMap.set(mockSupabaseUrlA, [jwkEcA, jwkEcRotated])
    globalThis.$fetch = async (url) => {
      for (const [iss, keys] of jwksMap.entries()) {
        if (url.startsWith(iss) && url.includes('.well-known/jwks.json')) return { keys }
      }
      return []
    }
    const tokenNew = createSignedJwt({ privateKey: ecKeyRotated.privateKey, headerOverrides: { kid: 'kid-ec-02' }, issuer: mockSupabaseUrlA })
    const claims = await getClaims(tokenNew, mockSupabaseUrlA, mockConfigA)
    assert.ok(claims)
    assert.strictEqual(claims.id, '00000000-0000-0000-0000-000000000001')
  })

  await asyncTest('crypto', '1.18 JWKS Infra 500 no cold cache -> lança 503 e preserva sessão (JWKS_INFRA_FAILURE_POLICY=PRESERVE_SESSION_503)', async () => {
    clearJwksCacheForTest()
    globalThis.$fetch = async (url) => {
      if (url.includes('.well-known/jwks.json')) {
        const err = new Error('Internal Server Error')
        err.statusCode = 500
        throw err
      }
      return []
    }
    const token = createSignedJwt()
    try {
      await getClaims(token, mockSupabaseUrlA, mockConfigA)
      assert.fail('Deveria ter lançado 503')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 503, 'JWKS_INFRA_FAILURE_POLICY=PRESERVE_SESSION_503')
    }
  })

  await asyncTest('crypto', '1.19 JWKS Cached Key + Upstream Down -> token é validado com sucesso via cache', async () => {
    clearJwksCacheForTest()
    globalThis.$fetch = async (url) => {
      if (url.includes('.well-known/jwks.json')) return { keys: [jwkEcA] }
      return []
    }
    await getSupabaseJwks(mockSupabaseUrlA, false)

    globalThis.$fetch = async () => {
      const err = new Error('JWKS Down 500')
      err.statusCode = 500
      throw err
    }

    const token = createSignedJwt()
    const claims = await getClaims(token, mockSupabaseUrlA, mockConfigA)
    assert.ok(claims, 'Token deve ser validado via cache quente mesmo com upstream down')
    assert.strictEqual(claims.id, '00000000-0000-0000-0000-000000000001')
  })

  await asyncTest('crypto', '1.20 HS256 Token -> fallback oficial para GET /auth/v1/user com low-privilege key (HS256_USER_ENDPOINT_FALLBACK=YES)', async () => {
    clearJwksCacheForTest()
    let userEndpointCalled = false
    globalThis.$fetch = async (url, opts) => {
      if (url.includes('/auth/v1/user')) {
        userEndpointCalled = true
        assert.strictEqual(opts.headers.apikey, 'test-anon-key')
        assert.ok(opts.headers.Authorization.startsWith('Bearer '))
        return { id: 'u-hs256-user', email: 'hs@adt.local', role: 'authenticated' }
      }
      return []
    }
    const tokenHs = createSignedJwt({ headerOverrides: { alg: 'HS256' } })
    const claims = await getClaims(tokenHs, mockSupabaseUrlA, mockConfigA)
    assert.ok(claims)
    assert.strictEqual(claims.id, 'u-hs256-user')
    assert.strictEqual(userEndpointCalled, true)
  })

  console.log('\n--- 2. REFRESH TOKEN — COOKIE PHYSICAL PROOFS & LEAST PRIVILEGE ---')

  await asyncTest('refresh', '2.1 [REFRESH_VALID_SET_COOKIE_TEST] Refresh válido grava novos access e refresh cookies via Set-Cookie headers', async () => {
    clearJwksCacheForTest()
    jwksMap.set(mockSupabaseUrlA, [jwkEcA])
    const validNewAccessToken = createSignedJwt()

    globalThis.$fetch = async (url, opts) => {
      if (url.includes('.well-known/jwks.json')) return { keys: [jwkEcA] }
      if (url.includes('/auth/v1/token?grant_type=refresh_token')) {
        assert.strictEqual(opts.headers.apikey, 'anon-key-123', 'AUTH_REFRESH_GRANT_LOW_PRIVILEGE_ONLY=YES')
        return {
          access_token: validNewAccessToken,
          refresh_token: 'new_refresh_token_xyz',
          expires_in: 3600,
          user: { id: '00000000-0000-0000-0000-000000000001', email: 'admin@adt.local' }
        }
      }
      return []
    }

    const event = createMockEvent()
    const res = await resolveSupabaseUser(
      event,
      { supabaseUrl: mockSupabaseUrlA, supabaseServiceRoleKey: 'secret-key', anonKey: 'anon-key-123' },
      null,
      'old_refresh_token'
    )
    assert.ok(res)
    assert.strictEqual(res.id, '00000000-0000-0000-0000-000000000001')

    const setCookies = getSetCookieHeaders(event)
    assert.ok(setCookies.length >= 2, 'Devem ser emitidos pelo menos 2 cookies (access + refresh)')
    assert.ok(setCookies.some(c => c.includes(ADMIN_AUTH_COOKIE_NAME) && c.includes(validNewAccessToken)), 'Set-Cookie do access token presente')
    assert.ok(setCookies.some(c => c.includes(ADMIN_REFRESH_COOKIE_NAME) && c.includes('new_refresh_token_xyz')), 'Set-Cookie do refresh token presente')
  })

  await asyncTest('refresh', '2.2 [REFRESH_INVALID_DELETE_COOKIE_TEST] Refresh 400/401 limpa fisicamente os cookies (Max-Age=0) e retorna null', async () => {
    clearJwksCacheForTest()
    globalThis.$fetch = async (url) => {
      if (url.includes('/auth/v1/token?grant_type=refresh_token')) {
        const err = new Error('Invalid refresh token')
        err.statusCode = 400
        throw err
      }
      return []
    }

    const event = createMockEvent()
    const res = await resolveSupabaseUser(
      event,
      { supabaseUrl: mockSupabaseUrlA, anonKey: 'anon-key-123' },
      null,
      'expired_refresh_token'
    )
    assert.strictEqual(res, null, 'Token expirado retorna null')

    const setCookies = getSetCookieHeaders(event)
    assert.ok(setCookies.some(c => c.includes(ADMIN_AUTH_COOKIE_NAME) && (c.includes('Max-Age=0') || c.includes('expires='))), 'Access cookie deve ter Max-Age=0')
    assert.ok(setCookies.some(c => c.includes(ADMIN_REFRESH_COOKIE_NAME) && (c.includes('Max-Age=0') || c.includes('expires='))), 'Refresh cookie deve ter Max-Age=0')
  })

  await asyncTest('refresh', '2.3 [REFRESH_INFRA_PRESERVE_COOKIE_TEST] Refresh upstream 504/500 lança 503 e NÃO emite deleção de cookies', async () => {
    clearJwksCacheForTest()
    globalThis.$fetch = async (url) => {
      if (url.includes('/auth/v1/token?grant_type=refresh_token')) {
        const err = new Error('Gateway Timeout')
        err.statusCode = 504
        throw err
      }
      return []
    }

    const event = createMockEvent()
    try {
      await resolveSupabaseUser(
        event,
        { supabaseUrl: mockSupabaseUrlA, anonKey: 'anon-key-123' },
        null,
        'valid_refresh_token'
      )
      assert.fail('Deveria ter lançado 503')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 503, 'SESSION_REFRESH_INFRA_FAILURE_POLICY=PRESERVE_COOKIES_503')
    }

    const setCookies = getSetCookieHeaders(event)
    assert.strictEqual(setCookies.length, 0, 'NENHUM Set-Cookie de deleção deve ser emitido em falha de infraestrutura')
  })

  await asyncTest('refresh', '2.4 Refresh sem anon/publishable key lança 503 (AUTH_GRANT_SERVICE_ROLE_FALLBACK=REMOVED)', async () => {
    const event = createMockEvent()
    try {
      await resolveSupabaseUser(
        event,
        { supabaseUrl: mockSupabaseUrlA, supabaseServiceRoleKey: 'secret-role-key' },
        null,
        'refresh_token'
      )
      assert.fail('Deveria ter lançado 503 por falta de chave de baixo privilégio')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 503)
    }
  })

  console.log('\n--- 3. SINGLE-FLIGHT IN-FLIGHT DEDUPLICATION ---')

  await asyncTest('singleFlight', '3.1 Duas chamadas simultâneas (mesmo issuer + userId) compartilham 1 única Promise', async () => {
    let mockFetchCount = 0
    globalThis.$fetch = async (url) => {
      if (url.includes('admin_users')) {
        mockFetchCount++
        await new Promise(r => setTimeout(r, 50))
        return [{ id: 'adm-1', user_id: 'u-999', role: 'admin', is_active: true }]
      }
      return []
    }

    const config = { supabaseUrl: mockSupabaseUrlA, supabaseServiceRoleKey: 'key' }
    const [res1, res2] = await Promise.all([
      fetchAdminUserSingleFlight(config, 'u-999'),
      fetchAdminUserSingleFlight(config, 'u-999')
    ])

    assert.strictEqual(mockFetchCount, 1, 'Exatamente 1 requisição HTTP upstream para chamadas simultâneas')
    assert.strictEqual(res1[0].user_id, 'u-999')
    assert.strictEqual(res2[0].user_id, 'u-999')
  })

  await asyncTest('singleFlight', '3.2 Usuários diferentes NÃO compartilham Promise', async () => {
    let mockFetchCount = 0
    globalThis.$fetch = async (url) => {
      if (url.includes('admin_users')) {
        mockFetchCount++
        await new Promise(r => setTimeout(r, 30))
        return [{ id: 'adm', role: 'admin', is_active: true }]
      }
      return []
    }

    const config = { supabaseUrl: mockSupabaseUrlA, supabaseServiceRoleKey: 'key' }
    await Promise.all([
      fetchAdminUserSingleFlight(config, 'u-1'),
      fetchAdminUserSingleFlight(config, 'u-2')
    ])
    assert.strictEqual(mockFetchCount, 2)
  })

  await asyncTest('singleFlight', '3.3 Configuração ausente lança 503 sanitizado (Fail-Closed, nunca array vazio)', async () => {
    try {
      await fetchAdminUserSingleFlight({ supabaseUrl: '', supabaseServiceRoleKey: '' }, 'u-1')
      assert.fail('Deveria ter lançado 503')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 503)
    }
  })

  console.log('\n--- 4. LOGIN & LOGOUT HANDLER REAL TESTS ---')

  globalThis.useRuntimeConfig = () => ({
    supabaseUrl: mockSupabaseUrlA,
    supabaseServiceRoleKey: 'test-service-key',
    supabaseAnonKey: 'test-anon-key',
    supabasePublishableKey: 'test-anon-key'
  })

  await asyncTest('loginHandler', '4.1 Body sem email/password retorna 400', async () => {
    const event = createMockEvent({ body: { email: '', password: '' } })
    try {
      await loginHandler(event)
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }
  })

  await asyncTest('loginHandler', '4.2 Credenciais inválidas (Supabase 400/401) retorna 401 sanitizado', async () => {
    globalThis.$fetch = async () => {
      const err = new Error('Invalid login credentials')
      err.statusCode = 400
      throw err
    }
    const event = createMockEvent({ body: { email: 'admin@adt.local', password: 'wrong-password' } })
    try {
      await loginHandler(event)
      assert.fail('Deveria ter lançado 401')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 401)
      assert.strictEqual(err.message, 'E-mail ou senha incorretos.')
    }
  })

  await asyncTest('loginHandler', '4.3 Password grant sem publishable/anon key lança 503 (AUTH_GRANT_SERVICE_ROLE_FALLBACK=REMOVED)', async () => {
    globalThis.useRuntimeConfig = () => ({
      supabaseUrl: mockSupabaseUrlA,
      supabaseServiceRoleKey: 'test-service-key'
    })
    const event = createMockEvent({ body: { email: 'admin@adt.local', password: 'password123' } })
    try {
      await loginHandler(event)
      assert.fail('Deveria ter lançado 503')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 503)
    }
    globalThis.useRuntimeConfig = () => ({
      supabaseUrl: mockSupabaseUrlA,
      supabaseServiceRoleKey: 'test-service-key',
      supabaseAnonKey: 'test-anon-key'
    })
  })

  await asyncTest('loginHandler', '4.4 Supabase Auth indisponível (timeout/503) retorna 503 sanitizado', async () => {
    globalThis.$fetch = async () => {
      const err = new Error('Gateway Timeout')
      err.statusCode = 504
      throw err
    }
    const event = createMockEvent({ body: { email: 'admin@adt.local', password: 'password123' } })
    try {
      await loginHandler(event)
      assert.fail('Deveria ter lançado 503')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 503)
      assert.strictEqual(err.message, 'Serviço de autenticação temporariamente indisponível.')
    }
  })

  await asyncTest('loginHandler', '4.5 Usuário autenticado mas não presente em public.admin_users retorna 403', async () => {
    globalThis.$fetch = async (url) => {
      if (url.includes('/auth/v1/token')) {
        return {
          access_token: 'valid_token',
          refresh_token: 'valid_refresh',
          expires_in: 3600,
          user: { id: 'u-non-admin', email: 'regular@user.com' }
        }
      }
      if (url.includes('admin_users')) return []
      return []
    }
    const event = createMockEvent({ body: { email: 'regular@user.com', password: 'password123' } })
    try {
      await loginHandler(event)
      assert.fail('Deveria ter lançado 403')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 403)
    }
  })

  await asyncTest('loginHandler', '4.6 Usuário autenticado com is_active: false retorna 403', async () => {
    globalThis.$fetch = async (url) => {
      if (url.includes('/auth/v1/token')) {
        return {
          access_token: 'valid_token',
          refresh_token: 'valid_refresh',
          expires_in: 3600,
          user: { id: 'u-inactive', email: 'inactive@adt.local' }
        }
      }
      if (url.includes('admin_users')) {
        return [{ id: 'adm-inact', user_id: 'u-inactive', email: 'inactive@adt.local', role: 'admin', is_active: false }]
      }
      return []
    }
    const event = createMockEvent({ body: { email: 'inactive@adt.local', password: 'password123' } })
    try {
      await loginHandler(event)
      assert.fail('Deveria ter lançado 403')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 403)
    }
  })

  await asyncTest('loginHandler', '4.7 Admin ativo: contrato LOGIN_RESPONSE_CONTRACT = { success, user: { id, userId, email, role } }', async () => {
    globalThis.$fetch = async (url, opts) => {
      if (url.includes('/auth/v1/token')) {
        assert.strictEqual(opts.headers.apikey, 'test-anon-key', 'AUTH_PASSWORD_GRANT_LOW_PRIVILEGE_ONLY=YES')
        return {
          access_token: 'valid_token_xyz',
          refresh_token: 'valid_refresh_xyz',
          expires_in: 3600,
          user: { id: 'u-valid-admin', email: 'admin@adt.local' }
        }
      }
      if (url.includes('admin_users')) {
        return [{ id: 'adm-real-id', user_id: 'u-valid-admin', email: 'admin@adt.local', role: 'admin', is_active: true }]
      }
      return []
    }
    const event = createMockEvent({ body: { email: 'admin@adt.local', password: 'correct-password' } })
    const res = await loginHandler(event)
    assert.strictEqual(res.success, true)
    assert.ok(res.user)
    assert.strictEqual(typeof res.admin, 'undefined')
    assert.strictEqual(res.user.userId, 'u-valid-admin')
    assert.strictEqual(res.user.email, 'admin@adt.local')
    assert.strictEqual(res.user.role, 'admin')
  })

  await asyncTest('loginHandler', '4.8 Logout POST revoga sessão no Supabase Auth com scope=local e apaga cookies (SUPABASE_SESSION_REVOCATION_ON_LOGOUT=YES)', async () => {
    let supabaseLogoutCalled = false
    let passedScope = null
    let passedToken = null
    let passedApiKey = null

    globalThis.$fetch = async (url, opts) => {
      if (url.includes('/auth/v1/logout')) {
        supabaseLogoutCalled = true
        passedScope = new URL(url).searchParams.get('scope')
        passedToken = opts.headers.Authorization
        passedApiKey = opts.headers.apikey
        return {}
      }
      return {}
    }

    const event = createMockEvent({
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        cookie: `${ADMIN_AUTH_COOKIE_NAME}=valid_access_token_123`
      }
    })

    const res = await logoutHandler(event)
    assert.strictEqual(res.success, true)
    assert.strictEqual(supabaseLogoutCalled, true, 'Deve invocar /auth/v1/logout no Supabase')
    assert.strictEqual(passedScope, 'local', 'LOGOUT_SCOPE=LOCAL')
    assert.strictEqual(passedToken, 'Bearer valid_access_token_123')
    assert.strictEqual(passedApiKey, 'test-anon-key', 'Usa chave de baixo privilégio')

    // Prova física de limpeza de cookies
    const setCookies = getSetCookieHeaders(event)
    assert.ok(setCookies.some(c => c.includes(ADMIN_AUTH_COOKIE_NAME) && c.includes('Max-Age=0')), 'LOGOUT_COOKIE_CLEAR=PASS')
  })

  await asyncTest('loginHandler', '4.9 Logout POST cross-origin é rejeitado com 403 CSRF (LOGOUT_CSRF=PASS)', async () => {
    const event = createMockEvent({ method: 'POST', headers: { origin: 'https://evil-site.com' } })
    try {
      await logoutHandler(event)
      assert.fail('Deveria ter lançado 403')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 403, 'LOGOUT_CSRF=PASS')
    }
  })

  console.log('\n--- 5. SESSION HANDLER REAL TESTS ---')

  await asyncTest('sessionHandler', '5.1 Handler /api/admin/auth/session sem token retorna authenticated: false', async () => {
    const event = createMockEvent({ method: 'GET' })
    const res = await sessionHandler(event)
    assert.strictEqual(res.authenticated, false)
    assert.strictEqual(res.user, null)
  })

  await asyncTest('sessionHandler', '5.2 Handler com admin ativo e JWT válido retorna authenticated: true e dados do usuário', async () => {
    clearJwksCacheForTest()
    jwksMap.set(mockSupabaseUrlA, [jwkEcA])
    const validToken = createSignedJwt()

    globalThis.$fetch = async (url) => {
      if (url.includes('.well-known/jwks.json')) return { keys: [jwkEcA] }
      if (url.includes('admin_users')) {
        return [{ id: 'adm-100', user_id: '00000000-0000-0000-0000-000000000001', email: 'admin@adt.local', role: 'admin', is_active: true }]
      }
      return []
    }

    const event = createMockEvent({
      method: 'GET',
      headers: { cookie: `${ADMIN_AUTH_COOKIE_NAME}=${validToken}` }
    })
    const res = await sessionHandler(event)
    assert.strictEqual(res.authenticated, true)
    assert.ok(res.user)
    assert.strictEqual(res.user.userId, '00000000-0000-0000-0000-000000000001')
    assert.strictEqual(res.user.role, 'admin')
  })

  await asyncTest('sessionHandler', '5.3 Handler com admin inativo (403) retorna authenticated: false', async () => {
    clearJwksCacheForTest()
    jwksMap.set(mockSupabaseUrlA, [jwkEcA])
    const validToken = createSignedJwt()

    globalThis.$fetch = async (url) => {
      if (url.includes('.well-known/jwks.json')) return { keys: [jwkEcA] }
      if (url.includes('admin_users')) {
        return [{ id: 'adm-100', user_id: '00000000-0000-0000-0000-000000000001', email: 'admin@adt.local', role: 'admin', is_active: false }]
      }
      return []
    }

    const event = createMockEvent({
      method: 'GET',
      headers: { cookie: `${ADMIN_AUTH_COOKIE_NAME}=${validToken}` }
    })
    const res = await sessionHandler(event)
    assert.strictEqual(res.authenticated, false)
    assert.strictEqual(res.user, null)
  })

  await asyncTest('sessionHandler', '5.4 Handler com falha de infraestrutura no lookup de admin retorna 503 (NUNCA authenticated: false)', async () => {
    clearJwksCacheForTest()
    jwksMap.set(mockSupabaseUrlA, [jwkEcA])
    const validToken = createSignedJwt()

    globalThis.$fetch = async (url) => {
      if (url.includes('.well-known/jwks.json')) return { keys: [jwkEcA] }
      if (url.includes('admin_users')) throw new Error('Database connection timeout')
      return []
    }

    const event = createMockEvent({
      method: 'GET',
      headers: { cookie: `${ADMIN_AUTH_COOKIE_NAME}=${validToken}` }
    })
    try {
      await sessionHandler(event)
      assert.fail('Deveria ter propagado 503')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 503, 'SESSION_HANDLER_5XX_POLICY=PROPAGATE_503')
    }
  })

  await asyncTest('sessionHandler', '5.5 [STATIC_SECURITY_CHECK] adminAuth.ts contains ZERO mock tokens (DEV_MOCK_AUTH_RUNTIME=REMOVED)', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const content = fs.readFileSync(path.resolve('server/utils/adminAuth.ts'), 'utf8')
    assert.strictEqual(content.includes('dev_mock_admin_token'), false)
    assert.strictEqual(content.includes('dev_mock_refresh_token'), false)
    assert.strictEqual(content.includes('ENABLE_TEST_AUTH'), false)
    assert.strictEqual(content.includes('e2e_test_admin_token'), false)
  })

  await asyncTest('sessionHandler', '5.6 [TEST_AUTH_SECURITY] Mock tokens are INCONDITIONALLY REJECTED in all envs (PRODUCTION_TEST_AUTH_BYPASS=IMPOSSIBLE)', async () => {
    const origNodeEnv = process.env.NODE_ENV
    const origEnableTestAuth = process.env.ENABLE_TEST_AUTH
    try {
      process.env.NODE_ENV = 'production'
      process.env.ENABLE_TEST_AUTH = 'true'
      const event = createMockEvent({
        method: 'GET',
        headers: {
          cookie: `${ADMIN_AUTH_COOKIE_NAME}=e2e_test_admin_token`
        }
      })
      const res = await sessionHandler(event)
      assert.strictEqual(res.authenticated, false, 'Mock token NUNCA autentica em runtime')
    } finally {
      process.env.NODE_ENV = origNodeEnv
      process.env.ENABLE_TEST_AUTH = origEnableTestAuth
    }
  })

  await asyncTest('sessionHandler', '5.7 [CACHED_ADMIN_SECURITY] Cached inactive admin is REJECTED with 403 (CACHED_INACTIVE_ADMIN=REJECTED)', async () => {
    const { requireActiveAdmin } = await import('../server/utils/adminAuth.ts')
    const event = createMockEvent({
      method: 'GET',
      context: {
        auth: {
          admin: { adminId: '1', userId: '1', email: 'test@adt.local', role: 'admin', isActive: false }
        }
      }
    })
    try {
      await requireActiveAdmin(event)
      assert.fail('Deveria ter lançado 403')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 403)
    }
  })

  await asyncTest('sessionHandler', '5.8 [ROLE_FAIL_CLOSED] verifyActiveAdmin denies null/undefined/operator role (MISSING_ADMIN_ROLE=REJECTED)', async () => {
    assert.strictEqual(verifyActiveAdmin({ id: 'u1' }, [{ user_id: 'u1', role: 'admin', is_active: true }]).authorized, true)
    assert.strictEqual(verifyActiveAdmin({ id: 'u1' }, [{ user_id: 'u1', role: 'superadmin', is_active: true }]).authorized, true)
    assert.strictEqual(verifyActiveAdmin({ id: 'u1' }, [{ user_id: 'u1', role: 'operator', is_active: true }]).authorized, false)
    assert.strictEqual(verifyActiveAdmin({ id: 'u1' }, [{ user_id: 'u1', role: null, is_active: true }]).authorized, false)
    assert.strictEqual(verifyActiveAdmin({ id: 'u1' }, [{ user_id: 'u1', role: undefined, is_active: true }]).authorized, false)
  })

  console.log('\n--- 6. COMPOSABLE & MIDDLEWARE REAL TESTS ---')

  await asyncTest('composable', '6.1 [COMPOSABLE_REAL_TEST] useAdminAuth().checkSession() 200 popula user e sessionState="authenticated"', async () => {
    clearNuxtStateForTest()
    globalThis.useRequestFetch = () => async () => ({
      authenticated: true,
      user: { id: 'adm-real-1', userId: 'u-1', email: 'admin@adt.local', role: 'admin' }
    })

    const auth = useAdminAuth()
    const state = await auth.checkSession()
    assert.strictEqual(state, 'authenticated')
    assert.strictEqual(auth.isAuthenticated.value, true)
    assert.strictEqual(auth.isUnavailable.value, false)
    assert.ok(auth.user.value)
    assert.strictEqual(auth.user.value.email, 'admin@adt.local')
  })

  await asyncTest('composable', '6.2 [COMPOSABLE_REAL_TEST] useAdminAuth().checkSession() 401 limpa user e define sessionState="unauthenticated"', async () => {
    clearNuxtStateForTest()
    const auth = useAdminAuth()
    auth.user.value = { id: 'old-user', email: 'old@adt.local', role: 'admin' }

    globalThis.useRequestFetch = () => async () => {
      const err = new Error('Unauthorized')
      err.statusCode = 401
      throw err
    }

    const state = await auth.checkSession()
    assert.strictEqual(state, 'unauthenticated')
    assert.strictEqual(auth.isAuthenticated.value, false)
    assert.strictEqual(auth.user.value, null)
  })

  await asyncTest('composable', '6.3 [COMPOSABLE_REAL_TEST] useAdminAuth().checkSession() 503 preserva user conhecido e define sessionState="unavailable"', async () => {
    clearNuxtStateForTest()
    const auth = useAdminAuth()
    const knownUser = { id: 'adm-known', userId: 'u-known', email: 'known@adt.local', role: 'admin' }
    auth.user.value = knownUser

    globalThis.useRequestFetch = () => async () => {
      const err = new Error('Service Unavailable')
      err.statusCode = 503
      throw err
    }

    const state = await auth.checkSession()
    assert.strictEqual(state, 'unavailable')
    assert.strictEqual(auth.isUnavailable.value, true)
    assert.strictEqual(auth.isAuthenticated.value, false)
    assert.strictEqual(auth.user.value?.userId, knownUser.userId, 'USE_ADMIN_AUTH_503_POLICY=PRESERVE_EXISTING_USER')
    assert.strictEqual(auth.user.value?.email, knownUser.email)
    assert.strictEqual(auth.authError.value, 'INFRA_UNAVAILABLE')
  })

  await asyncTest('composable', '6.4 [COMPOSABLE_REAL_TEST] useAdminAuth().checkSession() status 0 (transport failure) preserva user e define sessionState="unavailable" (NETWORK_STATUS_0_POLICY=UNAVAILABLE)', async () => {
    clearNuxtStateForTest()
    const auth = useAdminAuth()
    const knownUser = { id: 'adm-known', userId: 'u-known', email: 'known@adt.local', role: 'admin' }
    auth.user.value = knownUser

    globalThis.useRequestFetch = () => async () => {
      const netErr = new Error('Failed to fetch')
      netErr.name = 'FetchError'
      // status 0 / sem statusCode
      throw netErr
    }

    const state = await auth.checkSession()
    assert.strictEqual(state, 'unavailable')
    assert.strictEqual(auth.isUnavailable.value, true)
    assert.strictEqual(auth.user.value?.userId, knownUser.userId, 'NETWORK_STATUS_0_POLICY=UNAVAILABLE')
    assert.strictEqual(auth.user.value?.email, knownUser.email)
  })


  await asyncTest('middleware', '6.5 [MIDDLEWARE_REAL_TEST] Usuário autenticado acessa rota privada `/admin/crm`: permitida (zero redirect)', async () => {
    clearNuxtStateForTest()
    const auth = useAdminAuth()
    auth.user.value = { id: 'adm-1', email: 'adm@adt.local', role: 'admin' }
    auth.sessionState.value = 'authenticated'

    const res = await adminAuthMiddleware({ path: '/admin/crm', fullPath: '/admin/crm' })
    assert.strictEqual(res, undefined, 'Acesso permitido sem redirecionamento')
  })

  await asyncTest('middleware', '6.6 [MIDDLEWARE_REAL_TEST] Não autenticado acessa `/admin/crm`: redireciona para `/admin/login` com redirect query', async () => {
    clearNuxtStateForTest()
    globalThis.useRequestFetch = () => async () => ({ authenticated: false, user: null })

    const res = await adminAuthMiddleware({ path: '/admin/crm', fullPath: '/admin/crm' })
    assert.ok(res)
    assert.strictEqual(res.action, 'navigate')
    assert.strictEqual(res.path.path, '/admin/login')
    assert.strictEqual(res.path.query?.redirect, '/admin/crm')
  })

  await asyncTest('middleware', '6.7 [MIDDLEWARE_REAL_TEST] Usuário autenticado acessa `/admin/login`: redireciona para `/admin/dashboard`', async () => {
    clearNuxtStateForTest()
    const auth = useAdminAuth()
    auth.user.value = { id: 'adm-1', email: 'adm@adt.local', role: 'admin' }
    auth.sessionState.value = 'authenticated'

    const res = await adminAuthMiddleware({ path: '/admin/login', fullPath: '/admin/login', query: {} })
    assert.ok(res)
    assert.strictEqual(res.action, 'navigate')
    assert.strictEqual(res.path, '/admin/dashboard')
  })

  await asyncTest('middleware', '6.8 [MIDDLEWARE_REAL_TEST] User previamente autenticado + 503: permanece na rota atual sem redirect login (MIDDLEWARE_503_EXISTING_AUTH_POLICY=PRESERVE)', async () => {
    clearNuxtStateForTest()
    const auth = useAdminAuth()
    auth.user.value = { id: 'adm-known', email: 'known@adt.local', role: 'admin' }
    auth.sessionState.value = 'unavailable'

    const res = await adminAuthMiddleware({ path: '/admin/crm', fullPath: '/admin/crm' })
    assert.strictEqual(res, undefined, 'MIDDLEWARE_503_EXISTING_AUTH_POLICY=PRESERVE: acesso mantido')
  })

  await asyncTest('middleware', '6.9 [MIDDLEWARE_REAL_TEST] Fresh session (user=null) + 503 acessa rota privada: bloqueia com 503 (MIDDLEWARE_503_NO_KNOWN_AUTH_POLICY=BLOCK_UNAVAILABLE)', async () => {
    clearNuxtStateForTest()
    globalThis.useRequestFetch = () => async () => {
      const err = new Error('Service Unavailable')
      err.statusCode = 503
      throw err
    }

    const res = await adminAuthMiddleware({ path: '/admin/crm', fullPath: '/admin/crm' })
    assert.ok(res, 'Deve abortar a navegação')
    assert.strictEqual(res.action, 'abort')
    assert.strictEqual(res.error.statusCode, 503, 'MIDDLEWARE_503_NO_KNOWN_AUTH_POLICY=BLOCK_UNAVAILABLE')
  })

  await asyncTest('middleware', '6.10 [MIDDLEWARE_REAL_TEST] Fresh session (user=null) + 503 acessa `/admin/login`: permitida para exibir status', async () => {
    clearNuxtStateForTest()
    globalThis.useRequestFetch = () => async () => {
      const err = new Error('Service Unavailable')
      err.statusCode = 503
      throw err
    }

    const res = await adminAuthMiddleware({ path: '/admin/login', fullPath: '/admin/login', query: {} })
    assert.strictEqual(res, undefined, 'Página de login pode ser renderizada para exibir aviso de indisponibilidade')
  })

  console.log('\n--- 7. AUTHORIZATION & CSRF TRUE SAME-ORIGIN TESTS ---')

  test('csrf', '7.1 [MISSING_ADMIN_ROLE_POLICY=DENY] Admin sem role (null/undefined/vazio) retorna UNAUTHORIZED_ROLE', () => {
    const adminNoRole = { id: 'a1', user_id: 'u1', email: 'adm@adt.local', role: null, is_active: true }
    const res = verifyActiveAdmin({ id: 'u1' }, [adminNoRole])
    assert.strictEqual(res.authorized, false)
    assert.strictEqual(res.reason, 'UNAUTHORIZED_ROLE', 'MISSING_ADMIN_ROLE_POLICY=DENY')

    const adminEmptyRole = { id: 'a2', user_id: 'u2', email: 'adm2@adt.local', role: '   ', is_active: true }
    const res2 = verifyActiveAdmin({ id: 'u2' }, [adminEmptyRole])
    assert.strictEqual(res2.authorized, false)
    assert.strictEqual(res2.reason, 'UNAUTHORIZED_ROLE')
  })

  test('csrf', '7.2 [RBAC_ALLOWLIST] role="admin" -> authorized=true', () => {
    const res = verifyActiveAdmin({ id: 'u1' }, [{ id: 'a1', user_id: 'u1', email: 'adm@adt.local', role: 'admin', is_active: true }])
    assert.strictEqual(res.authorized, true)
    assert.strictEqual(res.admin?.role, 'admin')
  })

  test('csrf', '7.3 [RBAC_ALLOWLIST] role="superadmin" -> authorized=true', () => {
    const res = verifyActiveAdmin({ id: 'u1' }, [{ id: 'a1', user_id: 'u1', email: 'super@adt.local', role: 'superadmin', is_active: true }])
    assert.strictEqual(res.authorized, true)
    assert.strictEqual(res.admin?.role, 'superadmin')
  })

  test('csrf', '7.4 [RBAC_ALLOWLIST] role="operator" -> UNAUTHORIZED_ROLE (OPERATOR_FULL_ADMIN_ACCESS=NO)', () => {
    const res = verifyActiveAdmin({ id: 'u1' }, [{ id: 'a1', user_id: 'u1', email: 'op@adt.local', role: 'operator', is_active: true }])
    assert.strictEqual(res.authorized, false)
    assert.strictEqual(res.reason, 'UNAUTHORIZED_ROLE', 'OPERATOR_FULL_ADMIN_ACCESS=NO')
  })

  test('csrf', '7.5 [RBAC_ALLOWLIST] role="gerente" -> UNAUTHORIZED_ROLE (GERENTE_FULL_ADMIN_ACCESS=NO)', () => {
    const res = verifyActiveAdmin({ id: 'u1' }, [{ id: 'a1', user_id: 'u1', email: 'ger@adt.local', role: 'gerente', is_active: true }])
    assert.strictEqual(res.authorized, false)
    assert.strictEqual(res.reason, 'UNAUTHORIZED_ROLE', 'GERENTE_FULL_ADMIN_ACCESS=NO')
  })

  test('csrf', '7.6 [RBAC_ALLOWLIST] role="ADMIN" / " SuperAdmin " normalizado -> authorized=true', () => {
    const resUpper = verifyActiveAdmin({ id: 'u1' }, [{ id: 'a1', user_id: 'u1', email: 'adm@adt.local', role: 'ADMIN', is_active: true }])
    assert.strictEqual(resUpper.authorized, true)
    assert.strictEqual(resUpper.admin?.role, 'admin')

    const resTrim = verifyActiveAdmin({ id: 'u2' }, [{ id: 'a2', user_id: 'u2', email: 'sup@adt.local', role: ' SuperAdmin ', is_active: true }])
    assert.strictEqual(resTrim.authorized, true)
    assert.strictEqual(resTrim.admin?.role, 'superadmin')
  })

  test('csrf', '7.7 [CSRF_POLICY=TRUE_SAME_ORIGIN] https://site.com -> https://site.com = 200 PASS', () => {
    const res = validateMutationOrigin('https://site.com', null, 'site.com', false, null, false, 'https')
    assert.strictEqual(res.allowed, true)
    assert.strictEqual(res.statusCode, 200)
  })

  test('csrf', '7.8 [CSRF_POLICY=TRUE_SAME_ORIGIN] https://site.com:444 -> https://site.com = 403 REJECT (port mismatch)', () => {
    const res = validateMutationOrigin('https://site.com:444', null, 'site.com', false, null, false, 'https')
    assert.strictEqual(res.allowed, false)
    assert.strictEqual(res.statusCode, 403)
  })

  test('csrf', '7.9 [CSRF_POLICY=TRUE_SAME_ORIGIN] http://site.com -> https://site.com = 403 REJECT (scheme mismatch)', () => {
    const res = validateMutationOrigin('http://site.com', null, 'site.com', false, null, false, 'https')
    assert.strictEqual(res.allowed, false)
    assert.strictEqual(res.statusCode, 403)
  })

  test('csrf', '7.10 [CSRF_POLICY=TRUE_SAME_ORIGIN] https://evil.site -> https://site.com = 403 REJECT (host mismatch)', () => {
    const res = validateMutationOrigin('https://evil.site', null, 'site.com', false, null, false, 'https')
    assert.strictEqual(res.allowed, false)
    assert.strictEqual(res.statusCode, 403)
  })

  test('csrf', '7.11 [CSRF_MISSING_HOST_POLICY=REJECT] Host ausente em mutação retorna 403 fail-closed', () => {
    const res = validateMutationOrigin('https://site.com', null, '', false, null, false, 'https')
    assert.strictEqual(res.allowed, false)
    assert.strictEqual(res.statusCode, 403)
  })

  test('csrf', '7.12 [COOKIE_MUTATION_MISSING_ORIGIN_REFERER=REJECTED] Cookie mutation sem Origin e sem Referer é REJEITADA com 403', () => {
    const res = validateMutationOrigin(null, null, 'site.com', false, null, false, 'https')
    assert.strictEqual(res.allowed, false)
    assert.strictEqual(res.statusCode, 403)
  })

  test('csrf', '7.13 [CSRF_BEARER_WITH_ADMIN_COOKIE_BYPASS=NO] Bearer token com admin cookie presente sem Origin é REJEITADA com 403', () => {
    const res = validateMutationOrigin(null, null, 'site.com', false, 'Bearer fake-token', true, 'https')
    assert.strictEqual(res.allowed, false)
    assert.strictEqual(res.statusCode, 403)
  })

  test('csrf', '7.14 [DEV_ENVIRONMENT] Server-to-server puro (Bearer token SEM admin cookies em dev) sem Origin/Referer é PERMITIDA (200)', () => {
    const res = validateMutationOrigin(null, null, 'localhost:3000', true, 'Bearer some-server-token', false, 'http')
    assert.strictEqual(res.allowed, true)
    assert.strictEqual(res.statusCode, 200)
  })

  test('csrf', '7.15 [CSRF_MISSING_ORIGIN_REFERER_POLICY=FAIL_CLOSED_PRODUCTION] Em produção, sem Origin/Referer é SEMPRE 403', () => {
    const res = validateMutationOrigin(null, null, 'site.com', false, 'Bearer some-server-token', false, 'https')
    assert.strictEqual(res.allowed, false)
    assert.strictEqual(res.statusCode, 403)
  })


  console.log('\n--- 8. INITIAL DASHBOARD AGGREGATOR ---')

  await asyncTest('analytics', '8.1 Handler /api/admin/analytics/initial retorna overview + recentActivity', async () => {
    globalThis.$fetch = async (url) => {
      if (url.includes('page_views')) return [{ id: '1', created_at: new Date().toISOString(), is_bot: false }]
      if (url.includes('lead_clicks')) return [{ id: '1', created_at: new Date().toISOString(), tipo: 'whatsapp', is_bot: false }]
      if (url.includes('leads')) return [{ id: '1', submission_id: 'sub-1', created_at: new Date().toISOString(), nome: 'Teste' }]
      return []
    }

    const event = {
      node: { req: { method: 'GET' }, res: {} },
      context: {
        auth: {
          admin: { adminId: 'a1', userId: 'u1', email: 'adm@adt.local', role: 'admin', isActive: true }
        }
      }
    }

    const res = await initialAggregatorHandler(event)
    assert.strictEqual(res.success, true)
    assert.ok(res.overview, 'Overview deve estar presente')
    assert.ok(res.recentActivity, 'RecentActivity deve estar presente')
    assert.ok(Array.isArray(res.recentActivity.events))
  })

  console.log('\n--- 9. MEDIÇÃO DE PERFORMANCE (SIMULAÇÃO ARQUITETURAL DE REDE) ---')
  console.log('  PERFORMANCE_LATENCY_EVIDENCE = SIMULATED_NETWORK_MODEL')

  const iterations = 10
  const latenciesBefore = []
  const latenciesAfter = []

  const LAT_AUTH = 135
  const LAT_DB = 115
  const LAT_QUERY = 125

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now()
    await new Promise(r => setTimeout(r, (LAT_AUTH + LAT_DB) * 0.5))
    await Promise.all([
      new Promise(r => setTimeout(r, (LAT_AUTH + LAT_DB + LAT_QUERY * 4) * 0.5)),
      new Promise(r => setTimeout(r, (LAT_AUTH + LAT_DB + LAT_QUERY * 3) * 0.5)),
      new Promise(r => setTimeout(r, (LAT_AUTH + LAT_DB + LAT_QUERY * 3) * 0.5)),
      new Promise(r => setTimeout(r, (LAT_AUTH + LAT_DB + LAT_QUERY * 2) * 0.5)),
      new Promise(r => setTimeout(r, (LAT_AUTH + LAT_DB + LAT_QUERY * 3) * 0.5)),
      new Promise(r => setTimeout(r, (LAT_AUTH + LAT_DB + LAT_QUERY * 1) * 0.5))
    ])
    latenciesBefore.push(performance.now() - t0)

    const t1 = performance.now()
    await Promise.all([
      new Promise(r => setTimeout(r, (0 + LAT_DB + LAT_QUERY * 2) * 0.5))
    ])
    latenciesAfter.push(performance.now() - t1)
  }

  function calcStats(arr) {
    const sorted = [...arr].sort((a, b) => a - b)
    const min = sorted[0].toFixed(1)
    const median = sorted[Math.floor(sorted.length / 2)].toFixed(1)
    const p95 = sorted[Math.floor(sorted.length * 0.95)].toFixed(1)
    return { min, median, p95 }
  }

  const statsBefore = calcStats(latenciesBefore)
  const statsAfter = calcStats(latenciesAfter)

  console.log(`  BEFORE Patch 1 (Cold Dashboard Load): min=${statsBefore.min}ms, median=${statsBefore.median}ms, p95=${statsBefore.p95}ms`)
  console.log(`  AFTER Patch 1  (Cold Dashboard Load): min=${statsAfter.min}ms, median=${statsAfter.median}ms, p95=${statsAfter.p95}ms`)

  const reductionPercent = (((statsBefore.median - statsAfter.median) / statsBefore.median) * 100).toFixed(1)
  console.log(`  REDUÇÃO DE LATÊNCIA (MODELO SIMULADO): ${reductionPercent}%`)

  console.log('\n======================================================================')
  console.log(`TOTAL DE TESTES EXECUTADOS: ${passed + failed}`)
  console.log(`PASSOU:                     ${passed}`)
  console.log(`FALHOU:                     ${failed}`)
  console.log('----------------------------------------------------------------------')
  console.log(`AUTH_CRYPTO_UNIT_TESTS:     ${counts.crypto}`)
  console.log(`AUTH_REFRESH_TESTS:         ${counts.refresh}`)
  console.log(`SINGLE_FLIGHT_TESTS:        ${counts.singleFlight}`)
  console.log(`AUTH_HANDLER_TESTS:         ${counts.loginHandler}`)
  console.log(`SESSION_HANDLER_TESTS:      ${counts.sessionHandler}`)
  console.log(`COMPOSABLE_REAL_TESTS:      ${counts.composable}`)
  console.log(`MIDDLEWARE_REAL_TESTS:      ${counts.middleware}`)
  console.log(`CSRF_PROTECTION_TESTS:      ${counts.csrf}`)
  console.log(`ANALYTICS_AGGREGATOR_TESTS: ${counts.analytics}`)
  console.log('======================================================================')

  if (failed > 0) {
    console.error('\nErros encontrados na suíte de testes:')
    errors.forEach(e => console.error(` - ${e.name}: ${e.error}`))
    process.exit(1)
  }
}

runTests()
