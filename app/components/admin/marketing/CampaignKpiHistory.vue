<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { CampaignKpiEntry } from '../../../types/campaignKpi'
import { PLATFORM_LABELS } from '../../../types/campaignKpi'
import { calculateKpis, formatCurrency, formatPercent } from '../../../utils/campaignKpiCalculator'

const props = defineProps<{
  entries: CampaignKpiEntry[]
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [entry: CampaignKpiEntry]
  delete: [id: string]
}>()

// ── Filtros ──
const filterPlatform = ref('')
const filterFrom = ref('')
const filterTo = ref('')
const sortOrder = ref<'desc' | 'asc'>('desc')

const filtered = computed(() => {
  let list = [...props.entries]

  if (filterPlatform.value) {
    list = list.filter(e => e.platform === filterPlatform.value)
  }
  if (filterFrom.value) {
    list = list.filter(e => e.period_start >= filterFrom.value)
  }
  if (filterTo.value) {
    list = list.filter(e => e.period_end <= filterTo.value)
  }

  list.sort((a, b) => {
    const d = a.period_start.localeCompare(b.period_start)
    return sortOrder.value === 'desc' ? -d : d
  })

  return list
})

function fmtDate(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function platformLabel(p: string): string {
  return PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS] ?? p
}

const PLATFORM_OPTIONS = [
  { value: '', label: 'Todas as plataformas' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'instagram_ads', label: 'Instagram Ads' },
  { value: 'facebook_ads', label: 'Facebook Ads' },
  { value: 'tiktok_ads', label: 'TikTok Ads' },
  { value: 'microsoft_ads', label: 'Microsoft Ads' },
  { value: 'outro', label: 'Outro' },
]
</script>

<template>
  <div class="flex flex-col gap-4 w-full max-w-full min-w-0">

    <!-- Filtros -->
    <div class="flex flex-wrap gap-2 items-end">
      <select v-model="filterPlatform" id="kpi-history-platform"
        class="bg-slate-800 border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <option v-for="opt in PLATFORM_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>

      <div class="flex gap-2 items-center">
        <input v-model="filterFrom" id="kpi-history-from" type="date"
          class="bg-slate-800 border border-white/10 text-white text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <span class="text-xs text-slate-500">até</span>
        <input v-model="filterTo" id="kpi-history-to" type="date"
          class="bg-slate-800 border border-white/10 text-white text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <button @click="sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'" id="kpi-history-sort"
        class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
        <Icon :name="sortOrder === 'desc' ? 'lucide:arrow-down' : 'lucide:arrow-up'" class="w-3 h-3" />
        {{ sortOrder === 'desc' ? 'Mais recentes' : 'Mais antigos' }}
      </button>

      <span class="text-xs text-slate-500 ml-auto">{{ filtered.length }} {{ filtered.length === 1 ? 'entrada' : 'entradas' }}</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-8 text-center text-xs text-slate-500 animate-pulse">Carregando histórico...</div>

    <!-- Vazio -->
    <div v-else-if="!filtered.length"
      class="py-10 text-center text-xs text-slate-500 bg-white/5 border border-white/10 rounded-2xl">
      Nenhuma campanha encontrada. Cadastre a primeira!
    </div>

    <!-- Lista -->
    <div v-else class="flex flex-col gap-2">
      <div v-for="entry in filtered" :key="entry.id"
        class="group w-full max-w-full min-w-0 bg-white/5 border border-white/10 hover:border-indigo-500/40 rounded-2xl p-4 transition-all cursor-pointer"
        @click="emit('select', entry)">
        <div class="flex flex-col sm:flex-row sm:items-start gap-3 justify-between min-w-0">
          <div class="flex flex-col gap-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {{ platformLabel(entry.platform) }}
              </span>
              <span v-if="entry.utm_campaign" class="text-[10px] text-slate-500 font-mono">{{ entry.utm_campaign }}</span>
            </div>
            <p class="text-sm font-bold text-white truncate max-w-full">{{ entry.campaign_name }}</p>
            <p class="text-xs text-slate-500">{{ fmtDate(entry.period_start) }} → {{ fmtDate(entry.period_end) }}</p>
          </div>

          <!-- Mini KPIs -->
          <div class="flex gap-4 flex-shrink-0 text-right">
            <div class="flex flex-col">
              <span class="text-[10px] text-slate-500">Gasto</span>
              <span class="text-xs font-bold text-white">{{ formatCurrency(entry.spend) }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] text-slate-500">Leads</span>
              <span class="text-xs font-bold text-amber-400">{{ entry.leads !== null ? entry.leads : '—' }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] text-slate-500">ROAS</span>
              <span class="text-xs font-bold text-emerald-400">
                {{ (() => { const k = calculateKpis(entry); return k.roas !== null ? k.roas + 'x' : '—' })() }}
              </span>
            </div>
            <!-- Delete -->
            <button
              @click.stop="emit('delete', entry.id)"
              :id="`kpi-delete-${entry.id}`"
              class="ml-2 p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100">
              <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
