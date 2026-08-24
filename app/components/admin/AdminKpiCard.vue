<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  value: string | number
  sublabel?: string
  formulaTooltip?: string
  icon: string
  theme?: 'cyan' | 'violet' | 'indigo' | 'emerald' | 'amber' | 'rose'
  badge?: string
  loading?: boolean
}>(), {
  theme: 'indigo',
  loading: false
})

const themeClasses = computed(() => {
  const map: Record<string, { bgGlow: string; borderHover: string; iconBg: string; iconBorder: string; iconColor: string; badgeColor: string }> = {
    cyan: {
      bgGlow: 'bg-cyan-500/10 group-hover:bg-cyan-500/20',
      borderHover: 'hover:border-cyan-500/30',
      iconBg: 'bg-cyan-500/10',
      iconBorder: 'border-cyan-500/20',
      iconColor: 'text-cyan-400',
      badgeColor: 'bg-cyan-400/10 text-cyan-400'
    },
    violet: {
      bgGlow: 'bg-violet-500/10 group-hover:bg-violet-500/20',
      borderHover: 'hover:border-violet-500/30',
      iconBg: 'bg-violet-500/10',
      iconBorder: 'border-violet-500/20',
      iconColor: 'text-violet-400',
      badgeColor: 'bg-violet-400/10 text-violet-400'
    },
    indigo: {
      bgGlow: 'bg-indigo-500/10 group-hover:bg-indigo-500/20',
      borderHover: 'hover:border-indigo-500/30',
      iconBg: 'bg-indigo-500/10',
      iconBorder: 'border-indigo-500/20',
      iconColor: 'text-indigo-400',
      badgeColor: 'bg-indigo-400/10 text-indigo-400'
    },
    emerald: {
      bgGlow: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
      borderHover: 'hover:border-emerald-500/30',
      iconBg: 'bg-emerald-500/10',
      iconBorder: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
      badgeColor: 'bg-emerald-400/10 text-emerald-400'
    },
    amber: {
      bgGlow: 'bg-amber-500/10 group-hover:bg-amber-500/20',
      borderHover: 'hover:border-amber-500/30',
      iconBg: 'bg-amber-500/10',
      iconBorder: 'border-amber-500/20',
      iconColor: 'text-amber-400',
      badgeColor: 'bg-amber-400/10 text-amber-400'
    },
    rose: {
      bgGlow: 'bg-rose-500/10 group-hover:bg-rose-500/20',
      borderHover: 'hover:border-rose-500/30',
      iconBg: 'bg-rose-500/10',
      iconBorder: 'border-rose-500/20',
      iconColor: 'text-rose-400',
      badgeColor: 'bg-rose-400/10 text-rose-400'
    }
  }
  return map[props.theme] || map.indigo
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString('pt-BR')
  }
  return props.value || '0'
})
</script>

<template>
  <div 
    class="relative group overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4 transition-all duration-300"
    :class="themeClasses.borderHover"
  >
    <!-- Background Glow Effect -->
    <div 
      class="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl transition-all pointer-events-none"
      :class="themeClasses.bgGlow"
    ></div>

    <div class="relative z-10">
      <div class="flex items-center justify-between mb-3">
        <div 
          class="w-9 h-9 rounded-xl border flex items-center justify-center"
          :class="[themeClasses.iconBg, themeClasses.iconBorder]"
        >
          <Icon :name="icon" class="w-4 h-4" :class="themeClasses.iconColor" />
        </div>

        <span 
          v-if="badge" 
          class="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
          :class="themeClasses.badgeColor"
        >
          {{ badge }}
        </span>
      </div>

      <div class="flex items-center gap-1.5 mb-1">
        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{{ title }}</p>
        <span 
          v-if="formulaTooltip" 
          :title="formulaTooltip"
          class="text-slate-500 hover:text-slate-300 cursor-help"
        >
          <Icon name="lucide:info" class="w-3 h-3" />
        </span>
      </div>

      <div v-if="loading" class="h-8 w-24 bg-white/10 rounded animate-pulse my-1"></div>
      <p v-else class="text-2xl lg:text-3xl font-extrabold text-white tabular-nums tracking-tight">
        {{ formattedValue }}
      </p>

      <p v-if="sublabel" class="text-[11px] text-slate-500 mt-1 font-medium truncate">
        {{ sublabel }}
      </p>
    </div>
  </div>
</template>
