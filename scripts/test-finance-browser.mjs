import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { financeToday } from '../server/shared/financeCore.mjs'

const origin = process.env.TEST_ORIGIN || 'http://localhost:3012'
mkdirSync('artifacts/finance', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 960 } })
    const page = await context.newPage(), errors = [], mutations = []
    const entries = [{ id: crypto.randomUUID(), kind: 'payable', description: 'Compra de telas e perfis', counterpart: 'Fornecedor de materiais', category: 'Materiais', amount_cents: 125050, due_date: financeToday(), status: 'open', version: 1, notes: '' }, { id: crypto.randomUUID(), kind: 'receivable', description: 'Instalação de telas — apartamento', counterpart: 'Cliente de exemplo', category: 'Serviços', amount_cents: 250000, due_date: financeToday(), status: 'open', version: 1, notes: '' }]
    const settings = { recipient: 'vendas.adtelaseredes@gmail.com', enabled: true, days_before: 3, version: 1, last_run_at: null }
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url())
      if (url.origin !== origin) return route.abort()
      const path = url.pathname
      if (path === '/api/admin/auth/login') return route.fulfill({ json: { success: true, user: { email: 'local@example.test', role: 'admin' } } })
      if (path === '/api/admin/auth/session') return route.fulfill({ json: { authenticated: false, user: null } })
      if (path === '/api/admin/finance/entries') {
        if (request.method() === 'POST') { const body = request.postDataJSON(); mutations.push(body); entries.push({ ...body, status: 'open', version: 1 }); return route.fulfill({ json: { entry: entries.at(-1) } }) }
        const filtered = entries.filter(e => (!url.searchParams.get('kind') || e.kind === url.searchParams.get('kind')) && (!url.searchParams.get('status') || e.status === url.searchParams.get('status')))
        return route.fulfill({ json: { entries: filtered, total: filtered.length, today: financeToday(), summary: { payable_open: 125050, receivable_open: 250000, payable_overdue: 0, receivable_overdue: 0 } } })
      }
      if (path.startsWith('/api/admin/finance/entries/') && request.method() === 'PATCH') {
        const body = request.postDataJSON(); mutations.push(body)
        const entry = entries.find(e => e.id === path.split('/').at(-1))
        if (body.action === 'settle') Object.assign(entry, { status: 'settled', settled_date: body.settled_date, payment_method: body.payment_method, version: entry.version + 1 })
        return route.fulfill({ json: { entry } })
      }
      if (path === '/api/admin/finance/settings') {
        if (request.method() === 'PATCH') { Object.assign(settings, request.postDataJSON()); settings.version++; return route.fulfill({ json: { settings } }) }
        return route.fulfill({ json: { settings, reminders: [], smtpConfigured: true, cronConfigured: true } })
      }
      if (path.startsWith('/api/') && !path.startsWith('/api/_nuxt_icon')) return route.fulfill({ json: {} })
      return route.continue()
    })
    await page.goto(`${origin}/admin/login?redirect=/admin/financeiro`)
    await page.locator('input[type=email]').fill('local@example.test')
    await page.locator('input[type=password]').fill('local-test-only')
    await page.locator('button[type=submit]').click()
    await page.getByRole('heading', { name: 'Financeiro', exact: true }).waitFor()
    await page.getByRole('heading', { name: 'Compra de telas e perfis' }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.screenshot({ path: `artifacts/finance/painel-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: '+ Nova conta', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Descrição', { exact: true }).fill('Aluguel da loja')
    await dialog.getByLabel('Fornecedor / favorecido', { exact: true }).fill('Imobiliária de exemplo')
    await dialog.getByLabel('Valor total (R$)', { exact: true }).fill('1.234,56')
    await dialog.getByLabel('Vencimento', { exact: true }).fill(financeToday())
    await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click()
    await page.getByRole('heading', { name: 'Aluguel da loja', exact: true }).waitFor()
    assert.equal(mutations[0].amount_cents, 123456)
    await page.getByRole('button', { name: 'Contas a receber', exact: true }).click()
    await page.getByRole('button', { name: 'Registrar recebimento', exact: true }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Registrar pagamento', exact: true }).count(), 0)
    await page.getByRole('button', { name: 'Registrar recebimento', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click()
    await page.getByRole('heading', { name: 'Nenhuma conta encontrada', exact: true }).waitFor()
    assert.equal(mutations.at(-1).action, 'settle')
    await page.getByText('Avisos de vencimento por e-mail', { exact: true }).click()
    await page.getByLabel('E-mail que recebe os avisos').waitFor()
    assert.equal(await page.getByLabel('E-mail que recebe os avisos').inputValue(), 'vendas.adtelaseredes@gmail.com')
    await page.getByLabel('Antecedência (dias)').fill('5')
    await page.getByRole('button', { name: 'Salvar avisos', exact: true }).click()
    await page.getByText('Configurações salvas.', { exact: true }).waitFor()
    assert.equal(settings.days_before, 5)
    assert.deepEqual(errors, [])
    console.log(`PASS ${width}px: authenticated navigation, responsive layout, create with BRL, filters, settlement and email settings.`)
    await context.close()
  }
  const response = await fetch(`${origin}/api/admin/finance/entries`)
  assert.equal(response.status, 401, 'real backend rejects unauthenticated requests')
  const cron = await fetch(`${origin}/api/cron/finance-reminders`)
  assert.equal(cron.status, 401, 'cron rejects missing credentials')
  console.log('PASS: live unauthenticated API and scheduler protection.')
} finally { await browser.close() }
