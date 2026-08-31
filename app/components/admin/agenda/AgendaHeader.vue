<script setup lang="ts">
import { computed } from 'vue'
import type { CrmStaffMember } from '~/composables/useCrmStaff'
import {
  formatAppointmentDate,
  getSaoPauloParts,
  getCalendarWeekDays,
  getSaoPauloDateString
} from '~/utils/crmDateTime'

const props = defineProps<{
  viewMode: 'semana' | 'dia' | 'lista' | 'mes'
  currentDate: Date
  staffList: CrmStaffMember[]
  selectedStaffId: string
  selectedTipo: string
  selectedStatus: string
}>()

const emit = defineEmits<{
  (e: 'update:viewMode', val: 'semana' | 'dia' | 'lista' | 'mes'): void
  (e: 'update:currentDate', val: Date): void
  (e: 'update:selectedStaffId', val: string): void
  (e: 'update:selectedTipo', val: string): void
  (e: 'update:selectedStatus', val: string): void
  (e: 'navigate', direction: 'prev' | 'next' | 'today'): void
  (e: 'createAppointment'): void
}>()

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const headerTitle = computed(() => {
  const p = getSaoPauloParts(props.currentDate)
  if (props.viewMode === 'dia') {
    return formatAppointmentDate(props.currentDate.toISOString())
  }
  if (props.viewMode === 'mes') {
    return `${monthNames[p.month - 1]} de ${p.year}`
  }
  // Semana / Lista
  const weekDays = getCalendarWeekDays(props.currentDate)
  const first = weekDays[0]
  const last = weekDays[6]
  const pFirst = getSaoPauloParts(first)
  const pLast = getSaoPauloParts(last)

  if (pFirst.month === pLast.month) {
    return `${pFirst.day} a ${pLast.day} de ${monthNames[pFirst.month - 1]} de ${pFirst.year}`
  }
  return `${pFirst.day} de ${monthNames[pFirst.month - 1]} a ${pLast.day} de ${monthNames[pLast.month - 1]} de ${pLast.year}`
})

function handleDateChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (!val) return
  const parts = val.split('-').map(Number)
  const y = parts[0]
  const m = parts[1]
  const d = parts[2]
  if (typeof y === 'number' && typeof m === 'number' && typeof d === 'number') {
    emit('update:currentDate', new Date(Date.UTC(y, m - 1, d, 12, 0, 0)))
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Linha Superior: Navegação e CTA -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        <!-- Botão Hoje -->
        <button
          @click="emit('navigate', 'today')"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer min-h-[44px] flex items-center gap-1.5 shadow-sm"
        >
          <Icon name="lucide:calendar-days" class="w-4 h-4 text-indigo-400" />
          <span>Hoje</span>
        </button>

        <!-- Navegação Anterior / Próximo -->
        <div class="flex items-center rounded-xl bg-slate-900 border border-white/10 p-0.5">
          <button
            @click="emit('navigate', 'prev')"
            aria-label="Período anterior"
            class="p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <Icon name="lucide:chevron-left" class="w-4 h-4" />
          </button>
          <button
            @click="emit('navigate', 'next')"
            aria-label="Próximo período"
            class="p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <Icon name="lucide:chevron-right" class="w-4 h-4" />
          </button>
        </div>

        <!-- Seletor Rápido de Data -->
        <div class="relative flex items-center max-w-full">
          <input
            type="date"
            :value="getSaoPauloDateString(currentDate)"
            @change="handleDateChange"
            aria-label="Selecionar data específica"
            class="px-2.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer max-w-[130px] sm:max-w-none"
          />
        </div>

        <!-- Título do Período -->
        <h2 class="text-xs sm:text-base font-bold text-white tracking-tight ml-1 truncate max-w-full">
          {{ headerTitle }}
        </h2>
      </div>

      <!-- Modos de Visualização & Botão Novo Agendamento -->
      <div class="flex flex-wrap items-center gap-2 sm:gap-3 max-w-full">
        <!-- Seletor de Modo -->
        <div class="flex items-center rounded-xl bg-slate-900/90 border border-white/10 p-0.5 sm:p-1 shadow-sm max-w-full overflow-x-auto">
          <button
            @click="emit('update:viewMode', 'semana')"
            aria-label="Semana"
            title="Semana"
            class="px-3 py-2 rounded-lg text-xs font-semibold transition-all min-h-[44px] min-w-[44px] justify-center flex items-center gap-1.5 cursor-pointer"
            :class="viewMode === 'semana' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <Icon name="lucide:grid" class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Semana</span>
          </button>

          <button
            @click="emit('update:viewMode', 'dia')"
            aria-label="Dia"
            title="Dia"
            class="px-3 py-2 rounded-lg text-xs font-semibold transition-all min-h-[44px] min-w-[44px] justify-center flex items-center gap-1.5 cursor-pointer"
            :class="viewMode === 'dia' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <Icon name="lucide:calendar" class="w-3.5 h-3.5" />
            <span>Dia</span>
          </button>

          <button
            @click="emit('update:viewMode', 'lista')"
            aria-label="Lista"
            title="Lista"
            class="px-3 py-2 rounded-lg text-xs font-semibold transition-all min-h-[44px] min-w-[44px] justify-center flex items-center gap-1.5 cursor-pointer"
            :class="viewMode === 'lista' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <Icon name="lucide:list" class="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>

          <button
            @click="emit('update:viewMode', 'mes')"
            aria-label="Mês"
            title="Mês"
            class="px-3 py-2 rounded-lg text-xs font-semibold transition-all min-h-[44px] min-w-[44px] justify-center flex items-center gap-1.5 cursor-pointer"
            :class="viewMode === 'mes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <Icon name="lucide:calendar-range" class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Mês</span>
          </button>
        </div>

        <!-- Botão Novo Agendamento -->
        <button
          @click="emit('createAppointment')"
          class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          <span>Novo Agendamento</span>
        </button>
      </div>
    </div>

    <!-- Linha Inferior: Filtros Estruturados -->
    <div class="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5">
      <!-- Filtro Técnico -->
      <div class="flex items-center gap-1.5 max-w-full">
        <label class="text-[11px] text-slate-400 font-medium">Técnico:</label>
        <select
          :value="selectedStaffId"
          @change="emit('update:selectedStaffId', ($event.target as HTMLSelectElement).value)"
          class="px-2 sm:px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer max-w-full"
        >
          <option value="">Todos os Técnicos</option>
          <option v-for="st in staffList" :key="st.id" :value="st.id">
            {{ st.nome }} ({{ st.funcao }})
          </option>
        </select>
      </div>

      <!-- Filtro Tipo -->
      <div class="flex items-center gap-1.5 max-w-full">
        <label class="text-[11px] text-slate-400 font-medium">Tipo:</label>
        <select
          :value="selectedTipo"
          @change="emit('update:selectedTipo', ($event.target as HTMLSelectElement).value)"
          class="px-2 sm:px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer max-w-full"
        >
          <option value="">Todos os Tipos</option>
          <option value="visita_tecnica">Visita Técnica</option>
          <option value="medicao">Medição</option>
          <option value="instalacao">Instalação</option>
          <option value="manutencao">Manutenção</option>
          <option value="garantia">Garantia</option>
        </select>
      </div>

      <!-- Filtro Status -->
      <div class="flex items-center gap-1.5 max-w-full">
        <label class="text-[11px] text-slate-400 font-medium">Status:</label>
        <select
          :value="selectedStatus"
          @change="emit('update:selectedStatus', ($event.target as HTMLSelectElement).value)"
          class="px-2 sm:px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer max-w-full"
        >
          <option value="">Todos os Status</option>
          <option value="agendado">Agendado</option>
          <option value="confirmado">Confirmado</option>
          <option value="em_deslocamento">Em Deslocamento</option>
          <option value="realizado">Realizado</option>
          <option value="cancelado">Cancelado</option>
          <option value="reagendado">Reagendado</option>
        </select>
      </div>
    </div>
  </div>
</template>
