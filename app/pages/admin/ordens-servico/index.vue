<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import WorkOrderSummaryCards from '~/components/admin/work-orders/WorkOrderSummaryCards.vue'
import WorkOrderListTable from '~/components/admin/work-orders/WorkOrderListTable.vue'
import WorkOrderListCards from '~/components/admin/work-orders/WorkOrderListCards.vue'

definePageMeta({
  layout: 'admin'
})

const router = useRouter()

const workOrders = ref<any[]>([])
const summary = ref<any | null>(null)
const isLoading = ref(true)
const isSummaryLoading = ref(true)
const errorMessage = ref<string | null>(null)

const searchQuery = ref('')
const selectedStatus = ref('')
const isArchived = ref(false)
const page = ref(1)
const limit = ref(20)
const totalPages = ref(1)
const totalCount = ref(0)

const statusOptions = [
  { value: '', label: 'Todos os Status' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'aprovada', label: 'Aprovada' },
  { value: 'aguardando_agendamento', label: 'Aguardando Agendamento' },
  { value: 'agendada', label: 'Agendada' },
  { value: 'em_execucao', label: 'Em Execução' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' }
]

async function fetchSummary() {
  isSummaryLoading.value = true
  try {
    const res = await $fetch<any>('/api/admin/crm/work-orders/summary')
    if (res?.summary) {
      summary.value = res.summary
    }
  } catch (err: any) {
    console.error('[WorkOrdersPage] Erro ao carregar sumário:', err)
  } finally {
    isSummaryLoading.value = false
  }
}

async function fetchWorkOrders() {
  isLoading.value = true
  errorMessage.value = null

  try {
    if (searchQuery.value.trim()) {
      // Busca segura via POST
      const res = await $fetch<any>('/api/admin/crm/work-orders/search', {
        method: 'POST',
        body: {
          search: searchQuery.value.trim(),
          status: selectedStatus.value || undefined,
          page: page.value,
          limit: limit.value
        }
      })
      if (res?.workOrders) {
        workOrders.value = res.workOrders
        totalCount.value = res.pagination?.total || 0
        totalPages.value = res.pagination?.totalPages || 1
      }
    } else {
      // Listagem normal via GET
      const queryParams: Record<string, any> = {
        page: page.value,
        limit: limit.value,
        isArchived: isArchived.value
      }
      if (selectedStatus.value) {
        queryParams.status = selectedStatus.value
      }

      const res = await $fetch<any>('/api/admin/crm/work-orders', {
        params: queryParams
      })

      if (res?.workOrders) {
        workOrders.value = res.workOrders
        totalCount.value = res.pagination?.total || 0
        totalPages.value = res.pagination?.totalPages || 1
      }
    }
  } catch (err: any) {
    console.error('[WorkOrdersPage] Erro ao carregar OSs:', err)
    errorMessage.value = err?.data?.message || err?.message || 'Falha ao carregar ordens de serviço'
  } finally {
    isLoading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchWorkOrders()
}

function handleClearFilters() {
  searchQuery.value = ''
  selectedStatus.value = ''
  isArchived.value = false
  page.value = 1
  fetchWorkOrders()
}

function navigateToNewWorkOrder() {
  router.push('/admin/ordens-servico/nova')
}

watch([selectedStatus, isArchived], () => {
  page.value = 1
  fetchWorkOrders()
})

onMounted(() => {
  fetchSummary()
  fetchWorkOrders()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Cabeçalho da Página -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Icon name="lucide:clipboard-list" class="w-6 h-6 text-indigo-400" />
          <span>Ordens de Serviço</span>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Gestão centralizada de orçamentos, vistorias e instalações em campo
        </p>
      </div>

      <button
        @click="navigateToNewWorkOrder"
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer min-h-[44px]"
      >
        <Icon name="lucide:plus" class="w-4 h-4 sm:w-5 sm:h-5" />
        <span>Nova Ordem de Serviço</span>
      </button>
    </div>

    <!-- Cards de Sumário -->
    <WorkOrderSummaryCards
      :summary="summary"
      :is-loading="isSummaryLoading"
    />

    <!-- Barra de Filtros e Busca Segura -->
    <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      <!-- Input de Busca -->
      <div class="flex-1 relative">
        <Icon name="lucide:search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="Buscar por número da OS, cliente ou telefone..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
        />
      </div>

      <!-- Filtro de Status -->
      <div class="w-full md:w-56">
        <select
          v-model="selectedStatus"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Botões de Ação -->
      <div class="flex items-center gap-2">
        <button
          @click="handleSearch"
          class="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Icon name="lucide:search" class="w-4 h-4" />
          <span>Buscar</span>
        </button>

        <button
          v-if="searchQuery || selectedStatus || isArchived"
          @click="handleClearFilters"
          class="px-3 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition-all flex items-center justify-center min-h-[44px] cursor-pointer"
          title="Limpar Filtros"
        >
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Mensagem de Erro -->
    <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
      {{ errorMessage }}
    </div>

    <!-- Tabela Desktop (>= 768px) -->
    <div class="hidden md:block">
      <WorkOrderListTable
        :work-orders="workOrders"
        :is-loading="isLoading"
      />
    </div>

    <!-- Cards Mobile (< 768px) -->
    <div class="block md:hidden">
      <WorkOrderListCards
        :work-orders="workOrders"
        :is-loading="isLoading"
      />
    </div>

    <!-- Paginação -->
    <div v-if="totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 pt-2">
      <span>Exibindo página {{ page }} de {{ totalPages }} (Total: {{ totalCount }} OSs)</span>
      <div class="flex items-center gap-2">
        <button
          :disabled="page <= 1 || isLoading"
          @click="page--; fetchWorkOrders()"
          class="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 disabled:opacity-40 hover:bg-slate-800 text-white min-h-[40px] cursor-pointer transition-all"
        >
          Anterior
        </button>
        <button
          :disabled="page >= totalPages || isLoading"
          @click="page++; fetchWorkOrders()"
          class="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 disabled:opacity-40 hover:bg-slate-800 text-white min-h-[40px] cursor-pointer transition-all"
        >
          Próxima
        </button>
      </div>
    </div>
  </div>
</template>
