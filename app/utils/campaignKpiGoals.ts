// app/utils/campaignKpiGoals.ts
// Avaliação de metas definidas pelo usuário.
// NÃO cria benchmarks de mercado.
// NÃO afirma que valores "são ruins" sem meta definida.

import type { CampaignKpiEntry, CampaignKpis, CampaignGoals, GoalResult } from '../types/campaignKpi'

/**
 * Avalia uma meta onde MENOR valor atual é MELHOR (CPC, CPL, CPA, Custo/WhatsApp).
 * Meta atingida quando: current <= target.
 */
function evaluateLowerIsBetter(current: number | null, target: number | null): GoalResult {
  if (target === null) return { status: 'no_goal', current, target: null }
  if (current === null) return { status: 'no_goal', current: null, target }
  return {
    status: current <= target ? 'achieved' : 'not_achieved',
    current,
    target,
  }
}

/**
 * Avalia uma meta onde MAIOR valor atual é MELHOR (CTR, ROAS, leads, vendas, taxas).
 * Meta atingida quando: current >= target.
 */
function evaluateHigherIsBetter(current: number | null, target: number | null): GoalResult {
  if (target === null) return { status: 'no_goal', current, target: null }
  if (current === null) return { status: 'no_goal', current: null, target }
  return {
    status: current >= target ? 'achieved' : 'not_achieved',
    current,
    target,
  }
}

/**
 * Avalia todas as metas de uma entrada de campanha contra os KPIs calculados.
 * Não inventa tolerância. Apenas 'achieved' | 'not_achieved' | 'no_goal'.
 */
export function evaluateGoals(entry: CampaignKpiEntry, kpis: CampaignKpis): CampaignGoals {
  return {
    // MENOR é melhor
    cpc: evaluateLowerIsBetter(kpis.cpc, entry.target_cpc),
    cpl: evaluateLowerIsBetter(kpis.cpl, entry.target_cpl),
    cpa: evaluateLowerIsBetter(kpis.cpa, entry.target_cpa),

    // MAIOR é melhor
    ctr: evaluateHigherIsBetter(kpis.ctr, entry.target_ctr),
    roas: evaluateHigherIsBetter(kpis.roas, entry.target_roas),
    leads: evaluateHigherIsBetter(entry.leads, entry.target_leads !== null ? Number(entry.target_leads) : null),
    sales: evaluateHigherIsBetter(entry.sales, entry.target_sales !== null ? Number(entry.target_sales) : null),
    lead_to_sale_rate: evaluateHigherIsBetter(kpis.lead_to_sale_rate, entry.target_lead_to_sale_rate),
  }
}

/**
 * Label legível do status da meta.
 */
export function goalStatusLabel(status: GoalResult['status']): string {
  switch (status) {
    case 'achieved':     return 'Meta atingida'
    case 'not_achieved': return 'Meta não atingida'
    case 'no_goal':      return 'Sem meta definida'
  }
}

/**
 * Valida payload numérico: rejeita NaN, Infinity, valores negativos onde indevido.
 * Retorna null se o valor for nulo/undefined.
 * Retorna undefined (erro) se inválido.
 */
export function validateNonNegativeNumber(
  value: unknown,
  fieldName: string
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (value === null || value === undefined || value === '') {
    return { ok: true, value: null }
  }
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return { ok: false, error: `${fieldName}: valor inválido (NaN ou Infinity).` }
  }
  if (num < 0) {
    return { ok: false, error: `${fieldName}: não pode ser negativo.` }
  }
  return { ok: true, value: num }
}

/**
 * Valida uma data ISO (YYYY-MM-DD).
 */
export function validateIsoDate(
  value: unknown,
  fieldName: string
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { ok: false, error: `${fieldName}: data inválida. Use o formato YYYY-MM-DD.` }
  }
  const d = new Date(value)
  if (isNaN(d.getTime())) {
    return { ok: false, error: `${fieldName}: data inválida.` }
  }
  return { ok: true, value }
}

/**
 * Valida que period_end >= period_start.
 */
export function validatePeriod(
  start: string,
  end: string
): { ok: true } | { ok: false; error: string } {
  if (end < start) {
    return { ok: false, error: 'period_end não pode ser anterior a period_start.' }
  }
  return { ok: true }
}
