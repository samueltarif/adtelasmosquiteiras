import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

// Run only against a local preview. All analytics and lead writes are mocked.
const base = process.env.LP_TEST_URL || 'http://127.0.0.1:3107'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local preview required')
const path = '/lp/telas-mosquiteiras'
const destinations = ['janelas', 'portas', 'sacadas-e-varandas', 'removivel', 'pet-screen', 'restaurantes']
const browser = await chromium.launch({ headless: true, channel: process.env.LP_BROWSER || 'msedge' })
await mkdir('scratch/lp-validation', { recursive: true })
try {
  const context = await browser.newContext()
  const requests = []
  const errors = []
  const consoleErrors = []
  let submitAttempts = 0
  await context.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.origin !== base) return route.fulfill({ status: 200, body: '', contentType: 'application/javascript' })
    // Existing service galleries depend on external storage unavailable offline.
    if (/^\/api\/services\/[^/]+\/media$/.test(url.pathname)) {
      return route.fulfill({ json: { success: true, count: 0, media: [] } })
    }
    if (url.pathname.startsWith('/api/track-')) {
      requests.push({ path: url.pathname, body: route.request().postDataJSON() })
      return route.fulfill({ json: { success: true } })
    }
    if (url.pathname === '/api/send-lead') {
      submitAttempts++
      requests.push({ path: url.pathname, body: route.request().postDataJSON() })
      return route.fulfill(submitAttempts === 1
        ? { status: 503, json: { success: false } }
        : { json: { success: true, leadSaved: true, leadId: 'local-test-only' } })
    }
    return route.continue()
  })
  const page = await context.newPage()
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
    if (message.type() === 'warning' && /hydration/i.test(message.text())) errors.push(message.text())
  })
  const gaEvents = name => page.evaluate(name => (window.dataLayer || []).filter(e => e[0] === 'event' && e[1] === name).map(e => e[2]), name)
  const successEvents = () => page.evaluate(() => (window.dataLayer || []).filter(e => e.event === 'lead_form_success'))
  const campaign = '?utm_source=google&utm_medium=cpc&utm_campaign=teste&utm_content=anuncio&utm_term=tela&gclid=local-test&gbraid=local-braid&wbraid=local-wbraid&campaign_id=123&adgroup_id=456'
  const response = await page.goto(base + path + campaign, { waitUntil: 'networkidle' })
  assert.equal(response.status(), 200)
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, follow')
  assert.equal(await page.locator('link[rel="canonical"]').count(), 1)
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://www.adtelasmosquiteiras.com.br' + path)
  assert.equal(await page.locator('h1').count(), 1)
  assert.equal(await page.locator('[data-cta-location="service_card"]').count(), 6)
  assert.equal(await page.locator('header nav').count(), 0)
  assert.equal((await gaEvents('landing_view')).length, 1)
  assert.equal(requests.filter(r => r.path === '/api/track-visit' && r.body.path === path).length, 1)
  assert.ok(!(await (await fetch(base + '/sitemap.xml')).text()).includes(path))
  for (const destination of destinations) {
    const href = `/servicos/telas/${destination}`
    assert.equal(await page.locator(`[data-cta-location="service_card"][href="${href}"]`).count(), 1)
    assert.equal((await fetch(base + href, { redirect: 'manual' })).status, 200, href)
  }
  console.log('PASS: canonical, noindex, six real direct links, single view, excluded from sitemap')

  for (const width of [360, 390, 412, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 800 })
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.waitForTimeout(100)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`)
    const headline = await page.locator('h1').boundingBox()
    const choose = await page.getByRole('link', { name: 'Escolher minha tela' }).boundingBox()
    assert.ok(headline.y + headline.height < 800 && choose.y + choose.height < 800, `First fold ${width}`)
    for (const card of await page.locator('.lp-service').all()) {
      const bounds = await card.boundingBox()
      assert.ok(bounds.height >= 90 && bounds.height <= 130, `Card height ${width}: ${bounds.height}`)
    }
    const padding = await page.locator('.lp-shell').evaluate(el => parseFloat(getComputedStyle(el).paddingBottom))
    if (width < 640) assert.ok(padding >= (await page.locator('.lp-sticky').boundingBox()).height)
    if ([390, 1440].includes(width)) await page.screenshot({ path: `scratch/lp-validation/top-${width}.png` })
  }
  console.log('PASS: six widths, compact cards, first-fold service and CTA, reserved sticky space')

  await page.setViewportSize({ width: 390, height: 800 })
  await page.screenshot({ path: 'scratch/lp-validation/full-390.png', fullPage: true })
  await page.locator('a[href="/servicos/telas/janelas"]').click()
  await page.waitForURL('**/servicos/telas/janelas')
  await page.waitForTimeout(150)
  assert.equal((await gaEvents('service_card_click')).length, 1)
  const cardEvent = (await gaEvents('service_card_click'))[0]
  assert.equal(cardEvent.service, 'janelas')
  assert.equal(cardEvent.source, 'landing_page')
  assert.equal(cardEvent.destination_url, '/servicos/telas/janelas')
  assert.equal(cardEvent.campaign_id, '123')
  await page.evaluate(() => document.addEventListener('click', e => {
    if (e.target.closest('a')?.href.match(/wa.me|whatsapp.com/)) e.preventDefault()
  }))
  const previous = requests.filter(r => r.path === '/api/track-click').length
  await page.locator('a[href*="whatsapp.com"]').first().click()
  await page.waitForTimeout(150)
  const clicks = requests.filter(r => r.path === '/api/track-click')
  assert.equal(clicks.length, previous + 1)
  assert.equal(clicks.at(-1).body.channel, 'google_ads')
  assert.equal(clicks.at(-1).body.landing_path, path)
  assert.equal(clicks.at(-1).body.gclid, 'local-test')
  assert.equal(clicks.at(-1).body.gbraid, 'local-braid')
  assert.equal(clicks.at(-1).body.wbraid, 'local-wbraid')
  const cookie = (await context.cookies()).find(c => c.name === 'adt_session_attribution')
  const attr = JSON.parse(decodeURIComponent(cookie.value))
  assert.equal(attr.campaign_id, '123')
  assert.equal(attr.adgroup_id, '456')
  console.log('PASS: Ads → landing → service → WhatsApp retains attribution without decorating links')

  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.addEventListener('click', e => {
    if (e.target.closest('a')?.href.match(/wa.me|whatsapp.com|tel:/)) e.preventDefault()
  }))
  for (const location of ['lp_hero', 'lp_bottom']) {
    const before = requests.filter(r => r.path === '/api/track-click').length
    await page.locator(`[data-cta-location="${location}"] a[href*="wa.me"]`).click()
    await page.waitForTimeout(100)
    const after = requests.filter(r => r.path === '/api/track-click')
    assert.equal(after.length, before + 1)
    assert.equal(after.at(-1).body.cta_location, location)
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.locator('header a').click()
  await page.waitForTimeout(500)
  assert.equal((await gaEvents('quote_cta_click')).length, 1)
  assert.equal(await page.locator('.lp-sticky').isVisible(), false)
  await page.getByRole('button', { name: 'Solicitar orçamento gratuito' }).click()
  assert.equal(submitAttempts, 0, 'Native validation blocks empty form')
  await page.locator('#quote-name').fill('Teste local')
  await page.locator('#quote-phone').fill('11999999999')
  await page.locator('#quote-cep').fill('01001-000')
  await page.locator('#quote-installation').selectOption('Janelas')
  assert.equal(consoleErrors.length, 0, consoleErrors.join('\n'))
  assert.equal(requests.filter(r => r.body.tipo === 'form_start').length, 1)
  await page.getByRole('button', { name: 'Solicitar orçamento gratuito' }).click()
  await page.getByRole('alert').waitFor()
  assert.equal((await successEvents()).length, 0)
  assert.equal((await gaEvents('conversion')).length, 0)
  assert.equal(await page.locator('#quote-name').inputValue(), 'Teste local')
  await page.getByRole('button', { name: 'Solicitar orçamento gratuito' }).click()
  await page.getByRole('heading', { name: 'Pedido recebido!' }).waitFor()
  assert.equal((await successEvents()).length, 1)
  assert.equal((await gaEvents('conversion')).length, 1)
  const submissions = requests.filter(r => r.path === '/api/send-lead')
  assert.equal(submissions.length, 2)
  assert.equal(submissions[0].body.submission_id, submissions[1].body.submission_id)
  assert.equal(submissions[1].body.session_channel, 'google_ads')
  assert.equal(submissions[1].body.conversion_path, path)
  assert.equal(submissions[1].body.gclid, 'local-test')
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
  await page.waitForTimeout(100)
  const privacyLink = await page.locator('footer a').boundingBox()
  const sticky = await page.locator('.lp-sticky').boundingBox()
  if (sticky) assert.ok(privacyLink.y + privacyLink.height <= sticky.y, 'Footer remains above sticky CTA')
  assert.equal(errors.length, 0, errors.join('\n'))
  console.log('PASS: CTA locations, single form_start, failure without conversion, retry with one success/conversion')
  console.log('PASS: no page errors or hydration warnings; zero real leads/analytics sent')
} finally {
  await browser.close()
}
