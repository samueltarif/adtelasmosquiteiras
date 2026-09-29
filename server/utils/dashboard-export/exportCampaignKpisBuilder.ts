/**
 * Construtor da Tabela de Exportação de KPIs de Campanhas (Fase 7)
 * Arquivo: server/utils/dashboard-export/exportCampaignKpisBuilder.ts
 * Limite: <= 200 linhas
 */

import { calculateKpis } from '../../../app/utils/campaignKpiCalculator.ts'
import type { ExportTable } from './exportDataBuilder.ts'

export function buildCampaignKpisTable(rawKpis: any[]): ExportTable {
  const headers = [
    'Plataforma', 'Campanha', 'UTM Campaign', 'Início', 'Fim',
    'Orçamento Planejado R$', 'Gasto R$', 'Impressões', 'Cliques', 'WhatsApp',
    'Leads', 'Vendas', 'Receita R$', 'Notas',
    'Meta CTR %', 'Meta CPC R$', 'Meta CPL R$', 'Meta CPA R$', 'Meta ROAS',
    'Meta Leads', 'Meta Vendas', 'Meta Lead->Venda %', 'Meta Orçamento R$',
    'CTR %', 'CPC R$', 'CPM R$', 'Custo por WhatsApp R$', 'CPL R$', 'CPA R$',
    'ROAS', 'Ticket Médio R$', 'Lead -> Venda %', 'Consumo Orçamento %'
  ]

  const rows = (rawKpis || []).map(k => {
    const kpis = calculateKpis(k)
    return [
      k.platform || '-',
      k.campaign_name || '-',
      k.utm_campaign || '-',
      k.period_start || '-',
      k.period_end || '-',
      k.planned_budget !== null && k.planned_budget !== undefined ? Number(k.planned_budget) : null,
      k.spend !== null && k.spend !== undefined ? Number(k.spend) : null,
      k.impressions !== null && k.impressions !== undefined ? Number(k.impressions) : null,
      k.clicks !== null && k.clicks !== undefined ? Number(k.clicks) : null,
      k.whatsapp_contacts !== null && k.whatsapp_contacts !== undefined ? Number(k.whatsapp_contacts) : null,
      k.leads !== null && k.leads !== undefined ? Number(k.leads) : null,
      k.sales !== null && k.sales !== undefined ? Number(k.sales) : null,
      k.revenue !== null && k.revenue !== undefined ? Number(k.revenue) : null,
      k.notes || '-',
      k.target_ctr !== null && k.target_ctr !== undefined ? Number(k.target_ctr) : null,
      k.target_cpc !== null && k.target_cpc !== undefined ? Number(k.target_cpc) : null,
      k.target_cpl !== null && k.target_cpl !== undefined ? Number(k.target_cpl) : null,
      k.target_cpa !== null && k.target_cpa !== undefined ? Number(k.target_cpa) : null,
      k.target_roas !== null && k.target_roas !== undefined ? Number(k.target_roas) : null,
      k.target_leads !== null && k.target_leads !== undefined ? Number(k.target_leads) : null,
      k.target_sales !== null && k.target_sales !== undefined ? Number(k.target_sales) : null,
      k.target_lead_to_sale_rate !== null && k.target_lead_to_sale_rate !== undefined ? Number(k.target_lead_to_sale_rate) : null,
      k.target_budget !== null && k.target_budget !== undefined ? Number(k.target_budget) : null,
      kpis.ctr,
      kpis.cpc,
      kpis.cpm,
      kpis.cost_per_whatsapp,
      kpis.cpl,
      kpis.cpa,
      kpis.roas,
      kpis.avg_ticket,
      kpis.lead_to_sale_rate,
      kpis.budget_consumption
    ]
  })

  return {
    key: 'campaign_kpis',
    title: 'KPIs de Campanhas',
    headers,
    rows
  }
}
