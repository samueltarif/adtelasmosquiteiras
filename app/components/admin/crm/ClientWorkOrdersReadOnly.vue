<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  clientId: string
}>()

const workOrders = ref<any[]>([])
const isLoading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const statusLabels: Record<string, { label: string, color: string }> = {
  orcamento: { label: 'Orçamento', color: 'bg-slate-800 text-slate-300 border-white/10' },
  aprovada: { label: 'Aprovada', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  aguardando_agendamento: { label: 'Aguardando Agendamento', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  agendada: { label: 'Agendada', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  em_execucao: { label: 'Em Execução', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  concluida: { label: 'Concluída', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  cancelada: { label: 'Cancelada', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
}

async function fetchWorkOrders() {
  isLoading.value = true
  try {
    const res = await $fetch<any>(`/api/admin/crm/clients/${props.clientId}/work-orders?page=${page.value}&pageSize=${pageSize.value}`)
    if (res?.success) {
      workOrders.value = res.workOrders || []
      total.value = res.total || 0
    }
  } catch (err: any) {
    console.error('[ClientWorkOrdersReadOnly] Erro ao carregar OSs:', err)
  } finally {
    isLoading.value = false
  }
}

function formatCurrency(val: number | string | null) {
  const num = typeof val === 'number' ? val : parseFloat(String(val || 0))
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(num) ? 0 : num)
}

function formatDate(iso?: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR')
}

onMounted(() => {
  fetchWorkOrders()
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <h3 class="text-sm font-bold text-white uppercase tracking-wider">Ordens de Serviço do Cliente</h3>
      <p class="text-xs text-slate-400">Histórico de orçamentos e serviços contratados</p>
    </div>

    <div v-if="isLoading" class="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-indigo-400" />
      <span>Carregando ordens de serviço...</span>
    </div>

    <div v-else-if="workOrders.length === 0" class="rounded-xl border border-white/5 bg-slate-900/30 p-8 text-center">
      <div class="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
        <Icon name="lucide:file-text" class="w-5 h-5" />
      </div>
      <p class="text-xs text-slate-400">Nenhuma Ordem de Serviço cadastrada para este cliente ainda.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="wo in workOrders"
        :key="wo.id"
        class="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm font-bold text-indigo-400">{{ wo.numero_os }}</span>
            <span 
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
              :class="statusLabels[wo.status_os]?.color || 'bg-slate-800 text-slate-300'"
            >
              {{ statusLabels[wo.status_os]?.label || wo.status_os }}
            </span>
          </div>

          <p class="text-xs text-slate-300">
            <span v-if="wo.client_addresses">
              Local: {{ wo.client_addresses.logradouro || wo.client_addresses.rotulo || 'Imóvel' }}, {{ wo.client_addresses.cidade }}
            </span>
            <span v-else>Local não vinculado</span>
          </p>

          <p class="text-[11px] text-slate-500">
            Criada em {{ formatDate(wo.created_at) }}
            <span v-if="wo.data_prevista"> | Prevista para {{ formatDate(wo.data_prevista) }}</span>
          </p>
        </div>

        <div class="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
          <div class="text-left md:text-right">
            <span class="text-[10px] uppercase text-slate-500 font-semibold block">Valor Total</span>
            <span class="text-sm font-bold text-emerald-400">{{ formatCurrency(wo.valor_final) }}</span>
          </div>
        </div>
      </div>

      <!-- Paginação simples -->
      <div v-if="total > pageSize" class="flex items-center justify-between pt-2 text-xs text-slate-400">
        <span>Total: {{ total }} OSs</span>
        <div class="flex items-center gap-2">
          <button 
            :disabled="page <= 1" 
            @click="page--; fetchWorkOrders()"
            class="px-2.5 py-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-white min-h-[32px]"
          >
            Anterior
          </button>
          <span>Página {{ page }}</span>
          <button 
            :disabled="page * pageSize >= total" 
            @click="page++; fetchWorkOrders()"
            class="px-2.5 py-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-white min-h-[32px]"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
