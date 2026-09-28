<script setup lang="ts">
import { computed } from 'vue'
import type { CampaignKpiEntry, CampaignKpis, CampaignGoals } from '../../../types/campaignKpi'
import { calculateKpis, formatCurrency, formatPercent, formatNumber } from '../../../utils/campaignKpiCalculator'
import { evaluateGoals, goalStatusLabel } from '../../../utils/campaignKpiGoals'

const props = defineProps<{
  entry: CampaignKpiEntry
  kpis?: CampaignKpis
  goals?: CampaignGoals
}>()

const activeKpis = computed(() => props.kpis || calculateKpis(props.entry))
const activeGoals = computed(() => props.goals || evaluateGoals(props.entry, activeKpis.value))

interface KpiCard {
  id: string
  label: string
  value: string
  tooltip: string
  goalStatus?: 'achieved' | 'not_achieved' | 'no_goal'
  goalText?: string
  color: string
}

const investmentCards = computed((): KpiCard[] => [
  {
    id: 'card-spend', label: 'Valor Gasto', color: 'violet',
    value: formatCurrency(props.entry.spend),
    tooltip: 'Investimento total informado pela plataforma.',
  },
  {
    id: 'card-impressions', label: 'Impressões', color: 'slate',
    value: props.entry.impressions !== null ? props.entry.impressions.toLocaleString('pt-BR') : 'Sem dados',
    tooltip: 'Total de vezes que o anúncio foi exibido.',
  },
  {
    id: 'card-clicks', label: 'Cliques', color: 'cyan',
    value: props.entry.clicks !== null ? props.entry.clicks.toLocaleString('pt-BR') : 'Sem dados',
    tooltip: 'Total de cliques informados pela plataforma.',
  },
  {
    id: 'card-whatsapp', label: 'WhatsApp', color: 'emerald',
    value: props.entry.whatsapp_contacts !== null ? props.entry.whatsapp_contacts.toLocaleString('pt-BR') : 'Sem dados',
    tooltip: 'Contatos/conversas iniciadas via WhatsApp.',
  },
  {
    id: 'card-leads', label: 'Leads', color: 'amber',
    value: props.entry.leads !== null ? props.entry.leads.toLocaleString('pt-BR') : 'Sem dados',
    tooltip: 'Leads gerados no período.',
    goalStatus: activeGoals.value.leads.status,
    goalText: activeGoals.value.leads.target !== null ? `Meta: ${activeGoals.value.leads.target}` : undefined,
  },
  {
    id: 'card-sales', label: 'Vendas', color: 'emerald',
    value: props.entry.sales !== null ? props.entry.sales.toLocaleString('pt-BR') : 'Sem dados',
    tooltip: 'Conversões/vendas no período.',
    goalStatus: activeGoals.value.sales.status,
    goalText: activeGoals.value.sales.target !== null ? `Meta: ${activeGoals.value.sales.target}` : undefined,
  },
  {
    id: 'card-revenue', label: 'Receita', color: 'emerald',
    value: formatCurrency(props.entry.revenue),
    tooltip: 'Receita total atribuída à campanha.',
  },
])

const efficiencyCards = computed((): KpiCard[] => [
  {
    id: 'card-ctr', label: 'CTR', color: 'indigo',
    value: formatPercent(activeKpis.value.ctr),
    tooltip: 'Percentual de impressões que resultaram em clique.',
    goalStatus: activeGoals.value.ctr.status,
    goalText: activeGoals.value.ctr.target !== null ? `Meta: ${activeGoals.value.ctr.target}%` : undefined,
  },
  {
    id: 'card-cpc', label: 'CPC', color: 'rose',
    value: formatCurrency(activeKpis.value.cpc),
    tooltip: 'Custo médio de cada clique.',
    goalStatus: activeGoals.value.cpc.status,
    goalText: activeGoals.value.cpc.target !== null ? `Meta: ${formatCurrency(activeGoals.value.cpc.target)}` : undefined,
  },
  {
    id: 'card-cpm', label: 'CPM', color: 'slate',
    value: formatCurrency(activeKpis.value.cpm),
    tooltip: 'Custo médio para cada mil impressões.',
  },
  {
    id: 'card-cost-whatsapp', label: 'Custo/WhatsApp', color: 'emerald',
    value: formatCurrency(activeKpis.value.cost_per_whatsapp),
    tooltip: 'Custo médio de cada contato iniciado pelo WhatsApp.',
  },
  {
    id: 'card-cpl', label: 'CPL', color: 'amber',
    value: formatCurrency(activeKpis.value.cpl),
    tooltip: 'Custo médio para gerar um lead.',
    goalStatus: activeGoals.value.cpl.status,
    goalText: activeGoals.value.cpl.target !== null ? `Meta: ${formatCurrency(activeGoals.value.cpl.target)}` : undefined,
  },
  {
    id: 'card-cpa', label: 'CPA', color: 'rose',
    value: formatCurrency(activeKpis.value.cpa),
    tooltip: 'Custo médio por venda/conversão.',
    goalStatus: activeGoals.value.cpa.status,
    goalText: activeGoals.value.cpa.target !== null ? `Meta: ${formatCurrency(activeGoals.value.cpa.target)}` : undefined,
  },
  {
    id: 'card-roas', label: 'ROAS', color: 'emerald',
    value: formatNumber(activeKpis.value.roas, 'x'),
    tooltip: 'Receita gerada para cada R$ 1 investido.',
    goalStatus: activeGoals.value.roas.status,
    goalText: activeGoals.value.roas.target !== null ? `Meta: ${activeGoals.value.roas.target}x` : undefined,
  },
  {
    id: 'card-ticket', label: 'Ticket Médio', color: 'violet',
    value: formatCurrency(activeKpis.value.avg_ticket),
    tooltip: 'Receita média por venda.',
  },
])

const colorClass: Record<string, string> = {
  cyan: 'text-cyan-400 bg-cyan-400/10',
  violet: 'text-violet-400 bg-violet-400/10',
  emerald: 'text-emerald-400 bg-emerald-400/10',
  amber: 'text-amber-400 bg-amber-400/10',
  rose: 'text-rose-400 bg-rose-400/10',
  indigo: 'text-indigo-400 bg-indigo-400/10',
  slate: 'text-slate-400 bg-slate-400/10',
}

function goalBadgeClass(status?: string) {
  if (status === 'achieved') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  if (status === 'not_achieved') return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
  return 'bg-slate-500/20 text-slate-500 border-slate-500/30'
}
</script>

<template>
  <div class="flex flex-col gap-4 w-full max-w-full min-w-0">
    <!-- Investimento e resultados -->
    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Investimento & Resultados</p>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
      <div v-for="card in investmentCards" :key="card.id" :id="card.id"
        class="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-1.5 min-w-0">
        <span class="text-xs text-slate-400 truncate" :title="card.tooltip">{{ card.label }}</span>
        <span class="text-sm font-bold text-white break-words" :class="colorClass[card.color]?.split(' ')[0]">{{ card.value }}</span>
        <div v-if="card.goalStatus && card.goalStatus !== 'no_goal'"
          class="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold w-fit"
          :class="goalBadgeClass(card.goalStatus)">
          {{ card.goalStatus === 'achieved' ? '✓ Meta atingida' : '✗ Fora da meta' }}
        </div>
        <span v-if="card.goalText" class="text-[10px] text-slate-500">{{ card.goalText }}</span>
      </div>
    </div>

    <!-- KPIs de eficiência -->
    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">KPIs de Eficiência</p>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2.5">
      <div v-for="card in efficiencyCards" :key="card.id" :id="card.id"
        class="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-1.5 min-w-0">
        <span class="text-xs text-slate-400 truncate" :title="card.tooltip">{{ card.label }}</span>
        <span class="text-sm font-bold text-white break-words">{{ card.value }}</span>
        <div v-if="card.goalStatus && card.goalStatus !== 'no_goal'"
          class="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold w-fit"
          :class="goalBadgeClass(card.goalStatus)">
          {{ card.goalStatus === 'achieved' ? '✓ Meta atingida' : '✗ Fora da meta' }}
        </div>
        <span v-if="card.goalText" class="text-[10px] text-slate-500">{{ card.goalText }}</span>
      </div>
    </div>
  </div>
</template>
