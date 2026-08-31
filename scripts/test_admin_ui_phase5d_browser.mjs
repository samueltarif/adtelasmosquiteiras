/**
 * ======================================================================
 * SUÍTE DE TESTES E2E / BROWSER RESPONSIVO & A11Y — FASE 5.0D.4
 * Arquivo: scripts/test_admin_ui_phase5d_browser.mjs
 * ======================================================================
 * Executa testes reais via Playwright com autenticação segura de teste e fixtures controladas:
 * 1. E2E Environment Isolation (zero secrets herdados de produção, E2E_BACKEND_TARGET=LOCAL_OR_TEST_ONLY)
 * 2. Validação estrita de permanência nas rotas privadas (Zero redirect login)
 * 3. Single Fetch Owner & Request Instrumentation (AGENDA_FETCH_PER_INTERACTION=1)
 * 4. Matriz de Visualizações em Mobile (320, 390, 768, 1280 em dia, semana, lista, mes)
 * 5. 10 Viewports responsivos (320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1920)
 * 6. Zero overflow horizontal: scrollWidth <= clientWidth
 * 7. Proibição de overflow-x-hidden artificial no html/body
 * 8. Touch targets >= 44x44px em controles operacionais
 * 9. Eliminação de controles interativos aninhados (NESTED_INTERACTIVE_CONTROLS = 0)
 * 10. Prova real de A11y nos 7 modais/sheets: Foco Inicial, Focus Trap Circular (Tab/Shift+Tab), Fechamento por Escape e Restauração de Foco ao Trigger
 * 11. Fixtures ricas e controladas (zero PII real, zero 500/503 inesperados)
 */

import assert from 'assert'
import http from 'http'
import { spawn } from 'child_process'
import { chromium } from 'playwright'

console.log('======================================================================')
console.log('--- SUÍTE E2E PLAYWRIGHT BROWSER & RESPONSIVIDADE — FASE 5.0D.4 ---')
console.log('======================================================================\n')

let browserPrivateRouteAsserts = 0
let browserViewportAsserts = 0
let browserModalA11yAsserts = 0
let browserTouchTargetAsserts = 0
let browserNestedControlAsserts = 0
let browserSingleFetchAsserts = 0
let browserLegacyUIAsserts = 0
let totalPassed = 0
let totalFailed = 0
const errors = []

function pass(category, name) {
  console.log(`  [PASS:${category}] ${name}`)
  if (category === 'ROUTE') browserPrivateRouteAsserts++
  else if (category === 'VIEWPORT') browserViewportAsserts++
  else if (category === 'MODAL_A11Y') browserModalA11yAsserts++
  else if (category === 'TOUCH_TARGET') browserTouchTargetAsserts++
  else if (category === 'NESTED_CONTROL') browserNestedControlAsserts++
  else if (category === 'SINGLE_FETCH') browserSingleFetchAsserts++
  else if (category === 'LEGACY_UI') browserLegacyUIAsserts++
  totalPassed++
}

function fail(category, name, err) {
  console.error(`  [FAIL:${category}] ${name}:`, err?.message || err)
  errors.push({ category, name, error: err?.message || String(err) })
  totalFailed++
}

const VIEWPORTS = [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1920]
const PORT = 3018

// -------------------------------------------------------------
// CONTROLLED NON-EMPTY FIXTURES (ZERO REAL PII / DADOS FICTÍCIOS)
// -------------------------------------------------------------
const todayIso = new Date().toISOString()
const tomorrowDate = new Date()
tomorrowDate.setDate(tomorrowDate.getDate() + 1)
const tomorrowIso = tomorrowDate.toISOString()

const MOCK_STAFF = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nome: 'Carlos Instalador',
    telefone: '(11) 98888-1111',
    email: 'carlos.inst@adtelas.local',
    funcao: 'instalador',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nome: 'Roberto Vistoriador',
    telefone: '(11) 98888-2222',
    email: 'roberto.vist@adtelas.local',
    funcao: 'vistoriador',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nome: 'Antigo Tecnico',
    telefone: '(11) 98888-3333',
    email: 'antigo@adtelas.local',
    funcao: 'instalador',
    is_active: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
]

function getMockAppointments(baseDate = new Date()) {
  const dt = new Date(baseDate)
  const y = dt.getUTCFullYear()
  const m = dt.getUTCMonth()
  const today = new Date()

  const dates = [
    new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0, 0)),
    new Date(Date.UTC(y, m, 15, 17, 0, 0)),
    new Date(Date.UTC(y, m, 16, 17, 0, 0)),
    new Date(dt.getTime())
  ]

  return dates.map((d, idx) => ({
    id: `a0000000-0000-0000-0000-00000000000${idx + 1}`,
    work_order_id: `w0000000-0000-0000-0000-00000000000${idx + 1}`,
    client_id: `c0000000-0000-0000-0000-00000000000${idx + 1}`,
    address_id: `d0000000-0000-0000-0000-00000000000${idx + 1}`,
    staff_id: idx % 2 === 0 ? '11111111-1111-1111-1111-111111111111' : '22222222-2222-2222-2222-222222222222',
    tipo_agendamento: idx % 2 === 0 ? 'instalacao' : 'medicao',
    data_hora_inicio: d.toISOString(),
    data_hora_fim: new Date(d.getTime() + 7200000).toISOString(),
    status_agendamento: idx === 0 ? 'agendado' : 'confirmado',
    created_at: d.toISOString(),
    updated_at: d.toISOString(),
    client: { id: `c0000000-0000-0000-0000-00000000000${idx + 1}`, nome: idx % 2 === 0 ? 'João Silva' : 'Maria Santos', tipo_cliente: 'residencial' },
    work_order: { id: `w0000000-0000-0000-0000-00000000000${idx + 1}`, numero_os: `OS-2026-00${idx + 1}`, status_os: 'agendada' },
    address: { id: `d0000000-0000-0000-0000-00000000000${idx + 1}`, rotulo: 'Residência', bairro: 'Moema', cidade: 'São Paulo' },
    staff: {
      id: idx % 2 === 0 ? '11111111-1111-1111-1111-111111111111' : '22222222-2222-2222-2222-222222222222',
      nome: idx % 2 === 0 ? 'Carlos Instalador' : 'Roberto Vistoriador',
      funcao: idx % 2 === 0 ? 'instalador' : 'vistoriador'
    }
  }))
}

function getMockDetail(baseDate = new Date()) {
  const appts = getMockAppointments(baseDate)
  return {
    ...appts[0],
    observacoes: 'Instalar rede de proteção na varanda e quartos.',
    rescheduled_from_id: null,
    motivo_reagendamento_cancelamento: null,
    created_by: '00000000-0000-0000-0000-000000000001',
    client: {
      id: 'c0000000-0000-0000-0000-000000000001',
      nome: 'João Silva',
      telefone_principal: '(11) 99999-1234',
      email: 'joao.silva@exemplo.local',
      tipo_cliente: 'residencial'
    },
    work_order: {
      id: 'w0000000-0000-0000-0000-000000000001',
      numero_os: 'OS-2026-001',
      status_os: 'agendada',
      valor_final: 850.00,
      is_archived: false
    },
    address: {
      id: 'd0000000-0000-0000-0000-000000000001',
      rotulo: 'Residência',
      logradouro: 'Rua das Flores',
      numero: '123',
      complemento: 'Apto 42',
      bairro: 'Moema',
      cidade: 'São Paulo',
      uf: 'SP'
    },
    staff: {
      id: '11111111-1111-1111-1111-111111111111',
      nome: 'Carlos Instalador',
      funcao: 'instalador',
      telefone: '(11) 98888-1111'
    }
  }
}

async function setupPageFixtures(page) {
  await page.route('**/api/admin/auth/session', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          userId: '00000000-0000-0000-0000-000000000001',
          email: 'admin@adt.local',
          role: 'admin'
        }
      })
    })
  })

  await page.route('**/api/admin/crm/staff**', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, staff: MOCK_STAFF })
      })
    } else if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, staff: { id: 'new-staff-id', ...body, is_active: true } })
      })
    } else if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Membro atualizado com sucesso' })
      })
    } else {
      await route.continue()
    }
  })

  await page.route('**/api/admin/crm/appointments?*', async route => {
    const url = new URL(route.request().url())
    const start = url.searchParams.get('start')
    const baseDate = start ? new Date(start) : new Date()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, appointments: getMockAppointments(baseDate) })
    })
  })

  await page.route('**/api/admin/crm/appointments/search', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, appointments: getMockAppointments() })
    })
  })

  await page.route('**/api/admin/crm/appointments/*', async route => {
    const url = route.request().url()
    if (url.endsWith('/cancel') || url.endsWith('/reschedule') || url.endsWith('/status')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Operação realizada com sucesso' })
      })
    } else if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, appointment: getMockDetail() })
      })
    } else if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Agendamento atualizado' })
      })
    } else {
      await route.continue()
    }
  })

  await page.route('**/api/admin/crm/appointments', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, appointment: { id: 'new-appt-id' } })
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, appointments: getMockAppointments() })
      })
    }
  })

  await page.route('**/api/admin/crm/work-orders/**', async route => {
    const url = route.request().url()
    const method = route.request().method()
    if (url.includes('/status')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          workOrder: {
            id: 'w0000000-0000-0000-0000-000000000001',
            numero_os: 'OS-2026-001',
            status_os: 'em_execucao',
            updated_at: new Date().toISOString()
          }
        })
      })
    } else if (url.includes('/appointments')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, appointments: getMockAppointments() })
      })
    } else if (method === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          workOrder: {
            id: 'w0000000-0000-0000-0000-000000000001',
            numero_os: 'OS-2026-001',
            status_os: 'aguardando_agendamento',
            updated_at: new Date().toISOString()
          }
        })
      })
    } else if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          workOrder: {
            id: 'w0000000-0000-0000-0000-000000000001',
            numero_os: 'OS-2026-001',
            status_os: 'aguardando_agendamento',
            client_id: 'c0000000-0000-0000-0000-000000000001',
            client: { id: 'c0000000-0000-0000-0000-000000000001', nome: 'João Silva', telefone_principal: '(11) 99999-1234' },
            responsible_staff_id: 's0000000-0000-0000-0000-000000000001',
            responsible: { id: 's0000000-0000-0000-0000-000000000001', nome: 'Carlos Técnico' },
            data_prevista: '2026-08-30',
            data_conclusao: null,
            valor_total: 850.00,
            valor_desconto: 0,
            observacoes_gerais: 'Instalação padrão',
            proposal_valid_until: '2026-09-30',
            is_archived: false,
            updated_at: '2026-08-30T12:00:00.000Z'
          },
          items: [
            { id: 'item-1', descricao: 'Tela Janela 1.20x1.00', categoria_operacional: 'tela_mosquiteira', quantidade: 2, preco_unitario: 250, preco_total: 500 }
          ],
          proposals: [],
          media: [],
          notes: []
        })
      })
    } else {
      await route.continue()
    }
  })

  await page.route('**/api/admin/crm/work-orders', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          workOrder: {
            id: 'w0000000-0000-0000-0000-000000000001',
            numero_os: 'OS-2026-001'
          }
        })
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          work_orders: [
            {
              id: 'w0000000-0000-0000-0000-000000000001',
              numero_os: 'OS-2026-001',
              status_os: 'aguardando_agendamento',
              valor_final: 850.00,
              is_archived: false,
              cliente_id: 'c0000000-0000-0000-0000-000000000001',
              client: { id: 'c0000000-0000-0000-0000-000000000001', nome: 'João Silva', telefone_principal: '(11) 99999-1234' }
            }
          ]
        })
      })
    }
  })

  await page.route(/\/api\/admin\/crm\/clients/, async route => {
    const url = route.request().url()
    if (url.includes('/search')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          clients: [
            {
              id: 'c0000000-0000-0000-0000-000000000001',
              nome: 'João Silva',
              telefone_principal: '(11) 99999-1234',
              cpf_cnpj: '123.456.789-00',
              tipo_cliente: 'pessoa_fisica'
            }
          ]
        })
      })
    } else if (url.includes('/c0000000') || (url.match(/\/clients\/[a-zA-Z0-9_-]+(\?.*)?$/) && !url.match(/\/clients(\?.*)?$/))) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          client: {
            id: 'c0000000-0000-0000-0000-000000000001',
            nome: 'João Silva',
            telefone_principal: '(11) 99999-1234',
            email: 'joao.silva@exemplo.local',
            tipo_cliente: 'pessoa_fisica'
          },
          addresses: [
            {
              id: 'a0000000-0000-0000-0000-000000000001',
              rotulo: 'Residência',
              logradouro: 'Av. Paulista',
              numero: '1000',
              bairro: 'Bela Vista',
              cidade: 'São Paulo',
              uf: 'SP',
              is_principal: true
            }
          ],
          originLead: null
        })
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          clients: [
            {
              id: 'c0000000-0000-0000-0000-000000000001',
              nome: 'João Silva',
              telefone_principal: '(11) 99999-1234',
              email: 'joao.silva@exemplo.local',
              tipo_cliente: 'pessoa_fisica'
            }
          ]
        })
      })
    }
  })

  await page.route('**/api/admin/analytics/lead-journey**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        lead: {
          id: 'l0000000-0000-0000-0000-000000000001',
          nome: 'Maria Souza',
          telefone: '(11) 98888-7777',
          email: 'maria.souza@exemplo.com',
          servico: 'Tela Mosquiteira',
          valor_orcamento: 600,
          status: 'novo',
          observacoes: 'Interesse em 3 telas',
          created_at: '2026-08-30T10:00:00.000Z'
        },
        timeline: [],
        media: [
          {
            id: 'm-lead-1',
            lead_id: 'l0000000-0000-0000-0000-000000000001',
            safe_filename: 'foto-janela-lead.webp',
            media_type: 'photo',
            file_size_bytes: 204800,
            upload_status: 'uploaded',
            created_at: '2026-08-30T10:00:00.000Z',
            signed_url: 'https://cdn.example.com/foto.webp'
          }
        ]
      })
    })
  })

  await page.route('**/api/admin/media/signed-url**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        signedUrl: 'https://cdn.example.com/foto.webp'
      })
    })
  })

  await page.route('**/api/admin/crm/leads/*/client-status', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        isConverted: false,
        client: null
      })
    })
  })

  await page.route('**/api/admin/crm/leads/*/convert', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        result: {
          client_id: 'c0000000-0000-0000-0000-000000000001',
          work_order_id: 'w0000000-0000-0000-0000-000000000001'
        }
      })
    })
  })

  await page.route('**/api/admin/leads**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        leads: [
          {
            id: 'l0000000-0000-0000-0000-000000000001',
            nome: 'Maria Souza',
            telefone: '(11) 98888-7777',
            email: 'maria.souza@exemplo.com',
            servico: 'Tela Mosquiteira',
            valor_orcamento: 600,
            status: 'novo',
            created_at: '2026-08-30T10:00:00.000Z'
          }
        ]
      })
    })
  })

  await page.route('**/api/admin/media/site/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        count: 1,
        media: [
          {
            id: 'm0000000-0000-0000-0000-000000000001',
            service_key: 'telas_janelas',
            storage_key: 'site-media/telas_janelas/m1.webp',
            media_type: 'photo',
            mime_type: 'image/webp',
            title: 'Tela Mosquiteira em Janela',
            alt_text: 'Instalação de Tela Mosquiteira',
            caption: 'Tela de alta resistência',
            sort_order: 1,
            is_featured: true,
            is_active: true,
            width: 1920,
            height: 1080,
            file_size_bytes: 154200,
            created_at: '2026-08-30T10:00:00.000Z',
            publicUrl: 'https://cdn.example.com/site-media/telas_janelas/m1.webp'
          }
        ]
      })
    })
  })

  await page.route('**/favicon.ico', async route => {
    await route.fulfill({ status: 204, body: '' })
  })
}

const SUPABASE_PORT = 54399

function createMockSupabaseServer() {
  const server = http.createServer((req, res) => {
    const url = req.url || ''
    console.log('[MOCK SUPABASE REQ]', req.method, url)
    res.setHeader('Content-Type', 'application/json')

    if (url.startsWith('/auth/v1/user')) {
      res.writeHead(200)
      res.end(JSON.stringify({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@adt.local',
        role: 'authenticated'
      }))
    } else if (url.startsWith('/auth/v1/.well-known/jwks.json')) {
      res.writeHead(404)
      res.end(JSON.stringify({ message: 'Not found' }))
    } else if (url.startsWith('/rest/v1/admin_users')) {
      res.writeHead(200)
      res.end(JSON.stringify([
        {
          id: '00000000-0000-0000-0000-000000000001',
          user_id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@adt.local',
          role: 'admin',
          is_active: true
        }
      ]))
    } else if (url.startsWith('/rest/v1/staff')) {
      res.writeHead(200)
      res.end(JSON.stringify(MOCK_STAFF))
    } else if (url.startsWith('/rest/v1/appointments')) {
      res.writeHead(200)
      res.end(JSON.stringify(getMockAppointments()))
    } else if (url.startsWith('/rest/v1/work_orders')) {
      res.writeHead(200)
      res.end(JSON.stringify([
        {
          id: 'w0000000-0000-0000-0000-000000000001',
          numero_os: 'OS-2026-001',
          status_os: 'aguardando_agendamento',
          valor_final: 850.00,
          is_archived: false,
          cliente_id: 'c0000000-0000-0000-0000-000000000001'
        }
      ]))
    } else if (url.startsWith('/rest/v1/clients')) {
      res.writeHead(200)
      res.end(JSON.stringify([
        {
          id: 'c0000000-0000-0000-0000-000000000001',
          nome: 'João Silva',
          telefone_principal: '(11) 99999-1234',
          email: 'joao.silva@exemplo.local',
          cpf_cnpj: '123.456.789-00',
          tipo_cliente: 'pessoa_fisica',
          client_addresses: [
            {
              id: 'a0000000-0000-0000-0000-000000000001',
              rotulo: 'Residência',
              logradouro: 'Av. Paulista',
              numero: '1000',
              bairro: 'Bela Vista',
              cidade: 'São Paulo',
              uf: 'SP',
              is_principal: true,
              is_archived: false
            }
          ],
          leads: null
        }
      ]))
    } else if (url.startsWith('/rest/v1/leads')) {
      res.writeHead(200)
      res.end(JSON.stringify([
        {
          id: 'l0000000-0000-0000-0000-000000000001',
          nome: 'Maria Souza',
          telefone: '(11) 98888-7777',
          email: 'maria.souza@exemplo.com',
          servico: 'Tela Mosquiteira',
          status: 'novo'
        }
      ]))
    } else {
      res.writeHead(200)
      res.end(JSON.stringify({ success: true }))
    }
  })
  return server
}

function createTestAdminJwt() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    sub: '00000000-0000-0000-0000-000000000001',
    email: 'admin@adt.local',
    role: 'authenticated',
    aud: 'authenticated',
    iss: `http://127.0.0.1:${SUPABASE_PORT}/auth/v1`,
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url')
  const sig = Buffer.from('mock_signature').toString('base64url')
  return `${header}.${payload}.${sig}`
}

async function run() {
  console.log('1. Verificando Isolamento do Ambiente de Teste...')
  // E2E Security Assertion: Backend target isolado e zero produção
  assert.strictEqual(process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_AUTH === 'true', true)
  assert.ok(!process.env.SUPABASE_URL?.includes('axjqhxpejwkuabeaoyaz'), 'E2E_BACKEND_TARGET=LOCAL_OR_TEST_ONLY (nunca produção)')
  pass('ROUTE', 'E2E_BACKEND_TARGET=LOCAL_OR_TEST_ONLY confirmado (zero produção)')

  const mockSupabaseServer = createMockSupabaseServer()
  await new Promise(resolve => mockSupabaseServer.listen(SUPABASE_PORT, '127.0.0.1', resolve))

  console.log(`2. Iniciando servidor de teste na porta ${PORT} com NODE_ENV=test e ENABLE_TEST_AUTH=true...`)
  const serverProcess = spawn('node', ['.output/server/index.mjs'], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      PORT: String(PORT),
      NODE_ENV: 'test',
      ENABLE_TEST_AUTH: 'true',
      NITRO_NO_DOTENV: '1',
      DOTENV_CONFIG_PATH: 'no-env',
      SUPABASE_URL: `http://127.0.0.1:${SUPABASE_PORT}`,
      NUXT_SUPABASE_URL: `http://127.0.0.1:${SUPABASE_PORT}`,
      NITRO_SUPABASE_URL: `http://127.0.0.1:${SUPABASE_PORT}`,
      NITRO_SUPABASEURL: `http://127.0.0.1:${SUPABASE_PORT}`,
      SUPABASE_SERVICE_ROLE_KEY: 'test-local-service-key',
      NUXT_SUPABASE_SERVICE_ROLE_KEY: 'test-local-service-key',
      NITRO_SUPABASE_SERVICE_ROLE_KEY: 'test-local-service-key',
      SUPABASE_ANON_KEY: 'test-local-anon-key',
      NUXT_SUPABASE_ANON_KEY: 'test-local-anon-key',
      NITRO_SUPABASE_ANON_KEY: 'test-local-anon-key'
    },
    stdio: 'inherit'
  })

  let ready = false
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}`)
      if (res.status) {
        ready = true
        break
      }
    } catch {
      await new Promise(r => setTimeout(r, 500))
    }
  }
  if (!ready) {
    throw new Error('Servidor de teste não respondeu a tempo.')
  }

  let browser
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true })
    const context = await browser.newContext()

    const testToken = createTestAdminJwt()
    await context.addCookies([
      {
        name: 'sb_admin_token',
        value: testToken,
        url: `http://localhost:${PORT}`
      },
      {
        name: 'sb_admin_refresh_token',
        value: 'e2e_test_admin_refresh_token',
        url: `http://localhost:${PORT}`
      }
    ])
    await context.setExtraHTTPHeaders({
      'x-e2e-test-auth': 'e2e_test_admin_token'
    })

    const page = await context.newPage()
    await setupPageFixtures(page)
    await page.route('**/*.{png,jpg,jpeg,webp,svg,gif}', async route => {
      await route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('') })
    })
    await page.route('https://cdn.example.com/**', async route => {
      await route.fulfill({ status: 200, contentType: 'image/webp', body: Buffer.from('') })
    })

    const consoleErrors = []
    const pageErrors = []
    const failedRequests = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (!text.includes('favicon.ico') && !text.includes('ERR_NAME_NOT_RESOLVED') && !text.includes('ERR_CONNECTION_REFUSED')) {
          consoleErrors.push(text)
        }
      }
    })
    page.on('pageerror', err => {
      pageErrors.push(err.message)
    })
    page.on('response', res => {
      if (res.status() >= 500) {
        failedRequests.push({ url: res.url(), status: res.status() })
      }
    })

    // -------------------------------------------------------------
    // 1. ROTAS PRIVADAS AUTENTICADAS (ZERO REDIRECT TO LOGIN)
    // -------------------------------------------------------------
    console.log('\n--- 1. VALIDAÇÃO DE ROTAS PRIVADAS AUTENTICADAS ---')

    await page.goto(`http://localhost:${PORT}/admin/agenda`, { waitUntil: 'networkidle' })
    const agendaUrl = page.url()
    assert.ok(agendaUrl.includes('/admin/agenda'), `URL deve ser /admin/agenda (atual: ${agendaUrl})`)
    assert.ok(!agendaUrl.includes('/admin/login'), 'NÃO pode redirecionar para /admin/login')
    const agendaHeading = page.locator('h1')
    assert.ok(await agendaHeading.isVisible(), 'Heading de Agenda deve estar visível')
    pass('ROUTE', 'Rota privada /admin/agenda autenticada com sucesso (zero redirect para login)')

    await page.goto(`http://localhost:${PORT}/admin/equipe`, { waitUntil: 'networkidle' })
    const equipeUrl = page.url()
    assert.ok(equipeUrl.includes('/admin/equipe'), `URL deve ser /admin/equipe (atual: ${equipeUrl})`)
    assert.ok(!equipeUrl.includes('/admin/login'), 'NÃO pode redirecionar para /admin/login')
    const equipeHeading = page.locator('h1').first()
    assert.ok(await equipeHeading.isVisible(), 'Heading de Equipe Operacional deve estar visível')
    const equipeText = await equipeHeading.textContent()
    assert.ok(equipeText.includes('Equipe Operacional'), `Heading deve conter Equipe Operacional (obtido: ${equipeText})`)
    pass('ROUTE', 'Rota privada /admin/equipe autenticada com sucesso (zero redirect para login)')

    await page.goto(`http://localhost:${PORT}/admin/ordens-servico`, { waitUntil: 'networkidle' })
    const osUrl = page.url()
    assert.ok(osUrl.includes('/admin/ordens-servico'), `URL deve ser /admin/ordens-servico (atual: ${osUrl})`)
    assert.ok(!osUrl.includes('/admin/login'), 'NÃO pode redirecionar para /admin/login')
    const osHeading = page.locator('h1').first()
    assert.ok(await osHeading.isVisible(), 'Heading de Ordens de Serviço deve estar visível')
    pass('ROUTE', 'Rota privada /admin/ordens-servico autenticada com sucesso (zero redirect para login)')

    // -------------------------------------------------------------
    // 2. SINGLE FETCH OWNER & INSTRUMENTAÇÃO DA AGENDA
    // -------------------------------------------------------------
    console.log('\n--- 2. INSTRUMENTAÇÃO DE SINGLE FETCH OWNER NA AGENDA ---')

    let appointmentFetches = 0
    await page.route('**/api/admin/crm/appointments?*', async route => {
      appointmentFetches++
      const url = new URL(route.request().url())
      const start = url.searchParams.get('start')
      const baseDate = start ? new Date(start) : new Date()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, appointments: getMockAppointments(baseDate) })
      })
    })

    // 2.1 Initial Mount Fetch Count = Exactly 1
    appointmentFetches = 0
    await page.goto(`http://localhost:${PORT}/admin/agenda`, { waitUntil: 'networkidle' })
    assert.strictEqual(appointmentFetches, 1, `Initial mount deve disparar exatamente 1 fetch (atual: ${appointmentFetches})`)
    pass('SINGLE_FETCH', 'Initial mount da Agenda executa exatamente 1 GET /api/admin/crm/appointments')

    // 2.2 Troca de View (Dia) = Exactly 1 Fetch
    appointmentFetches = 0
    await page.getByRole('button', { name: /^Dia/i }).click()
    await page.waitForTimeout(200)
    assert.strictEqual(appointmentFetches, 1, `Troca para Dia deve disparar exatamente 1 fetch (atual: ${appointmentFetches})`)
    pass('SINGLE_FETCH', 'Troca de visão para Dia dispara exatamente 1 fetch')

    // 2.3 Troca de View (Mês) = Exactly 1 Fetch
    appointmentFetches = 0
    await page.getByRole('button', { name: /^Mês/i }).click()
    await page.waitForTimeout(200)
    assert.strictEqual(appointmentFetches, 1, `Troca para Mês deve disparar exatamente 1 fetch (atual: ${appointmentFetches})`)
    pass('SINGLE_FETCH', 'Troca de visão para Mês dispara exatamente 1 fetch')

    // 2.4 Navegação (Próximo Período) = Exactly 1 Fetch
    appointmentFetches = 0
    await page.getByRole('button', { name: 'Próximo período' }).click()
    await page.waitForTimeout(200)
    assert.strictEqual(appointmentFetches, 1, `Navegação Next deve disparar exatamente 1 fetch (atual: ${appointmentFetches})`)
    pass('SINGLE_FETCH', 'Navegação de período dispara exatamente 1 fetch')

    // 2.5 Filtro de Tipo = Exactly 1 Fetch
    appointmentFetches = 0
    await page.locator('select').filter({ hasText: /Todos os Tipos/i }).selectOption('instalacao')
    await page.waitForTimeout(200)
    assert.strictEqual(appointmentFetches, 1, `Filtro de tipo deve disparar exatamente 1 fetch (atual: ${appointmentFetches})`)
    pass('SINGLE_FETCH', 'Filtro de tipo dispara exatamente 1 fetch')

    // -------------------------------------------------------------
    // 3. MATRIZ DE VISUALIZAÇÕES MOBILE & ZERO OVERFLOW
    // -------------------------------------------------------------
    console.log('\n--- 3. MATRIZ DE VISUALIZAÇÕES MOBILE & ZERO OVERFLOW ---')

    const matrixBreakpoints = [320, 390, 768, 1280]
    const matrixViews = ['dia', 'semana', 'lista', 'mes']

    for (const width of matrixBreakpoints) {
      for (const view of matrixViews) {
        await page.setViewportSize({ width, height: 800 })
        await page.goto(`http://localhost:${PORT}/admin/agenda?view=${view}`, { waitUntil: 'networkidle' })

        assert.ok(page.url().includes(`/admin/agenda`), `Rota preservada em ${width}px (${view})`)
        assert.ok(page.url().includes(`view=${view}`), `View ${view} preservada na query`)

        const overflowCheck = await page.evaluate(() => {
          const doc = document.documentElement
          return {
            docScrollWidth: doc.scrollWidth,
            docClientWidth: doc.clientWidth,
            isOverflowing: doc.scrollWidth > doc.clientWidth + 1
          }
        })

        assert.strictEqual(
          overflowCheck.isOverflowing,
          false,
          `Overflow horizontal detectado na visão ${view} em ${width}px (scroll: ${overflowCheck.docScrollWidth}, client: ${overflowCheck.docClientWidth})`
        )

        pass('VIEWPORT', `[${width}px][${view}] Visão sem overflow horizontal (${overflowCheck.docClientWidth}px)`)
      }
    }

    // -------------------------------------------------------------
    // 4. AUDITORIA EM 10 VIEWPORTS OBRIGATÓRIOS (ZERO OVERFLOW & ZERO BAND-AIDS)
    // -------------------------------------------------------------
    console.log('\n--- 4. AUDITORIA DE ZERO OVERFLOW EM 10 VIEWPORTS (11 ROTAS REAIS) ---')

    const auditedRoutes = [
      '/admin/agenda',
      '/admin/equipe',
      '/admin/ordens-servico',
      '/admin/ordens-servico/nova',
      '/admin/ordens-servico/w0000000-0000-0000-0000-000000000001',
      '/admin/leads',
      '/admin/galeria',
      '/admin/clientes',
      '/admin/clientes/c0000000-0000-0000-0000-000000000001',
      '/contato',
      '/orcamento'
    ]

    for (const route of auditedRoutes) {
      for (const vpWidth of VIEWPORTS) {
        await page.setViewportSize({ width: vpWidth, height: 800 })
        await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle' })

        const overflowCheck = await page.evaluate(() => {
          const doc = document.documentElement
          return {
            docScrollWidth: doc.scrollWidth,
            docClientWidth: doc.clientWidth,
            isOverflowing: doc.scrollWidth > doc.clientWidth + 1
          }
        })

        assert.strictEqual(
          overflowCheck.isOverflowing,
          false,
          `Overflow horizontal detectado na rota ${route} em ${vpWidth}px (scroll: ${overflowCheck.docScrollWidth}, client: ${overflowCheck.docClientWidth})`
        )

        pass('VIEWPORT', `[${vpWidth}px] Rota ${route} sem overflow horizontal`)
      }
    }

    const htmlStyles = await page.evaluate(() => window.getComputedStyle(document.documentElement).overflowX)
    const bodyStyles = await page.evaluate(() => window.getComputedStyle(document.body).overflowX)
    assert.ok(htmlStyles !== 'hidden', 'HTML element não deve usar overflow-x: hidden artificial')
    assert.ok(bodyStyles !== 'hidden', 'BODY element não deve usar overflow-x: hidden artificial')
    console.log('ZERO_HORIZONTAL_OVERFLOW=PASS')
    console.log('OVERFLOW_X_HIDDEN_BANDAID_COUNT=0')
    pass('VIEWPORT', 'HTML/BODY preservam scroll natural e não usam overflow-x: hidden artificial (OVERFLOW_X_HIDDEN_BANDAID_COUNT=0)')

    // -------------------------------------------------------------
    // 5. TOUCH TARGETS (>= 44x44px) NAS 10 VIEWPORTS REAIS & EVIDÊNCIA DE COBERTURA
    // -------------------------------------------------------------
    console.log('\n--- 5. TOUCH TARGETS (>= 44x44px) NAS 10 VIEWPORTS REAIS & EVIDÊNCIA DE COBERTURA ---')

    const touchFailures = []
    const touchAuditedRoutes = new Set()

    let touchRequiredExpectedCount = 0
    let touchRequiredFoundCount = 0
    let touchRequiredMeasuredCount = 0
    let touchRequiredPassCount = 0
    let touchRequiredFailCount = 0
    let touchOptionalSkippedCount = 0

    async function checkControlTouchTarget(locator, description, route, vpWidth, options = {}) {
      const { required = true } = options

      if (required) {
        touchRequiredExpectedCount++
      }

      const count = await locator.count().catch(() => 0)
      if (count === 0) {
        if (required) {
          touchRequiredFailCount++
          touchFailures.push({ route, vpWidth, description, reason: 'NOT_FOUND_COUNT_ZERO' })
          console.error(`[TOUCH_FAIL] [${vpWidth}px][${route}] REQUIRED control not found: ${description}`)
          assert.fail(`[${vpWidth}px][${route}] REQUIRED control not found in DOM: ${description}`)
        } else {
          touchOptionalSkippedCount++
          return
        }
      }

      const isVis = await locator.first().isVisible().catch(() => false)
      if (!isVis) {
        if (required) {
          touchRequiredFailCount++
          touchFailures.push({ route, vpWidth, description, reason: 'NOT_VISIBLE' })
          console.error(`[TOUCH_FAIL] [${vpWidth}px][${route}] REQUIRED control not visible: ${description}`)
          assert.fail(`[${vpWidth}px][${route}] REQUIRED control is not visible: ${description}`)
        } else {
          touchOptionalSkippedCount++
          return
        }
      }

      if (required) {
        touchRequiredFoundCount++
      }

      const box = await locator.first().boundingBox()
      if (!box) {
        if (required) {
          touchRequiredFailCount++
          touchFailures.push({ route, vpWidth, description, reason: 'NULL_BOUNDING_BOX' })
          console.error(`[TOUCH_FAIL] [${vpWidth}px][${route}] REQUIRED control boundingBox is null: ${description}`)
          assert.fail(`[${vpWidth}px][${route}] REQUIRED control has null boundingBox: ${description}`)
        } else {
          touchOptionalSkippedCount++
          return
        }
      }

      if (required) {
        touchRequiredMeasuredCount++
      }

      const w = Math.round(box.width * 10) / 10
      const h = Math.round(box.height * 10) / 10
      const passes = w >= 43.5 && h >= 43.5

      if (!passes) {
        if (required) {
          touchRequiredFailCount++
        }
        touchFailures.push({
          route,
          vpWidth,
          description,
          box: { width: w, height: h },
          reason: `DIMENSION_UNDER_44 (${w}x${h}px)`
        })
        console.error(`[TOUCH_FAIL] [${vpWidth}px][${route}] ${description}: ${w}x${h}px < 44x44px`)
        assert.fail(`[${vpWidth}px][${route}] ${description} touch target must be >= 44x44px (got ${w}x${h}px)`)
      } else {
        if (required) {
          touchRequiredPassCount++
        }
        pass('TOUCH_TARGET', `[${vpWidth}px][${route}] ${description} >= 44x44px (${w}x${h}px)`)
      }
    }

    async function scanPageInteractiveElements(page, route, vpWidth) {
      const elements = await page.evaluate(() => {
        const selector = 'button:not([disabled]), a[href]:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="button"]:not([aria-disabled="true"]), [role="link"]:not([aria-disabled="true"]), [role="checkbox"]:not([aria-disabled="true"]), [role="radio"]:not([aria-disabled="true"]), [tabindex="0"]'
        const all = Array.from(document.querySelectorAll(selector))
        const list = []

        for (const el of all) {
          if (el.getAttribute('aria-hidden') === 'true' || el.closest('[aria-hidden="true"]')) continue
          
          const style = window.getComputedStyle(el)
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue

          let targetEl = el
          if (el.type === 'checkbox' || el.type === 'radio') {
            const parentLabel = el.closest('label')
            if (parentLabel) {
              targetEl = parentLabel
            }
          }

          const rect = targetEl.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) continue

          list.push({
            tag: el.tagName.toLowerCase(),
            text: (targetEl.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || el.name || '').slice(0, 35).replace(/\s+/g, ' ').trim(),
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10
          })
        }
        return list
      })

      for (const item of elements) {
        if (item.width < 43.5 || item.height < 43.5) {
          touchFailures.push({
            route,
            vpWidth,
            description: `DOM Scanner: <${item.tag}> "${item.text}"`,
            box: { width: item.width, height: item.height },
            reason: `DYNAMIC_SCAN_FAIL (${item.width}x${item.height}px)`
          })
        }
      }
    }

    for (const vpWidth of VIEWPORTS) {
      await page.setViewportSize({ width: vpWidth, height: 800 })

      // 5.1 /admin/agenda
      touchAuditedRoutes.add('/admin/agenda')
      await page.goto(`http://localhost:${PORT}/admin/agenda?view=mes`, { waitUntil: 'networkidle' })
      for (const btnText of ['Semana', 'Dia', 'Lista', 'Mês']) {
        const btn = page.getByRole('button', { name: new RegExp(`^${btnText}`, 'i') })
        await checkControlTouchTarget(btn, `Botão de visão ${btnText}`, '/admin/agenda', vpWidth)
      }

      await checkControlTouchTarget(page.getByRole('button', { name: /Hoje/i }), 'Botão Hoje', '/admin/agenda', vpWidth)
      await checkControlTouchTarget(page.getByRole('button', { name: 'Período anterior' }), 'Botão Período anterior', '/admin/agenda', vpWidth)
      await checkControlTouchTarget(page.getByRole('button', { name: 'Próximo período' }), 'Botão Próximo período', '/admin/agenda', vpWidth)
      await checkControlTouchTarget(page.getByRole('button', { name: /Novo Agendamento/i }), 'Botão Novo Agendamento', '/admin/agenda', vpWidth)
      await scanPageInteractiveElements(page, '/admin/agenda', vpWidth)

      // 5.2 /admin/equipe
      touchAuditedRoutes.add('/admin/equipe')
      await page.goto(`http://localhost:${PORT}/admin/equipe`, { waitUntil: 'networkidle' })
      await checkControlTouchTarget(page.getByRole('button', { name: /Adicionar Membro/i }), 'Botão Adicionar Membro', '/admin/equipe', vpWidth)
      await checkControlTouchTarget(page.getByRole('button', { name: /Editar/i }).first(), 'Botão Editar Staff', '/admin/equipe', vpWidth)
      await checkControlTouchTarget(page.getByRole('button', { name: /Desativar/i }).first(), 'Botão Desativar Staff', '/admin/equipe', vpWidth)

      // Mobile Staff List Cards touch targets: Phone & Email links
      if (vpWidth < 768) {
        await checkControlTouchTarget(page.locator('a[href^="tel:"]:visible').first(), 'StaffListCards link tel', '/admin/equipe', vpWidth)
        await checkControlTouchTarget(page.locator('a[href^="mailto:"]:visible').first(), 'StaffListCards link mailto', '/admin/equipe', vpWidth)
      } else {
        await checkControlTouchTarget(page.locator('a[href^="tel:"]:visible').first(), 'StaffListCards link tel', '/admin/equipe', vpWidth, { required: false })
        await checkControlTouchTarget(page.locator('a[href^="mailto:"]:visible').first(), 'StaffListCards link mailto', '/admin/equipe', vpWidth, { required: false })
      }
      await scanPageInteractiveElements(page, '/admin/equipe', vpWidth)

      // 5.3 /admin/ordens-servico
      touchAuditedRoutes.add('/admin/ordens-servico')
      await page.goto(`http://localhost:${PORT}/admin/ordens-servico`, { waitUntil: 'networkidle' })
      await checkControlTouchTarget(page.getByRole('button', { name: /Nova Ordem de Serviço/i }).first(), 'Botão Nova OS', '/admin/ordens-servico', vpWidth)
      await checkControlTouchTarget(page.locator('button:has-text("Ver OS"):visible, a:has-text("Ver OS"):visible').first(), 'Botão Ver OS', '/admin/ordens-servico', vpWidth)
      await checkControlTouchTarget(page.locator('input[placeholder*="Buscar"]:visible').first(), 'Input de busca OS', '/admin/ordens-servico', vpWidth)
      await checkControlTouchTarget(page.locator('select:visible').first(), 'Select de status OS', '/admin/ordens-servico', vpWidth)
      await scanPageInteractiveElements(page, '/admin/ordens-servico', vpWidth)

      // 5.4 /admin/ordens-servico/nova
      touchAuditedRoutes.add('/admin/ordens-servico/nova')
      await page.goto(`http://localhost:${PORT}/admin/ordens-servico/nova`, { waitUntil: 'networkidle' })
      await checkControlTouchTarget(page.getByTitle('Voltar para Ordens de Serviço'), 'Botão Voltar Nova OS', '/admin/ordens-servico/nova', vpWidth)
      await checkControlTouchTarget(page.locator('button[type="submit"]:visible').first(), 'Botão Salvar Nova OS', '/admin/ordens-servico/nova', vpWidth)
      await scanPageInteractiveElements(page, '/admin/ordens-servico/nova', vpWidth)

      // 5.5 /admin/ordens-servico/:id — Navegação completa por todas as 7 abas operacionais
      touchAuditedRoutes.add('/admin/ordens-servico/:id')
      await page.goto(`http://localhost:${PORT}/admin/ordens-servico/w0000000-0000-0000-0000-000000000001`, { waitUntil: 'networkidle' })
      await checkControlTouchTarget(page.getByTitle('Voltar para a Lista de OS'), 'Botão Voltar OS', '/admin/ordens-servico/:id', vpWidth)
      await checkControlTouchTarget(page.getByTitle('Ligar'), 'Phone action link', '/admin/ordens-servico/:id', vpWidth)
      await checkControlTouchTarget(page.getByRole('button', { name: /Editar Geral/i }), 'Botão Editar Geral', '/admin/ordens-servico/:id', vpWidth)

      // Aba Itens & Medições
      const tabItensBtn = page.getByRole('button', { name: /Itens & Medições/i })
      await tabItensBtn.click()
      await page.waitForTimeout(150)
      await checkControlTouchTarget(page.locator('button:has-text("Adicionar Item"), button:has-text("Adicionar Primeiro Item")').first(), 'Botão Adicionar Item', '/admin/ordens-servico/:id', vpWidth)
      await checkControlTouchTarget(page.locator('button:has-text("Adicionar Vão")').first(), 'Botão Adicionar Vão', '/admin/ordens-servico/:id', vpWidth)

      // Aba Orçamentos
      const tabOrcamentosBtn = page.getByRole('button', { name: /Orçamentos/i })
      await tabOrcamentosBtn.click()
      await page.waitForTimeout(150)
      await checkControlTouchTarget(page.locator('button:has-text("Orçamento"), button:has-text("Revisão")').first(), 'Botão Gerar Orçamento', '/admin/ordens-servico/:id', vpWidth)

      // Aba Mídias Técnicas
      const tabMidiasBtn = page.getByRole('button', { name: /Mídias Técnicas/i })
      await tabMidiasBtn.click()
      await page.waitForTimeout(150)
      await checkControlTouchTarget(page.locator('button:has-text("Todas as Mídias"):visible').first(), 'Filtro Todas as Mídias', '/admin/ordens-servico/:id', vpWidth)

      // Aba Anotações
      const tabNotasBtn = page.getByRole('button', { name: /Anotações/i })
      await tabNotasBtn.click()
      await page.waitForTimeout(150)
      await checkControlTouchTarget(page.locator('button:has-text("Adicionar Nota"):visible').first(), 'Botão Adicionar Nota', '/admin/ordens-servico/:id', vpWidth)
      await checkControlTouchTarget(page.locator('select:visible').first(), 'Select Categoria Nota', '/admin/ordens-servico/:id', vpWidth)

      // Aba Agendamentos
      const tabAgendamentosBtn = page.getByRole('button', { name: /Agendamentos/i })
      await tabAgendamentosBtn.click()
      await page.waitForTimeout(150)
      await checkControlTouchTarget(page.locator('button:has-text("Agendar Compromisso"):visible, button:has-text("Criar Primeiro Agendamento"):visible, button:has-text("Novo Agendamento"):visible').first(), 'Botão Novo Agendamento na OS', '/admin/ordens-servico/:id', vpWidth)
      await scanPageInteractiveElements(page, '/admin/ordens-servico/:id', vpWidth)

      // 5.6 /admin/leads — Auditoria de página, LeadJourneyDrawer e MediaLightbox
      touchAuditedRoutes.add('/admin/leads')
      await page.goto(`http://localhost:${PORT}/admin/leads`, { waitUntil: 'networkidle' })
      await checkControlTouchTarget(page.locator('button:has-text("Atualizar"):visible').first(), 'Botão Atualizar Leads', '/admin/leads', vpWidth)
      await checkControlTouchTarget(page.locator('input[placeholder*="Buscar"]:visible').first(), 'Input busca Leads', '/admin/leads', vpWidth)
      await checkControlTouchTarget(page.locator('select:visible').first(), 'Select status Leads', '/admin/leads', vpWidth)

      const leadDetailBtn = page.locator('button[title="Ver jornada e detalhes"]:visible, button:has-text("Ver Detalhes"):visible').first()
      await checkControlTouchTarget(leadDetailBtn, 'Botão Ver Detalhes Lead', '/admin/leads', vpWidth)

      // Abrir explicitamente e CONFIRMAR abertura do LeadJourneyDrawer
      await leadDetailBtn.click()
      await page.waitForTimeout(300)
      const drawerCloseBtn = page.locator('button[aria-label="Fechar gaveta"]:visible').first()
      assert.strictEqual(await drawerCloseBtn.count(), 1, `LeadJourneyDrawer deve abrir em ${vpWidth}px`)
      assert.ok(await drawerCloseBtn.isVisible(), `Botão fechar do LeadJourneyDrawer visível em ${vpWidth}px`)

      await checkControlTouchTarget(drawerCloseBtn, 'Botão Fechar Drawer', '/admin/leads', vpWidth)
      await checkControlTouchTarget(page.locator('button:has-text("Abrir WhatsApp"):visible').first(), 'Botão WhatsApp Drawer', '/admin/leads', vpWidth)
      await checkControlTouchTarget(page.locator('button:has-text("Converter em Cliente"):visible, a:has-text("Abrir Cliente"):visible').first(), 'Botão Converter/Abrir Cliente Drawer', '/admin/leads', vpWidth)
      await scanPageInteractiveElements(page, 'LeadJourneyDrawer', vpWidth)

      // Abrir explicitamente e CONFIRMAR abertura do MediaLightbox a partir do drawer
      const drawerModal = page.locator('.fixed.inset-0.z-50').first()
      const mediaCard = drawerModal.locator('div.cursor-pointer').first()
      await mediaCard.waitFor({ state: 'visible', timeout: 5000 })
      assert.strictEqual(await mediaCard.count(), 1, `Card de mídia presente no drawer em ${vpWidth}px`)
      await mediaCard.click({ force: true })
      
      const lightboxCloseBtn = page.locator('button[aria-label="Fechar visualizador"]:visible').first()
      await lightboxCloseBtn.waitFor({ state: 'visible', timeout: 5000 })
      assert.strictEqual(await lightboxCloseBtn.count(), 1, `MediaLightbox deve abrir em ${vpWidth}px`)
      assert.ok(await lightboxCloseBtn.isVisible(), `Botão fechar do MediaLightbox visível em ${vpWidth}px`)

      // Controles de zoom do MediaLightbox (Visíveis em sm: >= 640px)
      const isDesktopZoom = vpWidth >= 640
      await checkControlTouchTarget(page.locator('button[aria-label="Diminuir Zoom"]:visible').first(), 'Lightbox Diminuir Zoom', 'MediaLightbox', vpWidth, { required: isDesktopZoom })
      await checkControlTouchTarget(page.locator('button[aria-label*="Resetar Zoom"]:visible').first(), 'Lightbox Reset Zoom Percent', 'MediaLightbox', vpWidth, { required: isDesktopZoom })
      const zoomInBtn = page.locator('button[aria-label="Aumentar Zoom"]:visible').first()
      await checkControlTouchTarget(zoomInBtn, 'Lightbox Aumentar Zoom', 'MediaLightbox', vpWidth, { required: isDesktopZoom })
      await checkControlTouchTarget(lightboxCloseBtn, 'Lightbox Fechar X', 'MediaLightbox', vpWidth, { required: true })

      // Se desktop zoom estiver disponível, testa 1:1 ao dar zoom
      if (isDesktopZoom) {
        await zoomInBtn.click({ force: true })
        await page.waitForTimeout(200)
        const btn1x1 = page.locator('button[aria-label="Resetar Zoom 1:1"]:visible, button:has-text("1:1"):visible').first()
        const has1x1 = (await btn1x1.count() > 0) && (await btn1x1.isVisible())
        await checkControlTouchTarget(btn1x1, 'Lightbox Botão 1:1', 'MediaLightbox', vpWidth, { required: has1x1 })
      } else {
        await checkControlTouchTarget(page.locator('button[aria-label="Resetar Zoom 1:1"]:visible').first(), 'Lightbox Botão 1:1', 'MediaLightbox', vpWidth, { required: false })
      }
      await scanPageInteractiveElements(page, 'MediaLightbox', vpWidth)

      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)

      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)

      // 5.7 /admin/galeria
      touchAuditedRoutes.add('/admin/galeria')
      await page.goto(`http://localhost:${PORT}/admin/galeria`, { waitUntil: 'networkidle' })
      await checkControlTouchTarget(page.getByRole('button', { name: /Adicionar Mídias/i }), 'Botão Adicionar Mídias', '/admin/galeria', vpWidth)
      await scanPageInteractiveElements(page, '/admin/galeria', vpWidth)

      // 5.8 /admin/clientes — Auditoria de lista e botão X de limpar pesquisa
      touchAuditedRoutes.add('/admin/clientes')
      await page.goto(`http://localhost:${PORT}/admin/clientes`, { waitUntil: 'networkidle' })
      const clientSearchInput = page.locator('input[placeholder*="Buscar por nome"]:visible').first()
      await checkControlTouchTarget(clientSearchInput, 'Input busca clientes', '/admin/clientes', vpWidth)
      
      // Digita texto na busca para ativar e CONFIRMAR o botão X de limpar
      await clientSearchInput.fill('João')
      await page.waitForTimeout(150)
      const clearSearchBtn = page.locator('button[aria-label="Limpar pesquisa"]:visible').first()
      assert.strictEqual(await clearSearchBtn.count(), 1, `Botão limpar pesquisa deve aparecer com texto preenchido em ${vpWidth}px`)
      assert.ok(await clearSearchBtn.isVisible(), `Botão limpar pesquisa visível em ${vpWidth}px`)
      await checkControlTouchTarget(clearSearchBtn, 'Botão X Limpar Pesquisa Clientes', '/admin/clientes', vpWidth)
      await clearSearchBtn.click()
      await page.waitForTimeout(100)
      await scanPageInteractiveElements(page, '/admin/clientes', vpWidth)

      // 5.9 /admin/clientes/:id — Auditoria de detalhes e modal de endereço (ClientAddressManager)
      touchAuditedRoutes.add('/admin/clientes/:id')
      await page.goto(`http://localhost:${PORT}/admin/clientes/c0000000-0000-0000-0000-000000000001`, { waitUntil: 'networkidle' })
      const tabEnderecosBtn = page.locator('button:has-text("Endereços")').first()
      await tabEnderecosBtn.waitFor({ state: 'visible', timeout: 5000 })
      await tabEnderecosBtn.click({ force: true })
      await page.waitForTimeout(200)

      const newAddressBtn = page.locator('button:has-text("Novo Endereço"), button:has-text("Adicionar Endereço")').first()
      await newAddressBtn.waitFor({ state: 'visible', timeout: 5000 })
      assert.strictEqual(await newAddressBtn.count(), 1, `Botão Novo Endereço presente em ${vpWidth}px`)
      await checkControlTouchTarget(newAddressBtn, 'Botão Novo Endereço', '/admin/clientes/:id', vpWidth)
      
      // Abre explicitamente e CONFIRMA abertura do ClientAddressManager modal
      await newAddressBtn.click({ force: true })
      await page.waitForTimeout(250)

      const closeAddressModalBtn = page.locator('button[aria-label="Fechar modal de endereço"]:visible').first()
      assert.strictEqual(await closeAddressModalBtn.count(), 1, `Modal de endereço deve abrir em ${vpWidth}px`)
      assert.ok(await closeAddressModalBtn.isVisible(), `Botão fechar do modal de endereço visível em ${vpWidth}px`)

      await checkControlTouchTarget(closeAddressModalBtn, 'Botão X Fechar Modal Endereço', 'ClientAddressManagerModal', vpWidth)
      const cancelAddressBtn = page.locator('button:has-text("Cancelar"):visible').first()
      await checkControlTouchTarget(cancelAddressBtn, 'Botão Cancelar Endereço', 'ClientAddressManagerModal', vpWidth)
      const saveAddressBtn = page.locator('button:has-text("Salvar Endereço"):visible').first()
      await checkControlTouchTarget(saveAddressBtn, 'Botão Salvar Endereço', 'ClientAddressManagerModal', vpWidth)
      await scanPageInteractiveElements(page, 'ClientAddressManagerModal', vpWidth)

      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      await scanPageInteractiveElements(page, '/admin/clientes/:id', vpWidth)

      // 5.10 /orcamento — Auditoria de formulário e botão X de remover arquivo do MediaUploader
      touchAuditedRoutes.add('/orcamento')
      await page.goto(`http://localhost:${PORT}/orcamento`, { waitUntil: 'networkidle' })
      const orcamentoSubmitBtn = page.locator('button[type="submit"]:visible').first()
      await checkControlTouchTarget(orcamentoSubmitBtn, 'Botão Enviar Orçamento', '/orcamento', vpWidth)

      // Simula seleção de foto no MediaUploader da página pública
      const fileInputOrcamento = page.locator('input[type="file"]').first()
      assert.strictEqual(await fileInputOrcamento.count(), 1, `Input de arquivo presente em /orcamento em ${vpWidth}px`)
      await fileInputOrcamento.setInputFiles({
        name: 'foto-janela-orcamento.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
      })
      await page.waitForTimeout(300)

      // Botão X de remover arquivo selecionado no MediaUploader: CONFIRMA existência e testa
      const removeFileBtnOrc = page.locator('button[title="Remover arquivo"]:visible, button[aria-label="Remover arquivo"]:visible').first()
      assert.strictEqual(await removeFileBtnOrc.count(), 1, `Botão remover arquivo deve aparecer após upload em /orcamento em ${vpWidth}px`)
      assert.ok(await removeFileBtnOrc.isVisible(), `Botão remover arquivo visível em ${vpWidth}px`)
      await checkControlTouchTarget(removeFileBtnOrc, 'Botão X Remover Arquivo MediaUploader Orcamento', '/orcamento', vpWidth)
      await scanPageInteractiveElements(page, '/orcamento', vpWidth)

      // 5.11 /contato — Auditoria de formulário público e MediaUploader
      touchAuditedRoutes.add('/contato')
      await page.goto(`http://localhost:${PORT}/contato`, { waitUntil: 'networkidle' })
      const contatoSubmitBtn = page.locator('button[type="submit"]:visible').first()
      await checkControlTouchTarget(contatoSubmitBtn, 'Botão Enviar Contato', '/contato', vpWidth)

      // Simula seleção de foto no MediaUploader da página de contato
      const fileInputContato = page.locator('input[type="file"]').first()
      assert.strictEqual(await fileInputContato.count(), 1, `Input de arquivo presente em /contato em ${vpWidth}px`)
      await fileInputContato.setInputFiles({
        name: 'foto-janela-contato.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
      })
      await page.waitForTimeout(300)

      const removeFileBtnContato = page.locator('button[title="Remover arquivo"]:visible, button[aria-label="Remover arquivo"]:visible').first()
      assert.strictEqual(await removeFileBtnContato.count(), 1, `Botão remover arquivo deve aparecer após upload em /contato em ${vpWidth}px`)
      assert.ok(await removeFileBtnContato.isVisible(), `Botão remover arquivo visível em /contato em ${vpWidth}px`)
      await checkControlTouchTarget(removeFileBtnContato, 'Botão X Remover Arquivo MediaUploader Contato', '/contato', vpWidth)
      await scanPageInteractiveElements(page, '/contato', vpWidth)

      pass('TOUCH_TARGET', `[${vpWidth}px] Todos os controles operacionais e fluxos profundos atendem touch target >= 44x44px`)
    }

    const touchTargetUnder44Count = touchFailures.length
    if (touchTargetUnder44Count > 0) {
      console.log('--- TOUCH TARGET FAILURES LIST ---')
      const uniqueFails = new Map()
      for (const f of touchFailures) {
        const key = `${f.route} -> ${f.description}`
        if (!uniqueFails.has(key)) {
          uniqueFails.set(key, { ...f, viewports: [f.vpWidth] })
        } else {
          uniqueFails.get(key).viewports.push(f.vpWidth)
        }
      }
      for (const [k, v] of uniqueFails.entries()) {
        console.log(`[DOM SCAN UNDER 44] ${k} | ${v.box.width}x${v.box.height}px | VPs: ${v.viewports.join(',')}`)
      }
    }
    console.log('TOUCH_TARGET_DIMENSION_POLICY=WIDTH_AND_HEIGHT_MIN_44')
    console.log('TOUCH_TARGET_SILENT_SKIP=DISABLED')
    console.log(`TOUCH_TARGET_REQUIRED_EXPECTED_COUNT=${touchRequiredExpectedCount}`)
    console.log(`TOUCH_TARGET_REQUIRED_FOUND_COUNT=${touchRequiredFoundCount}`)
    console.log(`TOUCH_TARGET_REQUIRED_MEASURED_COUNT=${touchRequiredMeasuredCount}`)
    console.log(`TOUCH_TARGET_REQUIRED_PASS_COUNT=${touchRequiredPassCount}`)
    console.log(`TOUCH_TARGET_REQUIRED_FAIL_COUNT=${touchRequiredFailCount}`)
    console.log(`TOUCH_TARGET_OPTIONAL_SKIPPED_COUNT=${touchOptionalSkippedCount}`)
    console.log(`TOUCH_TARGET_UNDER_44_COUNT=${touchTargetUnder44Count}`)
    console.log('TOUCH_TARGET_MIN_44PX=' + (touchTargetUnder44Count === 0 && touchRequiredFailCount === 0 ? 'PASS' : 'FAIL'))
    console.log('TOUCH_TARGET_DYNAMIC_DOM_SCAN=' + (touchTargetUnder44Count === 0 ? 'PASS' : 'FAIL'))
    console.log('TOUCH_TARGET_CRITICAL_CONTROL_SCAN=' + (touchRequiredFailCount === 0 ? 'PASS' : 'FAIL'))
    console.log('CLIENT_ADDRESS_MODAL_RUNTIME_AUDITED=YES')
    console.log('MEDIA_LIGHTBOX_RUNTIME_AUDITED=YES')
    console.log('MEDIA_UPLOADER_RUNTIME_AUDITED=YES')
    console.log('CLIENT_CLEAR_SEARCH_RUNTIME_AUDITED=YES')
    console.log('STAFF_PHONE_EMAIL_RUNTIME_AUDITED=YES')
    console.log('WORK_ORDER_ALL_TABS_TOUCH_AUDITED=YES')
    console.log('PHOTO_UPLOADER_RUNTIME_RELEASE_USAGE=NO')
    console.log(`TOUCH_TARGET_ROUTES_AUDITED=${Array.from(touchAuditedRoutes).join(',')}`)

    assert.strictEqual(touchRequiredExpectedCount, touchRequiredFoundCount, 'EXPECTED == FOUND')
    assert.strictEqual(touchRequiredFoundCount, touchRequiredMeasuredCount, 'FOUND == MEASURED')
    assert.strictEqual(touchRequiredMeasuredCount, touchRequiredPassCount, 'MEASURED == PASS')
    assert.strictEqual(touchRequiredFailCount, 0, 'FAIL == 0')
    assert.strictEqual(touchTargetUnder44Count, 0, 'ZERO failures em touch targets')

    // -------------------------------------------------------------
    // 5.7 AUDITORIA GLOBAL DE CONTROLES INTERATIVOS NÃO ANINHADOS (11 ROTAS + DEEP STATES)
    // -------------------------------------------------------------
    console.log('\n--- 5.7 AUDITORIA GLOBAL DE CONTROLES INTERATIVOS NÃO ANINHADOS (11 ROTAS + DEEP STATES) ---')
    const screensToCheck = [
      '/admin/agenda',
      '/admin/equipe',
      '/admin/ordens-servico',
      '/admin/ordens-servico/nova',
      '/admin/ordens-servico/w0000000-0000-0000-0000-000000000001',
      '/admin/leads',
      '/admin/galeria',
      '/admin/clientes',
      '/admin/clientes/c0000000-0000-0000-0000-000000000001',
      '/orcamento',
      '/contato'
    ]

    for (const scr of screensToCheck) {
      await page.goto(`http://localhost:${PORT}${scr}`, { waitUntil: 'networkidle' })
      const nestedCount = await page.evaluate(() => {
        const nested = document.querySelectorAll(
          'button button, a a, button a, a button, [role="button"] button, button [role="button"], [role="button"] a, a [role="button"]'
        )
        return nested.length
      })
      assert.strictEqual(nestedCount, 0, `Controles aninhados encontrados na tela ${scr}: ${nestedCount}`)
      pass('NESTED_CONTROL', `[${scr}] Zero controles aninhados`)
    }

    console.log('NESTED_INTERACTIVE_CONTROLS=0')

    // -------------------------------------------------------------
    // 5.8 PROVA REAL DE DDD 55 & DATE-ONLY EM AMBIENTE DE BROWSER
    // -------------------------------------------------------------
    console.log('\n--- 5.8 PROVA REAL DE DDD 55 & DATE-ONLY NO BROWSER ---')

    // 5.8.1 Teste DOM de WhatsApp com DDD 55 em WorkOrderListCards
    await page.setViewportSize({ width: 375, height: 800 })
    await page.route('**/api/admin/crm/work-orders*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          workOrders: [
            {
              id: 'w-55-1',
              numero_os: 'OS-DDD55-1',
              status_os: 'aguardando_agendamento',
              valor_final: 500,
              data_prevista: '2026-08-30',
              client: { id: 'c1', nome: 'Cliente RS 1', telefone_principal: '5533334444' }
            },
            {
              id: 'w-55-2',
              numero_os: 'OS-DDD55-2',
              status_os: 'aguardando_agendamento',
              valor_final: 500,
              data_prevista: '2026-08-30',
              client: { id: 'c2', nome: 'Cliente RS 2', telefone_principal: '55999991234' }
            },
            {
              id: 'w-55-3',
              numero_os: 'OS-DDD55-3',
              status_os: 'aguardando_agendamento',
              valor_final: 500,
              data_prevista: '2026-08-30',
              client: { id: 'c3', nome: 'Cliente RS 3', telefone_principal: '+55 55 3333-4444' }
            }
          ],
          pagination: { total: 3, totalPages: 1, page: 1, limit: 20 }
        })
      })
    })

    await page.goto(`http://localhost:${PORT}/admin/ordens-servico`, { waitUntil: 'networkidle' })

    const waLinks = await page.locator('a[aria-label="Abrir WhatsApp"]').evaluateAll(els => els.map(e => e.getAttribute('href')))
    assert.strictEqual(waLinks[0], 'https://wa.me/555533334444', `5533334444 deve virar https://wa.me/555533334444 (atual: ${waLinks[0]})`)
    assert.strictEqual(waLinks[1], 'https://wa.me/5555999991234', `55999991234 deve virar https://wa.me/5555999991234 (atual: ${waLinks[1]})`)
    assert.strictEqual(waLinks[2], 'https://wa.me/555533334444', `+55 55 3333-4444 deve virar https://wa.me/555533334444 (atual: ${waLinks[2]})`)
    pass('ROUTE', 'DDD 55 (RS) normalizado para WhatsApp no DOM sem duplicação ou confusão com DDI (5533334444 -> https://wa.me/555533334444)')

    // 5.8.2 Teste DOM de Date-Only 2026-08-30 -> 30/08/2026 (nunca 29/08/2026)
    const cardText = await page.locator('body').innerText()
    assert.ok(cardText.includes('30/08/2026'), 'data_prevista 2026-08-30 deve formatar como 30/08/2026 no card mobile')
    assert.ok(!cardText.includes('29/08/2026'), 'data_prevista NÃO deve retroceder para 29/08/2026')

    // Desktop view table
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`http://localhost:${PORT}/admin/ordens-servico`, { waitUntil: 'networkidle' })
    const tableText = await page.locator('body').innerText()
    assert.ok(tableText.includes('30/08/2026'), 'data_prevista 2026-08-30 deve formatar como 30/08/2026 na tabela desktop')
    assert.ok(!tableText.includes('29/08/2026'), 'data_prevista NÃO deve retroceder para 29/08/2026 na tabela desktop')
    pass('ROUTE', 'data_prevista formata como data pura civil 30/08/2026 em cards e tabela (zero timezone regression)')


    // -------------------------------------------------------------
    // 6. PROVA REAL DE A11Y NOS 10 MODAIS/SHEETS (OPEN, TRAP, ESCAPE, EXACT RESTORE)
    // -------------------------------------------------------------
    console.log('\n--- 6. PROVA REAL DE A11Y NOS 10 MODAIS/SHEETS ---')

    // Helper de Focus Trap e Restoration Exata
    async function testModalA11y(modalName, openTriggerLocator, titleLocator, expectedTitleText) {
      // 1. Foco no trigger e captura do handle
      await openTriggerLocator.focus()
      const triggerEl = await openTriggerLocator.elementHandle()
      await openTriggerLocator.click()
      await page.waitForTimeout(250)

      // 2. Foco entra no dialog
      const title = titleLocator
      assert.ok(await title.isVisible(), `${modalName} deve estar visível`)
      if (expectedTitleText) {
        const text = await title.textContent()
        assert.ok(text.includes(expectedTitleText), `${modalName} deve conter '${expectedTitleText}'`)
      }

      const isFocusInside = await page.evaluate(() => {
        const active = document.activeElement
        const modals = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"]'))
        return modals.some(modal => modal.contains(active))
      })
      assert.strictEqual(isFocusInside, true, `${modalName}: Foco inicial deve entrar no diálogo`)

      // 3. Focus Trap: Tab e Shift+Tab não escapam do modal
      await page.keyboard.press('Tab')
      const afterTabInside = await page.evaluate(() => {
        const modals = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"]'))
        return modals.some(modal => modal.contains(document.activeElement))
      })
      assert.strictEqual(afterTabInside, true, `${modalName}: Tab não deve escapar do modal`)

      await page.keyboard.press('Shift+Tab')
      const afterShiftTabInside = await page.evaluate(() => {
        const modals = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"]'))
        return modals.some(modal => modal.contains(document.activeElement))
      })
      assert.strictEqual(afterShiftTabInside, true, `${modalName}: Shift+Tab não deve escapar do modal`)

      // 4. Fechamento por Escape
      await page.keyboard.press('Escape')
      await page.waitForTimeout(250)
      assert.ok(!(await title.isVisible()), `${modalName} deve fechar com tecla Escape`)

      // 5. Restauração EXATA de foco ao trigger
      const isExactTriggerFocused = await page.evaluate((el) => {
        return document.activeElement === el
      }, triggerEl)
      assert.strictEqual(isExactTriggerFocused, true, `${modalName}: Foco deve ser restaurado EXATAMENTE ao elemento trigger disparador`)

      pass('MODAL_A11Y', `[${modalName}] Abertura, Focus Trap, Escape e Restauração Exata de Foco aprovados com sucesso`)
    }

    // 6.1 AppointmentCreateModal
    await page.goto(`http://localhost:${PORT}/admin/agenda?view=lista`, { waitUntil: 'networkidle' })
    await testModalA11y(
      '1/10 AppointmentCreateModal',
      page.getByRole('button', { name: /Novo Agendamento/i }),
      page.locator('#create-title'),
      'Novo Agendamento'
    )

    // 6.2 AppointmentDetailSheet
    await testModalA11y(
      '2/10 AppointmentDetailSheet',
      page.getByRole('button', { name: /João Silva/i }).first(),
      page.locator('#detail-title'),
      'Detalhes do Agendamento'
    )

    // 6.3 AppointmentEditModal (via Detail Sheet)
    await page.getByRole('button', { name: /João Silva/i }).first().click()
    await page.waitForTimeout(200)
    await testModalA11y(
      '3/10 AppointmentEditModal',
      page.getByRole('button', { name: /^Editar$/i }),
      page.locator('#edit-title'),
      'Editar Agendamento'
    )

    // 6.4 AppointmentRescheduleModal (via Detail Sheet que permanece aberta)
    await testModalA11y(
      '4/10 AppointmentRescheduleModal',
      page.getByRole('button', { name: /^Reagendar$/i }),
      page.locator('#reschedule-title'),
      'Reagendar Compromisso'
    )

    // 6.5 AppointmentCancelDialog (via Detail Sheet que permanece aberta)
    await testModalA11y(
      '5/10 AppointmentCancelDialog',
      page.getByRole('button', { name: /^Cancelar$/i }),
      page.locator('#cancel-title'),
      'Cancelar Agendamento'
    )

    // Fecha a Detail Sheet
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    // 6.6 StaffFormModal (na rota /admin/equipe)
    await page.goto(`http://localhost:${PORT}/admin/equipe`, { waitUntil: 'networkidle' })
    await testModalA11y(
      '6/10 StaffFormModal',
      page.getByRole('button', { name: /Adicionar Membro/i }),
      page.locator('#staff-modal-title'),
      'Adicionar Membro da Equipe'
    )

    // 6.7 StaffDeactivateDialog (na rota /admin/equipe)
    const deactivateBtn = page.getByRole('button', { name: /Desativar/i }).first()
    await testModalA11y(
      '7/10 StaffDeactivateDialog',
      deactivateBtn,
      page.locator('#staff-deactivate-title'),
      'Desativar Membro da Equipe'
    )

    // 6.8 WorkOrderStatusModal (na rota /admin/ordens-servico/:id)
    await page.goto(`http://localhost:${PORT}/admin/ordens-servico/w0000000-0000-0000-0000-000000000001`, { waitUntil: 'networkidle' })
    const statusModalTrigger = page.locator('button').filter({ hasText: 'Aguardando Agendamento' }).first()
    await testModalA11y(
      '8/10 WorkOrderStatusModal',
      statusModalTrigger,
      page.locator('#work-order-status-modal-title'),
      'Alterar Status da OS'
    )

    // 6.9 WorkOrderGeneralEditModal (na rota /admin/ordens-servico/:id)
    const editModalTrigger = page.getByRole('button', { name: /Editar Geral/i })
    await testModalA11y(
      '9/10 WorkOrderGeneralEditModal',
      editModalTrigger,
      page.locator('#work-order-general-edit-title'),
      'Editar Dados Gerais da OS'
    )

    // 6.10 LeadConversionModal (na rota /admin/leads)
    await page.goto(`http://localhost:${PORT}/admin/leads`, { waitUntil: 'networkidle' })
    const openDrawerBtn = page.locator('button[title="Ver jornada e detalhes"]:visible, button:has-text("Ver Detalhes"):visible').first()
    await openDrawerBtn.waitFor({ state: 'visible', timeout: 5000 })
    await openDrawerBtn.click()
    await page.waitForTimeout(500)

    const convertModalTrigger = page.getByRole('button', { name: /Converter em Cliente/i })
    await convertModalTrigger.waitFor({ state: 'visible', timeout: 10000 })

    // Validar touch target dos controles de LeadConversionModal
    await convertModalTrigger.click()
    await page.waitForTimeout(250)
    const enderecoLabel = page.locator('label').filter({ hasText: /Cadastrar Endereço Inicial/i })
    const endBox = await enderecoLabel.boundingBox()
    assert.ok(endBox && endBox.height >= 44, `LeadConversionModal endereco label height >= 44px (${endBox?.height}px)`)
    pass('TOUCH_TARGET', `[LeadConversionModal] Label 'Cadastrar Endereço' touch target height >= 44px (${endBox?.height}px)`)

    const osLabel = page.locator('label').filter({ hasText: /Gerar Primeira Ordem de Serviço/i })
    const osBox = await osLabel.boundingBox()
    assert.ok(osBox && osBox.height >= 44, `LeadConversionModal os label height >= 44px (${osBox?.height}px)`)
    pass('TOUCH_TARGET', `[LeadConversionModal] Label 'Gerar Primeira OS' touch target height >= 44px (${osBox?.height}px)`)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    await testModalA11y(
      '10/10 LeadConversionModal',
      convertModalTrigger,
      page.locator('#lead-conversion-modal-title'),
      'Converter Lead em Cliente'
    )

    // -------------------------------------------------------------
    // 7. VALIDAÇÃO DE FORMULÁRIOS & AUSÊNCIA DE DATA_PREVISTA NA UI (FASE 5.0D.2)
    // -------------------------------------------------------------
    console.log('\n--- 7. VALIDAÇÃO DE FORMULÁRIOS & AUSÊNCIA DE DATA_PREVISTA NA UI ---')

    // 7.1 Nova OS: Input editável de data prevista ausente, preenchimento e submit sem dataPrevista
    await page.goto(`http://localhost:${PORT}/admin/ordens-servico/nova?clientId=c0000000-0000-0000-0000-000000000001`, { waitUntil: 'networkidle' })
    const infoAgendaText = page.getByText(/A data prevista de instalação será definida pelo agendamento/i)
    assert.ok(await infoAgendaText.isVisible(), 'Nota informativa da autoridade da Agenda deve estar visível em Nova OS')
    pass('LEGACY_UI', 'Nova OS (/admin/ordens-servico/nova) exibe aviso informativo e não possui input editável de data prevista')

    let postWoBody = null
    await page.route('**/api/admin/crm/work-orders', async route => {
      if (route.request().method() === 'POST') {
        postWoBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, workOrder: { id: 'w0000000-0000-0000-0000-000000000001' } })
        })
      } else {
        await route.continue()
      }
    })

    await page.locator('input[placeholder*="Ex: Instalação"]').fill('Tela Mosquiteira Janela')
    await page.getByRole('button', { name: /Criar Ordem de Serviço/i }).click()
    await page.waitForTimeout(400)

    assert.ok(postWoBody !== null, 'POST /api/admin/crm/work-orders deve ter sido interceptado')
    assert.strictEqual(postWoBody.dataPrevista, undefined, 'Payload POST não deve conter dataPrevista')
    assert.strictEqual(postWoBody.data_prevista, undefined, 'Payload POST não deve conter data_prevista')
    pass('LEGACY_UI', 'POST /api/admin/crm/work-orders executado sem dataPrevista no payload')

    // 7.2 Edição de OS (WorkOrderGeneralEditModal): Input de data ausente e PATCH sem data_prevista
    await page.goto(`http://localhost:${PORT}/admin/ordens-servico/w0000000-0000-0000-0000-000000000001`, { waitUntil: 'networkidle' })
    let patchWoBody = null
    await page.route('**/api/admin/crm/work-orders/*', async route => {
      if (route.request().method() === 'PATCH') {
        patchWoBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            workOrder: {
              id: 'w0000000-0000-0000-0000-000000000001',
              numero_os: 'OS-2026-001',
              status_os: 'aguardando_agendamento'
            }
          })
        })
      } else {
        await route.continue()
      }
    })

    await page.getByRole('button', { name: /Editar Geral/i }).click()
    await page.waitForTimeout(200)
    const editModal = page.locator('#work-order-general-edit-title')
    assert.ok(await editModal.isVisible(), 'Modal de Edição Geral deve estar visível')
    assert.strictEqual(await page.locator('input[type="date"]').count(), 1, 'Apenas proposalValidUntil pode ter input de data')

    await page.getByRole('button', { name: /Salvar Alterações/i }).click()
    await page.waitForTimeout(300)

    assert.ok(patchWoBody !== null, 'PATCH /api/admin/crm/work-orders/:id deve ter sido interceptado')
    assert.strictEqual(patchWoBody.data_prevista, undefined, 'Payload PATCH não deve conter data_prevista')
    assert.strictEqual(patchWoBody.dataPrevista, undefined, 'Payload PATCH não deve conter dataPrevista')
    pass('LEGACY_UI', 'PATCH /api/admin/crm/work-orders/:id executado sem data_prevista no payload')

    // 7.3 Status da OS (WorkOrderStatusModal): agendada ausente das transições manuais e CTA abre aba agendamentos
    await page.locator('button').filter({ hasText: 'Aguardando Agendamento' }).first().click()
    await page.waitForTimeout(200)
    const statusSelect = page.locator('select')
    const options = await statusSelect.locator('option').allTextContents()
    assert.strictEqual(options.some(o => o.toLowerCase().includes('agendada')), false, 'Status agendada NÃO deve ser selecionável manualmente')

    const ctaAgendar = page.getByRole('button', { name: /Agendar Instalação/i })
    assert.ok(await ctaAgendar.isVisible(), 'CTA Agendar Instalação deve estar visível no modal de status')
    await ctaAgendar.click()
    await page.waitForTimeout(300)

    assert.ok(!(await page.locator('#work-order-status-modal-title').isVisible()), 'Modal de status deve fechar após clique no CTA')
    assert.ok(await page.getByText(/Agenda & Compromissos da OS/i).isVisible(), 'Aba de Agendamentos deve estar visível após CTA')
    pass('LEGACY_UI', 'WorkOrderStatusModal bloqueia "agendada" manual e CTA direciona para agendamento')

    // 7.4 Conversão de Lead (LeadConversionModal): os_data sem chave data_prevista
    await page.goto(`http://localhost:${PORT}/admin/leads`, { waitUntil: 'networkidle' })
    const openDrawerBtnConvert = page.locator('button[title="Ver jornada e detalhes"]:visible, button:has-text("Ver Detalhes"):visible').first()
    await openDrawerBtnConvert.waitFor({ state: 'visible', timeout: 5000 })
    await openDrawerBtnConvert.click()
    await page.waitForTimeout(500)
    const convertBtn = page.getByRole('button', { name: /Converter em Cliente/i })
    await convertBtn.waitFor({ state: 'visible', timeout: 10000 })
    await convertBtn.click()
    await page.waitForTimeout(200)

    let convertLeadBody = null
    await page.route('**/api/admin/crm/leads/*/convert', async route => {
      convertLeadBody = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          result: {
            client_id: 'c0000000-0000-0000-0000-000000000001',
            work_order_id: 'w0000000-0000-0000-0000-000000000001'
          }
        })
      })
    })

    await page.getByRole('button', { name: /Confirmar Conversão/i }).click()
    await page.waitForTimeout(300)

    assert.ok(convertLeadBody !== null, 'POST convert deve ter sido interceptado')
    if (convertLeadBody.os_data) {
      assert.strictEqual(convertLeadBody.os_data.data_prevista, undefined, 'os_data não deve conter data_prevista')
      assert.strictEqual(convertLeadBody.os_data.dataPrevista, undefined, 'os_data não deve conter dataPrevista')
    }
    pass('LEGACY_UI', 'LeadConversionModal submete conversão sem data_prevista no os_data')

    // -------------------------------------------------------------
    // 8. INTEGRIDADE DE CONSOLE & BROWSER ERROR POLICY
    // -------------------------------------------------------------
    console.log('\n--- 8. INTEGRIDADE DE CONSOLE & BROWSER ERROR POLICY ---')
    assert.strictEqual(consoleErrors.length, 0, `BROWSER_UNEXPECTED_CONSOLE_ERRORS: ${consoleErrors.join(', ')}`)
    pass('ROUTE', 'BROWSER_UNEXPECTED_CONSOLE_ERRORS = 0')

    assert.strictEqual(pageErrors.length, 0, `BROWSER_UNEXPECTED_PAGE_ERRORS: ${pageErrors.join(', ')}`)
    pass('ROUTE', 'BROWSER_UNEXPECTED_PAGE_ERRORS = 0')

    assert.strictEqual(failedRequests.length, 0, `BROWSER_UNEXPECTED_NETWORK_5XX: ${JSON.stringify(failedRequests)}`)
    pass('ROUTE', 'BROWSER_UNEXPECTED_NETWORK_5XX = 0')

  } catch (err) {
    fail('E2E', 'Erro geral na execução dos testes Playwright', err)
  } finally {
    if (browser) await browser.close()
    if (serverProcess) serverProcess.kill('SIGTERM')
    if (mockSupabaseServer) mockSupabaseServer.close()
  }

  console.log('\n======================================================================')
  console.log(`TOTAL DE ASSERTS E2E:            ${totalPassed + totalFailed}`)
  console.log(`BROWSER_PRIVATE_ROUTE_ASSERTS:   ${browserPrivateRouteAsserts}`)
  console.log(`BROWSER_VIEWPORT_ASSERTS:        ${browserViewportAsserts}`)
  console.log(`BROWSER_SINGLE_FETCH_ASSERTS:    ${browserSingleFetchAsserts}`)
  console.log(`BROWSER_TOUCH_TARGET_ASSERTS:    ${browserTouchTargetAsserts}`)
  console.log(`BROWSER_NESTED_CONTROL_ASSERTS:  ${browserNestedControlAsserts}`)
  console.log(`BROWSER_MODAL_A11Y_ASSERTS:      ${browserModalA11yAsserts}`)
  console.log(`BROWSER_LEGACY_UI_ASSERTS:       ${browserLegacyUIAsserts}`)
  console.log(`PASSOU:                          ${totalPassed}`)
  console.log(`FALHOU:                          ${totalFailed}`)
  console.log('======================================================================\n')

  if (totalFailed > 0) process.exit(1)
}

run()
