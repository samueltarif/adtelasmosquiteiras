<script setup lang="ts">
defineProps<{
  counts: {
    total: number
    novos: number
    em_contato: number
    sem_resposta: number
    fechados: number
    perdidos: number
  }
  selectedStatus: string
}>()

const emit = defineEmits<{
  (e: 'select-status', status: string): void
}>()

const cards = [
  { key: '', label: 'Total', countKey: 'total', color: 'from-slate-800 to-slate-900 border-slate-700/60 text-white' },
  { key: 'Novo', label: 'Novos', countKey: 'novos', color: 'from-cyan-950/40 to-slate-900 border-cyan-500/30 text-cyan-400' },
  { key: 'Em contato', label: 'Em Contato', countKey: 'em_contato', color: 'from-amber-950/40 to-slate-900 border-amber-500/30 text-amber-400' },
  { key: 'Sem resposta', label: 'Sem Resposta', countKey: 'sem_resposta', color: 'from-purple-950/40 to-slate-900 border-purple-500/30 text-purple-400' },
  { key: 'Fechado', label: 'Fechados', countKey: 'fechados', color: 'from-emerald-950/40 to-slate-900 border-emerald-500/30 text-emerald-400' },
  { key: 'Perdido', label: 'Perdidos', countKey: 'perdidos', color: 'from-rose-950/40 to-slate-900 border-rose-500/30 text-rose-400' }
] as const
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 w-full">
    <button
      v-for="c in cards"
      :key="c.key"
      type="button"
      @click="emit('select-status', selectedStatus === c.key ? '' : c.key)"
      class="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b border transition-all text-left flex flex-col justify-between min-h-[72px] sm:min-h-[80px] cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
      :class="[
        c.color,
        selectedStatus === c.key ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/20' : 'opacity-90 hover:opacity-100'
      ]"
    >
      <div class="flex items-center justify-between w-full">
        <span class="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
          {{ c.label }}
        </span>
        <span v-if="selectedStatus === c.key" class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
      </div>
      <div class="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums mt-1">
        {{ counts[c.countKey as keyof typeof counts] || 0 }}
      </div>
    </button>
  </div>
</template>
