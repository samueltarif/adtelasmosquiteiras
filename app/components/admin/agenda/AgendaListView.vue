<script setup lang="ts">
import { computed } from 'vue'
import type { CrmAppointmentSummary } from '~/types/crmAppointments'
import AppointmentCard from './AppointmentCard.vue'
import {
  getSaoPauloDateString,
  formatAppointmentDate,
  isToday
} from '~/utils/crmDateTime'

const props = defineProps<{
  appointments: CrmAppointmentSummary[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'selectAppointment', appt: CrmAppointmentSummary): void
}>()

interface GroupedAppointments {
  dateStr: string
  displayDate: string
  isCurrentDay: boolean
  items: CrmAppointmentSummary[]
}

const groupedAppointments = computed(() => {
  const map: Record<string, CrmAppointmentSummary[]> = {}

  // Sort chronological
  const sorted = [...props.appointments].sort(
    (a, b) => new Date(a.data_hora_inicio).getTime() - new Date(b.data_hora_inicio).getTime()
  )

  for (const appt of sorted) {
    const key = getSaoPauloDateString(appt.data_hora_inicio)
    if (!map[key]) map[key] = []
    map[key].push(appt)
  }

  const groups: GroupedAppointments[] = []
  for (const [dateStr, items] of Object.entries(map)) {
    groups.push({
      dateStr,
      displayDate: formatAppointmentDate(items[0]?.data_hora_inicio),
      isCurrentDay: isToday(dateStr),
      items
    })
  }

  return groups
})
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="p-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60">
      <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
      <span>Carregando lista de agendamentos...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="groupedAppointments.length === 0"
      class="p-16 text-center rounded-2xl border border-dashed border-white/10 bg-slate-900/40 space-y-2"
    >
      <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
        <Icon name="lucide:calendar-x" class="w-6 h-6" />
      </div>
      <p class="text-sm font-semibold text-slate-200">Nenhum compromisso encontrado</p>
      <p class="text-xs text-slate-400">Ajuste os filtros selecionados ou crie um novo agendamento.</p>
    </div>

    <!-- Lista Agrupada -->
    <div v-else class="space-y-6">
      <div
        v-for="group in groupedAppointments"
        :key="group.dateStr"
        class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-5 shadow-lg space-y-3"
      >
        <!-- Header do Grupo -->
        <div class="flex items-center justify-between pb-2 border-b border-white/10">
          <div class="flex items-center gap-2">
            <Icon name="lucide:calendar" class="w-4 h-4 text-indigo-400" />
            <h3 class="text-sm font-bold text-white">{{ group.displayDate }}</h3>
            <span
              v-if="group.isCurrentDay"
              class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white shadow-xs"
            >
              Hoje
            </span>
          </div>

          <span class="text-xs text-slate-400 font-mono">
            {{ group.items.length }} {{ group.items.length === 1 ? 'item' : 'itens' }}
          </span>
        </div>

        <!-- Cards do Grupo -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AppointmentCard
            v-for="appt in group.items"
            :key="appt.id"
            :appointment="appt"
            @click="emit('selectAppointment', appt)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
