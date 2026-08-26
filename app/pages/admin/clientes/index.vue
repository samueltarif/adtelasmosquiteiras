<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import ClientListTable from '~/components/admin/crm/ClientListTable.vue'
import ClientListCards from '~/components/admin/crm/ClientListCards.vue'

definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const clients = ref<any[]>([])
const isLoading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const searchTerm = ref('')
const selectedTipo = ref('')
const showArchived = ref(false)
const sortBy = ref('created_at')
const sortDirection = ref('desc')

async function fetchClients() {
  isLoading.value = true
  try {
    // Se houver termo de busca, utiliza obrigatoriamente POST /search para proteger PII (telefone, email, CPF)
    if (searchTerm.value.trim()) {
      const res = await $fetch<any>('/api/admin/crm/clients/search', {
        method: 'POST',
        body: {
          search: searchTerm.value.trim(),
          tipo: selectedTipo.value || undefined,
          archived: showArchived.value,
          page: page.value,
          pageSize: pageSize.value,
          sortBy: sortBy.value,
          sortDirection: sortDirection.value
        }
      })

      if (res?.success) {
        clients.value = res.clients || []
        total.value = res.total || 0
      }
    } else {
      // Listagem geral não sensível via GET
      const queryParams = new URLSearchParams({
        page: String(page.value),
        pageSize: String(pageSize.value),
        sortBy: sortBy.value,
        sortDirection: sortDirection.value,
        archived: String(showArchived.value)
      })
      if (selectedTipo.value) {
        queryParams.set('tipo', selectedTipo.value)
      }

      const res = await $fetch<any>(`/api/admin/crm/clients?${queryParams.toString()}`)
      if (res?.success) {
        clients.value = res.clients || []
        total.value = res.total || 0
      }
    }
  } catch (err: any) {
    console.error('[ClientsIndex] Erro ao carregar clientes:', err)
  } finally {
    isLoading.value = false
  }
}

function handleSort(field: string) {
  if (sortBy.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortDirection.value = 'asc'
  }
  page.value = 1
  fetchClients()
}

function handleOpenClient(id: string) {
  router.push(`/admin/clientes/${id}`)
}

// Debounce da busca
let searchTimeout: any = null
watch(searchTerm, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    fetchClients()
  }, 350)
})

watch([selectedTipo, showArchived], () => {
  page.value = 1
  fetchClients()
})

onMounted(() => {
  fetchClients()
})
</script>

<template>
  <div class="space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <!-- Header com título e botão de ação -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Carteira de Clientes</span>
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
            {{ total }} cadastrados
          </span>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Gerenciamento cadastral, histórico de atendimentos e ordens de serviço
        </p>
      </div>

      <NuxtLink
        to="/admin/clientes/novo"
        class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 min-h-[44px] shrink-0"
      >
        <Icon name="lucide:user-plus" class="w-4 h-4" />
        <span>Novo Cliente</span>
      </NuxtLink>
    </div>

    <!-- Barra de Filtros e Pesquisa -->
    <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-sm space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <!-- Campo de Pesquisa -->
        <div class="sm:col-span-2 relative">
          <Icon name="lucide:search" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar por nome, telefone, e-mail ou CPF/CNPJ..."
            class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
          />
          <button
            v-if="searchTerm"
            type="button"
            @click="searchTerm = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
          >
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>

        <!-- Filtro por Tipo -->
        <div>
          <select
            v-model="selectedTipo"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
          >
            <option value="">Todos os tipos</option>
            <option value="pessoa_fisica">Pessoa Física</option>
            <option value="empresa">Empresa</option>
            <option value="condominio">Condomínio</option>
          </select>
        </div>

        <!-- Toggle Arquivados -->
        <div class="flex items-center justify-start sm:justify-end">
          <label class="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300 min-h-[44px]">
            <input
              v-model="showArchived"
              type="checkbox"
              class="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-white/20"
            />
            <span>Exibir Arquivados</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Lista de Clientes (Desktop Table + Mobile Cards) -->
    <div v-if="isLoading" class="p-16 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
      <span>Carregando clientes...</span>
    </div>

    <div v-else-if="clients.length === 0" class="rounded-2xl border border-white/10 bg-slate-900/40 p-12 text-center">
      <div class="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3">
        <Icon name="lucide:users" class="w-7 h-7" />
      </div>
      <h3 class="text-base font-bold text-white">Nenhum cliente encontrado</h3>
      <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
        {{ searchTerm ? 'Nenhum resultado corresponde à sua pesquisa. Tente outros termos.' : 'Cadastre seu primeiro cliente ou converta um Lead para iniciar a carteira.' }}
      </p>
      <NuxtLink
        v-if="!searchTerm"
        to="/admin/clientes/novo"
        class="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 min-h-[44px]"
      >
        <Icon name="lucide:user-plus" class="w-4 h-4" />
        <span>Cadastrar Cliente</span>
      </NuxtLink>
    </div>

    <div v-else class="space-y-4">
      <!-- Visão Desktop (>= 768px) -->
      <div class="hidden md:block">
        <ClientListTable
          :clients="clients"
          :sort-by="sortBy"
          :sort-direction="sortDirection"
          @sort="handleSort"
          @open="handleOpenClient"
        />
      </div>

      <!-- Visão Mobile (< 768px) -->
      <div class="block md:hidden">
        <ClientListCards
          :clients="clients"
          @open="handleOpenClient"
        />
      </div>

      <!-- Paginação Geral -->
      <div v-if="total > pageSize" class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs sm:text-sm text-slate-400">
        <div>
          Exibindo <span class="text-white font-medium">{{ (page - 1) * pageSize + 1 }}</span> a <span class="text-white font-medium">{{ Math.min(page * pageSize, total) }}</span> de <span class="text-white font-medium">{{ total }}</span> clientes
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="page <= 1"
            @click="page--; fetchClients()"
            class="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 disabled:opacity-40 hover:bg-slate-800 text-white transition-colors min-h-[40px] cursor-pointer"
          >
            Anterior
          </button>
          <span class="px-2 font-medium">Página {{ page }}</span>
          <button
            type="button"
            :disabled="page * pageSize >= total"
            @click="page++; fetchClients()"
            class="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 disabled:opacity-40 hover:bg-slate-800 text-white transition-colors min-h-[40px] cursor-pointer"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
