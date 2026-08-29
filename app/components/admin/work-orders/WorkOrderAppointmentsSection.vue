<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { CrmAppointmentSummary } from '~/types/crmAppointments'
import AppointmentCreateModal from '~/components/admin/agenda/AppointmentCreateModal.vue'
import AppointmentDetailSheet from '~/components/admin/agenda/AppointmentDetailSheet.vue'
import {
  formatDateRangeDisplay
} from '~/utils/crmDateTime'
import { useCrmStaff } from '~/composables/useCrmStaff'
import { useCrmAgenda } from '~/composables/useCrmAgenda'

const props = defineProps<{
  workOrderId: string
  workOrderStatus: string
  isArchived?: boolean
}>()

const emit = defineEmits<{
  (e: 'appointmentsChanged'): void
}>()

const appointments = ref<CrmAppointmentSummary[]>([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(false)
const limit = 20
const offset = ref(0)
const errorMessage = ref<string | null>(null)

const isCreateModalOpen = ref(false)
const isDetailSheetOpen = ref(false)
const selectedAppointmentDetail = ref<any | null>(null)

const { staffList, fetchStaff } = useCrmStaff()
const { fetchAppointmentDetail } = useCrmAgenda()

const statusColors: Record<string, string> = {
  agendado: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  confirmado: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  em_deslocamento: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  realizado: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cancelado: 'bg-rose-500/20 text-rose-300 border-rose-500/30 line-through opacity-70',
  reagendado: 'bg-purple-500/20 text-purple-300 border-purple-500/30 opacity-70'
}

const tipoLabels: Record<string, string> = {
  visita_tecnica: 'Visita Técnica',
  medicao: 'Medição',
  instalacao: 'Instalação',
  manutencao: 'Manutenção',
  garantia: 'Garantia'
}

async function loadAppointments(reset = false) {
  if (reset) {
    offset.value = 0
    appointments.value = []
    isLoading.value = true
  } else {
    isLoadingMore.value = true
  }
  errorMessage.value = null

  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}/appointments?limit=${limit}&offset=${offset.value}`)
    const fetched = res?.appointments || []
    if (reset) {
      appointments.value = fetched
    } else {
      appointments.value.push(...fetched)
    }
    hasMore.value = fetched.length === limit
    offset.value += fetched.length
  } catch (err: any) {
    console.error('[WorkOrderAppointmentsSection] Erro ao carregar agendamentos:', err)
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Falha ao carregar histórico de agendamentos.'
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

async function handleOpenDetail(appt: CrmAppointmentSummary) {
  const detail = await fetchAppointmentDetail(appt.id)
  if (detail) {
    selectedAppointmentDetail.value = detail
    isDetailSheetOpen.value = true
  }
}

function handleAppointmentCreated() {
  loadAppointments(true)
  emit('appointmentsChanged')
}

onMounted(async () => {
  await Promise.all([
    loadAppointments(true),
    fetchStaff({ isActive: true })
  ])
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header da Seção com CTA -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <Icon name="lucide:calendar" class="w-5 h-5 text-indigo-400" />
          <span>Agenda & Compromissos da OS</span>
        </h3>
        <p class="text-xs text-slate-400">Histórico completo de visitas técnicas, medições, instalações e garantias.</p>
      </div>

      <button
        v-if="!isArchived"
        @click="isCreateModalOpen = true"
        class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        <span>Agendar Compromisso</span>
      </button>
    </div>

    <!-- Feedback de Erro -->
    <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
      {{ errorMessage }}
    </div>

    <!-- Loading Inicial -->
    <div v-if="isLoading" class="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60">
      <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
      <span>Carregando histórico de agendamentos...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="appointments.length === 0"
      class="p-12 text-center rounded-2xl border border-dashed border-white/10 bg-slate-900/40 space-y-3"
    >
      <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
        <Icon name="lucide:calendar-x" class="w-6 h-6" />
      </div>
      <p class="text-sm font-semibold text-slate-200">Nenhum compromisso agendado para esta OS.</p>
      <p class="text-xs text-slate-400 max-w-md mx-auto">
        Agende uma medição, visita técnica ou instalação para vincular a equipe técnica e atualizar a data prevista automaticamente.
      </p>
      <div v-if="!isArchived" class="pt-2">
        <button
          @click="isCreateModalOpen = true"
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all inline-flex items-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          <span>Criar Primeiro Agendamento</span>
        </button>
      </div>
    </div>

    <!-- Lista Paginada de Agendamentos -->
    <div v-else class="space-y-4">
      <div class="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-xl divide-y divide-white/5">
        <div
          v-for="appt in appointments"
          :key="appt.id"
          @click="handleOpenDetail(appt)"
          class="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div class="space-y-1.5 flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-bold text-white">
                {{ tipoLabels[appt.tipo_agendamento] || appt.tipo_agendamento }}
              </span>
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                :class="statusColors[appt.status_agendamento] || 'bg-slate-800 text-slate-300 border-white/10'"
              >
                {{ appt.status_agendamento }}
              </span>
            </div>

            <p class="text-xs text-slate-300 font-mono">
              {{ formatDateRangeDisplay(appt.data_hora_inicio, appt.data_hora_fim) }}
            </p>

            <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
              <span v-if="appt.staff" class="flex items-center gap-1">
                <Icon name="lucide:user" class="w-3.5 h-3.5 text-slate-500" />
                <span>{{ appt.staff.nome }} ({{ appt.staff.funcao }})</span>
              </span>
              <span v-else class="italic text-slate-500">Sem técnico atribuído</span>

              <span v-if="appt.address" class="flex items-center gap-1 truncate">
                <Icon name="lucide:map-pin" class="w-3.5 h-3.5 text-slate-500" />
                <span class="truncate">{{ appt.address.logradouro }}, {{ appt.address.numero }}</span>
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              @click.stop="handleOpenDetail(appt)"
              class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[44px] cursor-pointer"
            >
              <span>Ver Detalhes</span>
              <Icon name="lucide:chevron-right" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Botão Carregar Mais -->
      <div v-if="hasMore" class="text-center pt-2">
        <button
          @click="loadAppointments(false)"
          :disabled="isLoadingMore"
          class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold transition-all inline-flex items-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Icon v-if="isLoadingMore" name="lucide:loader-2" class="w-4 h-4 animate-spin text-indigo-400" />
          <span>{{ isLoadingMore ? 'Carregando...' : 'Carregar Mais Agendamentos' }}</span>
        </button>
      </div>
    </div>

    <!-- Modais Contextuais -->
    <AppointmentCreateModal
      :is-open="isCreateModalOpen"
      :staff-list="staffList"
      :preselected-work-order-id="workOrderId"
      @close="isCreateModalOpen = false"
      @appointment-created="handleAppointmentCreated"
    />

    <AppointmentDetailSheet
      :is-open="isDetailSheetOpen"
      :appointment="selectedAppointmentDetail"
      @close="isDetailSheetOpen = false"
      @open-edit="isDetailSheetOpen = false"
      @open-reschedule="isDetailSheetOpen = false"
      @open-cancel="isDetailSheetOpen = false"
    />
  </div>
</template>
