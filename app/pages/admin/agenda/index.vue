<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AgendaHeader from '~/components/admin/agenda/AgendaHeader.vue'
import AgendaWeekView from '~/components/admin/agenda/AgendaWeekView.vue'
import AgendaDayView from '~/components/admin/agenda/AgendaDayView.vue'
import AgendaListView from '~/components/admin/agenda/AgendaListView.vue'
import AgendaMonthView from '~/components/admin/agenda/AgendaMonthView.vue'
import AppointmentDetailSheet from '~/components/admin/agenda/AppointmentDetailSheet.vue'
import AppointmentCreateModal from '~/components/admin/agenda/AppointmentCreateModal.vue'
import AppointmentRescheduleModal from '~/components/admin/agenda/AppointmentRescheduleModal.vue'
import AppointmentEditModal from '~/components/admin/agenda/AppointmentEditModal.vue'
import AppointmentCancelDialog from '~/components/admin/agenda/AppointmentCancelDialog.vue'

import { useCrmAgenda } from '~/composables/useCrmAgenda'
import { useCrmStaff } from '~/composables/useCrmStaff'
import {
  getCalendarWeekDays,
  getCalendarMonthGrid,
  getSaoPauloParts
} from '~/utils/crmDateTime'
import type { CrmAppointmentSummary } from '~/types/crmAppointments'

definePageMeta({
  layout: 'admin'
})

const viewMode = ref<'semana' | 'dia' | 'lista' | 'mes'>('semana')
const currentDate = ref<Date>(new Date())
const selectedStaffId = ref<string>('')
const selectedTipo = ref<string>('')
const selectedStatus = ref<string>('')

// Modais e Sheet
const isDetailSheetOpen = ref(false)
const isCreateModalOpen = ref(false)
const isRescheduleModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isCancelDialogOpen = ref(false)

const {
  appointments,
  selectedAppointment,
  isLoading,
  errorMessage,
  fetchCalendarRange,
  fetchAppointmentDetail,
  updateAppointmentStatus
} = useCrmAgenda()

const { staffList, fetchStaff } = useCrmStaff()

// Define visualização padrão conforme largura da tela
onMounted(async () => {
  if (window.innerWidth < 768) {
    viewMode.value = 'dia'
  } else {
    viewMode.value = 'semana'
  }

  await fetchStaff({ isActive: true })
  await loadCalendarData()
})

watch([viewMode, currentDate, selectedStaffId, selectedTipo, selectedStatus], () => {
  loadCalendarData()
})

async function loadCalendarData() {
  let startIso: string
  let endIso: string

  if (viewMode.value === 'dia') {
    const p = getSaoPauloParts(currentDate.value)
    const dayStart = new Date(Date.UTC(p.year, p.month - 1, p.day, 0, 0, 0))
    const dayEnd = new Date(Date.UTC(p.year, p.month - 1, p.day, 23, 59, 59))
    startIso = dayStart.toISOString()
    endIso = dayEnd.toISOString()
  } else if (viewMode.value === 'mes') {
    const p = getSaoPauloParts(currentDate.value)
    const grid = getCalendarMonthGrid(p.year, p.month)
    const first = grid[0]
    const last = grid[grid.length - 1]
    const pFirst = getSaoPauloParts(first)
    const pLast = getSaoPauloParts(last)
    startIso = new Date(Date.UTC(pFirst.year, pFirst.month - 1, pFirst.day, 0, 0, 0)).toISOString()
    endIso = new Date(Date.UTC(pLast.year, pLast.month - 1, pLast.day, 23, 59, 59)).toISOString()
  } else {
    // Semana ou Lista (7 dias)
    const days = getCalendarWeekDays(currentDate.value)
    const first = days[0]
    const last = days[6]
    const pFirst = getSaoPauloParts(first)
    const pLast = getSaoPauloParts(last)
    startIso = new Date(Date.UTC(pFirst.year, pFirst.month - 1, pFirst.day, 0, 0, 0)).toISOString()
    endIso = new Date(Date.UTC(pLast.year, pLast.month - 1, pLast.day, 23, 59, 59)).toISOString()
  }

  const rawAppointments = await fetchCalendarRange(startIso, endIso, selectedStaffId.value || undefined)

  // Filtros locais adicionais se aplicável (tipo e status)
  if (selectedTipo.value || selectedStatus.value) {
    appointments.value = rawAppointments.filter(a => {
      const matchTipo = !selectedTipo.value || a.tipo_agendamento === selectedTipo.value
      const matchStatus = !selectedStatus.value || a.status_agendamento === selectedStatus.value
      return matchTipo && matchStatus
    })
  }
}

function handleNavigate(direction: 'prev' | 'next' | 'today') {
  if (direction === 'today') {
    currentDate.value = new Date()
    return
  }

  const delta = direction === 'next' ? 1 : -1
  const next = new Date(currentDate.value)

  if (viewMode.value === 'dia') {
    next.setUTCDate(next.getUTCDate() + delta)
  } else if (viewMode.value === 'mes') {
    const p = getSaoPauloParts(next)
    next.setUTCFullYear(p.year)
    next.setUTCMonth(p.month - 1 + delta)
  } else {
    // Semana / Lista
    next.setUTCDate(next.getUTCDate() + (delta * 7))
  }
  currentDate.value = next
}

async function handleSelectAppointment(appt: CrmAppointmentSummary) {
  const detail = await fetchAppointmentDetail(appt.id)
  if (detail) {
    isDetailSheetOpen.value = true
  }
}

function handleSelectDayFromMonth(day: Date) {
  currentDate.value = day
  viewMode.value = 'dia'
}

async function handleAdvanceStatus(nextStatus: string) {
  if (!selectedAppointment.value) return
  const res = await updateAppointmentStatus(selectedAppointment.value.id, {
    status: nextStatus,
    expected_appointment_updated_at: selectedAppointment.value.updated_at
  })
  if (res.success) {
    await loadCalendarData()
  }
}

function handleAppointmentMutated() {
  loadCalendarData()
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Header e Controles da Agenda -->
    <AgendaHeader
      :view-mode="viewMode"
      :current-date="currentDate"
      :staff-list="staffList"
      :selected-staff-id="selectedStaffId"
      :selected-tipo="selectedTipo"
      :selected-status="selectedStatus"
      @update:view-mode="viewMode = $event"
      @update:current-date="currentDate = $event"
      @update:selected-staff-id="selectedStaffId = $event"
      @update:selected-tipo="selectedTipo = $event"
      @update:selected-status="selectedStatus = $event"
      @navigate="handleNavigate"
      @create-appointment="isCreateModalOpen = true"
    />

    <!-- Feedback de Erro Geral -->
    <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
      {{ errorMessage }}
    </div>

    <!-- Visão Ativa do Calendário -->
    <div>
      <AgendaWeekView
        v-if="viewMode === 'semana'"
        :current-date="currentDate"
        :appointments="appointments"
        :is-loading="isLoading"
        @select-appointment="handleSelectAppointment"
      />

      <AgendaDayView
        v-else-if="viewMode === 'dia'"
        :current-date="currentDate"
        :appointments="appointments"
        :is-loading="isLoading"
        @select-appointment="handleSelectAppointment"
      />

      <AgendaListView
        v-else-if="viewMode === 'lista'"
        :appointments="appointments"
        :is-loading="isLoading"
        @select-appointment="handleSelectAppointment"
      />

      <AgendaMonthView
        v-else-if="viewMode === 'mes'"
        :current-date="currentDate"
        :appointments="appointments"
        :is-loading="isLoading"
        @select-day="handleSelectDayFromMonth"
        @select-appointment="handleSelectAppointment"
      />
    </div>

    <!-- Modais e Sheets de Ação -->
    <AppointmentDetailSheet
      :is-open="isDetailSheetOpen"
      :appointment="selectedAppointment"
      :is-loading="isLoading"
      @close="isDetailSheetOpen = false"
      @open-edit="isDetailSheetOpen = false; isEditModalOpen = true"
      @open-reschedule="isDetailSheetOpen = false; isRescheduleModalOpen = true"
      @open-cancel="isDetailSheetOpen = false; isCancelDialogOpen = true"
      @update-status="handleAdvanceStatus"
    />

    <AppointmentCreateModal
      :is-open="isCreateModalOpen"
      :staff-list="staffList"
      @close="isCreateModalOpen = false"
      @appointment-created="handleAppointmentMutated"
    />

    <AppointmentRescheduleModal
      :is-open="isRescheduleModalOpen"
      :appointment="selectedAppointment"
      @close="isRescheduleModalOpen = false"
      @rescheduled="handleAppointmentMutated"
    />

    <AppointmentEditModal
      :is-open="isEditModalOpen"
      :appointment="selectedAppointment"
      :staff-list="staffList"
      @close="isEditModalOpen = false"
      @appointment-updated="handleAppointmentMutated"
    />

    <AppointmentCancelDialog
      :is-open="isCancelDialogOpen"
      :appointment="selectedAppointment"
      @close="isCancelDialogOpen = false"
      @cancelled="handleAppointmentMutated"
    />
  </div>
</template>
