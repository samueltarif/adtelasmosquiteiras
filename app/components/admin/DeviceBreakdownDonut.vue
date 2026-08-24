<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  devices: Array<{
    name: string
    count: number
    percentage: number
  }>
  loading?: boolean
}>()

const total = computed(() => (props.devices || []).reduce((acc, d) => acc + d.count, 0))

const dR = 50
const dS = 12
const dC = 2 * Math.PI * dR

const colors: Record<string, string> = {
  Mobile: '#06b6d4',
  Desktop: '#6366f1',
  Tablet: '#f59e0b',
  Outros: '#64748b'
}

const icons: Record<string, string> = {
  Mobile: 'lucide:smartphone',
  Desktop: 'lucide:monitor',
  Tablet: 'lucide:tablet',
  Outros: 'lucide:help-circle'
}

const arcs = computed(() => {
  if (total.value === 0 || !props.devices) return []
  let offset = 0
  const gap = 3

  return props.devices.map(d => {
    const frac = d.count / total.value
    const len = frac * dC
    const arc = {
      name: d.name,
      count: d.count,
      pct: d.percentage,
      color: colors[d.name] || '#94a3b8',
      icon: icons[d.name] || 'lucide:circle',
      dasharray: `${Math.max(len - gap, 0)} ${dC}`,
      offset: -offset
    }
    offset += len
    return arc
  })
})
</script>

<template>
  <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <Icon name="lucide:laptop" class="w-4 h-4 text-violet-400" />
          Dispositivos
        </h3>
        <p class="text-xs text-slate-500 mt-0.5">Distribuição do tráfego humano</p>
      </div>
      <Icon name="lucide:pie-chart" class="w-4 h-4 text-slate-600" />
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
          <span class="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Pageviews</span>
        </div>
      </div>

      <!-- Legend -->
      <div class="w-full flex flex-col gap-2">
        <div v-if="total === 0" class="text-center text-slate-500 text-xs py-2">
          Nenhum pageview registrado no período.
        </div>
        <div v-else v-for="d in devices" :key="d.name" class="flex items-center justify-between px-2 py-1 rounded-lg bg-white/[0.02]">
          <div class="flex items-center gap-2">
            <Icon :name="icons[d.name] || 'lucide:circle'" class="w-3.5 h-3.5" :style="{ color: colors[d.name] || '#94a3b8' }" />
            <span class="text-xs text-slate-300 font-medium">{{ d.name }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500 tabular-nums">{{ d.count.toLocaleString('pt-BR') }}</span>
            <span class="text-xs font-bold text-white tabular-nums">{{ d.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
