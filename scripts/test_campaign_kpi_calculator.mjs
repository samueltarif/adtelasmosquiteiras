/**
 * Suíte de Testes do Calculador de KPIs de Campanhas (Fase 7)
 * Testa KPI-01 a KPI-16 (Regras de cálculo puro, tratamento de zero, metas e validações)
 * Arquivo: scripts/test_campaign_kpi_calculator.mjs (<= 200 linhas)
 */

import {
  calcCtr, calcCpc, calcCpm, calcCostPerWhatsapp,
  calcCpl, calcCpa, calcRoas, calcAvgTicket, calcLeadToSaleRate,
  calculateKpis
} from '../app/utils/campaignKpiCalculator.ts'

import {
  evaluateGoals,
  validateNonNegativeNumber,
  validateIsoDate,
  validatePeriod
} from '../app/utils/campaignKpiGoals.ts'

let passed = 0
let failed = 0

function assert(condition, code, desc) {
  if (condition) {
    console.log(`  [PASS] ${code}: ${desc}`)
    passed++
  } else {
    console.error(`  [FAIL] ${code}: ${desc}`)
    failed++
  }
}

console.log('======================================================================')
console.log('SUÍTE DE TESTES: CALCULADOR DE KPIS DE CAMPANHAS (FASE 7)')
console.log('======================================================================')

// KPI-01: CTR correto (clicks=420, impressions=10000 -> 4.2%)
assert(calcCtr(420, 10000) === 4.2, 'KPI-01', 'CTR calculado corretamente (4.2%)')

// KPI-02: CPC correto (spend=840, clicks=420 -> R$ 2.00)
assert(calcCpc(840, 420) === 2.0, 'KPI-02', 'CPC calculado corretamente (R$ 2.00)')

// KPI-03: CPM correto (spend=500, impressions=10000 -> R$ 50.00)
assert(calcCpm(500, 10000) === 50.0, 'KPI-03', 'CPM calculado corretamente (R$ 50.00)')

// KPI-04: Custo por WhatsApp correto (spend=1000, whatsapp=50 -> R$ 20.00)
assert(calcCostPerWhatsapp(1000, 50) === 20.0, 'KPI-04', 'Custo por WhatsApp correto (R$ 20.00)')

// KPI-05: CPL correto (spend=1500, leads=30 -> R$ 50.00)
assert(calcCpl(1500, 30) === 50.0, 'KPI-05', 'CPL calculado corretamente (R$ 50.00)')

// KPI-06: CPA correto (spend=3000, sales=6 -> R$ 500.00)
assert(calcCpa(3000, 6) === 500.0, 'KPI-06', 'CPA calculado corretamente (R$ 500.00)')

// KPI-07: ROAS correto (revenue=15000, spend=3000 -> 5.0x)
assert(calcRoas(15000, 3000) === 5.0, 'KPI-07', 'ROAS calculado corretamente (5.0x)')

// KPI-08: Ticket Médio correto (revenue=15000, sales=6 -> R$ 2500.00)
assert(calcAvgTicket(15000, 6) === 2500.0, 'KPI-08', 'Ticket Médio calculado corretamente (R$ 2500.00)')

// KPI-09: Lead -> Venda correto (sales=6, leads=30 -> 20.0%)
assert(calcLeadToSaleRate(6, 30) === 20.0, 'KPI-09', 'Taxa Lead -> Venda calculada corretamente (20.0%)')

// KPI-10: Denominador zero não gera NaN nem Infinity (retorna null)
const kZero = calculateKpis({
  id: 'test', platform: 'google_ads', campaign_name: 'test', utm_campaign: null,
  period_start: '2026-09-01', period_end: '2026-09-30',
  planned_budget: 0, spend: 0, impressions: 0, clicks: 0,
  whatsapp_contacts: 0, leads: 0, sales: 0, revenue: 0, notes: null,
  target_ctr: null, target_cpc: null, target_cpl: null, target_cpa: null,
  target_roas: null, target_leads: null, target_sales: null,
  target_lead_to_sale_rate: null, target_budget: null,
  created_by: null, created_at: '', updated_at: ''
})
assert(
  kZero.ctr === null && kZero.cpc === null && kZero.cpm === null &&
  kZero.cpl === null && kZero.cpa === null && kZero.roas === null &&
  !Number.isNaN(kZero.ctr) && kZero.ctr !== Infinity,
  'KPI-10', 'Denominador zero retorna null com segurança absoluta (zero NaN/Infinity)'
)

// KPI-11: spend=0 não quebra ROAS nem causa crash
assert(calcRoas(5000, 0) === null, 'KPI-11', 'spend=0 retorna null para ROAS sem quebrar')

// KPI-12: Meta CPC menor é melhor = atingida quando current <= target
const dummyEntry = {
  target_cpc: 3.0, target_roas: 4.0, target_ctr: null, target_cpl: null,
  target_cpa: null, target_leads: null, target_sales: null,
  target_lead_to_sale_rate: null
}
const kpisSample = { cpc: 2.5, roas: 4.5, ctr: null, cpl: null, cpa: null, lead_to_sale_rate: null }
const goals12 = evaluateGoals(dummyEntry, kpisSample)
assert(goals12.cpc.status === 'achieved', 'KPI-12', 'Meta CPC menor é melhor atingida (2.50 <= 3.00)')

// KPI-13: Meta ROAS maior é melhor = atingida quando current >= target
assert(goals12.roas.status === 'achieved', 'KPI-13', 'Meta ROAS maior é melhor atingida (4.50 >= 4.00)')

// KPI-14: Sem meta definida = status neutro ('no_goal')
assert(goals12.cpl.status === 'no_goal', 'KPI-14', 'Métrica sem meta resulta em status neutro no_goal')

// KPI-15: Valores negativos são rejeitados
const valNeg = validateNonNegativeNumber(-10, 'spend')
const valPos = validateNonNegativeNumber(100, 'spend')
const valNan = validateNonNegativeNumber(NaN, 'spend')
assert(!valNeg.ok && valPos.ok && !valNan.ok, 'KPI-15', 'Valores negativos e NaN rejeitados na validação')

// KPI-16: Período inválido rejeitado (data final anterior à inicial e datas malformadas)
const pInv = validatePeriod('2026-09-30', '2026-09-01')
const pVal = validatePeriod('2026-09-01', '2026-09-30')
const dInv = validateIsoDate('data-invalida', 'period_start')
assert(!pInv.ok && pVal.ok && !dInv.ok, 'KPI-16', 'Período invertido e formato de data inválido rejeitados')

console.log('======================================================================')
console.log(`TOTAL CALCULADOR: ${passed} PASS | ${failed} FAIL`)
console.log('======================================================================')

if (failed > 0) {
  process.exit(1)
} else {
  console.log('TODOS OS 16 TESTES DO CALCULADOR DE KPIS FORAM APROVADOS!')
}
