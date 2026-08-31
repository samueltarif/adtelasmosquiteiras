<script setup lang="ts">
import { computed } from 'vue'
import type { CrmAppointmentSummary } from '~/types/crmAppointments'
import AppointmentCard from './AppointmentCard.vue'
import {
  formatAppointmentDate,
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

const dayAppointments = computed(() => {
  return props.appointments
    .filter(a => isSameDay(a.data_hora_inicio, props.currentDate))
    .sort((a, b) => new Date(a.data_hora_inicio).getTime() - new Date(b.data_hora_inicio).getTime())
})

// Timeline operacional 07:00–20:00 (expandindo se houver evento fora)
const timelineHours = computed(() => {
  let startHour = 7
  let endHour = 20

  for (const appt of dayAppointments.value) {
    const pStart = getSaoPauloParts(appt.data_hora_inicio)
    const pEnd = getSaoPauloParts(appt.data_hora_fim)
    if (pStart.hour < startHour) startHour = Math.max(0, pStart.hour)
    if (pEnd.hour > endHour || (pEnd.hour === endHour && pEnd.minute > 0)) {
      endHour = Math.min(23, pEnd.minute > 0 ? pEnd.hour + 1 : pEnd.hour)
    }
  }

  const hours: number[] = []
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h)
  }
  return hours
})

function getAppointmentsForHour(hour: number) {
  return dayAppointments.value.filter(a => {
    const p = getSaoPauloParts(a.data_hora_inicio)
    return p.hour === hour
  })
}
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-6 shadow-xl space-y-6">
    <!-- Header do Dia -->
    <div class="flex items-center justify-between pb-3 border-b border-white/10">
      <div>
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <Icon name="lucide:calendar" class="w-4 h-4 text-indigo-400" />
          <span>{{ formatAppointmentDate(currentDate.toISOString()) }}</span>
        </h3>
        <p class="text-xs text-slate-400">
          {{ dayAppointments.length }} {{ dayAppointments.length === 1 ? 'compromisso agendado' : 'compromissos agendados' }}
        </p>
      </div>

      <span
        v-if="isToday(currentDate)"
        class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-600 text-white shadow-sm"
      >
        Hoje
      </span>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
      <span>Carregando compromissos do dia...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="dayAppointments.length === 0"
      class="p-12 text-center rounded-xl border border-dashed border-white/10 bg-slate-950/40 space-y-2"
    >
      <div class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
        <Icon name="lucide:calendar-x" class="w-5 h-5" />
      </div>
      <p class="text-xs font-semibold text-slate-300">Nenhum agendamento para este dia.</p>
      <p class="text-[11px] text-slate-500">Utilize o botão "+ Novo Agendamento" para programar um serviço.</p>
    </div>

    <!-- Timeline Operacional do Dia -->
    <div v-else class="space-y-4">
      <div class="relative border-l border-white/10 ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6">
        <div
          v-for="hour in timelineHours"
          :key="hour"
          class="relative"
        >
          <!-- Indicador de Hora -->
          <div class="absolute -left-[29px] sm:-left-[37px] top-0 flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-slate-700 border-2 border-slate-900" />
            <span class="text-[11px] font-mono font-bold text-slate-400 w-10">
              {{ String(hour).padStart(2, '0') }}:00
            </span>
          </div>

          <!-- Cards na hora correspondente -->
          <div class="pt-1 space-y-2 min-h-[36px]">
            <AppointmentCard
              v-for="appt in getAppointmentsForHour(hour)"
              :key="appt.id"
              :appointment="appt"
              @click="emit('selectAppointment', appt)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
