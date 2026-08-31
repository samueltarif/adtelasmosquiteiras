<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SiteMedia } from '~/types/siteMedia'

const props = defineProps<{
  isOpen: boolean
  media: SiteMedia | null
  isSaving: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: { alt_text: string; title: string; caption: string }): void
}>()

const form = ref({ alt_text: '', title: '', caption: '' })

watch(() => props.media, (m) => {
  if (m) {
    form.value = { alt_text: m.alt_text || '', title: m.title || '', caption: m.caption || '' }
  }
}, { immediate: true })

function handleSubmit() {
  emit('save', {
    alt_text: form.value.alt_text.trim(),
    title: form.value.title.trim(),
    caption: form.value.caption.trim()
  })
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click.self="emit('close')">
    <div class="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <div class="flex items-center gap-2">
          <Icon name="lucide:edit-3" class="w-5 h-5 text-indigo-400" />
          <h3 class="text-base font-bold text-white">Editar Informações da Mídia</h3>
        </div>
        <button @click="emit('close')" class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Fechar modal">
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-300 flex justify-between">
            <span>Texto Alternativo (Alt Text)*</span>
            <span class="text-slate-500 font-mono">{{ form.alt_text.length }}/255</span>
          </label>
          <input
            v-model="form.alt_text"
            type="text"
            required
            minlength="3"
            maxlength="255"
            placeholder="Descreva o que aparece na imagem..."
            class="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-hidden min-h-[44px]"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-300 flex justify-between">
            <span>Título da Foto/Vídeo (Opcional)</span>
            <span class="text-slate-500 font-mono">{{ form.title.length }}/255</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            maxlength="255"
            placeholder="Ex: Instalação no Bairro Moema"
            class="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-hidden min-h-[44px]"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-300 flex justify-between">
            <span>Legenda Descritiva (Opcional)</span>
            <span class="text-slate-500 font-mono">{{ form.caption.length }}/1000</span>
          </label>
          <textarea
            v-model="form.caption"
            rows="3"
            maxlength="1000"
            placeholder="Ex: Rede de proteção instalada..."
            class="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 focus:outline-hidden resize-none"
          ></textarea>
        </div>

        <div v-if="error" class="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-300">
          {{ error }}
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button type="button" @click="emit('close')" class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 min-h-[44px]">
            Cancelar
          </button>
          <button type="submit" :disabled="isSaving" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white shadow-md min-h-[44px] cursor-pointer">
            <Icon v-if="isSaving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>{{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
