<script setup lang="ts">
import { ref, watch, toRef } from 'vue'
import type { CrmAppointmentDetail } from '~/types/crmAppointments'
import { extractAppointmentErrorMessage } from '~/utils/crmAgendaErrors'
import { useModalA11y } from '~/composables/useModalA11y'

const props = defineProps<{
  isOpen: boolean
  appointment: CrmAppointmentDetail | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'cancelled', appt: any): void
}>()

useModalA11y(toRef(props, 'isOpen'), () => emit('close'))

const motivo = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

watch(() => props.isOpen, (open) => {
  if (open) {
    motivo.value = ''
    errorMessage.value = null
  }
})

async function handleCancel() {
  if (!props.appointment) return

  const reason = motivo.value.trim()
  if (!reason || reason.length < 3) {
    errorMessage.value = 'O motivo do cancelamento é obrigatório (mínimo 3 caracteres).'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const res = await $fetch<any>(`/api/admin/crm/appointments/${props.appointment.id}/cancel`, {
      method: 'POST',
      body: {
        motivo: reason,
        expected_appointment_updated_at: props.appointment.updated_at
      }
    })

    if (res?.success && res.appointment) {
      emit('cancelled', res.appointment)
      emit('close')
    }
  } catch (err: any) {
    console.error('[AppointmentCancelDialog] Falha ao cancelar')
    errorMessage.value = extractAppointmentErrorMessage(err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div
      class="w-full max-w-md rounded-2xl border border-rose-500/20 bg-slate-900 shadow-2xl p-6 space-y-5"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cancel-title"
    >
      <div class="flex items-center gap-3 border-b border-white/10 pb-4">
        <div class="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
          <Icon name="lucide:alert-triangle" class="w-5 h-5" />
        </div>
        <div>
          <h3 id="cancel-title" class="text-base font-bold text-white">Cancelar Agendamento</h3>
          <p class="text-xs text-slate-400">Esta ação é irreversível e ficará registrada no histórico.</p>
        </div>
      </div>

      <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
        {{ errorMessage }}
      </div>

      <div class="space-y-4">
        <p class="text-xs text-slate-300 leading-relaxed">
          Tem certeza de que deseja cancelar este agendamento? O cancelamento pode atualizar automaticamente a programação e a data prevista da Ordem de Serviço conforme o estado operacional atual.
        </p>

        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Motivo do Cancelamento * (mínimo 3 caracteres)</label>
          <textarea
            v-model="motivo"
            rows="3"
            placeholder="Ex: Cliente solicitou cancelamento por desistência..."
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all min-h-[44px] cursor-pointer"
          >
            Voltar
          </button>

          <button
            type="button"
            @click="handleCancel"
            :disabled="isSubmitting"
            class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg transition-all flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>{{ isSubmitting ? 'Cancelando...' : 'Confirmar Cancelamento' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
