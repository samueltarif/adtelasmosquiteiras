<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { formatDateOnly } from '~/utils/crmDateTime'

const props = defineProps<{
  clientId: string
}>()

const router = useRouter()
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
    const res = await $fetch<any>(`/api/admin/crm/work-orders?clientId=${props.clientId}&page=${page.value}&limit=${pageSize.value}`)
    if (res?.workOrders) {
      workOrders.value = res.workOrders || []
      total.value = res.pagination?.total || 0
    }
  } catch {
    console.error('[ClientWorkOrders] Falha ao carregar OSs')
  } finally {
    isLoading.value = false
  }
}

function navigateToNewWorkOrder() {
  router.push(`/admin/ordens-servico/nova?clientId=${props.clientId}`)
}

function navigateToWorkOrder(woId: string) {
  router.push(`/admin/ordens-servico/${woId}`)
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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold text-white uppercase tracking-wider">Ordens de Serviço do Cliente</h3>
        <p class="text-xs text-slate-400">Histórico de orçamentos e serviços contratados</p>
      </div>

      <button
        @click="navigateToNewWorkOrder"
        class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer min-h-[44px]"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        <span>Nova Ordem de Serviço</span>
      </button>
    </div>

    <div v-if="isLoading" class="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-indigo-400" />
      <span>Carregando ordens de serviço...</span>
    </div>

    <div v-else-if="workOrders.length === 0" class="rounded-xl border border-white/5 bg-slate-900/30 p-8 text-center">
      <div class="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
        <Icon name="lucide:file-text" class="w-5 h-5" />
      </div>
      <p class="text-xs text-slate-400 mb-3">Nenhuma Ordem de Serviço cadastrada para este cliente ainda.</p>
      <button
        @click="navigateToNewWorkOrder"
        class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-semibold border border-indigo-500/30 transition-all cursor-pointer min-h-[44px]"
      >
        <Icon name="lucide:plus" class="w-3.5 h-3.5" />
        <span>Criar Primeira OS</span>
      </button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="wo in workOrders"
        :key="wo.id"
        @click="navigateToWorkOrder(wo.id)"
        class="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-sm hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">{{ wo.numero_os }}</span>
            <span 
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
              :class="statusLabels[wo.status_os]?.color || 'bg-slate-800 text-slate-300'"
            >
              {{ statusLabels[wo.status_os]?.label || wo.status_os }}
            </span>
          </div>

          <p class="text-xs text-slate-300">
            <span v-if="wo.address">
              Local: {{ wo.address.logradouro || wo.address.rotulo || 'Imóvel' }}, {{ wo.address.cidade }}
            </span>
            <span v-else>Local não vinculado</span>
          </p>

          <p class="text-[11px] text-slate-500">
            Criada em {{ formatDate(wo.created_at) }}
            <span v-if="wo.data_prevista"> | Prevista para {{ formatDateOnly(wo.data_prevista) }}</span>
          </p>
        </div>

        <div class="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
          <div class="text-left md:text-right">
            <span class="text-[10px] uppercase text-slate-500 font-semibold block">Valor Final</span>
            <span class="text-sm font-bold text-emerald-400">{{ formatCurrency(wo.valor_final) }}</span>
          </div>

          <div class="text-slate-400 group-hover:text-white transition-colors">
            <Icon name="lucide:chevron-right" class="w-5 h-5" />
          </div>
        </div>
      </div>

      <!-- Paginação simples -->
      <div v-if="total > pageSize" class="flex items-center justify-between pt-2 text-xs text-slate-400">
        <span>Total: {{ total }} OSs</span>
        <div class="flex items-center gap-2">
          <button 
            :disabled="page <= 1" 
            @click.stop="page--; fetchWorkOrders()"
            class="px-3.5 py-2 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-white min-h-[44px] cursor-pointer"
          >
            Anterior
          </button>
          <span>Página {{ page }}</span>
          <button 
            :disabled="page * pageSize >= total" 
            @click.stop="page++; fetchWorkOrders()"
            class="px-3.5 py-2 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-white min-h-[44px] cursor-pointer"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
