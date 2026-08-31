<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isOpen: boolean
  workOrder: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'archiveUpdated', isArchived: boolean): void
}>()

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

async function handleToggleArchive() {
  isSubmitting.value = true
  errorMessage.value = null
  const targetArchived = !props.workOrder?.is_archived

  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrder.id}`, {
      method: 'PATCH',
      body: {
        is_archived: targetArchived,
        expected_updated_at: props.workOrder.updated_at
      }
    })

    if (res?.success) {
      emit('archiveUpdated', targetArchived)
      emit('close')
    }
  } catch (err: any) {
    console.error('[WorkOrderArchiveModal] Falha ao alterar arquivamento da OS')
    errorMessage.value = err?.data?.message || err?.message || 'Falha ao alterar arquivamento da OS'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 space-y-5">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <h3 class="text-base font-bold text-white">
          {{ workOrder?.is_archived ? 'Desarquivar Ordem de Serviço' : 'Arquivar Ordem de Serviço' }}
        </h3>
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

      <p class="text-xs text-slate-300">
        <span v-if="workOrder?.is_archived">
          Deseja reativar a Ordem de Serviço <strong class="text-white">{{ workOrder?.numero_os }}</strong>? Ela voltará a aparecer nas listagens padrão ativas.
        </span>
        <span v-else>
          Tem certeza de que deseja arquivar a Ordem de Serviço <strong class="text-white">{{ workOrder?.numero_os }}</strong>? Ela será ocultada da visualização operacional ativa, mas todos os registros e medições serão preservados.
        </span>
      </p>

      <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all min-h-[44px] cursor-pointer"
        >
          Cancelar
        </button>

        <button
          type="button"
          @click="handleToggleArchive"
          :disabled="isSubmitting"
          class="px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-lg transition-all flex items-center gap-2 min-h-[44px] cursor-pointer"
          :class="workOrder?.is_archived ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-amber-600 hover:bg-amber-500'"
        >
          <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          <span>{{ workOrder?.is_archived ? 'Confirmar Desarquivamento' : 'Confirmar Arquivamento' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
