<script setup lang="ts">
import { computed } from 'vue'
import type { CrmAppointmentSummary } from '~/types/crmAppointments'
import { formatAppointmentTime } from '~/utils/crmDateTime'

const props = defineProps<{
  appointment: CrmAppointmentSummary
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', appointment: CrmAppointmentSummary): void
}>()

const statusColors: Record<string, string> = {
  agendado: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  confirmado: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  em_deslocamento: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  realizado: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cancelado: 'bg-rose-500/20 text-rose-300 border-rose-500/30 line-through opacity-70',
  reagendado: 'bg-purple-500/20 text-purple-300 border-purple-500/30 opacity-70'
}

const statusLabels: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_deslocamento: 'Em Deslocamento',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
  reagendado: 'Reagendado'
}

const tipoLabels: Record<string, string> = {
  visita_tecnica: 'Visita Técnica',
  medicao: 'Medição',
  instalacao: 'Instalação',
  manutencao: 'Manutenção',
  garantia: 'Garantia'
}

const tipoBadgeColors: Record<string, string> = {
  visita_tecnica: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  medicao: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  instalacao: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  manutencao: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  garantia: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
}

const timeInterval = computed(() => {
  const start = formatAppointmentTime(props.appointment.data_hora_inicio)
  const end = formatAppointmentTime(props.appointment.data_hora_fim)
  return `${start} - ${end}`
})
</script>

<template>
  <div
    tabindex="0"
    role="button"
    :aria-label="`Compromisso ${tipoLabels[appointment.tipo_agendamento] || appointment.tipo_agendamento}, ${appointment.work_order?.numero_os || 'OS'}, ${timeInterval}`"
    @click="emit('click', appointment)"
    @keydown.enter="emit('click', appointment)"
    @keydown.space.prevent="emit('click', appointment)"
    class="w-full text-left rounded-xl border border-white/10 bg-slate-900/90 hover:bg-slate-800/90 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-2.5 transition-all shadow-md cursor-pointer group select-none min-h-[44px]"
  >
    <div class="flex items-center justify-between gap-1.5 mb-1.5">
      <span class="text-[11px] font-bold text-slate-300 flex items-center gap-1 font-mono">
        <Icon name="lucide:clock" class="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        {{ timeInterval }}
      </span>

      <span
        class="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
        :class="statusColors[appointment.status_agendamento] || 'bg-slate-800 text-slate-300 border-white/10'"
      >
        {{ statusLabels[appointment.status_agendamento] || appointment.status_agendamento }}
      </span>
    </div>

    <div class="space-y-1">
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
          {{ appointment.work_order?.client?.nome || 'Cliente' }}
        </span>
        <span v-if="appointment.work_order?.numero_os" class="text-[10px] font-mono text-slate-400 shrink-0">
          {{ appointment.work_order.numero_os }}
        </span>
      </div>

      <div class="flex items-center justify-between gap-1.5 pt-0.5">
        <span
          class="text-[10px] font-medium px-1.5 py-0.5 rounded border"
          :class="tipoBadgeColors[appointment.tipo_agendamento] || 'bg-slate-800 text-slate-300 border-white/10'"
        >
          {{ tipoLabels[appointment.tipo_agendamento] || appointment.tipo_agendamento }}
        </span>

        <span v-if="appointment.staff" class="text-[11px] text-slate-400 flex items-center gap-1 truncate max-w-[120px]">
          <Icon name="lucide:user" class="w-3 h-3 text-slate-500 shrink-0" />
          <span class="truncate">{{ appointment.staff.nome }}</span>
        </span>
        <span v-else class="text-[10px] text-slate-500 italic">
          Sem técnico
        </span>
      </div>
    </div>
  </div>
</template>
