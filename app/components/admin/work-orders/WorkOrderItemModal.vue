<script setup lang="ts">
import { ref, watch } from 'vue'
import { ALLOWED_OS_CATEGORIAS } from '../../../../server/shared/crmValidation.mjs'

const props = defineProps<{
  isOpen: boolean
  workOrderId: string
  itemToEdit?: any | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'itemSaved', totals: any): void
}>()

const descricao = ref('')
const categoria = ref('tela_mosquiteira')
const quantidade = ref(1)
const precoUnitario = ref<number | ''>(0)
const serviceKey = ref('')
const observacoes = ref('')

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const categoriasOperacionais = [
  { value: 'tela_mosquiteira', label: 'Tela Mosquiteira' },
  { value: 'rede_protecao', label: 'Rede de Proteção' },
  { value: 'vidracaria', label: 'Vidraçaria' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'outro', label: 'Outro Serviço' }
]

watch(() => props.isOpen, (open) => {
  if (open) {
    errorMessage.value = null
    if (props.itemToEdit) {
      descricao.value = props.itemToEdit.descricao || ''
      categoria.value = props.itemToEdit.categoria_operacional || 'tela_mosquiteira'
      quantidade.value = props.itemToEdit.quantidade || 1
      precoUnitario.value = Number(props.itemToEdit.preco_unitario) || 0
      serviceKey.value = props.itemToEdit.service_key || ''
      observacoes.value = props.itemToEdit.observacoes || ''
    } else {
      descricao.value = ''
      categoria.value = 'tela_mosquiteira'
      quantidade.value = 1
      precoUnitario.value = 0
      serviceKey.value = ''
      observacoes.value = ''
    }
  }
})

async function handleSave() {
  if (!descricao.value || descricao.value.trim().length < 2) {
    errorMessage.value = 'Informe a descrição do serviço (mínimo 2 caracteres).'
    return
  }

  const qtd = parseInt(String(quantidade.value), 10)
  if (isNaN(qtd) || qtd <= 0) {
    errorMessage.value = 'Quantidade deve ser maior que zero.'
    return
  }

  const preco = Number(precoUnitario.value)
  if (isNaN(preco) || preco < 0) {
    errorMessage.value = 'Preço unitário não pode ser negativo.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  const payload: Record<string, any> = {
    categoria_operacional: categoria.value,
    descricao: descricao.value.trim(),
    quantidade: qtd,
    preco_unitario: preco,
    service_key: serviceKey.value ? serviceKey.value.trim() : null,
    observacoes: observacoes.value ? observacoes.value.trim() : null
  }

  try {
    let res: any
    if (props.itemToEdit?.id) {
      payload.expected_updated_at = props.itemToEdit.updated_at
      res = await $fetch(`/api/admin/crm/work-orders/${props.workOrderId}/items/${props.itemToEdit.id}`, {
        method: 'PATCH',
        body: payload
      })
    } else {
      res = await $fetch(`/api/admin/crm/work-orders/${props.workOrderId}/items`, {
        method: 'POST',
        body: payload
      })
    }

    if (res?.success) {
      emit('itemSaved', res.workOrderTotals)
      emit('close')
    }
  } catch (err: any) {
    console.error('[WorkOrderItemModal] Erro ao salvar item:', err)
    errorMessage.value = err?.data?.message || err?.message || 'Falha ao salvar item da ordem de serviço'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 class="text-base font-bold text-white">
            {{ itemToEdit?.id ? 'Editar Item de Serviço' : 'Adicionar Item de Serviço' }}
          </h3>
          <p class="text-xs text-slate-400">Total calculado automaticamente pelo banco</p>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSave" class="space-y-4">
        <!-- Categoria Operacional -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Categoria Operacional *</label>
          <select
            v-model="categoria"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
          >
            <option v-for="cat in categoriasOperacionais" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </div>

        <!-- Descrição -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Descrição do Serviço *</label>
          <input
            v-model="descricao"
            type="text"
            placeholder="Ex: Instalação de telas mosquiteiras em 3 janelas..."
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Quantidade -->
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Quantidade *</label>
            <input
              v-model.number="quantidade"
              type="number"
              min="1"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>

          <!-- Preço Unitário -->
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Preço Unitário (R$) *</label>
            <input
              v-model.number="precoUnitario"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>
        </div>

        <!-- Observações do Item -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Observações do Item</label>
          <textarea
            v-model="observacoes"
            rows="2"
            placeholder="Informações específicas deste item..."
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
            <span>{{ isSubmitting ? 'Salvando...' : 'Salvar Item' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
