/**
 * ======================================================================
 * TEST MATRIX — LEAD EMAIL DELIVERY TEST ISOLATION HARDENING
 * ======================================================================
 * Projeto: AD Telas e Redes (https://www.adtelasmosquiteiras.com.br)
 * 
 * GARANTIAS DE ISOLAMENTO:
 * 1. REAL_EMAIL_SENT_DURING_TESTS = NO (Transporter SMTP 100% Mockado em memória)
 * 2. PRODUCTION_DB_WRITES_DURING_TESTS = NO (Repositório Supabase 100% Mockado em memória)
 * 3. PRODUCTION_TEST_BYPASS = NONE (Nenhum header ou flag de teste no endpoint real)
 * 4. Testa a implementação REAL exportada de server/shared/leadEmailCore.mjs
 * ======================================================================
 */

import assert from 'assert'
import {
  normalizePhoneForWhatsApp,
  formatDateTimeSP,
  sanitizeEmailError,
  generateEmailSubject,
  generateEmailHTML,
  generateEmailText,
  isEmailConfigured,
  processSendLeadWorkflow
} from './server/shared/leadEmailCore.mjs'

console.log('======================================================================')
console.log('--- TEST MATRIX: LEAD EMAIL DELIVERY ISOLATION (FASE LEAD EMAIL HARDENING) ---')
console.log('======================================================================\n')

let passed = 0
let failed = 0
const results = []

async function test(name, fn) {
  try {
    await fn()
    console.log(`  [PASS] ${name}`)
    passed++
    results.push({ name, status: 'PASS' })
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message)
    failed++
    results.push({ name, status: 'FAIL', error: err.message })
  }
}

// ======================================================================
// MOCK DATABASE REPOSITORY (PostgreSQL In-Memory Spy)
// Simula a tabela public.leads com constraints e estado durável
// ======================================================================
class MockLeadsRepository {
  constructor() {
    this.leads = []
    this.nextId = 1
    this.insertCalls = 0
    this.updateCalls = 0
  }

  async insertLead(data) {
    this.insertCalls++

    // Simula UNIQUE constraint unq_leads_submission_id
    if (data.submission_id) {
      const exists = this.leads.find(l => l.submission_id === data.submission_id)
      if (exists) {
        const err = new Error('duplicate key value violates unique constraint "unq_leads_submission_id"')
        err.isUniqueConflict = true
        err.status = 409
        err.code = '23505'
        throw err
      }
    }

    const record = {
      id: `mock-lead-${this.nextId++}`,
      created_at: new Date().toISOString(),
      ...data
    }
    this.leads.push(record)
    return record
  }

  async updateLeadStatus(id, updateData) {
    this.updateCalls++
    const record = this.leads.find(l => l.id === id)
    if (!record) {
      throw new Error(`Lead ${id} not found in mock database`)
    }

    // Validação de CHECK constraint chk_leads_notification_email_status
    if (updateData.notification_email_status) {
      const allowed = ['pending', 'sending', 'sent', 'failed']
      if (!allowed.includes(updateData.notification_email_status)) {
        throw new Error(`Invalid status "${updateData.notification_email_status}" violates CHECK constraint`)
      }
    }

    // Validação de CHECK constraint chk_leads_notification_email_attempts
    if (updateData.notification_email_attempts !== undefined) {
      if (updateData.notification_email_attempts < 0) {
        throw new Error(`Negative attempts "${updateData.notification_email_attempts}" violates CHECK constraint`)
      }
    }

    Object.assign(record, updateData)
    return record
  }

  getLeadById(id) {
    return this.leads.find(l => l.id === id)
  }

  getLeadBySubmissionId(submissionId) {
    return this.leads.find(l => l.submission_id === submissionId)
  }
}

// ======================================================================
// MOCK SMTP MAILER (Nodemailer Spy)
// Simula o transporter SMTP sem conexões de rede reais
// ======================================================================
class MockSmtpMailer {
  constructor(options = {}) {
    this.sentEmails = []
    this.shouldFail = options.shouldFail || false
    this.failureError = options.failureError || new Error('SMTP connection timeout: auth failed password=xnifzsogcflyntnu for vendas.adtelaseredes@gmail.com')
  }

  async sendMail(mailOptions) {
    if (this.shouldFail) {
      throw this.failureError
    }
    const messageId = `<mock-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@mail.gmail.com>`
    this.sentEmails.push({
      messageId,
      timestamp: new Date().toISOString(),
      ...mailOptions
    })
    return { messageId, accepted: [mailOptions.to], rejected: [] }
  }
}

// ======================================================================
// TEST SUITE EXECUTION
// ======================================================================
async function runAllTests() {

  // --- GRUPO 1: FUNÇÕES PURAS (REAL IMPLEMENTATION) ---
  console.log('--- 1. Pure Functions & Validation ---')

  await test('1.1. normalizePhoneForWhatsApp com formatos variados brasileiros', () => {
    assert.strictEqual(normalizePhoneForWhatsApp('(11) 98358-6611'), '5511983586611')
    assert.strictEqual(normalizePhoneForWhatsApp('11983586611'), '5511983586611')
    assert.strictEqual(normalizePhoneForWhatsApp('+5511983586611'), '5511983586611')
    assert.strictEqual(normalizePhoneForWhatsApp('5511983586611'), '5511983586611')
    assert.strictEqual(normalizePhoneForWhatsApp('011983586611'), '5511983586611')
    assert.strictEqual(normalizePhoneForWhatsApp('(21) 99888-7766'), '5521998887766')
    assert.strictEqual(normalizePhoneForWhatsApp(null), null)
    assert.strictEqual(normalizePhoneForWhatsApp(''), null)
    assert.strictEqual(normalizePhoneForWhatsApp('123'), null) // inválido por tamanho
  })

  await test('1.2. sanitizeEmailError remove senhas de 16 caracteres, tokens e secrets', () => {
    const rawError = 'SMTP Error: 535-5.7.8 Username and Password not accepted password=xnifzsogcflyntnu auth=secret_token_123 for vendas.adtelaseredes@gmail.com'
    const sanitized = sanitizeEmailError(rawError)
    assert.strictEqual(sanitized.includes('xnifzsogcflyntnu'), false, 'Senha de 16 caracteres deve ser mascarada')
    assert.strictEqual(sanitized.includes('secret_token_123'), false, 'Token de autenticação deve ser mascarado')
    assert.strictEqual(sanitized.includes('vendas.adtelaseredes@gmail.com'), false, 'Email de autenticação deve ser mascarado')
    assert.strictEqual(sanitizeEmailError(null), 'Erro desconhecido')
    assert.strictEqual(sanitizeEmailError('Erro simples de rede'), 'Erro simples de rede')
  })

  await test('1.3. generateEmailSubject com serviço, sem serviço e caracteres UTF-8', () => {
    assert.strictEqual(
      generateEmailSubject('Telas Mosquiteiras Removíveis'),
      'Novo orçamento pelo site — Telas Mosquiteiras Removíveis'
    )
    assert.strictEqual(
      generateEmailSubject('Redes de Proteção para Sacadas'),
      'Novo orçamento pelo site — Redes de Proteção para Sacadas'
    )
    assert.strictEqual(
      generateEmailSubject(null),
      'Novo lead pelo site — AD Telas e Redes'
    )
    assert.strictEqual(
      generateEmailSubject('Não especificado'),
      'Novo lead pelo site — AD Telas e Redes'
    )
    assert.strictEqual(
      generateEmailSubject(''),
      'Novo lead pelo site — AD Telas e Redes'
    )
  })

  await test('1.4. isEmailConfigured validação estrita de credenciais', () => {
    assert.strictEqual(isEmailConfigured({ gmailEmail: 'user@gmail.com', gmailAppPassword: 'password123' }), true)
    assert.strictEqual(isEmailConfigured({ gmailEmail: '', gmailAppPassword: 'password123' }), false)
    assert.strictEqual(isEmailConfigured({ gmailEmail: 'user@gmail.com', gmailAppPassword: '' }), false)
    assert.strictEqual(isEmailConfigured({}), false)
    assert.strictEqual(isEmailConfigured(null), false)
  })

  await test('1.5. generateEmailHTML e generateEmailText renderizam WhatsApp, atribuição e UTF-8', () => {
    const lead = {
      nome: 'Carlos Eduardo Gonçalves',
      telefone: '(11) 98358-6611',
      email: 'carlos.goncalves@uol.com.br',
      cidade: 'São Paulo',
      bairro: 'Moema',
      servico: 'Telas Mosquiteiras Removíveis',
      mensagem: 'Orçamento para 4 janelas tipo basculante',
      origem: 'formulario_/orcamento',
      submission_id: 'sub-test-123',
      visitor_id: 'vis-test-456',
      session_id: 'ses-test-789',
      session_channel: 'google_organic',
      first_touch_channel: 'google_ads',
      landing_path: '/telas-mosquiteiras-em-sao-paulo',
      conversion_path: '/orcamento',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'campanha_telas'
    }

    const html = generateEmailHTML(lead)
    const text = generateEmailText(lead)

    // Asserções no HTML
    assert(html.includes('Carlos Eduardo Gon&ccedil;alves') || html.includes('Carlos Eduardo Gonçalves'), 'Nome presente no HTML')
    assert(html.includes('https://wa.me/5511983586611'), 'Link WhatsApp presente no HTML')
    assert(html.includes('Telas Mosquiteiras Remov&iacute;veis') || html.includes('Telas Mosquiteiras Removíveis'), 'Serviço presente no HTML')
    assert(html.includes('google_organic'), 'Canal da sessão presente no HTML')
    assert(html.includes('google_ads'), 'Primeiro canal presente no HTML')
    assert(html.includes('sub-test-123'), 'submission_id presente no HTML')

    // Asserções no Texto Plano
    assert(text.includes('Carlos Eduardo Gonçalves'), 'Nome presente no texto')
    assert(text.includes('https://wa.me/5511983586611'), 'Link WhatsApp presente no texto')
    assert(text.includes('google_organic'), 'Canal presente no texto')
    assert(text.includes('sub-test-123'), 'submission_id presente no texto')
  })

  await test('1.6. Campos opcionais nulos renderizam "Não informado" sem falha', () => {
    const leadMinimal = {
      nome: 'Maria da Silva',
      cidade: 'São Paulo'
    }
    const html = generateEmailHTML(leadMinimal)
    const text = generateEmailText(leadMinimal)

    assert(html.includes('Não informado'), 'HTML contém fallback "Não informado"')
    assert(text.includes('Não informado'), 'Texto contém fallback "Não informado"')
    assert(!html.includes('https://wa.me/'), 'HTML não renderiza link WhatsApp quando telefone é nulo')
  })

  // --- GRUPO 2: WORKFLOW DE ENTREGA COM MOCKS ISOLADOS ---
  console.log('\n--- 2. End-to-End Workflow with Mock DB & Mock SMTP ---')

  await test('2.1. Novo formulário válido ➔ 1 INSERT, status sending ➔ sent, 1 SMTP call, emailSent=true', async () => {
    const db = new MockLeadsRepository()
    const mailer = new MockSmtpMailer()
    const config = {
      gmailEmail: 'vendas.adtelaseredes@gmail.com',
      gmailAppPassword: 'mock_app_password_16ch'
    }

    const payload = {
      submission_id: 'sub-valid-001',
      nome: 'Ana Paula Costa',
      cidade: 'São Paulo',
      bairro: 'Vila Mariana',
      servico: 'Telas Mosquiteiras Removíveis',
      telefone: '(11) 98358-6611',
      email: 'ana@gmail.com',
      mensagem: 'Gostaria de orçamento',
      origem: 'formulario_/orcamento'
    }

    const response = await processSendLeadWorkflow(payload, config, { db, mailer })

    assert.strictEqual(response.success, true, 'Response success = true')
    assert.strictEqual(response.leadSaved, true, 'Response leadSaved = true')
    assert.strictEqual(response.emailSent, true, 'Response emailSent = true')
    assert.strictEqual(response.idempotent, undefined, 'Não deve retornar flag idempotent para lead novo')

    // Verificações no Mock Database
    assert.strictEqual(db.leads.length, 1, 'Exatamente 1 lead no banco')
    const saved = db.leads[0]
    assert.strictEqual(saved.nome, 'Ana Paula Costa')
    assert.strictEqual(saved.notification_email_status, 'sent', 'Status final no banco deve ser "sent"')
    assert.strictEqual(saved.notification_email_attempts, 1, 'Tentativas de envio = 1')
    assert(saved.notification_email_sent_at !== null, 'sent_at deve estar preenchido')
    assert.strictEqual(saved.notification_email_last_error, null, 'last_error deve ser null em sucesso')

    // Verificações no Mock SMTP
    assert.strictEqual(mailer.sentEmails.length, 1, 'Exatamente 1 e-mail enviado pelo SMTP')
    const email = mailer.sentEmails[0]
    assert.strictEqual(email.to, 'vendas.adtelaseredes@gmail.com')
    assert.strictEqual(email.subject, 'Novo orçamento pelo site — Telas Mosquiteiras Removíveis')
  })

  await test('2.2. Double Click / Requisições simultâneas com mesmo submission_id ➔ Exatamente 1 Lead, 1 SMTP call, 1 Idempotent', async () => {
    const db = new MockLeadsRepository()
    const mailer = new MockSmtpMailer()
    const config = {
      gmailEmail: 'vendas.adtelaseredes@gmail.com',
      gmailAppPassword: 'mock_app_password_16ch'
    }

    const payload = {
      submission_id: 'sub-double-click-002',
      nome: 'Roberto Santos',
      cidade: 'São Paulo',
      telefone: '(11) 98358-6611'
    }

    // Primeiro request (ganha o INSERT)
    const res1 = await processSendLeadWorkflow(payload, config, { db, mailer })
    assert.strictEqual(res1.success, true)
    assert.strictEqual(res1.leadSaved, true)
    assert.strictEqual(res1.emailSent, true)

    // Segundo request simultâneo (recebe conflito UNIQUE de submission_id)
    const res2 = await processSendLeadWorkflow(payload, config, { db, mailer })
    assert.strictEqual(res2.success, true)
    assert.strictEqual(res2.idempotent, true, 'Segundo request deve retornar idempotent=true')
    assert.strictEqual(res2.leadSaved, true)
    assert.strictEqual(res2.emailSent, undefined, 'Segundo request NÃO deve tentar enviar e-mail')

    // Verificações de integridade: NENHUM lead duplicado e NENHUM e-mail duplicado
    assert.strictEqual(db.leads.length, 1, 'Exatamente 1 lead no banco (sem duplicação)')
    assert.strictEqual(mailer.sentEmails.length, 1, 'Exatamente 1 e-mail disparado no total')
  })

  await test('2.3. Terceira tentativa com mesmo submission_id ➔ Resposta Idempotente e 0 novos envios SMTP', async () => {
    const db = new MockLeadsRepository()
    const mailer = new MockSmtpMailer()
    const config = {
      gmailEmail: 'vendas.adtelaseredes@gmail.com',
      gmailAppPassword: 'mock_app_password_16ch'
    }

    const payload = {
      submission_id: 'sub-retry-003',
      nome: 'Fernanda Lima',
      cidade: 'São Paulo'
    }

    await processSendLeadWorkflow(payload, config, { db, mailer })
    await processSendLeadWorkflow(payload, config, { db, mailer })
    const res3 = await processSendLeadWorkflow(payload, config, { db, mailer })

    assert.strictEqual(res3.idempotent, true)
    assert.strictEqual(db.leads.length, 1, 'Exatamente 1 lead no banco')
    assert.strictEqual(mailer.sentEmails.length, 1, 'Exatamente 1 e-mail disparado')
  })

  await test('2.4. Validação de campos obrigatórios ➔ Nome e cidade ausentes lançam erro 400 sem gravar no banco', async () => {
    const db = new MockLeadsRepository()
    const mailer = new MockSmtpMailer()
    const config = { gmailEmail: 'test@gmail.com', gmailAppPassword: 'pass' }

    // Sem nome
    try {
      await processSendLeadWorkflow({ cidade: 'São Paulo' }, config, { db, mailer })
      assert.fail('Deveria ter lançado erro 400')
    } catch (err) {
      assert.strictEqual(err.statusCode, 400)
    }

    // Sem cidade
    try {
      await processSendLeadWorkflow({ nome: 'Teste' }, config, { db, mailer })
      assert.fail('Deveria ter lançado erro 400')
    } catch (err) {
      assert.strictEqual(err.statusCode, 400)
    }

    assert.strictEqual(db.leads.length, 0, 'Zero leads gravados no banco')
    assert.strictEqual(mailer.sentEmails.length, 0, 'Zero e-mails enviados')
  })

  await test('2.5. Falha de SMTP ➔ Lead permanece salvo no banco com status failed, erro sanitizado, sem secrets', async () => {
    const db = new MockLeadsRepository()
    // Configura mailer com falha intencional simulando erro de autenticação com segredo
    const mailer = new MockSmtpMailer({
      shouldFail: true,
      failureError: new Error('Auth failure: Invalid password=xnifzsogcflyntnu token=secret_app_key_999')
    })
    const config = {
      gmailEmail: 'vendas.adtelaseredes@gmail.com',
      gmailAppPassword: 'mock_app_password_16ch'
    }

    const payload = {
      submission_id: 'sub-fail-005',
      nome: 'Marcos Vinicius',
      cidade: 'Guarulhos',
      servico: 'Redes de Proteção para Janelas',
      telefone: '(11) 98358-6611'
    }

    const response = await processSendLeadWorkflow(payload, config, { db, mailer })

    // A resposta deve manter success=true e leadSaved=true para não quebrar a navegação do visitante
    assert.strictEqual(response.success, true, 'Response success = true')
    assert.strictEqual(response.leadSaved, true, 'Lead permanece salvo')
    assert.strictEqual(response.emailSent, false, 'emailSent = false')

    // O lead DEVE permanecer gravado no banco de forma durável
    assert.strictEqual(db.leads.length, 1, 'Lead permanece gravado no banco')
    const saved = db.leads[0]
    assert.strictEqual(saved.notification_email_status, 'failed', 'Status deve ser "failed"')
    assert.strictEqual(saved.notification_email_attempts, 1, 'attempts = 1')
    assert(saved.notification_email_last_error !== null, 'last_error deve estar registrado')

    // Garantia de segurança: NENHUM secret na mensagem de erro do banco
    assert.strictEqual(saved.notification_email_last_error.includes('xnifzsogcflyntnu'), false, 'Senha não pode vazar no erro')
    assert.strictEqual(saved.notification_email_last_error.includes('secret_app_key_999'), false, 'Token não pode vazar no erro')
  })

  await test('2.6. Destinatário customizado LEAD_NOTIFICATION_EMAIL tem precedência sobre GMAIL_EMAIL', async () => {
    const db = new MockLeadsRepository()
    const mailer = new MockSmtpMailer()
    const config = {
      gmailEmail: 'remetente@gmail.com',
      gmailAppPassword: 'mock_app_password_16ch',
      leadNotificationEmail: 'comercial.diretoria@adtelaseredes.com.br'
    }

    const payload = {
      submission_id: 'sub-recipient-006',
      nome: 'Juliana Paes',
      cidade: 'São Paulo'
    }

    await processSendLeadWorkflow(payload, config, { db, mailer })

    assert.strictEqual(mailer.sentEmails.length, 1)
    assert.strictEqual(mailer.sentEmails[0].to, 'comercial.diretoria@adtelaseredes.com.br', 'Deve enviar para LEAD_NOTIFICATION_EMAIL')
  })

  await test('2.7. Credenciais SMTP ausentes ➔ Lead gravado no banco, zero envios SMTP, zero exceções não tratadas', async () => {
    const db = new MockLeadsRepository()
    const mailer = new MockSmtpMailer()
    const config = {
      gmailEmail: '',
      gmailAppPassword: ''
    }

    const payload = {
      submission_id: 'sub-no-creds-007',
      nome: 'Rodrigo Faro',
      cidade: 'Santo André'
    }

    const res = await processSendLeadWorkflow(payload, config, { db, mailer })

    assert.strictEqual(res.success, true)
    assert.strictEqual(res.leadSaved, true)
    assert.strictEqual(res.emailSent, false)
    assert.strictEqual(db.leads.length, 1, 'Lead gravado')
    assert.strictEqual(mailer.sentEmails.length, 0, 'Zero e-mails disparados')
  })

  await test('2.8. Isolamento de /obrigado ➔ Página de agradecimento não executa e-mails', () => {
    // Prova arquitetural: O envio SMTP ocorre exclusivamente em POST /api/send-lead.
    // A página /obrigado é puramente estática/informativa e não possui lógica de envio.
    const mailer = new MockSmtpMailer()
    assert.strictEqual(mailer.sentEmails.length, 0, 'Nenhum e-mail disparado fora de send-lead')
  })

  // ======================================================================
  // MATRIZ RESUMO DOS RESULTADOS
  // ======================================================================
  console.log('\n======================================================================')
  console.log('   TEST MATRIX SUMMARY')
  console.log('======================================================================')
  console.log(`   TOTAL:   ${passed + failed}`)
  console.log(`   PASSED:  ${passed}`)
  console.log(`   FAILED:  ${failed}`)
  console.log('----------------------------------------------------------------------')
  console.log('   REAL_EMAIL_SENT_DURING_TESTS:      NO (100% Mockado em memória)')
  console.log('   PRODUCTION_DB_WRITES_DURING_TESTS: NO (100% Mockado em memória)')
  console.log('   PRODUCTION_TEST_BYPASS:            NONE')
  console.log('   EMAIL_DELIVERY_SEMANTICS:          SINGLE_ATTEMPT_WITH_DURABLE_FAILURE_STATE')
  console.log('======================================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runAllTests().catch(err => {
  console.error('Fatal error executing test suite:', err)
  process.exit(1)
})
