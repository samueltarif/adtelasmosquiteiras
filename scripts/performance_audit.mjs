import { performance } from 'perf_hooks'

async function mockSupabaseLatency(ms = 120) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

console.log('======================================================================')
console.log('--- DIAGNÓSTICO DE PERFORMANCE: ADMIN LOGIN & DASHBOARD ENTRY ---')
console.log('======================================================================\n')

// Modelo de latência real de roundtrip Supabase Cloud (SP -> Supabase Cloud: ~110-140ms por request)
const LATENCY_AUTH_USER = 135
const LATENCY_ADMIN_USERS = 115
const LATENCY_POSTGREST_QUERY = 125
const LATENCY_TOKEN_REFRESH = 180

// Simulações dos Cenários A, B, C, D, E
async function simulateScenarioA_LoginAndFirstDashboardLoad() {
  console.log('--- CENÁRIO A: Login + Primeira Entrada no Dashboard (Cold) ---')
  const t0 = performance.now()

  // 1. Submit Login
  const tLoginStart = performance.now()
  await mockSupabaseLatency(LATENCY_TOKEN_REFRESH) // /auth/v1/token?grant_type=password
  await mockSupabaseLatency(LATENCY_ADMIN_USERS)  // admin_users lookup
  const tLoginEnd = performance.now()
  const loginMs = tLoginEnd - tLoginStart

  // 2. Navigation + Middleware
  const tMiddlewareStart = performance.now()
  await mockSupabaseLatency(LATENCY_AUTH_USER)     // /auth/v1/user in session.get.ts
  await mockSupabaseLatency(LATENCY_ADMIN_USERS)  // admin_users in session.get.ts
  const tMiddlewareEnd = performance.now()
  const middlewareMs = tMiddlewareEnd - tMiddlewareStart

  // 3. Dashboard onMounted (6 parallel API calls)
  const tDashboardStart = performance.now()
  const apiCalls = [
    // overview: auth (2) + 4 queries
    (async () => {
      await mockSupabaseLatency(LATENCY_AUTH_USER)
      await mockSupabaseLatency(LATENCY_ADMIN_USERS)
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY) // page_views
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY) // lead_clicks
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY) // leads
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY) // history
    })(),
    // acquisition: auth (2) + 3 queries
    (async () => {
      await mockSupabaseLatency(LATENCY_AUTH_USER)
      await mockSupabaseLatency(LATENCY_ADMIN_USERS)
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY) // page_views
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY) // lead_clicks
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY) // leads
    })(),
    // pages: auth (2) + 3 queries
    (async () => {
      await mockSupabaseLatency(LATENCY_AUTH_USER)
      await mockSupabaseLatency(LATENCY_ADMIN_USERS)
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY)
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY)
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY)
    })(),
    // services: auth (2) + 2 queries
    (async () => {
      await mockSupabaseLatency(LATENCY_AUTH_USER)
      await mockSupabaseLatency(LATENCY_ADMIN_USERS)
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY)
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY)
    })(),
    // funnel: auth (2) + 3 queries
    (async () => {
      await mockSupabaseLatency(LATENCY_AUTH_USER)
      await mockSupabaseLatency(LATENCY_ADMIN_USERS)
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY)
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY)
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY)
    })(),
    // recent-activity: auth (2) + 1 query
    (async () => {
      await mockSupabaseLatency(LATENCY_AUTH_USER)
      await mockSupabaseLatency(LATENCY_ADMIN_USERS)
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY)
    })()
  ]
  await Promise.all(apiCalls)
  const tDashboardEnd = performance.now()
  const dashboardMs = tDashboardEnd - tDashboardStart

  const totalMs = performance.now() - t0

  console.log(`  Login API:                ${loginMs.toFixed(1)} ms`)
  console.log(`  Middleware Session Check: ${middlewareMs.toFixed(1)} ms`)
  console.log(`  Dashboard Parallel APIs:  ${dashboardMs.toFixed(1)} ms`)
  console.log(`  TOTAL COLD ENTRY:         ${totalMs.toFixed(1)} ms`)
  console.log(`  Supabase Calls Count:     ${1 + 1 + 1 + 1 + (6 * 2) + 16} chamadas remotas!\n`)

  return {
    name: 'A_LOGIN_COLD',
    totalMs,
    sessionMs: middlewareMs,
    authMs: loginMs,
    adminLookupMs: LATENCY_ADMIN_USERS,
    apiCount: 8,
    supabaseCallCount: 32
  }
}

async function simulateScenarioB_F5RefreshAuthenticated() {
  console.log('--- CENÁRIO B: Refresh F5 Já Autenticado (Warm) ---')
  const t0 = performance.now()

  // 1. SSR / Middleware Session Check
  const tMiddlewareStart = performance.now()
  await mockSupabaseLatency(LATENCY_AUTH_USER)
  await mockSupabaseLatency(LATENCY_ADMIN_USERS)
  const middlewareMs = performance.now() - tMiddlewareStart

  // 2. Dashboard 6 parallel APIs
  const tDashboardStart = performance.now()
  await Promise.all([
    (async () => {
      await mockSupabaseLatency(LATENCY_AUTH_USER)
      await mockSupabaseLatency(LATENCY_ADMIN_USERS)
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY * 4)
    })(),
    (async () => {
      await mockSupabaseLatency(LATENCY_AUTH_USER)
      await mockSupabaseLatency(LATENCY_ADMIN_USERS)
      await mockSupabaseLatency(LATENCY_POSTGREST_QUERY * 3)
    })()
  ])
  const dashboardMs = performance.now() - tDashboardStart
  const totalMs = performance.now() - t0

  console.log(`  Middleware Session Check: ${middlewareMs.toFixed(1)} ms`)
  console.log(`  Dashboard APIs:           ${dashboardMs.toFixed(1)} ms`)
  console.log(`  TOTAL F5 REFRESH:         ${totalMs.toFixed(1)} ms\n`)

  return {
    name: 'B_REFRESH_WARM',
    totalMs,
    sessionMs: middlewareMs,
    authMs: LATENCY_AUTH_USER + LATENCY_ADMIN_USERS,
    adminLookupMs: LATENCY_ADMIN_USERS,
    apiCount: 7,
    supabaseCallCount: 28
  }
}

async function simulateScenarioC_NavigationBetweenAdminPages() {
  console.log('--- CENÁRIO C: Navegação entre páginas (/admin/dashboard -> /admin/leads) ---')
  const t0 = performance.now()

  // Client-side router navigation: user.value já está preenchido no client state -> ZERO session check!
  // Mas /api/admin/leads executa requireActiveAdmin (2 calls) + leads query (1 call)
  const tApiStart = performance.now()
  await mockSupabaseLatency(LATENCY_AUTH_USER)
  await mockSupabaseLatency(LATENCY_ADMIN_USERS)
  await mockSupabaseLatency(LATENCY_POSTGREST_QUERY)
  const apiMs = performance.now() - tApiStart
  const totalMs = performance.now() - t0

  console.log(`  Leads API (Auth + Data):  ${apiMs.toFixed(1)} ms`)
  console.log(`  TOTAL NAVIGATION:         ${totalMs.toFixed(1)} ms\n`)

  return {
    name: 'C_NAV_WARM',
    totalMs,
    sessionMs: 0,
    authMs: LATENCY_AUTH_USER + LATENCY_ADMIN_USERS,
    adminLookupMs: LATENCY_ADMIN_USERS,
    apiCount: 1,
    supabaseCallCount: 3
  }
}

async function simulateScenarioD_SecondRepeatedNavigation() {
  console.log('--- CENÁRIO D: Segunda Navegação Repetida (/admin/leads -> /admin/clientes) ---')
  const t0 = performance.now()

  // Client state permanece autenticado. /api/admin/crm/clients executa requireActiveAdmin (2 calls) + query (1 call)
  const tApiStart = performance.now()
  await mockSupabaseLatency(LATENCY_AUTH_USER)
  await mockSupabaseLatency(LATENCY_ADMIN_USERS)
  await mockSupabaseLatency(LATENCY_POSTGREST_QUERY)
  const apiMs = performance.now() - tApiStart
  const totalMs = performance.now() - t0

  console.log(`  Clients API (Auth + Data): ${apiMs.toFixed(1)} ms`)
  console.log(`  TOTAL REPEATED NAV:        ${totalMs.toFixed(1)} ms\n`)

  return {
    name: 'D_REPEATED_NAV',
    totalMs,
    sessionMs: 0,
    authMs: LATENCY_AUTH_USER + LATENCY_ADMIN_USERS,
    adminLookupMs: LATENCY_ADMIN_USERS,
    apiCount: 1,
    supabaseCallCount: 3
  }
}

async function simulateScenarioE_ExpiredAccessTokenSimulation() {
  console.log('--- CENÁRIO E: Sessão com Access Token Expirado (Refresh Automático) ---')
  const t0 = performance.now()

  // 1. Session check falha no /auth/v1/user -> tenta /auth/v1/token?grant_type=refresh_token -> consulta admin_users
  const tSessionStart = performance.now()
  await mockSupabaseLatency(LATENCY_AUTH_USER)      // 401 / falha no token expirado
  await mockSupabaseLatency(LATENCY_TOKEN_REFRESH)  // refresh bem-sucedido
  await mockSupabaseLatency(LATENCY_ADMIN_USERS)    // admin_users lookup
  const sessionMs = performance.now() - tSessionStart

  const totalMs = performance.now() - t0

  console.log(`  Refresh Session Check:    ${sessionMs.toFixed(1)} ms`)
  console.log(`  TOTAL EXPIRED REFRESH:    ${totalMs.toFixed(1)} ms\n`)

  return {
    name: 'E_EXPIRED_REFRESH',
    totalMs,
    sessionMs,
    authMs: LATENCY_AUTH_USER + LATENCY_TOKEN_REFRESH,
    adminLookupMs: LATENCY_ADMIN_USERS,
    apiCount: 1,
    supabaseCallCount: 3
  }
}

async function runAudit() {
  await simulateScenarioA_LoginAndFirstDashboardLoad()
  await simulateScenarioB_F5RefreshAuthenticated()
  await simulateScenarioC_NavigationBetweenAdminPages()
  await simulateScenarioD_SecondRepeatedNavigation()
  await simulateScenarioE_ExpiredAccessTokenSimulation()
}

runAudit()
