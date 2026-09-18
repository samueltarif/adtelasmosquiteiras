import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('app/composables/useFormSubmit.js', 'utf8')
  .replace(/^import .*$/gm, '').replace(/import\.meta\.dev/g, 'false').replace('export function', 'function')
const requests = [], conversions = [], redirects = []
let reply, failure, release
const identity = { getOrCreateVisitorId: () => 'visitor', getOrCreateSessionId: () => ({ sessionId: 'session' }), getSessionLandingPath: () => '/servicos/telas', getFirstTouchContext: () => ({}), generateUUID: () => crypto.randomUUID() }
const make = new Function('ref', 'useAnalyticsIdentity', 'useAttribution', '$fetch', 'reportFormConversion', 'navigateTo', `${source}; return useFormSubmit`)
const useSubmit = make(v => ({ value: v }), () => identity, () => ({ getOrInitAttribution: () => ({ gclid: 'test-attribution' }) }), async (url, options) => { requests.push(options.body); if (release) await new Promise(resolve => { release = resolve }); if (failure) throw Error('simulated failure'); return reply }, id => conversions.push(id), path => redirects.push(path))
const form = useSubmit()
const fields = { nome: 'Teste local', telefone: '11999999999', cidade: '', mensagem: 'CEP: 01001-000', servico: 'Telas Mosquiteiras — Janelas' }
for (const response of [{ success: false }, { success: true, leadSaved: false }, { success: true, leadSaved: true }]) {
  reply = response
  await assert.rejects(form.redirectToThankYou(fields, null, { redirect: false }))
  assert.equal(form.isSubmitting.value, false)
}
failure = true
await assert.rejects(form.redirectToThankYou(fields, null, { redirect: false }))
assert.equal(conversions.length, 0)
assert.equal(redirects.length, 0)
failure = false
reply = { success: true, leadSaved: true, leadId: 'test-lead' }
release = true
const pending = form.redirectToThankYou(fields, null, { redirect: false })
await form.redirectToThankYou(fields, null, { redirect: false })
assert.equal(requests.length, 5, 'double click sends only one request')
release()
await pending
release = null
assert.equal(new Set(requests.map(r => r.submission_id)).size, 1, 'retries preserve submission ID')
assert.equal(conversions.length, 1)
assert.equal(redirects.length, 0, 'inline success stays on landing page')
assert.equal(requests[4].mensagem, fields.mensagem)
assert.equal(requests[4].gclid, 'test-attribution')
await form.redirectToThankYou(fields)
assert.deepEqual(redirects, ['/obrigado'], 'existing forms retain redirect')
assert.notEqual(requests[5].submission_id, requests[4].submission_id)
console.log('PASS: confirmed save, failures, retries, double click, attribution, CEP, inline success and existing redirects.')
