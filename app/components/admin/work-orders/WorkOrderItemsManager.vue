<script setup lang="ts">
import { ref, computed } from 'vue'
import WorkOrderItemModal from './WorkOrderItemModal.vue'
import WorkOrderMeasurementsTable from './WorkOrderMeasurementsTable.vue'

const props = defineProps<{
  workOrderId: string
  workOrderStatus: string
  workOrderTotals: {
    valor_total: number | string
    valor_desconto: number | string
    valor_final: number | string
  }
  items: any[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'itemsChanged'): void
  (e: 'totalsUpdated', totals: any): void
}>()

const isItemModalOpen = ref(false)
const itemToEdit = ref<any | null>(null)
const isDeletingItemId = ref<string | null>(null)

const isLocked = computed(() => ['concluida', 'cancelada'].includes(props.workOrderStatus))
const isDeleteLocked = computed(() => ['em_execucao', 'concluida', 'cancelada'].includes(props.workOrderStatus))

const categoryLabels: Record<string, string> = {
  tela_mosquiteira: 'Tela Mosquiteira',
  rede_protecao: 'Rede de Proteção',
  vidracaria: 'Vidraçaria',
  manutencao: 'Manutenção',
  outro: 'Outro'
}

function openCreateItemModal() {
  itemToEdit.value = null
  isItemModalOpen.value = true
}

function openEditItemModal(item: any) {
  itemToEdit.value = item
  isItemModalOpen.value = true
}

async function handleDeleteItem(itemId: string) {
  if (isDeleteLocked.value) {
    alert('Exclusão de itens não é permitida neste status.')
    return
  }

  if (!confirm('Deseja realmente excluir este item? Todas as medições vinculadas a ele serão excluídas.')) return

  isDeletingItemId.value = itemId
  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}/items/${itemId}`, {
      method: 'DELETE'
    })
    if (res?.success) {
      emit('itemsChanged')
      if (res.workOrderTotals) {
        emit('totalsUpdated', res.workOrderTotals)
      }
    }
  } catch (err: any) {
    console.error('[WorkOrderItemsManager] Erro ao deletar item:', err)
    alert(err?.data?.message || 'Falha ao excluir item da OS')
  } finally {
    isDeletingItemId.value = null
  }
}

function handleItemSaved(totals?: any) {
  emit('itemsChanged')
  if (totals) {
    emit('totalsUpdated', totals)
  }
}

function formatCurrency(val?: number | string | null) {
  const num = typeof val === 'number' ? val : parseFloat(String(val || 0))
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(num) ? 0 : num)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold text-white uppercase tracking-wider">Itens e Serviços da OS</h3>
        <p class="text-xs text-slate-400">Serviços contratados, vãos técnicos e totalização</p>
      </div>

      <button
        v-if="!isLocked"
        type="button"
        @click="openCreateItemModal"
        class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer min-h-[44px]"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        <span>Adicionar Item</span>
      </button>
    </div>

    <!-- Lista de Itens -->
    <div v-if="isLoading" class="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-indigo-400" />
      <span>Carregando itens da ordem de serviço...</span>
    </div>

    <div v-else-if="items.length === 0" class="rounded-2xl border border-white/5 bg-slate-900/40 p-8 text-center">
      <div class="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
        <Icon name="lucide:package" class="w-5 h-5" />
      </div>
      <p class="text-xs text-slate-400 mb-3">Nenhum item adicionado a esta ordem de serviço ainda.</p>
      <button
        v-if="!isLocked"
        @click="openCreateItemModal"
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-semibold border border-indigo-500/30 transition-all cursor-pointer min-h-[38px]"
      >
        <Icon name="lucide:plus" class="w-3.5 h-3.5" />
        <span>Adicionar Primeiro Item</span>
      </button>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="(item, idx) in items"
        :key="item.id"
        class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-5 shadow-lg space-y-3"
      >
        <!-- Header do Item -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center">
                {{ idx + 1 }}
              </span>
              <h4 class="text-sm font-bold text-white">{{ item.descricao }}</h4>
              <span class="inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5">
                {{ categoryLabels[item.categoria_operacional] || item.categoria_operacional }}
              </span>
            </div>

            <p v-if="item.observacoes" class="text-xs text-slate-400 pl-8">
              {{ item.observacoes }}
            </p>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-4 pl-8 sm:pl-0">
            <div class="text-right">
              <span class="text-[10px] text-slate-500 block">
                {{ item.quantidade }} × {{ formatCurrency(item.preco_unitario) }}
              </span>
              <span class="text-sm font-bold text-emerald-400">
                {{ formatCurrency(item.preco_total) }}
              </span>
            </div>

            <div v-if="!isLocked" class="flex items-center gap-1">
              <button
                type="button"
                @click="openEditItemModal(item)"
                class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Editar Item"
              >
                <Icon name="lucide:edit" class="w-4 h-4" />
              </button>

              <button
                v-if="!isDeleteLocked"
                type="button"
                :disabled="isDeletingItemId === item.id"
                @click="handleDeleteItem(item.id)"
                class="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Excluir Item"
              >
                <Icon v-if="isDeletingItemId === item.id" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
                <Icon v-else name="lucide:trash-2" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Tabela de Vãos Embutida -->
        <WorkOrderMeasurementsTable
          :work-order-id="workOrderId"
          :item-id="item.id"
          :measurements="item.measurements || []"
          :is-locked="isLocked"
          @measurements-changed="emit('itemsChanged')"
        />
      </div>

      <!-- Resumo Financeiro da OS -->
      <div class="rounded-2xl border border-white/10 bg-slate-950/80 p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="text-xs text-slate-400">
          Valores calculados e reconciliados diretamente com o banco de dados.
        </div>

        <div class="space-y-1.5 sm:text-right">
          <div class="flex items-center justify-between sm:justify-end gap-6 text-xs text-slate-400">
            <span>Subtotal Bruto:</span>
            <span class="font-mono text-white">{{ formatCurrency(workOrderTotals.valor_total) }}</span>
          </div>

          <div v-if="Number(workOrderTotals.valor_desconto) > 0" class="flex items-center justify-between sm:justify-end gap-6 text-xs text-amber-400">
            <span>Desconto Aplicado:</span>
            <span class="font-mono">- {{ formatCurrency(workOrderTotals.valor_desconto) }}</span>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-6 text-sm font-bold text-emerald-400 pt-1 border-t border-white/10">
            <span>Valor Final:</span>
            <span class="font-mono text-base">{{ formatCurrency(workOrderTotals.valor_final) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Item -->
    <WorkOrderItemModal
      :is-open="isItemModalOpen"
      :work-order-id="workOrderId"
      :item-to-edit="itemToEdit"
      @close="isItemModalOpen = false"
      @item-saved="handleItemSaved"
    />
  </div>
</template>
