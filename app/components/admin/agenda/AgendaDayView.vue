<script setup lang="ts">
import { computed } from 'vue'
import type { CrmAppointmentSummary } from '~/types/crmAppointments'
import AppointmentCard from './AppointmentCard.vue'
import {
  formatAppointmentDate,
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
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-6 shadow-xl space-y-4">
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

    <!-- Lista de Compromissos do Dia -->
    <div v-else class="space-y-3">
      <AppointmentCard
        v-for="appt in dayAppointments"
        :key="appt.id"
        :appointment="appt"
        @click="emit('selectAppointment', appt)"
      />
    </div>
  </div>
</template>
