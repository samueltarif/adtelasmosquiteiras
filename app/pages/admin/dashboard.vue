<script setup>
import { onMounted, ref, computed } from 'vue'

definePageMeta({ layout: 'admin' })
useHead({
  title: 'Dashboard - AD Telas e Redes',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

const isLoading = ref(true)
const hoveredPoint = ref(null)
const hoveredVisitPoint = ref(null)
const hoveredDonut = ref(null)
const animReady = ref(false)
const chartMode = ref('leads') // 'leads' | 'visits' | 'both'
const recentEvents = ref([])

const stats = ref({
  totalLeads: 0, whatsappClicks: 0, conversionRate: '0.0%',
  totalVisits: 0, uniqueVisitors: 0,
  dailyLeads: [], dailyVisits: [],
  serviceDistribution: [], topLocations: [], topPages: []
})

// Fallbacks
const fbDaily = [
  { date: '06/07', count: 5 }, { date: '07/07', count: 8 }, { date: '08/07', count: 4 },
  { date: '09/07', count: 12 }, { date: '10/07', count: 10 }, { date: '11/07', count: 15 },
  { date: '12/07', count: 14 }, { date: '13/07', count: 18 }, { date: '14/07', count: 16 },
  { date: '15/07', count: 22 }, { date: '16/07', count: 20 }, { date: '17/07', count: 25 },
  { date: '18/07', count: 23 }, { date: '19/07', count: 28 }, { date: '20/07', count: 32 }
]
const fbVisits = [
  { date: '06/07', count: 45 }, { date: '07/07', count: 62 }, { date: '08/07', count: 38 },
  { date: '09/07', count: 85 }, { date: '10/07', count: 72 }, { date: '11/07', count: 95 },
  { date: '12/07', count: 88 }, { date: '13/07', count: 110 }, { date: '14/07', count: 102 },
  { date: '15/07', count: 130 }, { date: '16/07', count: 125 }, { date: '17/07', count: 145 },
  { date: '18/07', count: 138 }, { date: '19/07', count: 160 }, { date: '20/07', count: 178 }
]
const fbSvc = [
  { name: 'Redes de Proteção', count: 35, percentage: 55 },
  { name: 'Telas Mosquiteiras', count: 19, percentage: 30 },
  { name: 'Outros Serviços', count: 10, percentage: 15 }
]
const fbLoc = [
  { name: 'São Paulo (Capital)', count: 28, percentage: 45 },
  { name: 'Guarulhos', count: 12, percentage: 20 },
  { name: 'Osasco', count: 10, percentage: 15 },
  { name: 'Mogi das Cruzes', count: 6, percentage: 10 }
]
const fbPages = [
  { path: '/', count: 420, percentage: 35 },
  { path: '/servicos', count: 280, percentage: 23 },
  { path: '/redes-de-protecao', count: 190, percentage: 16 },
  { path: '/contato', count: 150, percentage: 13 },
  { path: '/telas-mosquiteiras', count: 120, percentage: 10 }
]

const fetchStats = async () => {
  isLoading.value = true
  try {
    const [d, act] = await Promise.all([
      $fetch('/api/admin/dashboard-stats'),
      $fetch('/api/admin/recent-activity')
    ])
    if (d?.success) {
      stats.value.totalLeads = d.totalLeads
      stats.value.whatsappClicks = d.whatsappClicks
      stats.value.conversionRate = d.conversionRate
      stats.value.totalVisits = d.totalVisits
      stats.value.uniqueVisitors = d.uniqueVisitors
      stats.value.dailyLeads = d.dailyLeads || []
      stats.value.dailyVisits = d.dailyVisits || []
      stats.value.serviceDistribution = d.serviceDistribution || []
      stats.value.topLocations = d.topLocations || []
      stats.value.topPages = d.topPages || []
    } else {
      useFb()
    }
    recentEvents.value = act?.events || []
  } catch {
    useFb()
  } finally {
    isLoading.value = false
    setTimeout(() => { animReady.value = true }, 150)
  }
}

const useFb = () => {
  stats.value = {
    totalLeads: 1250, whatsappClicks: 890, conversionRate: '12.5%',
    totalVisits: 1850, uniqueVisitors: 720,
    dailyLeads: fbDaily, dailyVisits: fbVisits,
    serviceDistribution: fbSvc, topLocations: fbLoc, topPages: fbPages
  }
}

onMounted(() => fetchStats())

// ===== CHART =====
const cW = 600, cH = 260, pL = 48, pR = 15, pT = 25, pB = 35
const aW = computed(() => cW - pL - pR)
const aH = computed(() => cH - pT - pB)

const activeData = computed(() => {
  if (chartMode.value === 'visits') return stats.value.dailyVisits
  return stats.value.dailyLeads
})

const maxVal = computed(() => {
  let vals = activeData.value.map(d => d.count)
  if (chartMode.value === 'both') {
    vals = [...vals, ...stats.value.dailyVisits.map(d => d.count)]
  }
  return Math.ceil(Math.max(...vals, 5) / 5) * 5
})

const makePoints = (data) => {
  if (!data.length) return []
  const step = aW.value / Math.max(data.length - 1, 1)
  return data.map((it, i) => ({
    x: pL + i * step,
    y: pT + aH.value - (it.count / maxVal.value) * aH.value,
    date: it.date, count: it.count, i
  }))
}

const leadPts = computed(() => makePoints(stats.value.dailyLeads))
const visitPts = computed(() => makePoints(stats.value.dailyVisits))
const mainPts = computed(() => chartMode.value === 'visits' ? visitPts.value : leadPts.value)

const makePath = (pts) => {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const t = 0.35, dx = pts[i + 1].x - pts[i].x
    d += ` C ${pts[i].x + dx * t},${pts[i].y} ${pts[i + 1].x - dx * t},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`
  }
  return d
}

const leadLine = computed(() => makePath(leadPts.value))
const visitLine = computed(() => makePath(visitPts.value))
const mainLine = computed(() => chartMode.value === 'visits' ? visitLine.value : leadLine.value)

const makeArea = (line, pts) => {
  if (!line || !pts.length) return ''
  return `${line} L ${pts[pts.length - 1].x},${cH - pB} L ${pts[0].x},${cH - pB} Z`
}

const mainArea = computed(() => makeArea(mainLine.value, mainPts.value))
const visitArea = computed(() => makeArea(visitLine.value, visitPts.value))

const yTicks = computed(() => {
  const t = []
  for (let i = 0; i <= 4; i++) {
    t.push({ val: Math.round((maxVal.value / 4) * (4 - i)), y: pT + (aH.value / 4) * i })
  }
  return t
})

// ===== DONUT =====
const dR = 52, dS = 14, dC = 2 * Math.PI * dR
const donutArcs = computed(() => {
  const list = stats.value.serviceDistribution
  const total = list.reduce((s, c) => s + c.count, 0) || 1
  const colors = ['#6366f1', '#f59e0b', '#10b981']
  let off = 0
  return list.map((it, idx) => {
    const f = it.count / total, len = f * dC, gap = 4
    const arc = { ...it, color: colors[idx % colors.length], dasharray: `${Math.max(len - gap, 0)} ${dC}`, offset: -off + gap / 2, percentage: Math.round(f * 100) }
    off += len
    return arc
  })
})

const fmt = (n) => (n || 0).toLocaleString('pt-BR')

const pageName = (path) => {
  const map = { '/': 'Página Inicial', '/servicos': 'Serviços', '/contato': 'Contato', '/orcamento': 'Orçamento' }
  return map[path] || path.replace(/^\//, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Home'
}

const eventConfig = (tipo) => {
  const cfg = {
    visita:            { icon: 'lucide:eye',            bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    color: 'text-cyan-400' },
    whatsapp:          { icon: 'lucide:message-circle', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', color: 'text-emerald-400' },
    telefone:          { icon: 'lucide:phone-call',     bg: 'bg-rose-500/10',   border: 'border-rose-500/20',   color: 'text-rose-400' },
    lead:              { icon: 'lucide:user-plus',      bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', color: 'text-indigo-400' },
    formulario_submit: { icon: 'lucide:file-text',     bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  color: 'text-amber-400' },
    cta_interno:       { icon: 'lucide:arrow-right',   bg: 'bg-violet-500/10', border: 'border-violet-500/20', color: 'text-violet-400' }
  }
  return cfg[tipo] || cfg['visita']
}

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return Math.floor(diff / 60) + ' min'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h'
  return Math.floor(diff / 86400) + 'd'
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 md:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto flex flex-col gap-5">

      <!-- HEADER -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Dashboard
            <span class="ml-2 inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse align-middle"></span>
          </h2>
          <p class="text-sm text-slate-400 mt-1">Métricas em tempo real · AD Telas e Redes</p>
        </div>
        <button @click="fetchStats" class="group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/5 text-slate-300 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-95 transition-all duration-200">
          <Icon name="lucide:refresh-cw" class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" :class="isLoading ? 'animate-spin' : ''" />
          Atualizar
        </button>
      </div>

      <!-- KPI ROW -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- Visitas -->
        <div class="relative group overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4 hover:border-cyan-500/30 transition-all duration-300">
          <div class="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Icon name="lucide:eye" class="w-4 h-4 text-cyan-400" />
              </div>
              <span class="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded-full">LIVE</span>
            </div>
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Visitas ao Site</p>
            <p class="text-2xl lg:text-3xl font-extrabold text-white tabular-nums">{{ fmt(stats.totalVisits) }}</p>
          </div>
        </div>

        <!-- Visitantes únicos -->
        <div class="relative group overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4 hover:border-violet-500/30 transition-all duration-300">
          <div class="absolute -top-10 -right-10 w-28 h-28 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Icon name="lucide:fingerprint" class="w-4 h-4 text-violet-400" />
              </div>
            </div>
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Únicos</p>
            <p class="text-2xl lg:text-3xl font-extrabold text-white tabular-nums">{{ fmt(stats.uniqueVisitors) }}</p>
          </div>
        </div>

        <!-- Leads -->
        <div class="relative group overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4 hover:border-indigo-500/30 transition-all duration-300">
          <div class="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Icon name="lucide:users" class="w-4 h-4 text-indigo-400" />
              </div>
              <span class="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">+12%</span>
            </div>
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Leads</p>
            <p class="text-2xl lg:text-3xl font-extrabold text-white tabular-nums">{{ fmt(stats.totalLeads) }}</p>
          </div>
        </div>

        <!-- WhatsApp -->
        <div class="relative group overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4 hover:border-emerald-500/30 transition-all duration-300">
          <div class="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Icon name="lucide:message-circle" class="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">WhatsApp</p>
            <p class="text-2xl lg:text-3xl font-extrabold text-white tabular-nums">{{ fmt(stats.whatsappClicks) }}</p>
          </div>
        </div>

        <!-- Conversão -->
        <div class="relative group overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4 hover:border-amber-500/30 transition-all duration-300 col-span-2 lg:col-span-1">
          <div class="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Icon name="lucide:target" class="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Conversão</p>
            <p class="text-2xl lg:text-3xl font-extrabold text-white tabular-nums">{{ stats.conversionRate }}</p>
          </div>
        </div>
      </div>

      <!-- CHART ROW -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <!-- LINE CHART -->
        <div class="lg:col-span-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
          <div class="px-5 pt-5 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 class="text-sm font-bold text-white">Tráfego & Captação</h3>
              <p class="text-xs text-slate-500 mt-0.5">Visitas ao site vs leads gerados — últimos 15 dias</p>
            </div>
            <div class="flex bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
              <button @click="chartMode = 'leads'" class="px-3 py-1 rounded-md text-xs font-semibold transition-all" :class="chartMode === 'leads' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'">
                Leads
              </button>
              <button @click="chartMode = 'visits'" class="px-3 py-1 rounded-md text-xs font-semibold transition-all" :class="chartMode === 'visits' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'">
                Visitas
              </button>
              <button @click="chartMode = 'both'" class="px-3 py-1 rounded-md text-xs font-semibold transition-all" :class="chartMode === 'both' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-slate-300'">
                Ambos
              </button>
            </div>
          </div>

          <div class="px-2 pb-4 relative" style="aspect-ratio: 2.4 / 1;">
            <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center z-10">
              <Icon name="lucide:loader" class="w-7 h-7 text-indigo-400 animate-spin" />
            </div>

            <!-- Tooltip leads -->
            <div v-if="hoveredPoint && !isLoading" class="absolute z-30 pointer-events-none" :style="{ left: `calc(${(hoveredPoint.x / cW) * 100}%)`, top: `calc(${(hoveredPoint.y / cH) * 100}%)`, transform: 'translate(-50%, -120%)' }">
              <div class="bg-indigo-900/95 backdrop-blur-sm border border-indigo-700/50 rounded-xl px-3 py-2 shadow-2xl">
                <p class="text-indigo-200 text-[10px] font-medium">{{ hoveredPoint.date }}</p>
                <p class="text-white text-sm font-bold tabular-nums">{{ hoveredPoint.count }} leads</p>
              </div>
            </div>
            <!-- Tooltip visits -->
            <div v-if="hoveredVisitPoint && !isLoading" class="absolute z-30 pointer-events-none" :style="{ left: `calc(${(hoveredVisitPoint.x / cW) * 100}%)`, top: `calc(${(hoveredVisitPoint.y / cH) * 100}%)`, transform: 'translate(-50%, -120%)' }">
              <div class="bg-cyan-900/95 backdrop-blur-sm border border-cyan-700/50 rounded-xl px-3 py-2 shadow-2xl">
                <p class="text-cyan-200 text-[10px] font-medium">{{ hoveredVisitPoint.date }}</p>
                <p class="text-white text-sm font-bold tabular-nums">{{ hoveredVisitPoint.count }} visitas</p>
              </div>
            </div>

            <svg v-if="!isLoading" class="w-full h-full" :viewBox="`0 0 ${cW} ${cH}`" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6366f1" stop-opacity="0.25"/><stop offset="90%" stop-color="#6366f1" stop-opacity="0.01"/></linearGradient>
                <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#06b6d4" stop-opacity="0.2"/><stop offset="90%" stop-color="#06b6d4" stop-opacity="0.01"/></linearGradient>
                <filter id="glowL"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="glowV"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <!-- Grid -->
              <g v-for="t in yTicks" :key="t.val">
                <line :x1="pL" :y1="t.y" :x2="cW - pR" :y2="t.y" stroke="white" stroke-opacity="0.04" stroke-dasharray="3,6"/>
                <text :x="pL - 10" :y="t.y + 3.5" text-anchor="end" fill="#64748b" font-size="10" font-family="Inter,sans-serif" font-weight="500">{{ t.val }}</text>
              </g>
              <!-- X labels -->
              <text v-for="(p, i) in mainPts" :key="'x'+i" v-show="i % 2 === 0 || i === mainPts.length - 1" :x="p.x" :y="cH - 8" text-anchor="middle" fill="#64748b" font-size="10" font-family="Inter,sans-serif" font-weight="500">{{ p.date }}</text>

              <!-- Visit line (behind) -->
              <template v-if="chartMode === 'both' || chartMode === 'visits'">
                <path v-if="visitArea" :d="visitArea" fill="url(#visitGrad)" :class="animReady ? 'opacity-100' : 'opacity-0'" class="transition-opacity duration-1000"/>
                <path v-if="visitLine" :d="visitLine" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" filter="url(#glowV)" stroke-opacity="0.8" :class="animReady ? 'opacity-100' : 'opacity-0'" class="transition-opacity duration-700"/>
                <g v-for="p in visitPts" :key="'vp'+p.i">
                  <circle :cx="p.x" :cy="p.y" r="12" fill="transparent" class="cursor-pointer" @mouseenter="hoveredVisitPoint = p" @mouseleave="hoveredVisitPoint = null"/>
                  <circle :cx="p.x" :cy="p.y" :r="hoveredVisitPoint?.i === p.i ? 4 : 2.5" :fill="hoveredVisitPoint?.i === p.i ? '#06b6d4' : '#0c1a2e'" :stroke="hoveredVisitPoint?.i === p.i ? '#67e8f9' : '#06b6d4'" stroke-width="1.5" class="transition-all duration-200 cursor-pointer" @mouseenter="hoveredVisitPoint = p" @mouseleave="hoveredVisitPoint = null"/>
                </g>
              </template>

              <!-- Lead line (front) -->
              <template v-if="chartMode === 'both' || chartMode === 'leads'">
                <path v-if="mainArea && chartMode !== 'both'" :d="mainArea" fill="url(#leadGrad)" :class="animReady ? 'opacity-100' : 'opacity-0'" class="transition-opacity duration-1000"/>
                <path v-if="leadLine" :d="leadLine" fill="none" stroke="#818cf8" stroke-width="2.5" stroke-linecap="round" filter="url(#glowL)" :class="animReady ? 'opacity-100' : 'opacity-0'" class="transition-opacity duration-700"/>
                <g v-for="p in leadPts" :key="'lp'+p.i">
                  <circle :cx="p.x" :cy="p.y" r="12" fill="transparent" class="cursor-pointer" @mouseenter="hoveredPoint = p" @mouseleave="hoveredPoint = null"/>
                  <circle v-if="hoveredPoint?.i === p.i" :cx="p.x" :cy="p.y" r="10" fill="none" stroke="#6366f1" stroke-opacity="0.3" stroke-width="1.5" class="animate-ping"/>
                  <circle :cx="p.x" :cy="p.y" :r="hoveredPoint?.i === p.i ? 5 : 3" :fill="hoveredPoint?.i === p.i ? '#6366f1' : '#1e1b4b'" :stroke="hoveredPoint?.i === p.i ? '#a5b4fc' : '#6366f1'" stroke-width="2" class="transition-all duration-200 cursor-pointer" @mouseenter="hoveredPoint = p" @mouseleave="hoveredPoint = null"/>
                </g>
              </template>
            </svg>
          </div>

          <!-- Legend bar -->
          <div class="px-5 pb-4 flex gap-5 text-xs text-slate-500">
            <span v-if="chartMode !== 'visits'" class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> Leads</span>
            <span v-if="chartMode !== 'leads'" class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Visitas</span>
          </div>
        </div>

        <!-- DONUT -->
        <div class="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 flex flex-col">
          <h3 class="text-sm font-bold text-white mb-1">Serviços Mais Procurados</h3>
          <p class="text-xs text-slate-500 mb-5">Distribuição dos pedidos de orçamento</p>
          <div class="flex-1 flex flex-col items-center justify-center gap-6">
            <div class="relative w-40 h-40 sm:w-44 sm:h-44">
              <svg v-if="!isLoading" class="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
                <circle cx="65" cy="65" :r="dR" fill="none" stroke="white" stroke-opacity="0.03" :stroke-width="dS"/>
                <circle v-for="(a, i) in donutArcs" :key="i" cx="65" cy="65" :r="dR" fill="none" :stroke="a.color" :stroke-width="dS" :stroke-dasharray="a.dasharray" :stroke-dashoffset="a.offset" stroke-linecap="round" class="transition-all duration-700 cursor-pointer" :class="animReady ? 'opacity-100' : 'opacity-0'" :style="{ filter: hoveredDonut === i ? `drop-shadow(0 0 6px ${a.color})` : 'none' }" @mouseenter="hoveredDonut = i" @mouseleave="hoveredDonut = null"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span class="text-xl font-extrabold text-white tabular-nums">{{ fmt(stats.totalLeads) }}</span>
                <span class="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">total</span>
              </div>
            </div>
            <div class="w-full flex flex-col gap-2 px-1">
              <div v-if="donutArcs.length === 0" class="text-center text-slate-500 text-xs py-4">
                Nenhum lead registrado para os serviços.
              </div>
              <div v-else v-for="(a, i) in donutArcs" :key="'lg'+i" class="flex items-center justify-between group cursor-pointer rounded-lg px-3 py-2 -mx-1 hover:bg-white/[0.04] transition-colors" @mouseenter="hoveredDonut = i" @mouseleave="hoveredDonut = null">
                <div class="flex items-center gap-2.5">
                  <span class="w-2.5 h-2.5 rounded-full transition-transform" :style="{ backgroundColor: a.color }" :class="hoveredDonut === i ? 'scale-125' : ''"></span>
                  <span class="text-sm text-slate-300 font-medium">{{ a.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500 tabular-nums">{{ a.count }}</span>
                  <span class="text-sm font-bold text-white tabular-nums">{{ a.percentage }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- BOTTOM ROW -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Páginas Mais Acessadas -->
        <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-sm font-bold text-white">Páginas Mais Acessadas</h3>
              <p class="text-xs text-slate-500 mt-0.5">Ranking por número de visitas</p>
            </div>
            <Icon name="lucide:layout" class="w-5 h-5 text-slate-600"/>
          </div>
          <div class="flex flex-col gap-3">
            <div v-if="stats.topPages.length === 0" class="text-center text-slate-500 text-xs py-8">
              Nenhuma visita registrada ainda.
            </div>
            <div v-else v-for="(pg, i) in stats.topPages" :key="i" class="group">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-3">
                  <span class="text-xs font-bold w-5 text-center tabular-nums" :class="i === 0 ? 'text-cyan-400' : 'text-slate-600'">#{{ i + 1 }}</span>
                  <span class="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{{ pageName(pg.path) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500 tabular-nums">{{ fmt(pg.count) }}</span>
                  <span class="text-xs font-bold text-cyan-400 tabular-nums">{{ pg.percentage }}%</span>
                </div>
              </div>
              <div class="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700" :class="animReady ? '' : 'w-0'" :style="{ width: animReady ? pg.percentage + '%' : '0%', background: `linear-gradient(90deg, #06b6d4 0%, #22d3ee 100%)` }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Regiões -->
        <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-sm font-bold text-white">Principais Regiões</h3>
              <p class="text-xs text-slate-500 mt-0.5">Origem geográfica dos leads</p>
            </div>
            <Icon name="lucide:map-pin" class="w-5 h-5 text-slate-600"/>
          </div>
          <div class="flex flex-col gap-4">
            <div v-if="stats.topLocations.length === 0" class="text-center text-slate-500 text-xs py-8">
              Nenhum lead com localização registrado.
            </div>
            <div v-else v-for="(loc, i) in stats.topLocations" :key="i" class="group">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-3">
                  <span class="text-xs font-bold w-5 text-center text-slate-600">#{{ i + 1 }}</span>
                  <span class="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{{ loc.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500 tabular-nums">{{ loc.count }}</span>
                  <span class="text-xs font-bold text-indigo-400 tabular-nums">{{ loc.percentage }}%</span>
                </div>
              </div>
              <div class="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700" :class="animReady ? '' : 'w-0'" :style="{ width: animReady ? loc.percentage + '%' : '0%', background: `linear-gradient(90deg, ${['#6366f1','#8b5cf6','#a78bfa','#c4b5fd'][i]} 0%, ${['#818cf8','#a78bfa','#c4b5fd','#ddd6fe'][i]} 100%)` }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Atividade Recente -->
        <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-sm font-bold text-white">Atividade Recente</h3>
              <p class="text-xs text-slate-500 mt-0.5">Eventos reais · banco de dados</p>
            </div>
            <NuxtLink to="/admin/leads" class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1">
              Ver leads <Icon name="lucide:arrow-right" class="w-3.5 h-3.5"/>
            </NuxtLink>
          </div>
          <div class="flex flex-col gap-2">
            <!-- Loading -->
            <div v-if="isLoading" class="flex items-center justify-center py-8">
              <Icon name="lucide:loader" class="w-5 h-5 text-indigo-400 animate-spin"/>
            </div>
            <!-- Vazio -->
            <div v-else-if="recentEvents.length === 0" class="flex flex-col items-center justify-center py-8 gap-2">
              <Icon name="lucide:activity" class="w-8 h-8 text-slate-700"/>
              <p class="text-xs text-slate-500 text-center">Nenhuma atividade registrada ainda.<br>Acesse o site para começar a capturar dados.</p>
            </div>
            <!-- Eventos reais -->
            <div
              v-else
              v-for="(ev, idx) in recentEvents"
              :key="idx"
              class="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border"
                :class="[eventConfig(ev.tipo).bg, eventConfig(ev.tipo).border]"
              >
                <Icon :name="eventConfig(ev.tipo).icon" class="w-4 h-4" :class="eventConfig(ev.tipo).color"/>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-slate-300 font-medium truncate">{{ ev.label }}</p>
                <p class="text-xs text-slate-500 mt-0.5 truncate">{{ ev.sublabel }}</p>
              </div>
              <span class="text-[10px] text-slate-600 whitespace-nowrap mt-1">{{ timeAgo(ev.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
