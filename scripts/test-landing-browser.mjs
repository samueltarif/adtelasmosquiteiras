import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'

const origin = process.env.TEST_ORIGIN || 'http://localhost:3010'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
mkdirSync('artifacts/landing', { recursive: true })
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    const errors = [], submissions = [], clicks = []
    let fail = true
    page.on('pageerror', e => errors.push(e.message))
    await page.route('**/*', async route => {
      const url = new URL(route.request().url())
      if (url.origin !== origin) return route.abort()
      if (url.pathname === '/api/send-lead') {
        submissions.push(route.request().postDataJSON())
        return route.fulfill({ status: fail ? 503 : 200, json: fail ? { message: 'Simulated failure' } : { success: true, leadSaved: true, leadId: 'local-test-lead' } })
      }
      if (url.pathname === '/api/track-click') clicks.push(route.request().postDataJSON())
      if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/_nuxt_icon')) return route.fulfill({ json: { success: true } })
      return route.continue()
    })
    await page.goto(`${origin}/servicos/telas?gclid=local-test-attribution`, { waitUntil: 'networkidle' })
    await page.screenshot({ path: `artifacts/landing/landing-${width}.png`, fullPage: false })
    await page.locator('section[data-cta-location="hero"]').screenshot({ path: `artifacts/landing/formulario-${width}.png` })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'no horizontal overflow')
    assert.equal(await page.locator('#orcamento-telas input, #orcamento-telas select').count(), 4)
    assert.equal(await page.locator('a[title="WhatsApp: Solicitar Orçamento"]').count(), 0, 'floating button cannot cover the form')
    if (width < 768) {
      await page.locator('#quote-installation').scrollIntoViewIfNeeded()
      assert.equal(await page.locator('[data-cta-location="sticky_mobile"]').count(), 0, 'sticky bar stays hidden while form is visible')
    }
    await page.getByRole('button', { name: 'Solicitar orçamento gratuito', exact: true }).click()
    assert.equal(submissions.length, 0, 'empty form cannot submit')
    await page.locator('#quote-name').fill('Teste Local')
    await page.locator('#quote-phone').fill('123')
    await page.locator('#quote-cep').fill('01001-000')
    await page.locator('#quote-installation').selectOption('Janelas')
    await page.getByRole('button', { name: 'Solicitar orçamento gratuito', exact: true }).click()
    assert.equal(submissions.length, 0, 'invalid phone cannot submit')
    await page.locator('#quote-phone').fill('(11) 99999-9999')
    await page.getByRole('button', { name: 'Solicitar orçamento gratuito', exact: true }).click()
    await page.getByRole('alert').filter({ hasText: 'Não foi possível enviar' }).waitFor()
    assert.equal(await page.locator('#quote-name').inputValue(), 'Teste Local', 'failure keeps entered data')
    const conversions = () => page.evaluate(() => (window.dataLayer || []).filter(x => x.event === 'lead_form_success').length)
    assert.equal(await conversions(), 0)
    fail = false
    await page.getByRole('button', { name: 'Solicitar orçamento gratuito', exact: true }).click()
    await page.getByRole('heading', { name: 'Pedido recebido!' }).waitFor()
    assert.equal(new URL(page.url()).pathname, '/servicos/telas')
    assert.equal(await conversions(), 1)
    assert.equal(submissions[0].submission_id, submissions.at(-1).submission_id)
    assert.match(submissions.at(-1).mensagem, /01001-000/)
    assert.equal(submissions.at(-1).gclid, 'local-test-attribution')
    await page.getByRole('link', { name: 'Prefere conversar? WhatsApp' }).click()
    await page.waitForTimeout(200)
    assert.equal(clicks.filter(c => c.tipo === 'whatsapp' && c.cta_location === 'hero').length, 1)
    assert.equal(await conversions(), 1, 'WhatsApp click does not count as submitted form')
    assert.deepEqual(errors, [])
    console.log(`PASS ${width}px: layout, validation, failure/retry, inline success, attribution, conversion and WhatsApp click.`)
    await context.close()
  }
} finally { await browser.close() }
