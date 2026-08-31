<script setup lang="ts">
import { ref, computed, watch, toRef } from 'vue'
import type { CrmStaffMember } from '~/composables/useCrmStaff'
import { toSaoPauloIso, getSaoPauloDateString } from '~/utils/crmDateTime'
import { extractAppointmentErrorMessage } from '~/utils/crmAgendaErrors'
import { useModalA11y } from '~/composables/useModalA11y'

const props = defineProps<{
  isOpen: boolean
  staffList: CrmStaffMember[]
  preselectedWorkOrderId?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'appointmentCreated', appt: any): void
}>()

useModalA11y(toRef(props, 'isOpen'), () => emit('close'))

const activeStaffList = computed(() => (props.staffList || []).filter(st => st.is_active !== false))

// Search & Work Order Selection
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const isSearching = ref(false)
const selectedWorkOrder = ref<any | null>(null)

// Client Addresses
const clientAddresses = ref<any[]>([])
const selectedAddressId = ref<string>('')
const isLoadingAddresses = ref(false)

// Appointment Form
const tipoAgendamento = ref('instalacao')
const appointmentDate = ref(getSaoPauloDateString())
const horaInicio = ref('09:00')
const horaFim = ref('11:00')
const selectedStaffId = ref<string>('')
const observacoes = ref<string>('')

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

// Emenda 4: Status x Tipo matrix warnings
const tipoWarning = computed(() => {
  if (!selectedWorkOrder.value) return null
  const status = selectedWorkOrder.value.status_os
  const tipo = tipoAgendamento.value

  if (['visita_tecnica', 'medicao'].includes(tipo) && !['orcamento', 'aprovada', 'aguardando_agendamento'].includes(status)) {
    return `Visita técnica e medição são permitidas apenas para OS em 'Orçamento', 'Aprovada' ou 'Aguardando Agendamento' (atual: '${status}').`
  }
  if (tipo === 'instalacao' && !['aprovada', 'aguardando_agendamento'].includes(status)) {
    return `Agendamento de instalação exige que a OS esteja 'Aprovada' ou 'Aguardando Agendamento' (atual: '${status}').`
  }
  if (tipo === 'manutencao' && !['aprovada', 'aguardando_agendamento', 'agendada', 'em_execucao'].includes(status)) {
    return `Manutenção exige ordem de serviço operacional em aberto (atual: '${status}').`
  }
  if (tipo === 'garantia' && status !== 'concluida') {
    return `Agendamento de garantia exige ordem de serviço 'Concluída' com garantia ativa.`
  }
  return null
})

watch(() => props.isOpen, async (open) => {
  if (open) {
    errorMessage.value = null
    searchQuery.value = ''
    searchResults.value = []
    selectedWorkOrder.value = null
    selectedAddressId.value = ''
    selectedStaffId.value = ''
    clientAddresses.value = []
    observacoes.value = ''
    tipoAgendamento.value = 'instalacao'
    appointmentDate.value = getSaoPauloDateString()
    horaInicio.value = '09:00'
    horaFim.value = '11:00'

    if (props.preselectedWorkOrderId) {
      await loadPreselectedWorkOrder(props.preselectedWorkOrderId)
    }
  }
})

async function loadPreselectedWorkOrder(woId: string) {
  isSearching.value = true
  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${woId}`)
    if (res?.workOrder) {
      selectWorkOrder(res.workOrder)
    }
  } catch (err) {
    console.error('[AppointmentCreateModal] Falha ao carregar OS pré-selecionada')
  } finally {
    isSearching.value = false
  }
}

async function handleSearchWorkOrders() {
  const query = searchQuery.value.trim()
  if (query.length < 2) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    const res = await $fetch<any>('/api/admin/crm/work-orders/search', {
      method: 'POST',
      body: { search: query, limit: 10 }
    })
    searchResults.value = res?.workOrders || []
  } catch (err) {
    console.error('[AppointmentCreateModal] Falha na busca de OS')
  } finally {
    isSearching.value = false
  }
}

async function selectWorkOrder(wo: any) {
  selectedWorkOrder.value = wo
  searchResults.value = []
  searchQuery.value = `${wo.numero_os} - ${wo.client?.nome || 'Cliente'}`

  selectedAddressId.value = wo.address_id || ''
  if (wo.responsible_staff_id) {
    selectedStaffId.value = wo.responsible_staff_id
  } else {
    selectedStaffId.value = ''
  }

  // Load all client addresses (Emenda 6)
  if (wo.client_id) {
    isLoadingAddresses.value = true
    try {
      const res = await $fetch<any>(`/api/admin/crm/clients/${wo.client_id}`)
      clientAddresses.value = res?.addresses || []
    } catch {
      clientAddresses.value = []
    } finally {
      isLoadingAddresses.value = false
    }
  }
}

async function handleSubmit() {
  if (!selectedWorkOrder.value) {
    errorMessage.value = 'Selecione uma Ordem de Serviço.'
    return
  }

  if (!appointmentDate.value || !horaInicio.value || !horaFim.value) {
    errorMessage.value = 'Informe a data, horário de início e término do compromisso.'
    return
  }

  const startIso = toSaoPauloIso(appointmentDate.value, horaInicio.value)
  const endIso = toSaoPauloIso(appointmentDate.value, horaFim.value)

  if (new Date(startIso).getTime() >= new Date(endIso).getTime()) {
    errorMessage.value = 'O horário de término deve ser estritamente posterior ao horário de início.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  const payload = {
    work_order_id: selectedWorkOrder.value.id,
    tipo_agendamento: tipoAgendamento.value,
    data_hora_inicio: startIso,
    data_hora_fim: endIso,
    staff_id: selectedStaffId.value || null,
    address_id: selectedAddressId.value || null,
    observacoes: observacoes.value ? observacoes.value.trim() : null
  }

  try {
    const res = await $fetch<any>('/api/admin/crm/appointments', {
      method: 'POST',
      body: payload
    })

    if (res?.success && res.appointment) {
      emit('appointmentCreated', res.appointment)
      emit('close')
    }
  } catch (err: any) {
    console.error('[AppointmentCreateModal] Falha ao criar agendamento')
    errorMessage.value = extractAppointmentErrorMessage(err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div
      class="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-title"
    >
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 id="create-title" class="text-base font-bold text-white">Novo Agendamento</h3>
          <p class="text-xs text-slate-400">Programe um compromisso vinculado a uma Ordem de Serviço.</p>
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

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Busca de Ordem de Serviço -->
        <div class="space-y-1.5 relative">
          <label class="text-xs text-slate-300 font-medium">Ordem de Serviço *</label>
          <div class="relative">
            <input
              v-model="searchQuery"
              @input="handleSearchWorkOrders"
              type="text"
              placeholder="Digite o número da OS, nome ou telefone do cliente..."
              class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
            <Icon name="lucide:search" class="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <Icon v-if="isSearching" name="lucide:loader-2" class="w-4 h-4 animate-spin text-indigo-400 absolute right-3 top-3.5" />
          </div>

          <!-- Dropdown de Resultados da OS -->
          <div
            v-if="searchResults.length > 0"
            class="absolute z-20 w-full mt-1 rounded-xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden max-h-48 overflow-y-auto"
          >
            <div
              v-for="wo in searchResults"
              :key="wo.id"
              @click="selectWorkOrder(wo)"
              class="p-2.5 hover:bg-indigo-600/20 border-b last:border-b-0 border-white/5 cursor-pointer transition-colors text-xs"
            >
              <div class="flex items-center justify-between">
                <span class="font-mono font-bold text-indigo-400">{{ wo.numero_os }}</span>
                <span class="text-[10px] uppercase font-semibold text-slate-400">{{ wo.status_os }}</span>
              </div>
              <p class="text-white font-medium truncate">{{ wo.client?.nome || 'Cliente' }}</p>
              <p class="text-slate-400 text-[11px] truncate">{{ wo.client?.telefone_principal || '' }}</p>
            </div>
          </div>
        </div>

        <!-- Card de OS Selecionada -->
        <div v-if="selectedWorkOrder" class="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 text-xs space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white">{{ selectedWorkOrder.client?.nome }}</span>
            <span class="font-mono text-indigo-300 font-bold">{{ selectedWorkOrder.numero_os }}</span>
          </div>
          <p class="text-slate-400 text-[11px]">Status atual da OS: <strong class="text-white uppercase">{{ selectedWorkOrder.status_os }}</strong></p>
        </div>

        <!-- Tipo de Agendamento -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Tipo de Compromisso *</label>
          <select
            v-model="tipoAgendamento"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
          >
            <option value="instalacao">Instalação</option>
            <option value="visita_tecnica">Visita Técnica</option>
            <option value="medicao">Medição</option>
            <option value="manutencao">Manutenção</option>
            <option value="garantia">Garantia</option>
          </select>

          <!-- Aviso de Incompatibilidade de Tipo x Status da OS -->
          <div v-if="tipoWarning" class="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-[11px] text-amber-300 flex items-start gap-1.5">
            <Icon name="lucide:alert-circle" class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>{{ tipoWarning }}</span>
          </div>
        </div>

        <!-- Data e Horários -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Data *</label>
            <input
              v-model="appointmentDate"
              type="date"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Hora Início *</label>
            <input
              v-model="horaInicio"
              type="time"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Hora Fim *</label>
            <input
              v-model="horaFim"
              type="time"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>
        </div>

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

        <!-- Endereço do Atendimento -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Local do Atendimento</label>
          <select
            v-model="selectedAddressId"
            :disabled="!selectedWorkOrder || isLoadingAddresses"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer disabled:opacity-50"
          >
            <option value="">Endereço padrão da Ordem de Serviço</option>
            <option v-for="addr in clientAddresses" :key="addr.id" :value="addr.id">
              {{ addr.rotulo || 'Endereço' }}: {{ addr.logradouro }}, {{ addr.numero }} - {{ addr.bairro }} ({{ addr.cidade }})
            </option>
          </select>
        </div>

        <!-- Observações -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Observações Gerais</label>
          <textarea
            v-model="observacoes"
            rows="2"
            placeholder="Instruções para o técnico, restrições de condomínio, etc."
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
          ></textarea>
        </div>

        <!-- Botões de Ação -->
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
            :disabled="isSubmitting || !selectedWorkOrder"
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg transition-all flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>{{ isSubmitting ? 'Salvando...' : 'Agendar Compromisso' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
