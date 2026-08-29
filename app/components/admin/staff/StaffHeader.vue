<script setup lang="ts">
import { computed } from 'vue'
import type { CrmStaffMember } from '~/composables/useCrmStaff'

const props = defineProps<{
  staffList: CrmStaffMember[]
  selectedFuncao: string
  selectedStatus: string
}>()

const emit = defineEmits<{
  (e: 'update:selectedFuncao', val: string): void
  (e: 'update:selectedStatus', val: string): void
  (e: 'openCreateModal'): void
}>()

const totalStaff = computed(() => props.staffList.length)
const activeStaff = computed(() => props.staffList.filter(s => s.is_active).length)
const instaladoresCount = computed(() => props.staffList.filter(s => s.is_active && s.funcao === 'instalador').length)
const vistoriadoresCount = computed(() => props.staffList.filter(s => s.is_active && s.funcao === 'vistoriador').length)
</script>

<template>
  <div class="space-y-6">
    <!-- Header Principal -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Icon name="lucide:user-check" class="w-5 h-5" />
          </div>
          <span>Equipe Operacional</span>
        </h1>
        <p class="text-xs text-slate-400 mt-1">Gestão de técnicos instaladores, vistoriadores e equipe de atendimento.</p>
      </div>

      <button
        @click="emit('openCreateModal')"
        class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        <span>Adicionar Membro</span>
      </button>
    </div>

    <!-- Cards de Métricas da Equipe -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
        <span class="text-[11px] font-semibold text-slate-400 block uppercase">Total de Membros</span>
        <span class="text-xl font-bold text-white mt-1 block">{{ totalStaff }}</span>
      </div>

      <div class="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 shadow-lg">
        <span class="text-[11px] font-semibold text-emerald-400 block uppercase">Membros Ativos</span>
        <span class="text-xl font-bold text-white mt-1 block">{{ activeStaff }}</span>
      </div>

      <div class="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 shadow-lg">
        <span class="text-[11px] font-semibold text-indigo-400 block uppercase">Instaladores Ativos</span>
        <span class="text-xl font-bold text-white mt-1 block">{{ instaladoresCount }}</span>
      </div>

      <div class="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4 shadow-lg">
        <span class="text-[11px] font-semibold text-cyan-400 block uppercase">Vistoriadores Ativos</span>
        <span class="text-xl font-bold text-white mt-1 block">{{ vistoriadoresCount }}</span>
      </div>
    </div>

    <!-- Filtros de Equipe -->
    <div class="flex flex-wrap items-center gap-3 pt-2">
      <div class="flex items-center gap-1.5">
        <label class="text-xs text-slate-400 font-medium">Função:</label>
        <select
          :value="selectedFuncao"
          @change="emit('update:selectedFuncao', ($event.target as HTMLSelectElement).value)"
          class="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
        >
          <option value="">Todas as Funções</option>
          <option value="instalador">Instalador</option>
          <option value="vistoriador">Vistoriador</option>
          <option value="atendente">Atendente</option>
          <option value="gestor">Gestor</option>
        </select>
      </div>

      <div class="flex items-center gap-1.5">
        <label class="text-xs text-slate-400 font-medium">Status:</label>
        <select
          :value="selectedStatus"
          @change="emit('update:selectedStatus', ($event.target as HTMLSelectElement).value)"
          class="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
        >
          <option value="">Todos</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
      </div>
    </div>
  </div>
</template>
