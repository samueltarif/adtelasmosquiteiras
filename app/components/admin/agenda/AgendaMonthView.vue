<script setup lang="ts">
import { computed } from 'vue'
import type { CrmAppointmentSummary } from '~/types/crmAppointments'
import {
  getCalendarMonthGrid,
  getSaoPauloParts,
  isSameDay,
  isToday
} from '~/utils/crmDateTime'

const props = defineProps<{
  currentDate: Date
  appointments: CrmAppointmentSummary[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'selectDay', day: Date): void
  (e: 'selectAppointment', appt: CrmAppointmentSummary): void
}>()

const currentParts = computed(() => getSaoPauloParts(props.currentDate))

const monthGrid = computed(() => {
  return getCalendarMonthGrid(currentParts.value.year, currentParts.value.month)
})

const dayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getAppointmentsForDay(day: Date) {
  return props.appointments.filter(a => isSameDay(a.data_hora_inicio, day))
}

function isCurrentMonth(day: Date) {
  const p = getSaoPauloParts(day)
  return p.month === currentParts.value.month
}
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-xl" role="grid" aria-label="Calendário Mensal">
    <div class="overflow-x-auto">
      <div class="min-w-[640px] lg:min-w-0">
        <!-- Header dos Dias -->
        <div class="grid grid-cols-7 border-b border-white/10 bg-slate-900/90 text-center" role="row">
          <div
            v-for="name in dayHeaders"
            :key="name"
            role="columnheader"
            class="py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-r last:border-r-0 border-white/5"
          >
            {{ name }}
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="p-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
          <span>Carregando mês...</span>
        </div>

        <!-- Grade Mensal -->
        <div v-else class="grid grid-cols-7 min-h-[480px] divide-x divide-y divide-white/5 bg-slate-950/40" role="rowgroup">
          <div
            v-for="day in monthGrid"
            :key="day.toISOString()"
            role="gridcell"
            class="p-1.5 sm:p-2 min-h-[110px] sm:min-h-[130px] flex flex-col justify-between transition-colors"
            :class="[
              !isCurrentMonth(day) ? 'opacity-40 bg-slate-950/80' : '',
              isToday(day) ? 'bg-indigo-950/20' : ''
            ]"
          >
            <!-- Header do Dia (Botão Acessível, touch target >= 44x44px) -->
            <button
              type="button"
              @click="emit('selectDay', day)"
              :aria-label="`Ver compromissos do dia ${getSaoPauloParts(day).day}`"
              class="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] cursor-pointer text-left group"
            >
              <span
                class="text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
                :class="isToday(day) ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 group-hover:text-white'"
              >
                {{ getSaoPauloParts(day).day }}
              </span>

              <span
                v-if="getAppointmentsForDay(day).length > 0"
                class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
              >
                {{ getAppointmentsForDay(day).length }}
              </span>
            </button>

            <!-- Lista de Compromissos do Dia (Botões com touch target >= 44px) -->
            <div class="space-y-1.5 mt-1">
              <button
                v-for="appt in getAppointmentsForDay(day).slice(0, 2)"
                :key="appt.id"
                type="button"
                :aria-label="`Ver detalhes de agendamento: ${appt.client?.nome || 'Cliente'}`"
                @click="emit('selectAppointment', appt)"
                class="w-full text-left text-[11px] truncate px-2.5 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-200 border border-white/5 transition-colors cursor-pointer flex items-center min-h-[44px]"
              >
                <span class="truncate">{{ appt.client?.nome || 'Compromisso' }}</span>
              </button>
              <div
                v-if="getAppointmentsForDay(day).length > 2"
                class="text-[10px] text-slate-400 font-medium pl-1"
              >
                +{{ getAppointmentsForDay(day).length - 2 }} mais
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
