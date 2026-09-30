import assert from 'node:assert/strict'
import { whatsappProspects } from '../server/shared/whatsappProspects.mjs'
const base = { tipo: 'whatsapp', created_at: '2026-09-30T12:00:00Z', session_id: 'session', utm_campaign: 'Telas' }
const items = whatsappProspects([
  { ...base, id: '1', event_id: 'event' },
  { ...base, id: '2', event_id: 'event' },
  { ...base, id: '3' },
  { ...base, id: '4', utm_campaign: 'Redes' },
  { ...base, id: '5', is_bot: true },
  { ...base, id: '6', tipo: 'telefone' },
  { ...base, id: '7', session_id: null },
  { ...base, id: '8', session_id: null }
])
assert.equal(items.length, 4)
assert.equal(items[0].clicks, 2)
assert.equal(items[0].campaign, 'Telas')
assert.equal(items[0].has_click_id, false)
assert.equal(whatsappProspects([{ ...base, id: '9', gclid: 'private-id' }])[0].has_click_id, true)
assert.equal(JSON.stringify(items).includes('private-id'), false)
console.log('WhatsApp: deduplicação, bots, campanhas e sessões sem identidade aprovados.')
