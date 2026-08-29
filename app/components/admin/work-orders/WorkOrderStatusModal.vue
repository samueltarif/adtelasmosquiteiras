<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ALLOWED_STATUS_TRANSITIONS,
  TERMINAL_WORK_ORDER_STATUSES
} from '../../../../server/shared/crmValidation.mjs'

const props = defineProps<{
  isOpen: boolean
  workOrder: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'statusUpdated', updatedWo: any): void
}>()

const newStatus = ref('')
const dataPrevista = ref('')
const cancelReason = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const statusLabels: Record<string, string> = {
  orcamento: 'Orçamento',
  aprovada: 'Aprovada',
  aguardando_agendamento: 'Aguardando Agendamento',
  agendada: 'Agendada',
  em_execucao: 'Em Execução',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
}

const currentStatus = computed(() => props.workOrder?.status_os || 'orcamento')

const isTerminal = computed(() => TERMINAL_WORK_ORDER_STATUSES.includes(currentStatus.value))

const availableTransitions = computed(() => {
  const allowed = (ALLOWED_STATUS_TRANSITIONS as any)[currentStatus.value] || []
  return allowed.map((st: string) => ({
    value: st,
    label: statusLabels[st] || st
  }))
})

watch(() => props.isOpen, (open) => {
  if (open) {
    newStatus.value = availableTransitions.value[0]?.value || ''
    dataPrevista.value = props.workOrder?.data_prevista || ''
    cancelReason.value = ''
    errorMessage.value = null
  }
})

async function handleSave() {
  if (!newStatus.value) {
    errorMessage.value = 'Selecione o novo status.'
    return
  }

  if (newStatus.value === 'agendada' && !dataPrevista.value) {
    errorMessage.value = 'Para definir como Agendada, informe a data prevista.'
    return
  }

  if (newStatus.value === 'cancelada' && (!cancelReason.value || cancelReason.value.trim().length < 3)) {
    errorMessage.value = 'Informe o motivo do cancelamento (mínimo 3 caracteres).'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrder.id}/status`, {
      method: 'POST',
      body: {
        newStatus: newStatus.value,
        expectedUpdatedAt: props.workOrder.updated_at,
        dataPrevista: newStatus.value === 'agendada' ? dataPrevista.value : undefined,
        reason: newStatus.value === 'cancelada' ? cancelReason.value.trim() : undefined
      }
    })

    if (res?.success && res.workOrder) {
      emit('statusUpdated', res.workOrder)
      emit('close')
    }
  } catch (err: any) {
    console.error('[WorkOrderStatusModal] Erro ao alterar status:', err)
    errorMessage.value = err?.data?.message || err?.message || 'Falha ao atualizar status da OS'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 space-y-5">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 class="text-base font-bold text-white">Alterar Status da OS</h3>
          <p class="text-xs text-slate-400">Status atual: <span class="text-indigo-400 font-semibold">{{ statusLabels[currentStatus] || currentStatus }}</span></p>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Erro -->
      <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
        {{ errorMessage }}
      </div>

      <!-- Bloqueio para Status Terminais -->
      <div v-if="isTerminal" class="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300 space-y-2">
        <p class="font-bold">Status Terminal</p>
        <p>Esta Ordem de Serviço está no status <strong>{{ statusLabels[currentStatus] }}</strong> e não pode ter seu status operacional alterado na V1 para preservar a integridade histórica.</p>
        <div class="pt-2">
          <button
            @click="emit('close')"
            class="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 min-h-[40px] cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      <!-- Formulário de Transição -->
      <form v-else @submit.prevent="handleSave" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Novo Status *</label>
          <select
            v-model="newStatus"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
          >
            <option v-for="opt in availableTransitions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Se for 'agendada': Exige Data Prevista -->
        <div v-if="newStatus === 'agendada'" class="space-y-1.5 pt-1">
          <label class="text-xs text-slate-300 font-medium">Data Prevista para Instalação *</label>
          <input
            v-model="dataPrevista"
            type="date"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
          />
          <p class="text-[11px] text-slate-400">
            * Agendamento detalhado com horário e equipe será disponibilizado no módulo Agenda.
          </p>
        </div>

        <!-- Se for 'cancelada': Exige Motivo -->
        <div v-if="newStatus === 'cancelada'" class="space-y-1.5 pt-1">
          <label class="text-xs text-slate-300 font-medium">Motivo do Cancelamento *</label>
          <textarea
            v-model="cancelReason"
            rows="3"
            placeholder="Descreva o motivo da recusa ou cancelamento..."
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
            :disabled="isSubmitting || availableTransitions.length === 0"
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg transition-all flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>{{ isSubmitting ? 'Atualizando...' : 'Confirmar Alteração' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
