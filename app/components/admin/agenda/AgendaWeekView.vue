<script setup lang="ts">
import { computed } from 'vue'
import type { CrmAppointmentSummary } from '~/types/crmAppointments'
import AppointmentCard from './AppointmentCard.vue'
import {
  getCalendarWeekDays,
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
  (e: 'selectAppointment', appt: CrmAppointmentSummary): void
}>()

const weekDays = computed(() => getCalendarWeekDays(props.currentDate))

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Emenda 8: Dynamic hours bounds if appointments are outside 07:00-20:00
const hourBounds = computed(() => {
  let minHour = 7
  let maxHour = 20

  for (const appt of props.appointments) {
    if (appt.data_hora_inicio) {
      const pStart = getSaoPauloParts(appt.data_hora_inicio)
      if (pStart.hour < minHour) minHour = Math.max(0, pStart.hour)
    }
    if (appt.data_hora_fim) {
      const pEnd = getSaoPauloParts(appt.data_hora_fim)
      if (pEnd.hour > maxHour) maxHour = Math.min(23, pEnd.hour + 1)
    }
  }

  const hours: number[] = []
  for (let h = minHour; h <= maxHour; h++) {
    hours.push(h)
  }
  return hours
})

function getAppointmentsForDay(day: Date) {
  return props.appointments.filter(a => isSameDay(a.data_hora_inicio, day))
}
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-xl">
    <!-- Header dos Dias da Semana -->
    <div class="grid grid-cols-7 border-b border-white/10 bg-slate-900/90 text-center">
      <div
        v-for="(day, idx) in weekDays"
        :key="day.toISOString()"
        class="py-3 px-1 border-r last:border-r-0 border-white/5"
        :class="isToday(day) ? 'bg-indigo-950/40' : ''"
      >
        <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {{ dayNames[idx] }}
        </div>
        <div
          class="text-sm sm:text-base font-bold mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full"
          :class="isToday(day) ? 'bg-indigo-600 text-white shadow-md' : 'text-white'"
        >
          {{ getSaoPauloParts(day).day }}
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
      <span>Carregando agendamentos da semana...</span>
    </div>

    <!-- Grid Semanal de Compromissos -->
    <div v-else class="grid grid-cols-7 min-h-[480px] divide-x divide-white/5 bg-slate-950/40">
      <div
        v-for="day in weekDays"
        :key="day.toISOString()"
        class="p-2 space-y-2 flex flex-col"
        :class="isToday(day) ? 'bg-indigo-950/10' : ''"
      >
        <div v-if="getAppointmentsForDay(day).length === 0" class="flex-1 flex items-center justify-center text-center p-4">
          <span class="text-[11px] text-slate-600 select-none">Sem compromissos</span>
        </div>

        <div v-else class="space-y-2">
          <AppointmentCard
            v-for="appt in getAppointmentsForDay(day)"
            :key="appt.id"
            :appointment="appt"
            @click="emit('selectAppointment', appt)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
