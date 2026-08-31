<script setup lang="ts">
import { ref, watch, toRef } from 'vue'
import type { CrmAppointmentDetail } from '~/types/crmAppointments'
import { toSaoPauloIso, getSaoPauloDateString, getSaoPauloTimeString } from '~/utils/crmDateTime'
import { extractAppointmentErrorMessage } from '~/utils/crmAgendaErrors'
import { useModalA11y } from '~/composables/useModalA11y'

const props = defineProps<{
  isOpen: boolean
  appointment: CrmAppointmentDetail | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'rescheduled', appt: any): void
}>()

useModalA11y(toRef(props, 'isOpen'), () => emit('close'))

const newDate = ref(getSaoPauloDateString())
const newHoraInicio = ref('09:00')
const newHoraFim = ref('11:00')
const motivo = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

watch(() => props.isOpen, (open) => {
  if (open && props.appointment) {
    errorMessage.value = null
    motivo.value = ''
    newDate.value = getSaoPauloDateString(props.appointment.data_hora_inicio)
    newHoraInicio.value = getSaoPauloTimeString(props.appointment.data_hora_inicio)
    newHoraFim.value = getSaoPauloTimeString(props.appointment.data_hora_fim)
  }
})

async function handleReschedule() {
  if (!props.appointment) return

  if (!newDate.value || !newHoraInicio.value || !newHoraFim.value) {
    errorMessage.value = 'Informe a nova data e horários.'
    return
  }

  const startIso = toSaoPauloIso(newDate.value, newHoraInicio.value)
  const endIso = toSaoPauloIso(newDate.value, newHoraFim.value)

  if (new Date(startIso).getTime() >= new Date(endIso).getTime()) {
    errorMessage.value = 'O novo horário de término deve ser posterior ao início.'
    return
  }

  const reason = motivo.value.trim()
  if (!reason || reason.length < 3) {
    errorMessage.value = 'O motivo do reagendamento é obrigatório (mínimo 3 caracteres).'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const res = await $fetch<any>(`/api/admin/crm/appointments/${props.appointment.id}/reschedule`, {
      method: 'POST',
      body: {
        new_data_hora_inicio: startIso,
        new_data_hora_fim: endIso,
        motivo: reason,
        expected_appointment_updated_at: props.appointment.updated_at
      }
    })

    if (res?.success && res.appointment) {
      emit('rescheduled', res.appointment)
      emit('close')
    }
  } catch (err: any) {
    console.error('[AppointmentRescheduleModal] Falha ao reagendar')
    errorMessage.value = extractAppointmentErrorMessage(err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div
      class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 space-y-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-title"
    >
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 id="reschedule-title" class="text-base font-bold text-white">Reagendar Compromisso</h3>
          <p class="text-xs text-slate-400">O registro atual será preservado com status 'reagendado'.</p>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Fechar modal"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleReschedule" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Nova Data *</label>
          <input
            v-model="newDate"
            type="date"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Novo Início *</label>
            <input
              v-model="newHoraInicio"
              type="time"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Novo Fim *</label>
            <input
              v-model="newHoraFim"
              type="time"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Motivo do Reagendamento * (mínimo 3 caracteres)</label>
          <textarea
            v-model="motivo"
            rows="3"
            placeholder="Ex: Cliente solicitou mudança de horário por imprevisto..."
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all min-h-[44px] cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg transition-all flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>{{ isSubmitting ? 'Reagendando...' : 'Confirmar Reagendamento' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
