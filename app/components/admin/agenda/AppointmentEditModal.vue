<script setup lang="ts">
import { ref, computed, watch, toRef } from 'vue'
import type { CrmAppointmentDetail } from '~/types/crmAppointments'
import type { CrmStaffMember } from '~/composables/useCrmStaff'
import { extractAppointmentErrorMessage } from '~/utils/crmAgendaErrors'
import { useModalA11y } from '~/composables/useModalA11y'

const props = defineProps<{
  isOpen: boolean
  appointment: CrmAppointmentDetail | null
  staffList: CrmStaffMember[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'appointmentUpdated', appt: any): void
}>()

useModalA11y(toRef(props, 'isOpen'), () => emit('close'))

const selectedStaffId = ref<string>('')
const selectedAddressId = ref<string>('')
const observacoes = ref<string>('')
const clientAddresses = ref<any[]>([])

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const activeStaffList = computed(() => {
  return (props.staffList || []).filter(st => st.is_active !== false || st.id === props.appointment?.staff_id)
})

watch(() => props.isOpen, async (open) => {
  if (open && props.appointment) {
    errorMessage.value = null
    selectedStaffId.value = props.appointment.staff_id || ''
    selectedAddressId.value = props.appointment.address_id || ''
    observacoes.value = props.appointment.observacoes || ''

    const clientId = props.appointment.client_id || props.appointment.client?.id
    if (clientId) {
      try {
        const res = await $fetch<any>(`/api/admin/crm/clients/${clientId}`)
        clientAddresses.value = res?.addresses || []
      } catch {
        clientAddresses.value = []
      }
    }
  }
})

async function handleSave() {
  if (!props.appointment) return

  isSubmitting.value = true
  errorMessage.value = null

  const payload = {
    staff_id: selectedStaffId.value || null,
    address_id: selectedAddressId.value || null,
    observacoes: observacoes.value ? observacoes.value.trim() : null,
    expected_appointment_updated_at: props.appointment.updated_at
  }

  try {
    const res = await $fetch<any>(`/api/admin/crm/appointments/${props.appointment.id}`, {
      method: 'PATCH',
      body: payload
    })

    if (res?.success && res.appointment) {
      emit('appointmentUpdated', res.appointment)
      emit('close')
    }
  } catch (err: any) {
    console.error('[AppointmentEditModal] Falha ao editar')
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
      aria-labelledby="edit-title"
    >
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 id="edit-title" class="text-base font-bold text-white">Editar Agendamento</h3>
          <p class="text-xs text-slate-400">Alteração de responsável, local ou observações.</p>
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

      <form @submit.prevent="handleSave" class="space-y-4">
        <!-- Técnico Responsável -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Técnico Responsável</label>
          <select
            v-model="selectedStaffId"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
          >
            <option value="">Nenhum técnico atribuído</option>
            <option v-for="st in activeStaffList" :key="st.id" :value="st.id">
              {{ st.nome }} ({{ st.funcao }})
            </option>
          </select>
        </div>

        <!-- Endereço -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Local do Atendimento</label>
          <select
            v-model="selectedAddressId"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
          >
            <option value="">Endereço padrão da Ordem de Serviço</option>
            <option v-for="addr in clientAddresses" :key="addr.id" :value="addr.id">
              {{ addr.rotulo || 'Endereço' }}: {{ addr.logradouro }}, {{ addr.numero }} - {{ addr.bairro }}
            </option>
          </select>
        </div>

        <!-- Observações -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Observações</label>
          <textarea
            v-model="observacoes"
            rows="3"
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
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg transition-all flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>{{ isSubmitting ? 'Salvando...' : 'Salvar Alterações' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
