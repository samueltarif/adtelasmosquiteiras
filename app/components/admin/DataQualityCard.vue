<script setup lang="ts">
const props = defineProps<{
  quality: {
    missing_visitor_id: number
    missing_session_id: number
    missing_cta_location: number
    service_cards_missing_key: number
    bots_detected: number
    legacy_synthetic_leads: number
    automated_test_leads: number
    manual_validation_leads: number
  } | null
  loading?: boolean
}>()
</script>

<template>
  <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <Icon name="lucide:shield-check" class="w-4 h-4 text-emerald-400" />
          Qualidade & Saúde da Telemetria
        </h3>
        <p class="text-xs text-slate-500 mt-0.5">Integridade da captura no período</p>
      </div>
      <span class="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">FASE B/C ATIVA</span>
    </div>

    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
      <div v-for="i in 6" :key="i" class="h-16 bg-white/[0.03] rounded-xl"></div>
    </div>

    <div v-else-if="quality" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <!-- Visitor ID missing -->
      <div class="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col">
        <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sem Visitor ID</span>
        <span class="text-lg font-bold mt-1 tabular-nums" :class="quality.missing_visitor_id > 0 ? 'text-amber-400' : 'text-slate-300'">
          {{ quality.missing_visitor_id }}
        </span>
        <span class="text-[10px] text-slate-600">Eventos sem UUID</span>
      </div>

      <!-- Session ID missing -->
      <div class="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col">
        <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sem Session ID</span>
        <span class="text-lg font-bold mt-1 tabular-nums" :class="quality.missing_session_id > 0 ? 'text-amber-400' : 'text-slate-300'">
          {{ quality.missing_session_id }}
        </span>
        <span class="text-[10px] text-slate-600">Eventos sem sessão</span>
      </div>

      <!-- Service cards missing service_key -->
      <div class="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col">
        <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Cards s/ Key</span>
        <span class="text-lg font-bold mt-1 tabular-nums" :class="quality.service_cards_missing_key > 0 ? 'text-rose-400' : 'text-emerald-400'">
          {{ quality.service_cards_missing_key }}
        </span>
        <span class="text-[10px] text-slate-600">Esperado: 0</span>
      </div>

      <!-- Bots filtered -->
      <div class="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col">
        <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Bots Isolados</span>
        <span class="text-lg font-bold text-cyan-400 mt-1 tabular-nums">
          {{ quality.bots_detected }}
        </span>
        <span class="text-[10px] text-slate-600">Excluídos dos KPIs</span>
      </div>

      <!-- Historical synthetic leads -->
      <div class="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col">
        <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Leads Sintéticos</span>
        <span class="text-lg font-bold text-slate-400 mt-1 tabular-nums">
          {{ quality.legacy_synthetic_leads }}
        </span>
        <span class="text-[10px] text-slate-600">Isolados no banco</span>
      </div>

      <!-- Tests filtered -->
      <div class="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col">
        <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Testes Isolados</span>
        <span class="text-lg font-bold text-slate-400 mt-1 tabular-nums">
          {{ quality.automated_test_leads + quality.manual_validation_leads }}
        </span>
        <span class="text-[10px] text-slate-600">Histórico técnico</span>
      </div>
    </div>
  </div>
</template>
