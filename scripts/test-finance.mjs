import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { moneyToCents, financeDate, financeToday, financeTransition, validateFinanceEntry, validateFinanceSettings, buildFinanceReminder } from '../server/shared/financeCore.mjs'
import { runFinanceReminderBatch } from '../server/shared/financeReminderRunner.mjs'

assert.equal(moneyToCents('1.234,56'), 123456)
assert.equal(moneyToCents('0,01'), 1)
for (const value of ['0', '-1', '1.25', '1,234', 'NaN', 'Infinity', '1e3', '1000000000']) assert.throws(() => moneyToCents(value))
assert.equal(financeDate('2028-02-29'), '2028-02-29')
for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', '24/09/2026']) assert.throws(() => financeDate(date))
assert.equal(financeToday(new Date('2026-09-24T02:30:00Z')), '2026-09-23')
assert.throws(() => financeTransition({ status: 'open' }, { action: 'settle', settled_date: '2026-09-25', payment_method: 'pix' }, '2026-09-24'))
assert.throws(() => financeTransition({ status: 'settled' }, { action: 'settle' }))
assert.equal(financeTransition({ status: 'settled' }, { action: 'reopen' }).status, 'open')
assert.throws(() => validateFinanceEntry({ kind: 'payable', amount_cents: 1.5 }))
assert.throws(() => validateFinanceSettings({ recipient: 'a@b.com\r\nBcc: c@d.com', enabled: true, days_before: 3 }))
assert.throws(() => validateFinanceSettings({ recipient: 'a@b.com,c@d.com', enabled: true, days_before: 3 }))
assert.equal(validateFinanceSettings({ recipient: 'VENDAS.ADTELASEREDES@GMAIL.COM', enabled: true, days_before: 3 }).recipient, 'vendas.adtelaseredes@gmail.com')

const db = new PGlite()
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);`)
  await db.exec(readFileSync('supabase/migrations/20260924120000_finance_accounts_and_reminders.sql', 'utf8'))
  const query = (sql, args = []) => db.query(sql, args)
  const today = (await query("SELECT to_char((now() AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS date")).rows[0].date
  const insert = async (days, status = 'open', kind = 'payable', value = 12345) => {
    const id = crypto.randomUUID()
    await query(`INSERT INTO finance_entries(id,kind,description,counterpart,amount_cents,due_date,status,settled_date,payment_method) VALUES ($1,$2,'Teste financeiro','Fornecedor teste',$3,$4::date+$5::int,$6,CASE WHEN $6='settled' THEN $4::date END,CASE WHEN $6='settled' THEN 'pix' END)`, [id, kind, value, today, days, status])
    return id
  }
  const id = await insert(2)
  assert.equal((await query('SELECT count(*)::int AS n FROM finance_history WHERE entry_id=$1', [id])).rows[0].n, 1)
  const updated = await query('UPDATE finance_entries SET amount_cents=20000 WHERE id=$1 AND version=1 RETURNING version', [id])
  assert.equal(updated.rows[0].version, 2)
  assert.equal((await query('UPDATE finance_entries SET amount_cents=30000 WHERE id=$1 AND version=1 RETURNING id', [id])).rows.length, 0, 'stale update cannot overwrite')
  assert.equal((await query('SELECT count(*)::int AS n FROM finance_history WHERE entry_id=$1', [id])).rows[0].n, 2)
  await assert.rejects(query("UPDATE finance_entries SET status='settled' WHERE id=$1", [id]))
  await assert.rejects(insert(1, 'open', 'payable', 0))
  await insert(0, 'open', 'receivable', 50000)
  await insert(-1)
  await insert(3)
  await insert(4)
  await insert(0, 'settled')
  await insert(0, 'cancelled')
  const overview = (await query("SELECT finance_overview('receivable','open') AS data")).rows[0].data
  assert.equal(overview.total, 1)
  assert.equal(overview.summary.receivable_open, 50000)
  assert.equal((await query("SELECT finance_overview('','overdue') AS data")).rows[0].data.total, 1)
  const history = (await query('SELECT after_data FROM finance_history WHERE entry_id=$1 ORDER BY created_at DESC', [id])).rows
  assert(history.some(h => h.after_data.amount_cents === 20000))
  const claim = async runId => (await query('SELECT claim_finance_reminders($1) AS data', [runId])).rows[0].data
  const finish = async (runId, status, error) => query('UPDATE finance_reminders SET status=$2,error=$3 WHERE run_id=$1', [runId, status, error])
  const sent = []
  const send = async (recipient, message) => { sent.push({ recipient, message }) }
  const run = await runFinanceReminderBatch({ claim, finish, send, runId: crypto.randomUUID() })
  assert.equal(run.sent, 4, 'only eligible open accounts within window or overdue')
  assert.equal(sent.length, 1, 'one digest for the batch')
  assert.equal(sent[0].recipient, 'vendas.adtelaseredes@gmail.com')
  assert.match(sent[0].message.text, /A PAGAR/)
  assert.match(sent[0].message.text, /A RECEBER/)
  assert.match(sent[0].message.text, /VENCE HOJE/)
  assert.equal((await runFinanceReminderBatch({ claim, finish, send, runId: crypto.randomUUID() })).sent, 0)
  await query('UPDATE finance_entries SET due_date=$2::date WHERE id=$1', [id, today])
  assert.equal((await runFinanceReminderBatch({ claim, finish, send, runId: crypto.randomUUID() })).sent, 1, 'rescheduled account gets new due notice')
  await query('UPDATE finance_settings SET enabled=false')
  await insert(0)
  assert.equal((await claim(crypto.randomUUID())).entries.length, 0, 'disabled settings stop reservations')
  await query('UPDATE finance_settings SET enabled=true')
  await assert.rejects(runFinanceReminderBatch({ claim, finish, send: async () => { throw Error('SMTP timeout') }, runId: crypto.randomUUID() }))
  assert.equal((await query("SELECT count(*)::int AS n FROM finance_reminders WHERE status='uncertain'")).rows[0].n, 1)
  assert.equal((await claim(crypto.randomUUID())).entries.length, 0, 'uncertain SMTP is not automatically resent')
  await db.exec('SET ROLE anon')
  await assert.rejects(query('SELECT * FROM finance_entries'))
  await assert.rejects(query('SELECT finance_overview()'))
  await assert.rejects(query('SELECT claim_finance_reminders($1)', [crypto.randomUUID()]))
  await db.exec('RESET ROLE; SET ROLE authenticated')
  await assert.rejects(query('SELECT * FROM finance_entries'))
  await db.exec('RESET ROLE; SET ROLE service_role')
  assert((await query('SELECT finance_overview() AS data')).rows[0].data.total > 0)
  await insert(1)
  assert.equal((await claim(crypto.randomUUID())).entries.length, 1, 'service role can create audited accounts and reserve reminders')
  console.log('PASS: SQL migration, amounts, dates, timezone, audit, optimistic concurrency, statuses, filters, totals, reminder window, deduplication, SMTP uncertainty and database permissions.')
} finally { await db.close() }

const mail = buildFinanceReminder([{ kind: 'payable', due_date: '2026-09-24', amount_cents: 123456, description: '<script>alert(1)</script>', counterpart: 'Teste' }], '2026-09-24')
assert.equal(typeof mail.html, 'undefined', 'user-provided text is not injected into HTML')
