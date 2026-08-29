/**
 * Composable de Gestão da Agenda e Agendamentos CRM
 * Arquivo: app/composables/useCrmAgenda.ts
 *
 * Consome os 8 endpoints de agendamento com controle estrito de concorrência e tipagem.
 * APPLICATION_LOGIC_MAX_LINES <= 200
 */

import { ref } from 'vue'
import type { CrmAppointmentSummary, CrmAppointmentDetail } from '../../app/types/crmAppointments'

export function useCrmAgenda() {
  const appointments = ref<CrmAppointmentSummary[]>([])
  const selectedAppointment = ref<CrmAppointmentDetail | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  async function fetchCalendarRange(startIso: string, endIso: string, staffId?: string) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const q = new URLSearchParams({ start: startIso, end: endIso })
      if (staffId && staffId.trim() !== '') q.set('staffId', staffId.trim())

      const res = await $fetch<{ success: boolean, appointments: CrmAppointmentSummary[] }>(
        `/api/admin/crm/appointments?${q.toString()}`
      )
      appointments.value = res?.success && Array.isArray(res.appointments) ? res.appointments : []
      return appointments.value
    } catch (err: any) {
      console.error('[useCrmAgenda] Erro ao carregar calendário:', err)
      errorMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Falha ao carregar agendamentos.'
      return []
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAppointmentDetail(id: string) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ success: boolean, appointment: CrmAppointmentDetail }>(
        `/api/admin/crm/appointments/${id}`
      )
      if (res?.success && res.appointment) {
        selectedAppointment.value = res.appointment
        return res.appointment
      }
      return null
    } catch (err: any) {
      console.error('[useCrmAgenda] Erro ao carregar detalhes:', err)
      errorMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Agendamento não encontrado.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createAppointment(payload: {
    work_order_id: string
    tipo_agendamento: string
    data_hora_inicio: string
    data_hora_fim: string
    staff_id?: string | null
    address_id?: string | null
    observacoes?: string | null
  }) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ success: boolean, appointment: CrmAppointmentDetail }>(
        '/api/admin/crm/appointments',
        { method: 'POST', body: payload }
      )
      return { success: true, appointment: res.appointment }
    } catch (err: any) {
      console.error('[useCrmAgenda] Erro ao criar agendamento:', err)
      const msg = err?.data?.statusMessage || err?.data?.message || err?.message || 'Falha ao criar agendamento.'
      errorMessage.value = msg
      return { success: false, error: msg, statusCode: err?.statusCode || 500 }
    } finally {
      isLoading.value = false
    }
  }

  async function updateAppointment(id: string, payload: {
    staff_id?: string | null
    address_id?: string | null
    observacoes?: string | null
    expected_appointment_updated_at: string
  }) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ success: boolean, appointment: CrmAppointmentDetail }>(
        `/api/admin/crm/appointments/${id}`,
        { method: 'PATCH', body: payload }
      )
      if (res?.appointment) selectedAppointment.value = res.appointment
      return { success: true, appointment: res.appointment }
    } catch (err: any) {
      console.error('[useCrmAgenda] Erro ao atualizar agendamento:', err)
      const msg = err?.statusCode === 409
        ? 'Os dados foram alterados por outro usuário. Recarregamos a versão mais recente.'
        : (err?.data?.statusMessage || err?.data?.message || err?.message || 'Falha ao atualizar agendamento.')
      errorMessage.value = msg
      return { success: false, error: msg, statusCode: err?.statusCode || 500 }
    } finally {
      isLoading.value = false
    }
  }

  async function rescheduleAppointment(id: string, payload: {
    new_data_hora_inicio: string
    new_data_hora_fim: string
    motivo: string
    expected_appointment_updated_at: string
  }) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ success: boolean, appointment: CrmAppointmentDetail }>(
        `/api/admin/crm/appointments/${id}/reschedule`,
        { method: 'POST', body: payload }
      )
      return { success: true, appointment: res.appointment }
    } catch (err: any) {
      console.error('[useCrmAgenda] Erro ao reagendar:', err)
      const msg = err?.statusCode === 409 && err?.data?.statusMessage?.includes('ERR_STAFF_SCHEDULE_CONFLICT')
        ? 'Conflito de agenda: o técnico já possui outro compromisso ativo no horário selecionado.'
        : (err?.data?.statusMessage || err?.data?.message || err?.message || 'Falha ao reagendar compromisso.')
      errorMessage.value = msg
      return { success: false, error: msg, statusCode: err?.statusCode || 500 }
    } finally {
      isLoading.value = false
    }
  }

  async function cancelAppointment(id: string, payload: {
    motivo: string
    expected_appointment_updated_at: string
  }) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ success: boolean, appointment: CrmAppointmentDetail }>(
        `/api/admin/crm/appointments/${id}/cancel`,
        { method: 'POST', body: payload }
      )
      return { success: true, appointment: res.appointment }
    } catch (err: any) {
      console.error('[useCrmAgenda] Erro ao cancelar:', err)
      const msg = err?.data?.statusMessage || err?.data?.message || err?.message || 'Falha ao cancelar agendamento.'
      errorMessage.value = msg
      return { success: false, error: msg, statusCode: err?.statusCode || 500 }
    } finally {
      isLoading.value = false
    }
  }

  async function updateAppointmentStatus(id: string, payload: {
    status: string
    expected_appointment_updated_at: string
  }) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ success: boolean, appointment: CrmAppointmentDetail }>(
        `/api/admin/crm/appointments/${id}/status`,
        { method: 'POST', body: payload }
      )
      if (res?.appointment) selectedAppointment.value = res.appointment
      return { success: true, appointment: res.appointment }
    } catch (err: any) {
      console.error('[useCrmAgenda] Erro ao alterar status:', err)
      const msg = err?.data?.statusMessage || err?.data?.message || err?.message || 'Falha ao alterar status.'
      errorMessage.value = msg
      return { success: false, error: msg, statusCode: err?.statusCode || 500 }
    } finally {
      isLoading.value = false
    }
  }

  return {
    appointments,
    selectedAppointment,
    isLoading,
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
