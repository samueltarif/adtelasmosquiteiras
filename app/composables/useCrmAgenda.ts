/**
 * Composable de Gestão da Agenda e Agendamentos CRM
 * Arquivo: app/composables/useCrmAgenda.ts
 *
 * Consome os 8 endpoints de agendamento com controle estrito de concorrência e tipagem.
 * APPLICATION_LOGIC_MAX_LINES <= 200
 */

import { ref } from 'vue'
import type {
  CrmAppointmentSummary,
  CrmAppointmentDetail,
  AppointmentCalendarFilters,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  RescheduleAppointmentInput,
  CancelAppointmentInput,
  UpdateAppointmentStatusInput
} from '../../app/types/crmAppointments'
import { extractAppointmentErrorMessage } from '../utils/crmAgendaErrors'

export function useCrmAgenda() {
  const appointments = ref<CrmAppointmentSummary[]>([])
  const selectedAppointment = ref<CrmAppointmentDetail | null>(null)
  const isLoading = ref(false)
  const isDetailLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  let latestRequestId = 0

  async function fetchCalendarRange(filters: AppointmentCalendarFilters | { start: string; end: string; staffId?: string; tipo?: string; status?: string }) {
    const currentRequestId = ++latestRequestId
    isLoading.value = true
    errorMessage.value = null
    try {
      const q = new URLSearchParams({ start: filters.start, end: filters.end })
      if (filters.staffId && filters.staffId.trim()) q.set('staffId', filters.staffId.trim())
      if (filters.tipo && filters.tipo.trim()) q.set('tipo', filters.tipo.trim())
      if (filters.status && filters.status.trim()) q.set('status', filters.status.trim())

      const res = await $fetch<{ success: boolean; appointments: CrmAppointmentSummary[] }>(
        `/api/admin/crm/appointments?${q.toString()}`
      )
      if (currentRequestId === latestRequestId) {
        if (res?.success && Array.isArray(res.appointments)) {
          appointments.value = res.appointments
        }
      }
      return appointments.value
    } catch (err: any) {
      if (currentRequestId === latestRequestId) {
        console.error('[useCrmAgenda] Falha ao carregar calendário')
        errorMessage.value = extractAppointmentErrorMessage(err)
      }
      return appointments.value // Preserva dataset anterior em 503/erro
    } finally {
      if (currentRequestId === latestRequestId) {
        isLoading.value = false
      }
    }
  }

  async function fetchAppointmentDetail(id: string) {
    isDetailLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ success: boolean; appointment: CrmAppointmentDetail }>(
        `/api/admin/crm/appointments/${id}`
      )
      if (res?.success && res.appointment) {
        selectedAppointment.value = res.appointment
        return res.appointment
      }
      return null
    } catch (err: any) {
      console.error('[useCrmAgenda] Falha ao carregar detalhes')
      errorMessage.value = extractAppointmentErrorMessage(err)
      return null
    } finally {
      isDetailLoading.value = false
    }
  }

  async function handleMutationError(err: any, appointmentId?: string) {
    const msg = extractAppointmentErrorMessage(err)
    errorMessage.value = msg
    const status = err?.statusCode || (err?.response && err.response.status) || 500
    if (status === 409 && appointmentId) {
      // Concurrency conflict: refetch latest server detail to update selected appointment
      await fetchAppointmentDetail(appointmentId).catch(() => {})
    }
    return { success: false as const, error: msg, statusCode: status }
  }

  async function createAppointment(payload: CreateAppointmentInput) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ success: boolean; appointment: CrmAppointmentDetail }>(
        '/api/admin/crm/appointments',
        { method: 'POST', body: payload }
      )
      return { success: true as const, appointment: res.appointment }
    } catch (err: any) {
      return await handleMutationError(err)
    } finally {
      isLoading.value = false
    }
  }

  async function updateAppointment(id: string, payload: UpdateAppointmentInput) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ success: boolean; appointment: CrmAppointmentDetail }>(
        `/api/admin/crm/appointments/${id}`,
        { method: 'PATCH', body: payload }
      )
      if (res?.appointment) selectedAppointment.value = res.appointment
      return { success: true as const, appointment: res.appointment }
    } catch (err: any) {
      return await handleMutationError(err, id)
    } finally {
      isLoading.value = false
    }
  }

  async function rescheduleAppointment(id: string, payload: RescheduleAppointmentInput) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ success: boolean; appointment: CrmAppointmentDetail }>(
        `/api/admin/crm/appointments/${id}/reschedule`,
        { method: 'POST', body: payload }
      )
      return { success: true as const, appointment: res.appointment }
    } catch (err: any) {
      return await handleMutationError(err, id)
    } finally {
      isLoading.value = false
    }
  }

  async function cancelAppointment(id: string, payload: CancelAppointmentInput) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ success: boolean; appointment: CrmAppointmentDetail }>(
        `/api/admin/crm/appointments/${id}/cancel`,
        { method: 'POST', body: payload }
      )
      return { success: true as const, appointment: res.appointment }
    } catch (err: any) {
      return await handleMutationError(err, id)
    } finally {
      isLoading.value = false
    }
  }

  async function updateAppointmentStatus(id: string, payload: UpdateAppointmentStatusInput) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ success: boolean; appointment: CrmAppointmentDetail }>(
        `/api/admin/crm/appointments/${id}/status`,
        { method: 'POST', body: payload }
      )
      if (res?.appointment) selectedAppointment.value = res.appointment
      return { success: true as const, appointment: res.appointment }
    } catch (err: any) {
      return await handleMutationError(err, id)
    } finally {
      isLoading.value = false
    }
  }

  return {
    appointments,
    selectedAppointment,
    isLoading,
    isDetailLoading,
    errorMessage,
    fetchCalendarRange,
    fetchAppointmentDetail,
    createAppointment,
    updateAppointment,
    rescheduleAppointment,
    cancelAppointment,
    updateAppointmentStatus
  }
}
