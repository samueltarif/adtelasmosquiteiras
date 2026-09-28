<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CampaignKpiEntry, CampaignTrackingData } from '../../../types/campaignKpi'

const props = defineProps<{
  entry: CampaignKpiEntry
}>()

const loading = ref(false)
const trackingData = ref<CampaignTrackingData | null>(null)
const error = ref('')

async function fetchTrackingData() {
  if (!props.entry.utm_campaign && !props.entry.period_start) return
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({
      from: props.entry.period_start,
      to: props.entry.period_end,
    })
    if (props.entry.utm_campaign) params.set('utm_campaign', props.entry.utm_campaign)

    const res = await $fetch<{ data: CampaignTrackingData }>(`/api/admin/marketing/campaign-kpis/tracking-data?${params}`)
    trackingData.value = res?.data ?? null
  } catch {
    error.value = 'Não foi possível consultar os dados de tracking.'
    trackingData.value = null
  } finally {
    loading.value = false
  }
}

watch(() => props.entry.id, () => {
  trackingData.value = null
  fetchTrackingData()
}, { immediate: true })

function safePercent(num: number | null, den: number | null): string {
  if (num === null || den === null || !Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return '—'
  const r = (num / den) * 100
  return Number.isFinite(r) ? `${r.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—'
}
</script>

<template>
  <div class="w-full max-w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
    <div class="flex items-center justify-between gap-2">
      <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Plataforma × Tracking Proprietário</p>
      <button @click="fetchTrackingData" :disabled="loading" id="kpi-refresh-tracking"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50">
        <Icon name="lucide:refresh-cw" class="w-3 h-3" :class="loading ? 'animate-spin' : ''" />
        Atualizar
      </button>
    </div>

    <!-- Aviso de diferenciação -->
    <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300 leading-relaxed">
      <strong class="font-bold">Atenção:</strong> Os dados abaixo vêm de fontes distintas. Diferenças são normais e podem ocorrer por bloqueadores de ads, privacidade, múltiplos cliques, carregamento interrompido ou critérios diferentes de medição e atribuição.
    </div>

    <div v-if="loading" class="text-xs text-slate-400 text-center py-4 animate-pulse">
      Consultando dados de tracking...
    </div>

    <div v-else-if="error" class="text-xs text-rose-400 text-center py-2">{{ error }}</div>

    <div v-else-if="trackingData" class="flex flex-col gap-3">
      <!-- Comparação de cliques -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Cliques da plataforma -->
        <div id="kpi-platform-clicks"
          class="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 flex flex-col gap-1">
          <p class="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">📊 Plataforma</p>
          <p class="text-xs text-slate-400">Cliques informados</p>
          <p class="text-xl font-extrabold text-white">
            {{ entry.clicks !== null ? entry.clicks.toLocaleString('pt-BR') : '—' }}
          </p>
        </div>

        <!-- Site -->
        <div id="kpi-tracked-sessions"
          class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex flex-col gap-1">
          <p class="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">🌐 Tracking do Site</p>
          <p class="text-xs text-slate-400">Sessões identificadas</p>
          <p class="text-xl font-extrabold text-white">
            {{ trackingData.sessions.toLocaleString('pt-BR') }}
          </p>
        </div>

        <!-- Diferença -->
        <div id="kpi-tracking-diff"
          class="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col gap-1">
          <p class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Diferença</p>
          <p class="text-xs text-slate-400">Taxa de chegada</p>
          <p class="text-xl font-extrabold text-white">
            {{ safePercent(trackingData.sessions, entry.clicks) }}
          </p>
          <p class="text-[10px] text-slate-500 mt-0.5">
            {{ entry.clicks !== null ? `${(entry.clicks - trackingData.sessions).toLocaleString('pt-BR')} não rastreados` : '—' }}
          </p>
        </div>
      </div>

      <!-- Dados detalhados do tracking -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
        <div v-for="item in [
          { id: 'td-pageviews', label: 'Pageviews', val: trackingData.pageviews },
          { id: 'td-whatsapp', label: 'Cliques WhatsApp', val: trackingData.whatsapp_clicks },
          { id: 'td-formstarts', label: 'Inícios de formulário', val: trackingData.lead_form_starts },
          { id: 'td-leads', label: 'Leads (tracking)', val: trackingData.leads },
        ]" :key="item.id" :id="item.id"
          class="rounded-xl border border-white/10 bg-white/5 p-2.5 flex flex-col gap-0.5">
          <p class="text-[10px] text-slate-500">{{ item.label }}</p>
          <p class="text-sm font-bold text-white">{{ item.val.toLocaleString('pt-BR') }}</p>
        </div>
      </div>

      <!-- Intervalo de dados -->
      <div v-if="trackingData.first_seen || trackingData.last_seen" class="text-[10px] text-slate-600 text-right">
        Primeiro acesso: {{ trackingData.first_seen ? new Date(trackingData.first_seen).toLocaleDateString('pt-BR') : '—' }}
        · Último: {{ trackingData.last_seen ? new Date(trackingData.last_seen).toLocaleDateString('pt-BR') : '—' }}
      </div>
    </div>

    <div v-else-if="!entry.utm_campaign" class="text-xs text-slate-500 text-center py-3">
      Defina o campo <span class="font-bold text-slate-400">UTM Campaign</span> para comparar com os dados de tracking.
    </div>
  </div>
</template>
