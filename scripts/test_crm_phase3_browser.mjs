/**
 * ======================================================================
 * RUNTIME BROWSER GATE & HYDRATION TEST SUITE — FASE 3.1
 * ======================================================================
 * Executa testes reais no navegador Chromium headless via Playwright:
 * - Paridade DOM SSR <-> Client
 * - Zero warnings de Hydration
 * - Navegação real via cliques no Desktop e Mobile Drawer
 * - Direct refresh (F5) em rotas administrativas
 * - Histórico back / forward
 * - Checagem de Zero Horizontal Overflow nos 10 viewports obrigatórios
 * - Verificação de CSP / Zero requisições a api.iconify.design
 */

import { chromium } from 'playwright'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001'

const REQUIRED_VIEWPORTS = [
  { width: 320, height: 568, name: '320px (Mobile SE)' },
  { width: 360, height: 740, name: '360px (Galaxy S8)' },
  { width: 375, height: 667, name: '375px (iPhone 8/SE)' },
  { width: 390, height: 844, name: '390px (iPhone 13/14)' },
  { width: 412, height: 915, name: '412px (Pixel 7)' },
  { width: 430, height: 932, name: '430px (iPhone 14 Pro Max)' },
  { width: 768, height: 1024, name: '768px (iPad Mini)' },
  { width: 1024, height: 768, name: '1024px (iPad Pro / Laptop)' },
  { width: 1280, height: 800, name: '1280px (Desktop HD)' },
  { width: 1920, height: 1080, name: '1920px (Desktop Full HD)' }
]

async function runBrowserTests() {
  console.log('====================================================')
  console.log('INICIANDO SUÍTE DE TESTES RUNTIME BROWSER (FASE 3.1)')
  console.log(`URL ALVO: ${BASE_URL}`)
  console.log('====================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`)
      passed++
    } else {
      console.error(`[FAIL] ${testName} -> Detalhes: [${details}]`)
      failed++
    }
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const consoleErrors = []
  const hydrationWarnings = []
  const networkRequests = []

  page.on('console', (msg) => {
    const text = msg.text()
    if (msg.type() === 'error') {
      consoleErrors.push(text)
    }
    if (text.includes('Hydration') || text.includes('hydration') || text.includes('mismatch')) {
      hydrationWarnings.push(text)
    }
  })

  page.on('request', (req) => {
    networkRequests.push(req.url())
  })

  try {
    // ----------------------------------------------------
    // TESTE 1: Login Administrativo
    // ----------------------------------------------------
    console.log('\n--- 1. AUTENTICAÇÃO E LOGIN ---')
    const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL
      },
      body: JSON.stringify({ email: 'admin@adt.local', password: 'dev-admin-pass-2026' })
    })

    const rawSetCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie')].filter(Boolean)
    const cookiesToAdd = []
    for (const raw of rawSetCookies) {
      const parts = raw.split(';')[0].split('=')
      const name = parts[0].trim()
      const value = parts.slice(1).join('=').trim()
      cookiesToAdd.push({
        name,
        value,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      })
    }

    await context.addCookies(cookiesToAdd)

    // Navega para /admin e verifica redirecionamento para /admin/dashboard
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' })
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 })
    
    const currentUrl = page.url()
    assert(currentUrl.includes('/admin/dashboard'), '1.1. Login administrativo autenticado e redirecionado para /admin/dashboard', currentUrl)

    // ----------------------------------------------------
    // TESTE 2: Console Gate & Zero Hydration Warnings
    // ----------------------------------------------------
    console.log('\n--- 2. CONSOLE GATE & HYDRATION ---')
    assert(hydrationWarnings.length === 0, '2.1. Zero hydration warnings no dashboard inicial', hydrationWarnings.join(' | '))

    // ----------------------------------------------------
    // TESTE 3: SSR / Client DOM Parity Check
    // ----------------------------------------------------
    console.log('\n--- 3. PARIDADE SSR <-> CLIENT ---')
    const cookies = await context.cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

    const rawDashboardHtml = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: cookieHeader }
    }).then(r => r.text())

    const hasPublicFooterInSsr = rawDashboardHtml.includes('data-cta-location="footer"') || rawDashboardHtml.includes('Direitos Reservados')
    assert(!hasPublicFooterInSsr, '3.1. SSR de /admin/dashboard NÃO renderiza footer público', 'Footer público encontrado no HTML do SSR')

    const hasAdminLayoutInSsr = rawDashboardHtml.includes('Painel Admin') || rawDashboardHtml.includes('Dashboard Analytics')
    assert(hasAdminLayoutInSsr, '3.2. SSR de /admin/dashboard renderiza estrutura administrativa', 'Estrutura admin ausente no HTML do SSR')

    // ----------------------------------------------------
    // TESTE 4: Desktop Sidebar Click Navigation
    // ----------------------------------------------------
    console.log('\n--- 4. NAVEGAÇÃO REAL DESKTOP (CLIQUES) ---')
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle' })

    // 4.1 Clicar em Clientes
    const clientsLink = page.locator('aside a[href="/admin/clientes"]').first()
    await clientsLink.click()
    await page.waitForURL('**/admin/clientes', { timeout: 5000 })
    assert(page.url().includes('/admin/clientes'), '4.1. Clique em "Clientes" navega para /admin/clientes', page.url())

    const clientsHeading = await page.locator('main h1').first().textContent()
    assert(clientsHeading.includes('Clientes'), '4.2. Página /admin/clientes renderiza título da Carteira de Clientes', clientsHeading)

    // 4.3 Clicar em Dashboard
    const dashboardLink = page.locator('aside a[href="/admin/dashboard"]').first()
    await dashboardLink.click()
    await page.waitForURL('**/admin/dashboard', { timeout: 5000 })
    assert(page.url().includes('/admin/dashboard'), '4.3. Clique em "Dashboard" retorna para /admin/dashboard', page.url())

    // 4.4 Clicar em Perfil da Empresa
    const companyLink = page.locator('aside a[href="/admin/configuracoes/empresa"]').first()
    await companyLink.click()
    await page.waitForURL('**/admin/configuracoes/empresa', { timeout: 5000 })
    assert(page.url().includes('/admin/configuracoes/empresa'), '4.4. Clique em "Perfil da Empresa" navega para /admin/configuracoes/empresa', page.url())

    // 4.5 Back e Forward do Navegador
    await page.goBack()
    await page.waitForURL('**/admin/dashboard', { timeout: 5000 })
    assert(page.url().includes('/admin/dashboard'), '4.5. Browser Back retorna ao Dashboard', page.url())

    await page.goForward()
    await page.waitForURL('**/admin/configuracoes/empresa', { timeout: 5000 })
    assert(page.url().includes('/admin/configuracoes/empresa'), '4.6. Browser Forward avança ao Perfil da Empresa', page.url())

    // ----------------------------------------------------
    // TESTE 5: Direct Refresh (F5)
    // ----------------------------------------------------
    console.log('\n--- 5. DIRECT REFRESH (F5) ---')

    hydrationWarnings.length = 0
    await page.goto(`${BASE_URL}/admin/clientes`, { waitUntil: 'networkidle' })
    await page.reload({ waitUntil: 'networkidle' })
    assert(hydrationWarnings.length === 0, '5.1. Direct reload em /admin/clientes sem erros de hydration', hydrationWarnings.join(' | '))

    hydrationWarnings.length = 0
    await page.goto(`${BASE_URL}/admin/configuracoes/empresa`, { waitUntil: 'networkidle' })
    await page.reload({ waitUntil: 'networkidle' })
    assert(hydrationWarnings.length === 0, '5.2. Direct reload em /admin/configuracoes/empresa sem erros de hydration', hydrationWarnings.join(' | '))

    // ----------------------------------------------------
    // TESTE 6: Mobile Drawer Navigation
    // ----------------------------------------------------
    console.log('\n--- 6. NAVEGAÇÃO MOBILE DRAWER ---')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle' })

    // Abrir Drawer
    const menuBtn = page.locator('button[aria-label="Abrir menu"]')
    await menuBtn.click()
    await page.waitForTimeout(300)

    // Clicar em Clientes no Drawer Mobile
    const mobileClientsLink = page.locator('aside.md\\:hidden a[href="/admin/clientes"]')
    await mobileClientsLink.click()
    await page.waitForURL('**/admin/clientes', { timeout: 5000 })
    assert(page.url().includes('/admin/clientes'), '6.1. Mobile Drawer navega com sucesso para /admin/clientes', page.url())

    // Abrir Drawer novamente
    await menuBtn.click()
    await page.waitForTimeout(300)

    // Clicar em Perfil da Empresa no Drawer Mobile
    const mobileCompanyLink = page.locator('aside.md\\:hidden a[href="/admin/configuracoes/empresa"]')
    await mobileCompanyLink.click()
    await page.waitForURL('**/admin/configuracoes/empresa', { timeout: 5000 })
    assert(page.url().includes('/admin/configuracoes/empresa'), '6.2. Mobile Drawer navega com sucesso para /admin/configuracoes/empresa', page.url())

    // ----------------------------------------------------
    // TESTE 7: Verificação de Viewports & Zero Horizontal Overflow
    // ----------------------------------------------------
    console.log('\n--- 7. AUDITORIA DE 10 VIEWPORTS & ZERO OVERFLOW ---')
    const pagesToAudit = ['/admin/dashboard', '/admin/clientes', '/admin/clientes/novo', '/admin/configuracoes/empresa']

    for (const vp of REQUIRED_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      let vpOverflowCount = 0

      for (const routePath of pagesToAudit) {
        await page.goto(`${BASE_URL}${routePath}`, { waitUntil: 'networkidle' })
        const overflowData = await page.evaluate(() => {
          const docEl = document.documentElement
          const isOverflowing = docEl.scrollWidth > window.innerWidth
          let offendingElement = null
          if (isOverflowing) {
            const allElements = document.querySelectorAll('*')
            for (const el of allElements) {
              const rect = el.getBoundingClientRect()
              if (rect.right > window.innerWidth) {
                offendingElement = `${el.tagName.toLowerCase()}.${Array.from(el.classList).join('.')} (right: ${rect.right}px, winWidth: ${window.innerWidth}px)`
                break
              }
            }
          }
          return { isOverflowing, offendingElement, scrollWidth: docEl.scrollWidth, winWidth: window.innerWidth }
        })

        if (overflowData.isOverflowing) {
          console.log(`   [OVERFLOW DETECTADO] Rota: ${routePath} em ${vp.name}:`, overflowData)
          vpOverflowCount++
        }
      }

      assert(vpOverflowCount === 0, `7. Viewport ${vp.name} (${vp.width}x${vp.height}) sem overflow horizontal`, `Overflow em ${vpOverflowCount} páginas`)
    }

    // ----------------------------------------------------
    // TESTE 8: Iconify CSP / Network Audit
    // ----------------------------------------------------
    console.log('\n--- 8. AUDITORIA DE CSP E ICONIFY ---')
    const externalIconifyRequests = networkRequests.filter(url => url.includes('api.iconify.design'))
    assert(externalIconifyRequests.length === 0, '8.1. Zero requisições externas para api.iconify.design (servidas localmente)', externalIconifyRequests.join(' | '))

  } catch (err) {
    console.error('\n[EXCEÇÃO NÃO TRATADA]:', err)
    failed++
  } finally {
    await browser.close()
  }

  console.log('\n====================================================')
  console.log(`RESULTADO RUNTIME BROWSER: ${passed} PASSOU | ${failed} FALHOU (Total: ${passed + failed})`)
  console.log('====================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runBrowserTests()
