<script setup lang="ts">
defineProps<{
  summary: {
    totalOpen: number
    inExecution: number
    completedThisMonth: number
    openValue: number
    totalActive: number
  } | null
  isLoading: boolean
}>()

function formatCurrency(val?: number) {
  const num = typeof val === 'number' ? val : 0
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Card 1: Total Abertas -->
    <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg relative overflow-hidden group">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-xs text-slate-400 font-medium">OS em Aberto</span>
          <div class="text-2xl font-bold text-white mt-1">
            <span v-if="isLoading" class="inline-block w-8 h-6 bg-slate-800 animate-pulse rounded"></span>
            <span v-else>{{ summary?.totalOpen ?? 0 }}</span>
          </div>
          <span class="text-[11px] text-slate-500">Orçamento / Aprovada / Agendada</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
          <Icon name="lucide:clock" class="w-6 h-6" />
        </div>
      </div>
    </div>

    <!-- Card 2: Em Execução -->
    <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg relative overflow-hidden group">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-xs text-slate-400 font-medium">Em Execução</span>
          <div class="text-2xl font-bold text-white mt-1">
            <span v-if="isLoading" class="inline-block w-8 h-6 bg-slate-800 animate-pulse rounded"></span>
            <span v-else>{{ summary?.inExecution ?? 0 }}</span>
          </div>
          <span class="text-[11px] text-slate-500">Instalação em campo</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <Icon name="lucide:wrench" class="w-6 h-6" />
        </div>
      </div>
    </div>

    <!-- Card 3: Concluídas no Mês -->
    <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg relative overflow-hidden group">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-xs text-slate-400 font-medium">Concluídas este Mês</span>
          <div class="text-2xl font-bold text-white mt-1">
            <span v-if="isLoading" class="inline-block w-8 h-6 bg-slate-800 animate-pulse rounded"></span>
            <span v-else>{{ summary?.completedThisMonth ?? 0 }}</span>
          </div>
          <span class="text-[11px] text-slate-500">Instalações entregues</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <Icon name="lucide:check-circle-2" class="w-6 h-6" />
        </div>
      </div>
    </div>

    <!-- Card 4: Valor em Aberto -->
    <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg relative overflow-hidden group">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-xs text-slate-400 font-medium">Valor em Aberto</span>
          <div class="text-2xl font-bold text-emerald-400 mt-1">
            <span v-if="isLoading" class="inline-block w-20 h-6 bg-slate-800 animate-pulse rounded"></span>
            <span v-else>{{ formatCurrency(summary?.openValue) }}</span>
          </div>
          <span class="text-[11px] text-slate-500">Pipeline operacional</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <Icon name="lucide:dollar-sign" class="w-6 h-6" />
        </div>
      </div>
    </div>
  </div>
</template>
