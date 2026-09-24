export const FINANCE_KINDS = ['payable', 'receivable']
export const FINANCE_METHODS = ['pix', 'boleto', 'transferencia', 'dinheiro', 'cartao', 'outro']
export const DEFAULT_FINANCE_EMAIL = 'vendas.adtelaseredes@gmail.com'

function invalid(message) { const error = new Error(message); error.statusCode = 400; throw error }
export function financeDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '2000-01-01' || value > '2100-12-31') invalid('Informe uma data válida entre 2000 e 2100.')
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) invalid('Data inválida.')
  return value
}
export function financeToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}
export function moneyToCents(value) {
  if (typeof value !== 'string') invalid('Informe o valor em reais.')
  const clean = value.trim()
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(clean)) invalid('Use um valor como 1.250,50.')
  const [whole, decimals = ''] = clean.replace(/\./g, '').split(',')
  const cents = Number(whole) * 100 + Number(decimals.padEnd(2, '0'))
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 99999999999) invalid('O valor deve ser maior que zero e menor que R$ 1 bilhão.')
  return cents
}
export function formatFinanceMoney(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(cents) / 100)
}
export function financeUuid(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) invalid('Identificador inválido.')
  return value
}
export function financeVersion(value) {
  if (!Number.isSafeInteger(value) || value < 1) invalid('Versão inválida. Atualize a lista.')
  return value
}
function text(value, label, max, required = true) {
  if (typeof value !== 'string') { if (!required && value == null) return ''; invalid(`${label} inválido.`) }
  const clean = value.trim()
  if ((required && clean.length < 2) || clean.length > max) invalid(`${label}: informe entre ${required ? 2 : 0} e ${max} caracteres.`)
  return clean
}
export function validateFinanceEntry(body) {
  if (!body || !FINANCE_KINDS.includes(body.kind)) invalid('Selecione conta a pagar ou a receber.')
  if (!Number.isSafeInteger(body.amount_cents) || body.amount_cents <= 0 || body.amount_cents > 99999999999) invalid('Valor inválido.')
  return { kind: body.kind, description: text(body.description, 'Descrição', 180), counterpart: text(body.counterpart, 'Cliente ou fornecedor', 180), category: text(body.category, 'Categoria', 80, false), amount_cents: body.amount_cents, due_date: financeDate(body.due_date), notes: text(body.notes, 'Observações', 2000, false) }
}
export function validateFinanceSettings(body) {
  const email = typeof body?.recipient === 'string' ? body.recipient.trim().toLowerCase() : ''
  if (email.length > 254 || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)) invalid('Informe um único e-mail válido para receber os avisos.')
  if (typeof body.enabled !== 'boolean' || !Number.isInteger(body.days_before) || body.days_before < 1 || body.days_before > 30) invalid('Antecedência deve ser de 1 a 30 dias.')
  return { recipient: email, enabled: body.enabled, days_before: body.days_before }
}
export function financeTransition(entry, body, today = financeToday()) {
  if (body.action === 'settle' && entry.status === 'open') {
    const date = financeDate(body.settled_date)
    if (date > today) invalid('A data do pagamento ou recebimento não pode estar no futuro.')
    if (!FINANCE_METHODS.includes(body.payment_method)) invalid('Forma de pagamento inválida.')
    return { status: 'settled', settled_date: date, payment_method: body.payment_method }
  }
  if (body.action === 'reopen' && ['settled', 'cancelled'].includes(entry.status)) return { status: 'open', settled_date: null, payment_method: null }
  if (body.action === 'cancel' && entry.status === 'open') return { status: 'cancelled', settled_date: null, payment_method: null }
  invalid('Esta ação não está disponível para o estado atual da conta.')
}
export function buildFinanceReminder(entries, today) {
  const lines = [`Avisos financeiros — AD Telas e Redes`, `Referência: ${today.split('-').reverse().join('/')}`, '']
  for (const entry of entries) {
    const label = entry.kind === 'payable' ? 'A PAGAR' : 'A RECEBER'
    const when = entry.due_date < today ? 'VENCIDA' : entry.due_date === today ? 'VENCE HOJE' : 'PRÓXIMO VENCIMENTO'
    lines.push(`${label} · ${when}`, `${entry.description} — ${entry.counterpart}`, `Valor: ${formatFinanceMoney(entry.amount_cents)} | Vencimento: ${entry.due_date.split('-').reverse().join('/')}`, '')
  }
  lines.push('Confira e atualize os pagamentos e recebimentos no painel administrativo:', 'https://www.adtelasmosquiteiras.com.br/admin/financeiro', '', 'Este aviso reflete as contas em aberto no momento da consulta. Não realiza pagamentos nem envia cobranças aos clientes.')
  return { subject: `AD Telas — ${entries.length} aviso(s) de vencimento`, text: lines.join('\n') }
}
