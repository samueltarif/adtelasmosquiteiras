<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  newVisitors: number
  returningVisitors: number
  newPercentage: number
  returningPercentage: number
  loading?: boolean
}>()

const total = computed(() => (props.newVisitors || 0) + (props.returningVisitors || 0))

const dR = 50
const dS = 12
const dC = 2 * Math.PI * dR

const arcs = computed(() => {
  if (total.value === 0) return []
  const newFrac = props.newVisitors / total.value
  const retFrac = props.returningVisitors / total.value

  const newLen = newFrac * dC
  const retLen = retFrac * dC
  const gap = 3

  return [
    {
      name: 'Novos Visitantes',
      count: props.newVisitors,
      pct: props.newPercentage,
      color: '#06b6d4',
      dasharray: `${Math.max(newLen - gap, 0)} ${dC}`,
      offset: 0
    },
    {
      name: 'Recorrentes',
      count: props.returningVisitors,
      pct: props.returningPercentage,
      color: '#8b5cf6',
      dasharray: `${Math.max(retLen - gap, 0)} ${dC}`,
      offset: -newLen
    }
  ]
})
</script>

<template>
  <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <Icon name="lucide:user-check" class="w-4 h-4 text-cyan-400" />
          Novos vs Recorrentes
        </h3>
        <p class="text-xs text-slate-500 mt-0.5">Baseado na 1ª aparição histórica (visitor_id)</p>
      </div>
      <Icon name="lucide:repeat" class="w-4 h-4 text-slate-600" />
    </div>

    <!-- Chart Container -->
    <div class="flex-1 flex flex-col items-center justify-center gap-5">
      <div class="relative w-36 h-36">
        <svg v-if="!loading && total > 0" class="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
          <circle cx="65" cy="65" :r="dR" fill="none" stroke="white" stroke-opacity="0.04" :stroke-width="dS" />
          <circle 
            v-for="(a, i) in arcs" 
            :key="i" 
            cx="65" 
            cy="65" 
            :r="dR" 
            fill="none" 
            :stroke="a.color" 
            :stroke-width="dS" 
            :stroke-dasharray="a.dasharray" 
            :stroke-dashoffset="a.offset" 
            stroke-linecap="round"
            class="transition-all duration-700" 
          />
        </svg>

        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span class="text-xl font-extrabold text-white tabular-nums">{{ total.toLocaleString('pt-BR') }}</span>
          <span class="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Visitantes</span>
        </div>
      </div>

      <!-- Legend -->
      <div class="w-full flex flex-col gap-2">
        <div v-if="total === 0" class="text-center text-slate-500 text-xs py-2">
          Nenhum visitante registrado no período.
        </div>
        <div v-else v-for="a in arcs" :key="a.name" class="flex items-center justify-between px-2 py-1 rounded-lg bg-white/[0.02]">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: a.color }"></span>
            <span class="text-xs text-slate-300 font-medium">{{ a.name }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500 tabular-nums">{{ a.count.toLocaleString('pt-BR') }}</span>
            <span class="text-xs font-bold text-white tabular-nums">{{ a.pct }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
