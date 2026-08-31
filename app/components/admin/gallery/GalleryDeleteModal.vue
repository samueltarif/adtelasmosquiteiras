<script setup lang="ts">
import type { SiteMedia } from '~/types/siteMedia'

const props = defineProps<{
  isOpen: boolean
  media: SiteMedia | null
  isDeleting: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click.self="emit('close')">
    <div class="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
          <Icon name="lucide:trash-2" class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-base font-bold text-white">Excluir esta mídia?</h3>
          <p class="text-xs text-slate-400">Esta ação é irreversível.</p>
        </div>
      </div>

      <p class="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-white/5">
        A mídia deixará de aparecer no site público e o arquivo físico será <strong>excluído definitivamente</strong> do bucket de armazenamento (Cloudflare R2).
      </p>

      <div v-if="error" class="p-3 bg-red-950/50 border border-red-800/50 rounded-xl text-xs text-red-300">
        {{ error }}
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
        <button type="button" @click="emit('close')" class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 min-h-[44px]">
          Cancelar
        </button>
        <button type="button" :disabled="isDeleting" @click="emit('confirm')" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-red-600/30 min-h-[44px] cursor-pointer">
          <Icon v-if="isDeleting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          <span>{{ isDeleting ? 'Excluindo...' : 'Excluir Definitivamente' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
