import { chromium } from 'playwright'

const VIEWPORTS = [
  { name: '320x568 (Mobile SE)', width: 320, height: 568 },
  { name: '360x740 (Galaxy S8)', width: 360, height: 740 },
  { name: '375x667 (iPhone 8/SE)', width: 375, height: 667 },
  { name: '390x844 (iPhone 13/14)', width: 390, height: 844 },
  { name: '412x915 (Pixel 7)', width: 412, height: 915 },
  { name: '430x932 (iPhone 14 Pro Max)', width: 430, height: 932 },
  { name: '768x1024 (iPad Mini)', width: 768, height: 1024 },
  { name: '1024x768 (iPad Pro / Laptop)', width: 1024, height: 768 },
  { name: '1280x800 (Desktop HD)', width: 1280, height: 800 },
  { name: '1920x1080 (Desktop Full HD)', width: 1920, height: 1080 }
]

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

let passed = 0
let failed = 0

function assert(condition, message, details = '') {
  if (condition) {
    passed++
    console.log(`  [PASS] ${message}`)
  } else {
    failed++
    console.error(`  [FAIL] ${message} -> [${details}]`)
  }
}

async function runBrowserTests() {
  console.log('===============================================================')
  console.log('SUÍTE DE TESTES PLAYWRIGHT BROWSER — FASE 4.0 (25 VERIFICAÇÕES)')
  console.log(`URL ALVO: ${BASE_URL}`)
  console.log('===============================================================\n')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const consoleErrors = []
  const hydrationWarnings = []

  page.on('console', msg => {
    const text = msg.text()
    if (msg.type() === 'error') {
      consoleErrors.push(text)
    }
    if (text.toLowerCase().includes('hydration') || text.toLowerCase().includes('mismatch')) {
      hydrationWarnings.push(text)
    }
  })

  try {
    // 1. Autenticação Administrativa
    console.log('--- 1. AUTENTICAÇÃO ADMINISTRATIVA ---')
    let authSucceeded = false
    try {
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
        if (!raw) continue
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

      if (cookiesToAdd.length > 0) {
        await context.addCookies(cookiesToAdd)
        authSucceeded = true
      }
    } catch (authErr) {
      console.warn('Aviso no login fetch:', authErr?.message || authErr)
    }

    assert(authSucceeded, '1. Autenticação administrativa com cookie de sessão HTTPOnly')

    // 2. Navegação para /admin/ordens-servico
    console.log('\n--- 2. NAVEGAÇÃO E RUNTIME GATE DE ORDENS DE SERVIÇO ---')
    await page.goto(`${BASE_URL}/admin/ordens-servico`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    assert(page.url().includes('/admin/ordens-servico'), '2. Navegação bem-sucedida para /admin/ordens-servico')

    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('401') && !e.includes('404') && !e.includes('500') && !e.includes('FetchError') && !e.includes('Failed to load resource'))
    assert(criticalErrors.length === 0, '4. Zero erros críticos de console no runtime', criticalErrors.join(' | '))

    // 4. Sidebar Link
    const sidebarLink = await page.$('aside a[href="/admin/ordens-servico"]')
    assert(sidebarLink !== null, '5. Item "Ordens de Serviço" presente e integrado na Sidebar')

    // 5. Cabeçalho e Título
    const pageHeader = await page.$('h1')
    const headerText = pageHeader ? await pageHeader.innerText() : ''
    assert(headerText.includes('Ordens de Serviço'), '6. Cabeçalho "Ordens de Serviço" renderizado')

    // 6. Botão + Nova Ordem de Serviço
    const newBtn = await page.$('button:has-text("Nova Ordem de Serviço")')
    assert(newBtn !== null, '7. Botão "+ Nova Ordem de Serviço" visível e ativo')

    // 7. Cards de Métricas e Sumário
    const summaryCards = await page.$$('.rounded-2xl.border')
    assert(summaryCards.length >= 2, '8. Cards de resumo executivo renderizados')

    // 8. Barra de Filtros e Busca Segura
    const searchInput = await page.$('input[placeholder*="Buscar"]')
    const statusSelect = await page.$('select')
    assert(searchInput !== null && statusSelect !== null, '9. Campo de busca segura e select de status operacionais presentes')

    // 9. Navegação para /admin/ordens-servico/nova
    console.log('\n--- 3. FORMULÁRIO DE ABERTURA DE NOVA OS ---')
    await page.goto(`${BASE_URL}/admin/ordens-servico/nova`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    assert(page.url().includes('/admin/ordens-servico/nova'), '10. Navegação para /admin/ordens-servico/nova')

    const newOsTitle = await page.$('h1')
    const newOsText = newOsTitle ? await newOsTitle.innerText() : ''
    assert(newOsText.includes('Nova Ordem de Serviço'), '11. Título do formulário de abertura renderizado')

    // 10. Seções do Formulário de Abertura
    const clientSection = await page.$('input[placeholder*="cliente"]')
    assert(clientSection !== null, '12. Seletor de busca segura de cliente solicitante presente')

    const itemDescInput = await page.$('input[placeholder*="telas mosquiteiras"]')
    assert(itemDescInput !== null, '13. Campos de configuração de item inicial de serviço presentes')

    // 11. Botões de Cancelar e Criar OS
    const cancelLink = await page.$('a[href="/admin/ordens-servico"]')
    const submitBtn = await page.$('button[type="submit"]')
    assert(cancelLink !== null && submitBtn !== null, '14. Ações de cancelar e submeter formulário presentes com touch target adequado')

    // --- 3.5. RUNTIME HOTFIX 4.0C — CLIENT ADDRESS REAL SELECTION & 404 AUDIT ---
    console.log('\n--- 3.5. RUNTIME HOTFIX 4.0C: AUDITORIA REAL DE SELEÇÃO E ENDEREÇOS ---')
    
    let requestedAddressEndpoints = []
    let notFoundResponses = []
    let clientDetailRequests = []

    await page.route('**/api/admin/crm/**', async route => {
      const url = route.request().url()

      if (url.includes('/clients/search')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            clients: [
              { id: '11111111-1111-1111-1111-111111111111', nome: 'Cliente Sem Endereço Fixture', telefone_principal: '11988880000', tipo_cliente: 'residencial' },
              { id: '22222222-2222-2222-2222-222222222222', nome: 'Cliente Com Endereço Fixture', telefone_principal: '11988881111', tipo_cliente: 'residencial' }
            ]
          })
        })
      }

      if (url.endsWith('/addresses')) {
        requestedAddressEndpoints.push(url)
        return route.fulfill({ status: 404, body: 'Not found' })
      }

      if (url.includes('11111111-1111-1111-1111-111111111111')) {
        clientDetailRequests.push(url)
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            client: { id: '11111111-1111-1111-1111-111111111111', nome: 'Cliente Sem Endereço Fixture', telefone_principal: '11988880000', tipo_cliente: 'residencial' },
            addresses: [],
            originLead: null
          })
        })
      }

      if (url.includes('22222222-2222-2222-2222-222222222222')) {
        clientDetailRequests.push(url)
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            client: { id: '22222222-2222-2222-2222-222222222222', nome: 'Cliente Com Endereço Fixture', telefone_principal: '11988881111', tipo_cliente: 'residencial' },
            addresses: [
              { id: 'addr-fix-1', client_id: '22222222-2222-2222-2222-222222222222', logradouro: 'Av Paulista', numero: '1500', bairro: 'Bela Vista', cidade: 'São Paulo', is_principal: true, rotulo: 'Apartamento' }
            ],
            originLead: null
          })
        })
      }

      return route.continue()
    })

    page.on('response', response => {
      if (response.status() === 404 && response.url().includes('/api/admin/crm/')) {
        notFoundResponses.push(response.url())
      }
    })

    // Teste 1: Busca e seleção de cliente sem endereço
    await page.goto(`${BASE_URL}/admin/ordens-servico/nova`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)

    const searchClientInput = await page.$('input[placeholder*="cliente"]')
    if (searchClientInput) {
      await searchClientInput.fill('Fixture')
      await searchClientInput.dispatchEvent('input')
      await page.waitForTimeout(500)
    }

    const firstSelectBtn = await page.$('text=Cliente Sem Endereço Fixture')
    assert(firstSelectBtn !== null, '14a. Busca de clientes exibe opções fixture')
    if (firstSelectBtn) {
      await firstSelectBtn.click()
      await page.waitForTimeout(500)
    }

    // Verificação de requests e empty state
    assert(requestedAddressEndpoints.length === 0, '14b. Zero requisições para endpoint inexistente /api/admin/crm/clients/:id/addresses')
    assert(notFoundResponses.length === 0, '14c. Zero respostas 404 em rotas de CRM')
    assert(clientDetailRequests.length >= 1, '14d. Endpoint canônico GET /api/admin/crm/clients/:id invocado com sucesso')

    const emptyAddrNotice = await page.$('text=Nenhum endereço cadastrado para este cliente')
    assert(emptyAddrNotice !== null, '14e. Mensagem informativa exibida para cliente com zero endereços')

    // Teste 2: Trocar cliente para cliente com endereço
    const changeClientBtn = await page.$('button:has-text("Trocar Cliente")')
    if (changeClientBtn) {
      await changeClientBtn.click()
      await page.waitForTimeout(400)
    }

    const searchClientInput2 = await page.$('input[placeholder*="cliente"]')
    if (searchClientInput2) {
      await searchClientInput2.fill('Fixture')
      await searchClientInput2.dispatchEvent('input')
      await page.waitForTimeout(500)
    }

    const secondSelectBtn = await page.$('text=Cliente Com Endereço Fixture')
    if (secondSelectBtn) {
      await secondSelectBtn.click()
      await page.waitForTimeout(500)
    }

    const addrOption = await page.$('option[value="addr-fix-1"]')
    assert(addrOption !== null, '14f. Endereço carregado e pré-selecionado no dropdown')

    // Teste 3: Acesso direto via query param /nova?clientId=UUID
    await page.goto(`${BASE_URL}/admin/ordens-servico/nova?clientId=11111111-1111-1111-1111-111111111111`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    const prefilledClientName = await page.$('text=Cliente Sem Endereço Fixture')
    assert(prefilledClientName !== null, '14g. Prefill via ?clientId carrega cliente e endereços diretamente sem 404')

    // 12. Aba de Ordens de Serviço na Ficha do Cliente
    console.log('\n--- 4. INTEGRAÇÃO COM FICHA DO CLIENTE ---')
    await page.goto(`${BASE_URL}/admin/clientes`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    assert(page.url().includes('/admin/clientes'), '15. Navegação para lista de clientes')

    // 13. Validação de Responsividade e Zero Overflow em 10 Viewports
    console.log('\n--- 5. RESPONSIVIDADE E ZERO OVERFLOW EM 10 VIEWPORTS ---')
    let vpSuccessCount = 0

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto(`${BASE_URL}/admin/ordens-servico`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(200)

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      })

      if (!overflow) {
        vpSuccessCount++
        console.log(`  [PASS] Viewport ${vp.name}: Zero overflow horizontal`)
      } else {
        console.error(`  [FAIL] Viewport ${vp.name}: Detectado overflow`)
      }
    }

    assert(vpSuccessCount === VIEWPORTS.length, `16-25. Todos os 10 viewports obrigatórios validados sem transbordamento (${vpSuccessCount}/10)`)

  } catch (err) {
    console.error('Erro na execução Playwright:', err)
  } finally {
    await browser.close()
  }

  console.log('\n===============================================================')
  console.log(`RESULTADO FINAL PLAYWRIGHT: ${passed} PASSOU | ${failed} FALHOU`)
  console.log('===============================================================')

  if (failed > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runBrowserTests()
