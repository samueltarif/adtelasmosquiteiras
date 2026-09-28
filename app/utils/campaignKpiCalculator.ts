// app/utils/campaignKpiCalculator.ts
// Funções PURAS de cálculo de KPIs de campanhas.
// Nunca retornam NaN, Infinity ou -Infinity.
// Retornam null quando o denominador é 0 ou dados insuficientes.

import type { CampaignKpiEntry, CampaignKpis } from '../types/campaignKpi'

/**
 * Divisão segura: retorna null se denominador <= 0 ou resultado inválido.
 */
function safeDivide(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null) return null
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null
  if (denominator <= 0) return null
  const result = numerator / denominator
  if (!Number.isFinite(result)) return null
  return result
}

/**
 * Arredonda para 2 casas decimais (ou retorna null).
 */
function round2(value: number | null): number | null {
  if (value === null) return null
  return Math.round(value * 100) / 100
}

/**
 * CTR = clicks / impressions * 100
 */
export function calcCtr(clicks: number | null, impressions: number | null): number | null {
  return round2(safeDivide(clicks !== null ? clicks * 100 : null, impressions))
}

/**
 * CPC = spend / clicks
 */
export function calcCpc(spend: number | null, clicks: number | null): number | null {
  return round2(safeDivide(spend, clicks))
}

/**
 * CPM = spend / impressions * 1000
 */
export function calcCpm(spend: number | null, impressions: number | null): number | null {
  return round2(safeDivide(spend !== null ? spend * 1000 : null, impressions))
}

/**
 * Custo por WhatsApp = spend / whatsapp_contacts
 */
export function calcCostPerWhatsapp(spend: number | null, whatsapp: number | null): number | null {
  return round2(safeDivide(spend, whatsapp))
}

/**
 * Taxa Clique -> WhatsApp = whatsapp_contacts / clicks * 100
 */
export function calcClickToWhatsappRate(whatsapp: number | null, clicks: number | null): number | null {
  return round2(safeDivide(whatsapp !== null ? whatsapp * 100 : null, clicks))
}

/**
 * Taxa Clique -> Lead = leads / clicks * 100
 */
export function calcClickToLeadRate(leads: number | null, clicks: number | null): number | null {
  return round2(safeDivide(leads !== null ? leads * 100 : null, clicks))
}

/**
 * Taxa WhatsApp -> Lead = leads / whatsapp_contacts * 100
 */
export function calcWhatsappToLeadRate(leads: number | null, whatsapp: number | null): number | null {
  return round2(safeDivide(leads !== null ? leads * 100 : null, whatsapp))
}

/**
 * Taxa Lead -> Venda = sales / leads * 100
 */
export function calcLeadToSaleRate(sales: number | null, leads: number | null): number | null {
  return round2(safeDivide(sales !== null ? sales * 100 : null, leads))
}

/**
 * CPL = spend / leads
 */
export function calcCpl(spend: number | null, leads: number | null): number | null {
  return round2(safeDivide(spend, leads))
}

/**
 * CPA = spend / sales
 */
export function calcCpa(spend: number | null, sales: number | null): number | null {
  return round2(safeDivide(spend, sales))
}

/**
 * ROAS = revenue / spend
 */
export function calcRoas(revenue: number | null, spend: number | null): number | null {
  return round2(safeDivide(revenue, spend))
}

/**
 * Consumo de orçamento = spend / planned_budget * 100
 */
export function calcBudgetConsumption(spend: number | null, planned: number | null): number | null {
  return round2(safeDivide(spend !== null ? spend * 100 : null, planned))
}

/**
 * Ticket Médio = revenue / sales
 */
export function calcAvgTicket(revenue: number | null, sales: number | null): number | null {
  return round2(safeDivide(revenue, sales))
}

/**
 * Calcula todos os KPIs de uma entrada de campanha.
 */
export function calculateKpis(entry: CampaignKpiEntry): CampaignKpis {
  return {
    ctr: calcCtr(entry.clicks, entry.impressions),
    cpc: calcCpc(entry.spend, entry.clicks),
    cpm: calcCpm(entry.spend, entry.impressions),
    cost_per_whatsapp: calcCostPerWhatsapp(entry.spend, entry.whatsapp_contacts),
    click_to_whatsapp_rate: calcClickToWhatsappRate(entry.whatsapp_contacts, entry.clicks),
    click_to_lead_rate: calcClickToLeadRate(entry.leads, entry.clicks),
    whatsapp_to_lead_rate: calcWhatsappToLeadRate(entry.leads, entry.whatsapp_contacts),
    lead_to_sale_rate: calcLeadToSaleRate(entry.sales, entry.leads),
    cpl: calcCpl(entry.spend, entry.leads),
    cpa: calcCpa(entry.spend, entry.sales),
    roas: calcRoas(entry.revenue, entry.spend),
    budget_consumption: calcBudgetConsumption(entry.spend, entry.planned_budget),
    avg_ticket: calcAvgTicket(entry.revenue, entry.sales),
  }
}

/**
 * Formata valor monetário brasileiro.
 */
export function formatCurrency(value: number | null): string {
  if (value === null) return 'Sem dados'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Formata percentual.
 */
export function formatPercent(value: number | null): string {
  if (value === null) return 'Sem dados'
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
}

/**
 * Formata número genérico com 2 casas.
 */
export function formatNumber(value: number | null, suffix = ''): string {
  if (value === null) return 'Sem dados'
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}${suffix}`
}
