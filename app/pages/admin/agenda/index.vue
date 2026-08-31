<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  getCalendarDayRange,
  getCalendarWeekRange,
  getCalendarMonthRange,
  getSaoPauloParts,
  getSaoPauloDateString,
  parseDateFromQuery,
  navigateMonthSafe
} from '~/utils/crmDateTime'
import type { CrmAppointmentSummary } from '~/types/crmAppointments'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()

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
  isDetailLoading,
  errorMessage,
  fetchCalendarRange,
  fetchAppointmentDetail,
  updateAppointmentStatus
} = useCrmAgenda()

const { staffList, fetchStaff } = useCrmStaff()

let isInitialMounting = true

function syncStateFromQuery() {
  const q = route.query
  const validViews = ['semana', 'dia', 'lista', 'mes']
  if (typeof q.view === 'string' && validViews.includes(q.view)) {
    viewMode.value = q.view as any
  } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
    viewMode.value = 'dia'
  } else {
    viewMode.value = 'semana'
  }

  if (typeof q.date === 'string') {
    const validDateStr = parseDateFromQuery(q.date)
    const [y, m, d] = validDateStr.split('-').map(Number)
    currentDate.value = new Date(Date.UTC(y || 1970, (m || 1) - 1, d || 1, 12, 0, 0))
  }
  selectedStaffId.value = typeof q.staffId === 'string' ? q.staffId : ''
  selectedTipo.value = typeof q.tipo === 'string' ? q.tipo : ''
  selectedStatus.value = typeof q.status === 'string' ? q.status : ''
}

function updateUrlQuery(updates: Record<string, string | undefined>) {
  const nextQuery: Record<string, string> = {
    view: viewMode.value,
    date: getSaoPauloDateString(currentDate.value),
    ...(selectedStaffId.value ? { staffId: selectedStaffId.value } : {}),
    ...(selectedTipo.value ? { tipo: selectedTipo.value } : {}),
    ...(selectedStatus.value ? { status: selectedStatus.value } : {}),
    ...updates
  }

  for (const k of Object.keys(nextQuery)) {
    if (!nextQuery[k]) delete nextQuery[k]
  }

  router.replace({ query: nextQuery }).catch(() => {})
}

async function loadCalendarData() {
  let range: { start: string; end: string }

  if (viewMode.value === 'dia') {
    range = getCalendarDayRange(getSaoPauloDateString(currentDate.value))
  } else if (viewMode.value === 'mes') {
    const p = getSaoPauloParts(currentDate.value)
    range = getCalendarMonthRange(p.year, p.month)
  } else {
    // Semana ou Lista (7 dias)
    range = getCalendarWeekRange(currentDate.value)
  }

  await fetchCalendarRange({
    start: range.start,
    end: range.end,
    staffId: selectedStaffId.value || undefined,
    tipo: selectedTipo.value || undefined,
    status: selectedStatus.value || undefined
  })
}

// Single Fetch Owner: onMounted executa initial fetch exatamente 1 vez
onMounted(async () => {
  syncStateFromQuery()
  await fetchStaff() // STAFF_FILTER_SCOPE = ACTIVE_AND_HISTORICAL
  await loadCalendarData()
  isInitialMounting = false
})

// Single Fetch Owner: Mudanças de route.query executam exatamente 1 fetch por interação
watch(() => route.query, () => {
  if (isInitialMounting) return
  syncStateFromQuery()
  loadCalendarData()
})

function handleNavigate(direction: 'prev' | 'next' | 'today') {
  let nextDate = new Date()
  if (direction !== 'today') {
    const delta = direction === 'next' ? 1 : -1
    if (viewMode.value === 'dia') {
      nextDate = new Date(currentDate.value)
      nextDate.setUTCDate(nextDate.getUTCDate() + delta)
    } else if (viewMode.value === 'mes') {
      nextDate = navigateMonthSafe(currentDate.value, delta)
    } else {
      nextDate = new Date(currentDate.value)
      nextDate.setUTCDate(nextDate.getUTCDate() + (delta * 7))
    }
  }
  updateUrlQuery({ date: getSaoPauloDateString(nextDate) })
}

async function handleSelectAppointment(appt: CrmAppointmentSummary) {
  const detail = await fetchAppointmentDetail(appt.id)
  if (detail) isDetailSheetOpen.value = true
}

function handleSelectDayFromMonth(day: Date) {
  updateUrlQuery({ view: 'dia', date: getSaoPauloDateString(day) })
}

async function handleAdvanceStatus(nextStatus: string) {
  if (!selectedAppointment.value) return
  const res = await updateAppointmentStatus(selectedAppointment.value.id, {
    status: nextStatus as any,
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
    <!-- Título Principal da Página -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
        Agenda & Agendamentos
      </h1>
    </div>

    <!-- Header e Controles da Agenda -->
    <AgendaHeader
      :view-mode="viewMode"
      :current-date="currentDate"
      :staff-list="staffList"
      :selected-staff-id="selectedStaffId"
      :selected-tipo="selectedTipo"
      :selected-status="selectedStatus"
      @update:view-mode="updateUrlQuery({ view: $event })"
      @update:current-date="updateUrlQuery({ date: getSaoPauloDateString($event) })"
      @update:selected-staff-id="updateUrlQuery({ staffId: $event || undefined })"
      @update:selected-tipo="updateUrlQuery({ tipo: $event || undefined })"
      @update:selected-status="updateUrlQuery({ status: $event || undefined })"
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
      :is-loading="isDetailLoading"
      @close="isDetailSheetOpen = false"
      @open-edit="isEditModalOpen = true"
      @open-reschedule="isRescheduleModalOpen = true"
      @open-cancel="isCancelDialogOpen = true"
      @update-status="handleAdvanceStatus"
    />

    <AppointmentCreateModal
      :is-open="isCreateModalOpen"
      :staff-list="staffList"
      @close="isCreateModalOpen = false"
      @created="handleAppointmentMutated"
    />

    <AppointmentEditModal
      :is-open="isEditModalOpen"
      :appointment="selectedAppointment"
      :staff-list="staffList"
      @close="isEditModalOpen = false"
      @saved="isDetailSheetOpen = false; handleAppointmentMutated()"
    />

    <AppointmentRescheduleModal
      :is-open="isRescheduleModalOpen"
      :appointment="selectedAppointment"
      :staff-list="staffList"
      @close="isRescheduleModalOpen = false"
      @rescheduled="isDetailSheetOpen = false; handleAppointmentMutated()"
    />

    <AppointmentCancelDialog
      :is-open="isCancelDialogOpen"
      :appointment="selectedAppointment"
      @close="isCancelDialogOpen = false"
      @cancelled="isDetailSheetOpen = false; handleAppointmentMutated()"
    />
  </div>
</template>
