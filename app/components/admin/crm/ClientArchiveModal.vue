<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isOpen: boolean
  clientId: string | null
  clientName: string
  isArchived: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirmed', isArchived: boolean): void
}>()

const isProcessing = ref(false)
const errorMessage = ref<string | null>(null)

async function handleToggleArchive() {
  if (!props.clientId) return
  isProcessing.value = true
  errorMessage.value = null

  const targetState = !props.isArchived

  try {
    const res = await $fetch<any>(`/api/admin/crm/clients/${props.clientId}`, {
      method: 'PATCH',
      body: {
        is_archived: targetState
      }
    })

    if (res?.success) {
      emit('confirmed', targetState)
      emit('close')
    } else {
      errorMessage.value = res?.message || 'Erro ao alterar estado de arquivamento.'
    }
  } catch (err: any) {
    console.error('[ClientArchiveModal] Erro:', err)
    errorMessage.value = err?.data?.message || err?.message || 'Erro ao arquivar/reativar cliente.'
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')"></div>

    <!-- Modal Container -->
    <div class="relative w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl z-10 flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <div 
          class="p-2.5 rounded-xl shrink-0"
          :class="isArchived ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'"
        >
          <Icon :name="isArchived ? 'lucide:archive-restore' : 'lucide:archive'" class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-base font-bold text-white leading-tight">
            {{ isArchived ? 'Reativar Cliente' : 'Arquivar Cliente' }}
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">Confirmação de segurança</p>
        </div>
      </div>

      <div v-if="errorMessage" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
        {{ errorMessage }}
      </div>

      <p class="text-sm text-slate-300 leading-relaxed">
        <span v-if="isArchived">
          Deseja reativar o cliente <strong class="text-white">{{ clientName }}</strong>? Ele voltará a aparecer na listagem principal de clientes ativos.
        </span>
        <span v-else>
          Tem certeza que deseja arquivar o cliente <strong class="text-white">{{ clientName }}</strong>? O histórico de ordens de serviço, endereços e notas será integralmente preservado.
        </span>
      </p>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
        <button 
          type="button" 
          @click="emit('close')"
          class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-sm font-medium min-h-[44px] cursor-pointer"
        >
          Cancelar
        </button>

        <button 
          type="button"
          :disabled="isProcessing"
          @click="handleToggleArchive"
          class="px-5 py-2.5 rounded-xl text-white transition-colors text-sm font-bold flex items-center gap-2 min-h-[44px] cursor-pointer shadow-md"
          :class="isArchived ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'"
        >
          <Icon v-if="isProcessing" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          <span>{{ isProcessing ? 'Processando...' : (isArchived ? 'Reativar Cliente' : 'Confirmar Arquivamento') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
