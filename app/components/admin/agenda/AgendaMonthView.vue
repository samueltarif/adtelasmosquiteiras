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
  <div class="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-xl">
    <!-- Header dos Dias -->
    <div class="grid grid-cols-7 border-b border-white/10 bg-slate-900/90 text-center">
      <div
        v-for="name in dayHeaders"
        :key="name"
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
    <div v-else class="grid grid-cols-7 min-h-[480px] divide-x divide-y divide-white/5 bg-slate-950/40">
      <div
        v-for="day in monthGrid"
        :key="day.toISOString()"
        @click="emit('selectDay', day)"
        class="p-2 min-h-[90px] sm:min-h-[110px] flex flex-col justify-between transition-colors cursor-pointer hover:bg-white/5 select-none"
        :class="[
          !isCurrentMonth(day) ? 'opacity-40 bg-slate-950/80' : '',
          isToday(day) ? 'bg-indigo-950/20' : ''
        ]"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
            :class="isToday(day) ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300'"
          >
            {{ getSaoPauloParts(day).day }}
          </span>

          <span
            v-if="getAppointmentsForDay(day).length > 0"
            class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
          >
            {{ getAppointmentsForDay(day).length }}
          </span>
        </div>

        <div class="space-y-1 mt-1">
          <div
            v-for="appt in getAppointmentsForDay(day).slice(0, 2)"
            :key="appt.id"
            @click.stop="emit('selectAppointment', appt)"
            class="text-[10px] truncate px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5 transition-colors"
          >
            {{ appt.work_order?.client?.nome || 'Compromisso' }}
          </div>
          <div
            v-if="getAppointmentsForDay(day).length > 2"
            class="text-[9px] text-slate-500 font-medium pl-1"
          >
            +{{ getAppointmentsForDay(day).length - 2 }} mais
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
