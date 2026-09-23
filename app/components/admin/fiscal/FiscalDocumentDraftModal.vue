<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  workOrder: any
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'draftCreated', docId: string): void
}>()

const router = useRouter()
const submitting = ref(false)
const errorMessage = ref<string | null>(null)

const tipoDocumento = ref<'nfe' | 'nfse'>('nfse')
const ambiente = ref<'homologacao' | 'producao'>('homologacao')
const isSimulated = ref(false)
const selectedItemIds = ref<string[]>([])

const initializeSelection = () => {
  if (props.workOrder?.items) {
    selectedItemIds.value = props.workOrder.items.map((it: any) => it.id)
  }
}

watch(() => props.isOpen, (open) => {
  if (open) {
    initializeSelection()
    errorMessage.value = null
  }
})

const handleCreateDraft = async () => {
  if (selectedItemIds.value.length === 0) {
    errorMessage.value = 'Selecione pelo menos um item para emissão.'
    return
  }

  submitting.value = true
  errorMessage.value = null

  try {
    const res = await $fetch<any>('/api/admin/crm/fiscal/draft', {
      method: 'POST',
      body: {
        workOrderId: props.workOrder.id,
        tipoDocumento: tipoDocumento.value,
        ambiente: ambiente.value,
        isSimulated: isSimulated.value,
        selectedItemIds: selectedItemIds.value
      }
    })

    emit('close')
    emit('draftCreated', res.draft.id)
    router.push(`/admin/fiscal/${res.draft.id}`)
  } catch (err: any) {
    errorMessage.value = err.data?.message || err.message || 'Erro ao gerar rascunho de nota fiscal.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div class="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <Icon name="lucide:receipt" class="w-5 h-5 text-indigo-400" />
          Gerar Documento Fiscal (Rascunho)
        </h3>
        <button
          @click="emit('close')"
          class="p-2 text-slate-400 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
        {{ errorMessage }}
      </div>

      <div class="space-y-4 text-sm">
        <!-- Tipo de Documento -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1.5">Tipo de Documento Fiscal</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="tipoDocumento = 'nfse'"
              class="px-4 py-3 rounded-xl border font-semibold text-xs transition cursor-pointer min-h-[44px]"
              :class="tipoDocumento === 'nfse' ? 'bg-purple-600/20 border-purple-500 text-purple-200' : 'bg-slate-950 border-white/10 text-slate-400'"
            >
              NFS-e (Serviços)
            </button>
            <button
              type="button"
              @click="tipoDocumento = 'nfe'"
              class="px-4 py-3 rounded-xl border font-semibold text-xs transition cursor-pointer min-h-[44px]"
              :class="tipoDocumento === 'nfe' ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'bg-slate-950 border-white/10 text-slate-400'"
            >
              NF-e (Mercadorias)
            </button>
          </div>
        </div>

        <!-- Ambiente -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1.5">Ambiente Fiscal</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="ambiente = 'homologacao'"
              class="px-4 py-2.5 rounded-xl border font-semibold text-xs transition cursor-pointer min-h-[44px]"
              :class="ambiente === 'homologacao' ? 'bg-amber-600/20 border-amber-500 text-amber-200' : 'bg-slate-950 border-white/10 text-slate-400'"
            >
              Homologação (Testes)
            </button>
            <button
              type="button"
              @click="ambiente = 'producao'"
              class="px-4 py-2.5 rounded-xl border font-semibold text-xs transition cursor-pointer min-h-[44px]"
              :class="ambiente === 'producao' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200' : 'bg-slate-950 border-white/10 text-slate-400'"
            >
              Produção Real
            </button>
          </div>
        </div>

        <!-- Sandbox Checkbox -->
        <label class="flex items-center gap-2 cursor-pointer pt-1 min-h-[44px]">
          <input
            v-model="isSimulated"
            type="checkbox"
            class="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
          />
          <span class="text-xs text-slate-300">Simulação Local (Mock Sandbox — Não envia para SEFAZ/Prefeitura)</span>
        </label>

        <!-- Seleção de Itens da OS -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1.5">Itens a faturar nesta emissão</label>
          <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
            <div
              v-for="it in workOrder.items || []"
              :key="it.id"
              class="p-2.5 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-between text-xs"
            >
              <label class="flex items-center gap-2.5 cursor-pointer flex-1 min-h-[36px]">
                <input
                  type="checkbox"
                  :value="it.id"
                  v-model="selectedItemIds"
                  class="w-4 h-4 rounded border-slate-700 text-indigo-600"
                />
                <span class="text-white font-medium">{{ it.descricao }}</span>
              </label>
              <span class="text-slate-400 font-mono text-[11px]">{{ it.quantidade }} un</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold min-h-[44px] cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleCreateDraft"
          :disabled="submitting"
          class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 disabled:opacity-50 min-h-[44px] cursor-pointer"
        >
          {{ submitting ? 'Criando...' : 'Criar Rascunho' }}
        </button>
      </div>
    </div>
  </div>
</template>
