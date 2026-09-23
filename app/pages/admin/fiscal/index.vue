<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

useHead({
  title: 'Notas Fiscais — Painel Administrativo'
})

interface FiscalDocItem {
  id: string
  work_order_id: string
  numero_documento?: string | null
  serie?: string | null
  tipo_documento: 'nfe' | 'nfse'
  ambiente: 'homologacao' | 'producao'
  is_simulated: boolean
  status: 'rascunho' | 'processando' | 'autorizado' | 'rejeitado' | 'cancelado' | 'falha_processamento'
  valor_liquido: number
  created_at: string
  client?: { id: string; nome: string; documento?: string }
  work_order?: { id: string; numero_os: string }
}

const loading = ref(true)
const items = ref<FiscalDocItem[]>([])
const selectedStatus = ref('')
const selectedAmbiente = ref('')
const selectedTipo = ref('')
const searchOs = ref('')

const fetchDocuments = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (selectedStatus.value) params.append('status', selectedStatus.value)
    if (selectedAmbiente.value) params.append('ambiente', selectedAmbiente.value)
    if (selectedTipo.value) params.append('tipoDocumento', selectedTipo.value)

    const res = await $fetch<any>(`/api/admin/crm/fiscal?${params.toString()}`)
    items.value = res.items || []
  } catch (err: any) {
    console.error('Erro ao carregar notas:', err)
  } finally {
    loading.value = false
  }
}

const filteredItems = computed(() => {
  if (!searchOs.value.trim()) return items.value
  const q = searchOs.value.trim().toLowerCase()
  return items.value.filter(it => 
    it.work_order?.numero_os?.toLowerCase().includes(q) ||
    it.client?.nome?.toLowerCase().includes(q) ||
    it.numero_documento?.includes(q)
  )
})

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'autorizado':
      return { label: 'Autorizado', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
    case 'processando':
      return { label: 'Processando', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' }
    case 'rejeitado':
      return { label: 'Rejeitado', class: 'bg-rose-500/20 text-rose-400 border-rose-500/30' }
    case 'falha_processamento':
      return { label: 'Falha Transmissão', class: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
    case 'cancelado':
      return { label: 'Cancelado', class: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
    default:
      return { label: 'Rascunho', class: 'bg-slate-700/30 text-slate-300 border-slate-600/30' }
  }
}

const formatMoney = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

const formatDate = (iso: string) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchDocuments()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Icon name="lucide:receipt" class="w-7 h-7 text-indigo-400" />
          Documentos Fiscais (NF-e / NFS-e)
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Emissão, consulta de protocolos oficiais e armazenamento seguro de XMLs e DANFEs.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="fetchDocuments"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition min-h-[44px] cursor-pointer"
        >
          <Icon name="lucide:refresh-cw" class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          <span>Atualizar</span>
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-slate-900/60 border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div>
        <label class="block text-xs font-semibold text-slate-400 mb-1.5">Buscar por OS / Cliente / Número</label>
        <input
          v-model="searchOs"
          type="text"
          placeholder="Ex: OS-2026-001..."
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 min-h-[44px]"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-400 mb-1.5">Status Fiscal</label>
        <select
          v-model="selectedStatus"
          @change="fetchDocuments"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 min-h-[44px]"
        >
          <option value="">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="processando">Processando</option>
          <option value="autorizado">Autorizado</option>
          <option value="rejeitado">Rejeitado</option>
          <option value="falha_processamento">Falha de Transmissão</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-400 mb-1.5">Ambiente</label>
        <select
          v-model="selectedAmbiente"
          @change="fetchDocuments"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 min-h-[44px]"
        >
          <option value="">Todos os ambientes</option>
          <option value="homologacao">Homologação (Testes)</option>
          <option value="producao">Produção</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-400 mb-1.5">Tipo de Documento</label>
        <select
          v-model="selectedTipo"
          @change="fetchDocuments"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 min-h-[44px]"
        >
          <option value="">Todos os tipos</option>
          <option value="nfe">NF-e (Mercadorias)</option>
          <option value="nfse">NFS-e (Serviços)</option>
        </select>
      </div>
    </div>

    <!-- Tabela de Documentos -->
    <div class="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr class="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase text-slate-400 tracking-wider">
              <th class="py-3.5 px-4">Documento</th>
              <th class="py-3.5 px-4">Ordem de Serviço</th>
              <th class="py-3.5 px-4">Cliente</th>
              <th class="py-3.5 px-4">Ambiente</th>
              <th class="py-3.5 px-4">Valor Líquido</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4">Data</th>
              <th class="py-3.5 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-sm">
            <tr v-if="loading && items.length === 0">
              <td colspan="8" class="py-12 text-center text-slate-400">
                <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                Carregando documentos fiscais...
              </td>
            </tr>

            <tr v-else-if="filteredItems.length === 0">
              <td colspan="8" class="py-12 text-center text-slate-400">
                Nenhum documento fiscal encontrado com os filtros selecionados.
              </td>
            </tr>

            <tr
              v-for="doc in filteredItems"
              :key="doc.id"
              class="hover:bg-white/[0.02] transition duration-150"
            >
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase"
                    :class="doc.tipo_documento === 'nfe' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'">
                    {{ doc.tipo_documento }}
                  </span>
                  <span class="font-medium text-white">
                    {{ doc.numero_documento ? `Nº ${doc.numero_documento}` : '(Não numerado)' }}
                  </span>
                </div>
              </td>

              <td class="py-3.5 px-4">
                <NuxtLink
                  :to="`/admin/ordens-servico/${doc.work_order_id}`"
                  class="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  {{ doc.work_order?.numero_os || doc.work_order_id.substring(0, 8) }}
                </NuxtLink>
              </td>

              <td class="py-3.5 px-4 text-slate-300 font-medium">
                {{ doc.client?.nome || 'Cliente não identificado' }}
              </td>

              <td class="py-3.5 px-4">
                <span class="text-xs px-2 py-0.5 rounded-full"
                  :class="doc.ambiente === 'producao' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 font-bold' : 'bg-amber-950/80 text-amber-300 border border-amber-800/40'">
                  {{ doc.ambiente === 'producao' ? 'Produção' : 'Homologação' }}
                </span>
                <span v-if="doc.is_simulated" class="ml-1 text-[10px] text-slate-500 font-mono">(Sandbox)</span>
              </td>

              <td class="py-3.5 px-4 font-bold text-white">
                {{ formatMoney(doc.valor_liquido) }}
              </td>

              <td class="py-3.5 px-4">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5"
                  :class="getStatusBadge(doc.status).class"
                >
                  {{ getStatusBadge(doc.status).label }}
                </span>
              </td>

              <td class="py-3.5 px-4 text-slate-400 text-xs">
                {{ formatDate(doc.created_at) }}
              </td>

              <td class="py-3.5 px-4 text-right">
                <NuxtLink
                  :to="`/admin/fiscal/${doc.id}`"
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium text-xs transition min-h-[36px]"
                >
                  Ver Detalhes
                  <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
