<script setup lang="ts">
import { ref, watch } from 'vue'
import { ALLOWED_MEDIA_ETAPAS } from '../../../../server/shared/crmValidation.mjs'

const props = defineProps<{
  isOpen: boolean
  workOrderId: string
  media: any | null
  items: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'mediaUpdated'): void
}>()

const etapa = ref('antes')
const descricao = ref('')
const selectedItemId = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const etapaOptions = [
  { value: 'antes', label: 'Antes da Instalação / Vistoria' },
  { value: 'durante', label: 'Durante a Execução' },
  { value: 'depois', label: 'Depois / Entrega Final' },
  { value: 'laudo', label: 'Laudo Técnico / Diagnóstico' }
]

watch(() => props.isOpen, (open) => {
  if (open && props.media) {
    etapa.value = props.media.etapa || 'antes'
    descricao.value = props.media.descricao || ''
    selectedItemId.value = props.media.work_order_item_id || ''
    errorMessage.value = null
  }
})

async function handleSave() {
  if (!props.media?.id) return

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}/media/${props.media.id}`, {
      method: 'PATCH',
      body: {
        etapa: etapa.value,
        descricao: descricao.value.trim() || null,
        work_order_item_id: selectedItemId.value || null
      }
    })

    if (res?.success) {
      emit('mediaUpdated')
      emit('close')
    }
  } catch (err: any) {
    console.error('[WorkOrderMediaEditModal] Falha ao editar mídia')
    errorMessage.value = err?.data?.message || err?.message || 'Falha ao atualizar metadados da mídia'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 space-y-5">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 class="text-base font-bold text-white">Editar Metadados da Mídia</h3>
          <p class="text-xs text-slate-400 truncate max-w-xs">{{ media?.safe_filename }}</p>
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
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Etapa da Instalação *</label>
          <select
            v-model="etapa"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
          >
            <option v-for="opt in etapaOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Vínculo com Item (Opcional)</label>
          <select
            v-model="selectedItemId"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
          >
            <option value="">Geral da Ordem de Serviço</option>
            <option v-for="it in items" :key="it.id" :value="it.id">
              Item: {{ it.descricao }}
            </option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Descrição / Observação</label>
          <textarea
            v-model="descricao"
            rows="3"
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
            <span>{{ isSubmitting ? 'Salvando...' : 'Salvar Alterações' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
