<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  series: Array<{
    date: string
    unique_visitors: number
    sessions: number
    pageviews: number
    leads: number
    whatsapp: number
  }>
  loading?: boolean
}>()

const chartMode = ref<'visitors' | 'sessions' | 'pageviews' | 'leads'>('visitors')
const hoveredIndex = ref<number | null>(null)

const cW = 600
const cH = 260
const pL = 48
const pR = 16
const pT = 25
const pB = 35

const aW = computed(() => cW - pL - pR)
const aH = computed(() => cH - pT - pB)

const activeData = computed(() => {
  if (!props.series || props.series.length === 0) return []
  return props.series.map((item, idx) => ({
    i: idx,
    date: item.date,
    value: chartMode.value === 'visitors' ? item.unique_visitors :
           chartMode.value === 'sessions' ? item.sessions :
           chartMode.value === 'pageviews' ? item.pageviews : item.leads,
    raw: item
  }))
})

const maxVal = computed(() => {
  const vals = activeData.value.map(d => d.value)
  return Math.ceil(Math.max(...vals, 5) / 5) * 5
})

const points = computed(() => {
  if (!activeData.value.length) return []
  const step = aW.value / Math.max(activeData.value.length - 1, 1)
  return activeData.value.map((d, idx) => ({
    x: pL + idx * step,
    y: pT + aH.value - (d.value / maxVal.value) * aH.value,
    date: d.date,
    value: d.value,
    raw: d.raw,
    i: idx
  }))
})

const linePath = computed(() => {
  const pts = points.value
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const t = 0.35
    const dx = pts[i + 1].x - pts[i].x
    d += ` C ${pts[i].x + dx * t},${pts[i].y} ${pts[i + 1].x - dx * t},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`
  }
  return d
})

const areaPath = computed(() => {
  const pts = points.value
  if (!linePath.value || !pts.length) return ''
  return `${linePath.value} L ${pts[pts.length - 1].x},${cH - pB} L ${pts[0].x},${cH - pB} Z`
})

const yTicks = computed(() => {
  const t = []
  for (let i = 0; i <= 4; i++) {
    t.push({
      val: Math.round((maxVal.value / 4) * (4 - i)),
      y: pT + (aH.value / 4) * i
    })
  }
  return t
})

const colorConfig = computed(() => {
  const map: Record<string, { stroke: string; glow: string; fillStop: string; badge: string; label: string }> = {
    visitors: { stroke: '#06b6d4', glow: '#67e8f9', fillStop: '#06b6d4', badge: 'bg-cyan-500/20 text-cyan-300', label: 'Visitantes Únicos' },
    sessions: { stroke: '#8b5cf6', glow: '#a78bfa', fillStop: '#8b5cf6', badge: 'bg-violet-500/20 text-violet-300', label: 'Sessões' },
    pageviews: { stroke: '#3b82f6', glow: '#60a5fa', fillStop: '#3b82f6', badge: 'bg-blue-500/20 text-blue-300', label: 'Pageviews' },
    leads: { stroke: '#10b981', glow: '#34d399', fillStop: '#10b981', badge: 'bg-emerald-500/20 text-emerald-300', label: 'Leads Reais' }
  }
  return map[chartMode.value] || map.visitors
})

const hoveredPoint = computed(() => {
  if (hoveredIndex.value === null) return null
  return points.value[hoveredIndex.value] || null
})
</script>

<template>
  <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden p-5 flex flex-col">
    <!-- Header with controls -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
      <div>
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <Icon name="lucide:trending-up" class="w-4 h-4 text-cyan-400" />
          Evolução do Tráfego & Conversão
        </h3>
        <p class="text-xs text-slate-500 mt-0.5">Métricas diárias baseadas em visitantes humanos</p>
      </div>

      <!-- Mode Selector Tabs -->
      <div class="grid grid-cols-2 sm:flex bg-white/[0.04] rounded-xl p-1 border border-white/[0.06] w-full sm:w-auto gap-1 sm:gap-0">
        <button 
          v-for="mode in (['visitors', 'sessions', 'pageviews', 'leads'] as const)"
          :key="mode"
          @click="chartMode = mode"
          class="px-2.5 sm:px-3 py-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-all text-center cursor-pointer min-h-[44px] flex items-center justify-center"
          :class="chartMode === mode ? colorConfig.badge : 'text-slate-400 hover:text-slate-200'"
        >
          {{ mode === 'visitors' ? 'Visitantes' : mode === 'sessions' ? 'Sessões' : mode === 'pageviews' ? 'Pageviews' : 'Leads' }}
        </button>
      </div>
    </div>

    <!-- Chart Container -->
    <div class="relative w-full" style="aspect-ratio: 2.3 / 1;">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/[0.01]">
        <Icon name="lucide:loader" class="w-7 h-7 text-indigo-400 animate-spin" />
      </div>

      <!-- Tooltip -->
      <div 
        v-if="hoveredPoint && !loading" 
        class="absolute z-30 pointer-events-none transition-transform duration-75"
        :style="{
          left: `calc(${(hoveredPoint.x / cW) * 100}%)`,
          top: `calc(${(hoveredPoint.y / cH) * 100}%)`,
          transform: 'translate(-50%, -120%)'
        }"
      >
        <div class="bg-slate-900/95 border border-slate-700/80 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md">
          <p class="text-slate-400 text-[10px] font-medium">{{ hoveredPoint.date }}</p>
          <p class="text-white text-sm font-bold tabular-nums">
            {{ hoveredPoint.value }} {{ colorConfig.label.toLowerCase() }}
          </p>
          <div class="text-[10px] text-slate-400 mt-1 flex gap-3">
            <span>Vis: {{ hoveredPoint.raw.unique_visitors }}</span>
            <span>Sess: {{ hoveredPoint.raw.sessions }}</span>
            <span>Leads: {{ hoveredPoint.raw.leads }}</span>
          </div>
        </div>
      </div>

      <!-- SVG Canvas -->
      <svg v-if="!loading && points.length > 0" class="w-full h-full" :viewBox="`0 0 ${cW} ${cH}`" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="colorConfig.fillStop" stop-opacity="0.25" />
            <stop offset="90%" :stop-color="colorConfig.fillStop" stop-opacity="0.01" />
          </linearGradient>
        </defs>

        <!-- Y Axis Grid -->
        <g v-for="t in yTicks" :key="t.val">
          <line :x1="pL" :y1="t.y" :x2="cW - pR" :y2="t.y" stroke="white" stroke-opacity="0.05" stroke-dasharray="3,6" />
          <text :x="pL - 10" :y="t.y + 3.5" text-anchor="end" fill="#64748b" font-size="10" font-weight="500">{{ t.val }}</text>
        </g>

        <!-- X Axis Labels -->
        <text 
          v-for="(p, i) in points" 
          :key="'x'+i" 
          v-show="i % Math.ceil(points.length / 8) === 0 || i === points.length - 1"
          :x="p.x" 
          :y="cH - 8" 
          text-anchor="middle" 
          fill="#64748b" 
          font-size="10" 
          font-weight="500"
        >
          {{ p.date }}
        </text>

        <!-- Area Fill -->
        <path v-if="areaPath" :d="areaPath" fill="url(#chartAreaGrad)" class="transition-all duration-500" />

        <!-- Line Path -->
        <path 
          v-if="linePath" 
          :d="linePath" 
          fill="none" 
          :stroke="colorConfig.stroke" 
          stroke-width="2.5" 
          stroke-linecap="round"
          class="transition-all duration-500" 
        />

        <!-- Interactive Data Points -->
        <g v-for="(p, idx) in points" :key="'pt'+idx">
          <circle 
            :cx="p.x" 
            :cy="p.y" 
            r="14" 
            fill="transparent" 
            class="cursor-pointer"
            @mouseenter="hoveredIndex = idx" 
            @mouseleave="hoveredIndex = null"
          />
          <circle 
            :cx="p.x" 
            :cy="p.y" 
            :r="hoveredIndex === idx ? 5 : 3" 
            :fill="hoveredIndex === idx ? colorConfig.stroke : '#0f172a'" 
            :stroke="colorConfig.stroke" 
            stroke-width="2" 
            class="transition-all duration-150 cursor-pointer pointer-events-none" 
          />
        </g>
      </svg>

      <!-- Empty State -->
      <div v-else-if="!loading && points.length === 0" class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs">
        <Icon name="lucide:bar-chart-2" class="w-8 h-8 text-slate-700 mb-2" />
        Nenhum dado registrado para o período selecionado.
      </div>
    </div>
  </div>
</template>
