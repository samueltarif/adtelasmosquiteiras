<script setup lang="ts">
import { ref, watch, toRef } from 'vue'
import { useModalA11y } from '~/composables/useModalA11y'

const props = defineProps<{
  isOpen: boolean
  workOrder: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'workOrderUpdated', updatedWo: any): void
}>()

useModalA11y(toRef(props, 'isOpen'), () => emit('close'))

const clientAddresses = ref<any[]>([])
const activeStaff = ref<any[]>([])

const addressId = ref<string>('')
const responsibleStaffId = ref<string>('')
const proposalValidUntil = ref<string>('')
const valorDesconto = ref<number>(0)
const observacoesGerais = ref<string>('')

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const isAddressEditable = ref(true)

watch(() => props.isOpen, async (open) => {
  if (open && props.workOrder) {
    errorMessage.value = null
    addressId.value = props.workOrder.address_id || ''
    responsibleStaffId.value = props.workOrder.responsible_staff_id || ''
    proposalValidUntil.value = props.workOrder.proposal_valid_until || ''
    valorDesconto.value = Number(props.workOrder.valor_desconto) || 0
    observacoesGerais.value = props.workOrder.observacoes_gerais || ''

    isAddressEditable.value = ['orcamento', 'aprovada', 'aguardando_agendamento', 'agendada'].includes(props.workOrder.status_os)

    if (props.workOrder.client_id) {
      await loadAddresses(props.workOrder.client_id)
    }
    await loadStaff()
  }
})

async function loadAddresses(clientId: string) {
  try {
    const res = await $fetch<any>(`/api/admin/crm/clients/${clientId}`)
    clientAddresses.value = res?.addresses || []
  } catch (err) {
    // Sanitized: sem console dump de payload ou PII
  }
}

async function loadStaff() {
  try {
    const res = await $fetch<any>('/api/admin/crm/staff')
    const allStaff = res?.staff || []
    // Permite staff ativo ou o staff histórico já atribuído a esta OS (bloqueia novos inativos)
    activeStaff.value = allStaff.filter((st: any) => st.is_active || st.id === props.workOrder?.responsible_staff_id)
  } catch (err) {
    // Sanitized: sem console dump
  }
}

async function handleSave() {
  isSubmitting.value = true
  errorMessage.value = null

  const payload: Record<string, any> = {
    expected_updated_at: props.workOrder.updated_at,
    responsible_staff_id: responsibleStaffId.value || null,
    proposal_valid_until: proposalValidUntil.value || null,
    valor_desconto: Number(valorDesconto.value) || 0,
    observacoes_gerais: observacoesGerais.value ? observacoesGerais.value.trim() : null
  }

  if (isAddressEditable.value) {
    payload.address_id = addressId.value || null
  }

  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrder.id}`, {
      method: 'PATCH',
      body: payload
    })

    if (res?.success && res.workOrder) {
      emit('workOrderUpdated', res.workOrder)
      emit('close')
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.message || err?.message || 'Falha ao atualizar dados da ordem de serviço'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div
      class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="work-order-general-edit-title"
    >
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 id="work-order-general-edit-title" class="text-base font-bold text-white">Editar Dados Gerais da OS</h3>
          <p class="text-xs text-slate-400 font-mono">{{ workOrder?.numero_os }}</p>
        </div>
        <button
          @click="emit('close')"
          aria-label="Fechar modal"
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSave" class="space-y-4">
        <!-- Endereço -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Endereço da Instalação</label>
          <select
            v-model="addressId"
            :disabled="!isAddressEditable"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer disabled:opacity-50"
          >
            <option value="">Nenhum endereço vinculado</option>
            <option v-for="addr in clientAddresses" :key="addr.id" :value="addr.id">
              {{ addr.rotulo || 'Endereço' }}: {{ addr.logradouro }}, {{ addr.numero }} - {{ addr.bairro }} ({{ addr.cidade }})
            </option>
          </select>
          <span v-if="!isAddressEditable" class="text-[11px] text-slate-500">
            Endereço bloqueado para edição no status atual ('{{ workOrder?.status_os }}').
          </span>
        </div>

        <!-- Responsável Técnico -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Responsável Técnico</label>
          <select
            v-model="responsibleStaffId"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
          >
            <option value="">Sem responsável atribuído</option>
            <option v-for="st in activeStaff" :key="st.id" :value="st.id">
              {{ st.nome }} ({{ st.funcao }}){{ !st.is_active ? ' [Inativo/Histórico]' : '' }}
            </option>
          </select>
        </div>

        <!-- Validade da Proposta -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Validade da Proposta</label>
          <input
            v-model="proposalValidUntil"
            type="date"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
          />
        </div>

        <!-- Desconto (R$) -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Desconto Aplicado (R$)</label>
          <input
            v-model.number="valorDesconto"
            type="number"
            step="0.01"
            min="0"
            :max="workOrder?.valor_total || 0"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
          />
          <span class="text-[11px] text-slate-500">
            Total Bruto: R$ {{ Number(workOrder?.valor_total || 0).toFixed(2) }}
          </span>
        </div>

        <!-- Observações Gerais -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Observações Gerais</label>
          <textarea
            v-model="observacoesGerais"
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
