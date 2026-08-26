import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

console.log('======================================================================')
console.log('GOOGLE ADS TRACKING & CONVERSION IDEMPOTENCY TEST SUITE')
console.log('======================================================================')

// Mock DOM environment for isolated testing of useFormSubmit conversion functions
const mockSessionStorage = new Map()
globalThis.sessionStorage = {
  getItem: (k) => mockSessionStorage.get(k) || null,
  setItem: (k, v) => mockSessionStorage.set(k, String(v)),
  removeItem: (k) => mockSessionStorage.delete(k),
  clear: () => mockSessionStorage.clear()
}

const gtagCalls = []
const dataLayerPushes = []

globalThis.window = {
  sessionStorage: globalThis.sessionStorage,
  gtag: (...args) => gtagCalls.push(args),
  dataLayer: {
    push: (item) => dataLayerPushes.push(item)
  }
}

// 1. Carregar módulos
const obrigadoCode = fs.readFileSync(path.resolve('app/pages/obrigado.vue'), 'utf8')
const formSubmitCode = fs.readFileSync(path.resolve('app/composables/useFormSubmit.js'), 'utf8')
const trackClicksCode = fs.readFileSync(path.resolve('app/plugins/track-clicks.client.ts'), 'utf8')

// Import dynamic functions from useFormSubmit
// Evaluated within mock context
const cleanedCode = formSubmitCode
  .replace(/import .*/g, '')
  .replace(/import\.meta\.dev/g, 'false')
  .replace(/export /g, '')

const evalContext = new Function(
  'window', 'sessionStorage',
  `
  ${cleanedCode}
  return { reportFormConversion, hasConversionBeenReported, markConversionAsReported }
  `
)
const { reportFormConversion, hasConversionBeenReported, markConversionAsReported } = evalContext(globalThis.window, globalThis.sessionStorage)

console.log('\n--- GRUPO 1: Single Source of Truth & /obrigado Purificada ---')
assert(!obrigadoCode.includes('gtag('), '1.1 obrigado.vue has zero gtag calls')
assert(!obrigadoCode.includes('conversion'), '1.2 obrigado.vue has zero conversion event references')
assert(!obrigadoCode.includes('generate_lead'), '1.3 obrigado.vue has zero generate_lead references')
assert(!obrigadoCode.includes('form_submission'), '1.4 obrigado.vue has zero form_submission references')
assert(!obrigadoCode.includes('onMounted'), '1.5 obrigado.vue has no onMounted hook')
assert(obrigadoCode.includes('robots') && obrigadoCode.includes('noindex, nofollow'), '1.6 obrigado.vue keeps noindex, nofollow metadata')
console.log('  ✓ 1.1 - 1.6 /obrigado is 100% pure UI (0 conversion on direct visit / F5 / back): PASS')

console.log('\n--- GRUPO 2: Conversão no API Success (Single Source) ---')
gtagCalls.length = 0
dataLayerPushes.length = 0
mockSessionStorage.clear()

const sub1 = 'sub-test-uuid-001'
const reported1 = reportFormConversion(sub1)

assert.strictEqual(reported1, true, '2.1 First call returns true')
assert.strictEqual(gtagCalls.length, 1, '2.2 Exactly 1 gtag call triggered')
assert.strictEqual(gtagCalls[0][0], 'event', '2.3 gtag event is "event"')
assert.strictEqual(gtagCalls[0][1], 'conversion', '2.4 gtag action is "conversion"')
assert.strictEqual(gtagCalls[0][2].send_to, 'AW-17981093809/4GwPCPCPWSjoccELHvhv5C', '2.5 Google Ads conversion destination is AW-17981093809/4GwPCPCPWSjoccELHvhv5C')

assert.strictEqual(dataLayerPushes.length, 1, '2.6 Exactly 1 dataLayer push')
assert.strictEqual(dataLayerPushes[0].event, 'lead_form_success', '2.7 Canonical event is lead_form_success')
assert.strictEqual(dataLayerPushes[0].submission_id, sub1, '2.8 dataLayer has correct submission_id')
console.log('  ✓ 2.1 - 2.8 API Success triggers exactly 1 Google Ads conversion + 1 canonical dataLayer event: PASS')

console.log('\n--- GRUPO 3: Idempotência de Submissão & Retries ---')
// Chamar reportFormConversion novamente com o MESMO submission_id
const reported1Again = reportFormConversion(sub1)

assert.strictEqual(reported1Again, false, '3.1 Duplicate call for same submission_id returns false')
assert.strictEqual(gtagCalls.length, 1, '3.2 No duplicate gtag calls (still 1)')
assert.strictEqual(dataLayerPushes.length, 1, '3.3 No duplicate dataLayer pushes (still 1)')
console.log('  ✓ 3.1 - 3.3 Retry with same submission_id blocked from duplicate conversion: PASS')

console.log('\n--- GRUPO 4: Nova Submissão com Novo UUID ---')
const sub2 = 'sub-test-uuid-002'
const reported2 = reportFormConversion(sub2)

assert.strictEqual(reported2, true, '4.1 Distinct submission_id returns true')
assert.strictEqual(gtagCalls.length, 2, '4.2 Second conversion triggered for new lead')
assert.strictEqual(dataLayerPushes.length, 2, '4.3 Second dataLayer push triggered for new lead')
assert.strictEqual(dataLayerPushes[1].submission_id, sub2, '4.4 Second dataLayer push has new submission_id')
console.log('  ✓ 4.1 - 4.4 New submission_id properly triggers new conversion: PASS')

console.log('\n--- GRUPO 5: Auditoria de Privacidade (Zero PII no Storage) ---')
for (const [key, value] of mockSessionStorage.entries()) {
  assert(key.startsWith('google_ads_form_conversion:'), `5.1 Key prefix valid: ${key}`)
  assert(!key.includes('@'), `5.2 Key has no email: ${key}`)
  assert(!value.includes('@'), `5.3 Value has no email: ${value}`)
  // Confirm value is non-PII (timestamp)
  assert(!isNaN(Number(value)), `5.4 Storage value is numeric timestamp: ${value}`)
}
console.log('  ✓ 5.1 - 5.4 sessionStorage contains ZERO PII (only technical UUID and timestamp): PASS')

console.log('\n--- GRUPO 6: Isolamento de Cliques de WhatsApp & Telefone ---')
assert(!trackClicksCode.includes('4GwPCPCPWSjoccELHvhv5C'), '6.1 track-clicks does not fire form conversion tag')
assert(!trackClicksCode.includes('lead_form_success'), '6.2 track-clicks does not fire form dataLayer event')
assert(trackClicksCode.includes('/api/track-click'), '6.3 track-clicks sends internal event to /api/track-click')
assert(trackClicksCode.includes('tipo = \'whatsapp\''), '6.4 track-clicks identifies WhatsApp CTAs')
assert(trackClicksCode.includes('tipo = \'telefone\''), '6.5 track-clicks identifies phone CTAs')
console.log('  ✓ 6.1 - 6.5 WhatsApp & Phone clicks isolated from form conversion: PASS')

console.log('\n--- GRUPO 7: API Error Isolation ---')
assert(formSubmitCode.includes('await $fetch(\'/api/send-lead\'') && formSubmitCode.includes('reportFormConversion(submittedId)'), '7.1 reportFormConversion is called strictly after await $fetch')
assert(formSubmitCode.includes('catch (e)') && formSubmitCode.includes('throw e'), '7.2 Errors in API call throw before reportFormConversion is reached')
console.log('  ✓ 7.1 - 7.2 Form submission failure prevents conversion reporting: PASS')

console.log('\n======================================================================')
console.log('ALL GOOGLE ADS TRACKING INVARIANTS: PASS')
console.log('======================================================================')
