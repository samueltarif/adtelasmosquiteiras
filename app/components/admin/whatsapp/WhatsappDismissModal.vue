<script setup lang="ts">
import { ref, watch } from 'vue'
import type { WhatsappAttributionItem } from '~/types/adminWhatsappAttribution'

const props = defineProps<{
  isOpen: boolean
  attribution: WhatsappAttributionItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'dismissed'): void
}>()

const dismissNotes = ref('')
const isDismissing = ref(false)
const dismissError = ref<string | null>(null)

watch(() => props.isOpen, (open) => {
  if (open) {
    dismissNotes.value = ''
    dismissError.value = null
  }
})

async function confirmDismissal() {
  if (!props.attribution) return

  isDismissing.value = true
  dismissError.value = null

  try {
    const res = await $fetch<any>(`/api/admin/marketing/whatsapp-attributions/${props.attribution.id}/dismiss`, {
      method: 'POST',
      body: {
        notes: dismissNotes.value.trim() || undefined
      }
    })

    if (res?.success) {
      emit('dismissed')
      emit('close')
    }
  } catch (err: any) {
    dismissError.value = err?.data?.message || err?.message || 'Erro ao dispensar atribuição.'
  } finally {
    isDismissing.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
  >
    <div class="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Icon name="lucide:trash-2" class="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-white">Dispensar Clique WhatsApp</h4>
            <p class="text-[11px] text-slate-400">Ref: {{ attribution?.short_code }}</p>
          </div>
        </div>
        <button type="button" @click="emit('close')" class="text-slate-400 hover:text-white cursor-pointer">
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <p class="text-xs text-slate-300 leading-relaxed">
        Tem certeza de que deseja dispensar este clique? Ele não aparecerá mais na fila de atendimento pendente.
      </p>

      <div v-if="dismissError" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
        {{ dismissError }}
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-slate-300">Motivo (opcional)</label>
        <input
          v-model="dismissNotes"
          type="text"
          placeholder="Ex: Contato sem retorno / spam / teste interno"
          class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
        />
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="confirmDismissal"
          :disabled="isDismissing"
          class="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Icon v-if="isDismissing" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ isDismissing ? 'Dispensando...' : 'Confirmar Dispensa' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
