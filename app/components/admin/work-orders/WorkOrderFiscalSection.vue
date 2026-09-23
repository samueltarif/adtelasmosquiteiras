<script setup lang="ts">
import { ref, onMounted } from 'vue'
import FiscalDocumentDraftModal from '../fiscal/FiscalDocumentDraftModal.vue'

const props = defineProps<{
  workOrder: any
}>()

const isDraftModalOpen = ref(false)
const loading = ref(true)
const fiscalDocs = ref<any[]>([])

const fetchFiscalDocs = async () => {
  if (!props.workOrder?.id) return
  loading.value = true
  try {
    const res = await $fetch<any>(`/api/admin/crm/fiscal?workOrderId=${props.workOrder.id}`)
    fiscalDocs.value = res.items || []
  } catch (err) {
    console.error('Erro ao carregar documentos fiscais da OS:', err)
  } finally {
    loading.value = false
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'autorizado':
      return { label: 'Autorizado', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
    case 'processando':
      return { label: 'Processando', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
    case 'rejeitado':
      return { label: 'Rejeitado', class: 'bg-rose-500/20 text-rose-400 border-rose-500/30' }
    case 'falha_processamento':
      return { label: 'Falha Transmissão', class: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
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
  fetchFiscalDocs()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header e Ação -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/60 border border-white/10 rounded-2xl">
      <div>
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <Icon name="lucide:receipt" class="w-5 h-5 text-indigo-400" />
          Faturamento e Emissão Fiscal
        </h3>
        <p class="text-xs text-slate-400 mt-1">
          Emita notas fiscais (NF-e de mercadorias ou NFS-e de serviços) com reserva atômica de saldo dos itens desta OS.
        </p>
      </div>

      <button
        @click="isDraftModalOpen = true"
        class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition min-h-[44px] cursor-pointer"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        <span>Gerar Documento Fiscal</span>
      </button>
    </div>

    <!-- Lista de Notas desta OS -->
    <div class="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden">
      <div v-if="loading" class="py-12 text-center text-slate-400 text-xs">
        <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
        Carregando documentos fiscais da OS...
      </div>

      <div v-else-if="fiscalDocs.length === 0" class="py-12 text-center text-slate-400 text-xs">
        Nenhum documento fiscal emitido para esta ordem de serviço.
      </div>

      <div v-else class="divide-y divide-white/5">
        <div
          v-for="doc in fiscalDocs"
          :key="doc.id"
          class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                :class="doc.tipo_documento === 'nfe' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'">
                {{ doc.tipo_documento }}
              </span>
              <span class="font-bold text-white text-sm">
                {{ doc.numero_documento ? `Nº ${doc.numero_documento}` : 'Rascunho' }}
              </span>
              <span class="text-xs px-2 py-0.5 rounded-full"
                :class="getStatusBadge(doc.status).class">
                {{ getStatusBadge(doc.status).label }}
              </span>
            </div>
            <p class="text-xs text-slate-400">
              Valor Faturado: <strong class="text-white">{{ formatMoney(doc.valor_liquido) }}</strong> | Em: {{ formatDate(doc.created_at) }}
            </p>
          </div>

          <NuxtLink
            :to="`/admin/fiscal/${doc.id}`"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-semibold text-xs transition min-h-[44px]"
          >
            Visualizar Detalhes
            <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Modal de Rascunho -->
    <FiscalDocumentDraftModal
      :work-order="workOrder"
      :is-open="isDraftModalOpen"
      @close="isDraftModalOpen = false"
      @draft-created="fetchFiscalDocs"
    />
  </div>
</template>
