<script setup lang="ts">
import { computed } from 'vue'
import type { CrmAppointmentDetail } from '~/types/crmAppointments'
import {
  formatAppointmentDate,
  formatAppointmentTime,
  formatDateRangeDisplay
} from '~/utils/crmDateTime'

const props = defineProps<{
  isOpen: boolean
  appointment: CrmAppointmentDetail | null
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'openEdit'): void
  (e: 'openReschedule'): void
  (e: 'openCancel'): void
  (e: 'updateStatus', nextStatus: string): void
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

const isTerminal = computed(() => {
  if (!props.appointment) return true
  return ['realizado', 'cancelado', 'reagendado'].includes(props.appointment.status_agendamento)
})

const isArchivedWo = computed(() => {
  return props.appointment?.work_order?.is_archived === true
})

// Emenda 3: Next valid status transitions supported by Migration 012
const nextValidStatuses = computed(() => {
  if (!props.appointment || isTerminal.value || isArchivedWo.value) return []
  const current = props.appointment.status_agendamento
  if (current === 'agendado') {
    return [
      { status: 'confirmado', label: 'Confirmar Agendamento', icon: 'lucide:check' },
      { status: 'em_deslocamento', label: 'Em Deslocamento', icon: 'lucide:truck' }
    ]
  }
  if (current === 'confirmado') {
    return [
      { status: 'em_deslocamento', label: 'Em Deslocamento', icon: 'lucide:truck' },
      { status: 'realizado', label: 'Marcar Realizado', icon: 'lucide:check-circle' }
    ]
  }
  if (current === 'em_deslocamento') {
    return [
      { status: 'realizado', label: 'Marcar Realizado', icon: 'lucide:check-circle' }
    ]
  }
  return []
})
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity">
    <div
      class="w-full max-w-lg bg-slate-900 border-l border-white/10 shadow-2xl h-full flex flex-col overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
    >
      <!-- Header do Sheet -->
      <div class="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
        <div class="space-y-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Detalhes do Agendamento</span>
          <h2 id="sheet-title" class="text-lg font-bold text-white flex items-center gap-2">
            <span>{{ appointment ? (tipoLabels[appointment.tipo_agendamento] || appointment.tipo_agendamento) : 'Carregando...' }}</span>
          </h2>
        </div>
        <button
          @click="emit('close')"
          class="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Fechar detalhes"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading || !appointment" class="flex-1 p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
        <span>Carregando detalhes do agendamento...</span>
      </div>

      <!-- Conteúdo Detalhado -->
      <div v-else class="p-6 space-y-6 flex-1">
        <!-- Alerta de OS Arquivada -->
        <div v-if="isArchivedWo" class="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
          <Icon name="lucide:alert-triangle" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p class="font-bold">Ordem de Serviço Arquivada</p>
            <p class="text-slate-300 text-[11px] mt-0.5">Edições, reagendamentos e mudanças de status estão bloqueados. Apenas cancelamento é permitido.</p>
          </div>
        </div>

        <!-- Badges de Status e Data/Hora -->
        <div class="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400 font-medium">Status Operacional:</span>
            <span
              class="text-xs font-bold px-3 py-1 rounded-lg border shadow-xs"
              :class="statusColors[appointment.status_agendamento] || 'bg-slate-800 text-white'"
            >
              {{ statusLabels[appointment.status_agendamento] || appointment.status_agendamento }}
            </span>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
            <span class="text-slate-400 font-medium">Data e Horário:</span>
            <span class="font-bold text-white font-mono">
              {{ formatDateRangeDisplay(appointment.data_hora_inicio, appointment.data_hora_fim) }}
            </span>
          </div>
        </div>

        <!-- Dados do Cliente e OS -->
        <div class="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-3 text-xs">
          <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 text-indigo-400">
            <Icon name="lucide:clipboard-list" class="w-4 h-4" />
            <span>Ordem de Serviço & Cliente</span>
          </h3>

          <div class="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span class="text-slate-500 block text-[11px]">Número da OS:</span>
              <NuxtLink
                v-if="appointment.work_order?.id"
                :to="`/admin/ordens-servico/${appointment.work_order.id}`"
                class="font-mono font-bold text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
              >
                <span>{{ appointment.work_order.numero_os }}</span>
                <Icon name="lucide:external-link" class="w-3 h-3" />
              </NuxtLink>
              <span v-else class="text-slate-400">-</span>
            </div>

            <div>
              <span class="text-slate-500 block text-[11px]">Status da OS:</span>
              <span class="font-bold text-slate-200 uppercase mt-0.5 block">
                {{ appointment.work_order?.status_os || '-' }}
              </span>
            </div>
          </div>

          <div class="pt-2 border-t border-white/5">
            <span class="text-slate-500 block text-[11px]">Cliente:</span>
            <span class="font-bold text-white text-sm block mt-0.5">
              {{ appointment.work_order?.client?.nome || '-' }}
            </span>
            <span v-if="appointment.work_order?.client?.telefone_principal" class="text-slate-400 text-[11px] block mt-0.5">
              Tel: {{ appointment.work_order.client.telefone_principal }}
            </span>
          </div>
        </div>

        <!-- Endereço do Compromisso -->
        <div class="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-2 text-xs">
          <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 text-indigo-400">
            <Icon name="lucide:map-pin" class="w-4 h-4" />
            <span>Local do Atendimento</span>
          </h3>

          <div v-if="appointment.address" class="text-slate-200 leading-relaxed pt-1">
            <span class="font-bold text-white block">{{ appointment.address.rotulo || 'Endereço Principal' }}</span>
            <p>{{ appointment.address.logradouro }}, {{ appointment.address.numero }} <span v-if="appointment.address.complemento">({{ appointment.address.complemento }})</span></p>
            <p class="text-slate-400">{{ appointment.address.bairro }} - {{ appointment.address.cidade }}/{{ appointment.address.uf }}</p>
            <p v-if="appointment.address.cep" class="text-slate-500 font-mono text-[11px]">CEP: {{ appointment.address.cep }}</p>
          </div>
          <p v-else class="text-slate-500 italic pt-1">Nenhum endereço específico vinculado.</p>
        </div>

        <!-- Técnico Responsável -->
        <div class="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-2 text-xs">
          <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 text-indigo-400">
            <Icon name="lucide:user-check" class="w-4 h-4" />
            <span>Técnico Responsável</span>
          </h3>

          <div v-if="appointment.staff" class="flex items-center justify-between pt-1">
            <div>
              <span class="font-bold text-white block">{{ appointment.staff.nome }}</span>
              <span class="text-[11px] text-slate-400">{{ appointment.staff.funcao }}</span>
            </div>
            <span v-if="appointment.staff.is_active" class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Ativo
            </span>
          </div>
          <p v-else class="text-slate-500 italic pt-1">Nenhum técnico atribuído a este compromisso.</p>
        </div>

        <!-- Observações -->
        <div v-if="appointment.observacoes" class="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-2 text-xs">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Observações Técnicas</h3>
          <p class="text-slate-200 whitespace-pre-wrap leading-relaxed">{{ appointment.observacoes }}</p>
        </div>

        <!-- Histórico de Reagendamento se houver -->
        <div v-if="appointment.motivo_reagendamento" class="rounded-2xl border border-purple-500/20 bg-purple-950/20 p-4 space-y-2 text-xs">
          <h3 class="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <Icon name="lucide:history" class="w-4 h-4" />
            <span>Motivo do Reagendamento</span>
          </h3>
          <p class="text-slate-200">{{ appointment.motivo_reagendamento }}</p>
        </div>

        <!-- Motivo de Cancelamento se houver -->
        <div v-if="appointment.motivo_cancelamento" class="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4 space-y-2 text-xs">
          <h3 class="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
            <Icon name="lucide:x-circle" class="w-4 h-4" />
            <span>Motivo do Cancelamento</span>
          </h3>
          <p class="text-slate-200">{{ appointment.motivo_cancelamento }}</p>
        </div>
      </div>

      <!-- Barra de Ações Inferior -->
      <div v-if="appointment && !isTerminal" class="p-6 border-t border-white/10 bg-slate-900/95 sticky bottom-0 space-y-3">
        <!-- Próximas Transições de Status -->
        <div v-if="nextValidStatuses.length > 0" class="space-y-2">
          <span class="text-[11px] text-slate-400 font-semibold block">Avançar Status:</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              v-for="st in nextValidStatuses"
              :key="st.status"
              @click="emit('updateStatus', st.status)"
              class="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
            >
              <Icon :name="st.icon" class="w-4 h-4" />
              <span>{{ st.label }}</span>
            </button>
          </div>
        </div>

        <!-- Botões de Edição, Reagendamento e Cancelamento -->
        <div class="flex items-center gap-2 pt-2 border-t border-white/5">
          <button
            v-if="!isArchivedWo"
            @click="emit('openEdit')"
            class="flex-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
          >
            <Icon name="lucide:pencil" class="w-4 h-4 text-indigo-400" />
            <span>Editar</span>
          </button>

          <button
            v-if="!isArchivedWo"
            @click="emit('openReschedule')"
            class="flex-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-purple-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
          >
            <Icon name="lucide:calendar-clock" class="w-4 h-4" />
            <span>Reagendar</span>
          </button>

          <button
            @click="emit('openCancel')"
            class="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
          >
            <Icon name="lucide:ban" class="w-4 h-4" />
            <span>Cancelar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
