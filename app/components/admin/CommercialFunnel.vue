<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  funnelData: {
    stages: Array<{
      stage: string
      label: string
      count: number
      rate_from_previous: string
      rate_from_top: string
    }>
    outcomes: {
      won: { count: number; label: string }
      lost: { count: number; label: string }
    }
    is_consistent: boolean
    consistency_warning: string | null
  } | null
  loading?: boolean
}>()

const maxCount = computed(() => {
  const list = props.funnelData?.stages || []
  return Math.max(...list.map(s => s.count), 1)
})

const stageColors = [
  'from-cyan-500 to-blue-600',
  'from-blue-500 to-indigo-600',
  'from-indigo-500 to-violet-600',
  'from-violet-500 to-purple-600',
  'from-purple-500 to-emerald-600',
  'from-emerald-500 to-teal-600'
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Main Funnel Card -->
    <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <Icon name="lucide:filter" class="w-4 h-4 text-violet-400" />
            Funil Comercial Canônico (Pessoas Únicas)
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">Etapas cumulativas baseadas em visitor_id distinto (sem duplicação por cliques múltiplos)</p>
        </div>

        <div v-if="funnelData?.is_consistent" class="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full font-semibold">
          <Icon name="lucide:check-circle" class="w-3.5 h-3.5" />
          Funil Consistente
        </div>
      </div>

      <!-- Warning if inconsistent -->
      <div v-if="funnelData?.consistency_warning" class="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
        <Icon name="lucide:alert-triangle" class="w-4 h-4 shrink-0" />
        <span>{{ funnelData.consistency_warning }}</span>
      </div>

      <!-- Funnel Stages Visualization -->
      <div class="flex flex-col gap-4">
        <div v-if="loading" v-for="i in 5" :key="i" class="animate-pulse h-14 bg-white/[0.03] rounded-xl"></div>
        
        <div 
          v-else-if="funnelData && funnelData.stages.length > 0"
          v-for="(st, idx) in funnelData.stages" 
          :key="st.stage"
          class="flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.015] border border-white/[0.03] hover:bg-white/[0.03] transition-colors"
        >
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-[10px]">
                {{ idx + 1 }}
              </span>
              <span class="font-bold text-white">{{ st.label }}</span>
            </div>

            <div class="flex items-center gap-4 text-xs font-semibold tabular-nums">
              <span class="text-slate-400">vs Anterior: <strong class="text-white">{{ st.rate_from_previous }}</strong></span>
              <span class="text-slate-400">vs Topo: <strong class="text-cyan-400">{{ st.rate_from_top }}</strong></span>
              <span class="text-base font-extrabold text-white">{{ st.count.toLocaleString('pt-BR') }}</span>
            </div>
          </div>

          <!-- Stage Progress Bar -->
          <div class="w-full bg-white/[0.04] rounded-full h-2 overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-700 bg-gradient-to-r"
              :class="stageColors[idx % stageColors.length]"
              :style="{ width: `${Math.max((st.count / maxCount) * 100, 2)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Funnel Outcomes (Won vs Lost) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Won -->
      <div class="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl p-5 flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Negócios Fechados (Won)</span>
          <p class="text-2xl font-extrabold text-white mt-1 tabular-nums">
            {{ funnelData?.outcomes.won.count || 0 }}
          </p>
          <p class="text-[11px] text-emerald-300/80 mt-0.5">Leads com status "Fechado"</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Icon name="lucide:check-check" class="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      <!-- Lost -->
      <div class="rounded-2xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-xl p-5 flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Negócios Perdidos (Lost)</span>
          <p class="text-2xl font-extrabold text-white mt-1 tabular-nums">
            {{ funnelData?.outcomes.lost.count || 0 }}
          </p>
          <p class="text-[11px] text-rose-300/80 mt-0.5">Leads com status "Perdido" (saída do funil)</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Icon name="lucide:x-circle" class="w-6 h-6 text-rose-400" />
        </div>
      </div>
    </div>
  </div>
</template>
