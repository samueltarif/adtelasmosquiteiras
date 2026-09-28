<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CampaignKpiEntry } from '../../../types/campaignKpi'
import { PLATFORM_LABELS } from '../../../types/campaignKpi'
import { calculateKpis, formatCurrency, formatPercent } from '../../../utils/campaignKpiCalculator'

const props = defineProps<{
  entries: CampaignKpiEntry[]
}>()

const selectedIds = ref<string[]>([])

function toggleSelect(id: string) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  } else {
    selectedIds.value.push(id)
  }
}

const selectedEntries = computed(() => {
  return props.entries.filter(e => selectedIds.value.includes(e.id))
})

const comparedData = computed(() => {
  return selectedEntries.value.map(entry => ({
    entry,
    kpis: calculateKpis(entry)
  }))
})
</script>

<template>
  <div class="flex flex-col gap-5 w-full max-w-full min-w-0">
    <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
      <h3 class="text-sm font-bold text-white mb-1">Comparação entre Campanhas</h3>
      <p class="text-xs text-slate-400 mb-3">
        Selecione duas ou mais campanhas para analisar métricas lado a lado. Sem rankings automáticos arbitrários.
      </p>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="e in entries"
          :key="e.id"
          @click="toggleSelect(e.id)"
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
          :class="selectedIds.includes(e.id)
            ? 'bg-indigo-600/30 border-indigo-500 text-white'
            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'"
        >
          <Icon :name="selectedIds.includes(e.id) ? 'lucide:check-square' : 'lucide:square'" class="w-3.5 h-3.5" />
          <span class="font-bold">[{{ PLATFORM_LABELS[e.platform] ?? e.platform }}]</span>
          <span class="truncate max-w-[140px]">{{ e.campaign_name }}</span>
        </button>
      </div>
    </div>

    <div v-if="selectedEntries.length < 2" class="py-8 text-center text-xs text-slate-500 bg-white/5 border border-white/10 rounded-2xl">
      Selecione ao menos 2 campanhas acima para comparar.
    </div>

    <div v-else class="overflow-x-auto w-full max-w-full rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-sm">
      <table class="w-full text-xs text-left border-collapse min-w-[600px]">
        <thead>
          <tr class="border-b border-white/10 bg-white/5">
            <th class="p-3 font-semibold text-slate-300">Indicador</th>
            <th v-for="col in comparedData" :key="col.entry.id" class="p-3 font-bold text-white text-right">
              <div>{{ col.entry.campaign_name }}</div>
              <span class="text-[10px] font-normal text-indigo-400">{{ PLATFORM_LABELS[col.entry.platform] ?? col.entry.platform }}</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5 text-slate-300">
          <tr>
            <td class="p-3 font-medium text-slate-400">Investimento</td>
            <td v-for="col in comparedData" :key="col.entry.id" class="p-3 text-right font-semibold text-white">
              {{ formatCurrency(col.entry.spend) }}
            </td>
          </tr>
          <tr>
            <td class="p-3 font-medium text-slate-400">Impressões</td>
            <td v-for="col in comparedData" :key="col.entry.id" class="p-3 text-right">
              {{ col.entry.impressions ?? '—' }}
            </td>
          </tr>
          <tr>
            <td class="p-3 font-medium text-slate-400">Cliques</td>
            <td v-for="col in comparedData" :key="col.entry.id" class="p-3 text-right">
              {{ col.entry.clicks ?? '—' }}
            </td>
          </tr>
          <tr>
            <td class="p-3 font-medium text-slate-400">CTR</td>
            <td v-for="col in comparedData" :key="col.entry.id" class="p-3 text-right font-medium text-cyan-300">
              {{ formatPercent(col.kpis.ctr) }}
            </td>
          </tr>
          <tr>
            <td class="p-3 font-medium text-slate-400">CPC</td>
            <td v-for="col in comparedData" :key="col.entry.id" class="p-3 text-right">
              {{ formatCurrency(col.kpis.cpc) }}
            </td>
          </tr>
          <tr>
            <td class="p-3 font-medium text-slate-400">WhatsApp</td>
            <td v-for="col in comparedData" :key="col.entry.id" class="p-3 text-right text-emerald-400 font-semibold">
              {{ col.entry.whatsapp_contacts ?? '—' }}
            </td>
          </tr>
          <tr>
            <td class="p-3 font-medium text-slate-400">Leads</td>
            <td v-for="col in comparedData" :key="col.entry.id" class="p-3 text-right text-amber-400 font-semibold">
              {{ col.entry.leads ?? '—' }}
            </td>
          </tr>
          <tr>
            <td class="p-3 font-medium text-slate-400">CPL</td>
            <td v-for="col in comparedData" :key="col.entry.id" class="p-3 text-right">
              {{ formatCurrency(col.kpis.cpl) }}
            </td>
          </tr>
          <tr>
            <td class="p-3 font-medium text-slate-400">Vendas</td>
            <td v-for="col in comparedData" :key="col.entry.id" class="p-3 text-right text-emerald-300 font-semibold">
              {{ col.entry.sales ?? '—' }}
            </td>
          </tr>
          <tr>
            <td class="p-3 font-medium text-slate-400">CPA</td>
            <td v-for="col in comparedData" :key="col.entry.id" class="p-3 text-right">
              {{ formatCurrency(col.kpis.cpa) }}
            </td>
          </tr>
          <tr>
            <td class="p-3 font-medium text-slate-400">Receita</td>
            <td v-for="col in comparedData" :key="col.entry.id" class="p-3 text-right font-semibold text-emerald-400">
              {{ formatCurrency(col.entry.revenue) }}
            </td>
          </tr>
          <tr>
            <td class="p-3 font-medium text-slate-400">ROAS</td>
            <td v-for="col in comparedData" :key="col.entry.id" class="p-3 text-right font-bold text-emerald-400">
              {{ col.kpis.roas !== null ? col.kpis.roas + 'x' : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
