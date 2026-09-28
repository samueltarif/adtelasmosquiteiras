<script setup lang="ts">
import { computed } from 'vue'
import type { CampaignKpiEntry } from '../../../types/campaignKpi'
import { formatPercent } from '../../../utils/campaignKpiCalculator'

const props = defineProps<{ entry: CampaignKpiEntry }>()

interface FunnelStep {
  id: string
  label: string
  value: number | null
  rate: number | null  // taxa para próxima etapa (%)
  color: string
}

function safeRate(num: number | null, den: number | null): number | null {
  if (num === null || den === null || den <= 0) return null
  const r = (num / den) * 100
  return Number.isFinite(r) ? Math.round(r * 10) / 10 : null
}

const steps = computed((): FunnelStep[] => {
  const e = props.entry
  return [
    {
      id: 'funnel-impressions', label: 'Impressões', color: 'slate',
      value: e.impressions,
      rate: safeRate(e.clicks, e.impressions),
    },
    {
      id: 'funnel-clicks', label: 'Cliques', color: 'cyan',
      value: e.clicks,
      rate: safeRate(e.whatsapp_contacts, e.clicks),
    },
    {
      id: 'funnel-whatsapp', label: 'WhatsApp', color: 'emerald',
      value: e.whatsapp_contacts,
      rate: safeRate(e.leads, e.whatsapp_contacts),
    },
    {
      id: 'funnel-leads', label: 'Leads', color: 'amber',
      value: e.leads,
      rate: safeRate(e.sales, e.leads),
    },
    {
      id: 'funnel-sales', label: 'Vendas', color: 'violet',
      value: e.sales,
      rate: null,  // última etapa
    },
  ]
})

const colorMap: Record<string, string> = {
  slate:   'border-slate-500/40 bg-slate-500/10 text-slate-300',
  cyan:    'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  amber:   'border-amber-500/40 bg-amber-500/10 text-amber-300',
  violet:  'border-violet-500/40 bg-violet-500/10 text-violet-300',
}
</script>

<template>
  <div class="w-full max-w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Funil da Campanha</p>
    <div class="flex flex-col items-center gap-0 w-full max-w-xs mx-auto">
      <template v-for="(step, idx) in steps" :key="step.id">
        <!-- Etapa -->
        <div :id="step.id"
          class="w-full border rounded-xl px-4 py-3 text-center transition-all"
          :class="colorMap[step.color]">
          <p class="text-xs font-semibold uppercase tracking-wide opacity-80">{{ step.label }}</p>
          <p class="text-xl font-extrabold mt-0.5">
            {{ step.value !== null ? step.value.toLocaleString('pt-BR') : '—' }}
          </p>
          <p v-if="step.value === null" class="text-[10px] text-slate-500 mt-0.5">Sem dados</p>
        </div>

        <!-- Seta + taxa de conversão -->
        <div v-if="idx < steps.length - 1" class="flex flex-col items-center py-1.5 gap-0.5">
          <div class="text-[10px] font-semibold text-slate-400">
            {{ step.rate !== null ? `↓ ${formatPercent(step.rate)}` : '↓' }}
          </div>
          <div v-if="step.rate === null" class="text-[9px] text-slate-600">Sem dados</div>
        </div>
      </template>
    </div>
  </div>
</template>
