<script setup lang="ts">
import { computed } from 'vue'
import Badge from '~/components/ui/badge/Badge.vue'
import type { UploadQueueItem } from '~/types/siteMedia'

const props = defineProps<{
  uploadQueue: UploadQueueItem[]
  currentServiceName: string
  isUploading: boolean
}>()

const emit = defineEmits<{
  (e: 'process'): void
  (e: 'clearCompleted'): void
  (e: 'retry', id: string): void
  (e: 'remove', id: string): void
}>()

const pendingUploadsCount = computed(() => props.uploadQueue.filter((i) => i.status !== 'completed').length)
const completedUploadsCount = computed(() => props.uploadQueue.filter((i) => i.status === 'completed').length)

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<template>
  <div v-if="uploadQueue.length > 0" class="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
          {{ uploadQueue.length }}
        </div>
        <div>
          <h3 class="text-sm font-bold text-white leading-tight">
            Fila de Envio para "{{ currentServiceName }}"
          </h3>
          <p class="text-xs text-slate-400">
            {{ pendingUploadsCount }} pendente(s) • {{ completedUploadsCount }} concluído(s)
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <button
          v-if="completedUploadsCount > 0"
          @click="emit('clearCompleted')"
          class="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 min-h-[44px] transition-colors cursor-pointer"
        >
          Limpar Concluídos
        </button>
        <button
          @click="emit('process')"
          :disabled="isUploading || pendingUploadsCount === 0"
          class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/25 min-h-[44px] cursor-pointer"
        >
          <Icon v-if="isUploading" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          <Icon v-else name="lucide:send" class="w-4 h-4" />
          <span>{{ isUploading ? 'Processando Fila...' : `Iniciar Envio (${pendingUploadsCount})` }}</span>
        </button>
      </div>
    </div>

    <!-- Lista de Itens na Fila -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
      <div
        v-for="item in uploadQueue"
        :key="item.id"
        class="bg-slate-950/70 border border-white/10 rounded-xl p-3.5 flex flex-col gap-2.5 transition-all"
      >
        <div class="flex items-start gap-3">
          <div class="w-16 h-16 rounded-xl bg-slate-900 border border-white/10 overflow-hidden shrink-0 relative flex items-center justify-center">
            <img
              v-if="item.mediaType === 'photo'"
              :src="item.previewUrl"
              :alt="item.altText"
              class="w-full h-full object-cover"
            />
            <div v-else class="text-indigo-400 flex flex-col items-center justify-center gap-1">
              <Icon name="lucide:video" class="w-6 h-6" />
              <span class="text-[9px] font-bold uppercase">Vídeo</span>
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-bold text-white truncate" :title="item.file.name">
                {{ item.file.name }}
              </span>
              <button
                v-if="item.status !== 'uploading'"
                @click="emit('remove', item.id)"
                class="text-slate-400 hover:text-red-400 p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                title="Remover da fila"
                aria-label="Remover da fila"
              >
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>

            <p class="text-[11px] text-slate-400">
              {{ item.mediaType === 'photo' ? 'Foto' : 'Vídeo' }} • Original: {{ formatBytes(item.originalSize) }}
              <span v-if="item.finalSize && item.finalSize !== item.originalSize" class="text-emerald-400">
                → {{ formatBytes(item.finalSize) }} (WebP)
              </span>
            </p>

            <div class="mt-1 flex items-center gap-1.5">
              <Badge
                :variant="item.status === 'completed' ? 'default' : item.status === 'error' ? 'destructive' : 'secondary'"
                class="text-[10px] py-0.5 px-2"
              >
                <span v-if="item.status === 'idle'">Aguardando</span>
                <span v-else-if="item.status === 'optimizing'">Otimizando WebP...</span>
                <span v-else-if="item.status === 'authorizing'">Autorizando...</span>
                <span v-else-if="item.status === 'uploading'">Enviando ({{ item.progress }}%)...</span>
                <span v-else-if="item.status === 'validating'">Validando...</span>
                <span v-else-if="item.status === 'completed'">Concluído ✓</span>
                <span v-else-if="item.status === 'error'">Erro no Envio</span>
              </Badge>

              <button
                v-if="item.status === 'error'"
                @click="emit('retry', item.id)"
                class="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-semibold ml-1 cursor-pointer min-h-[44px]"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>

        <div v-if="item.status !== 'completed'" class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-slate-400 flex justify-between">
            <span>Texto Alternativo (SEO)*:</span>
            <span>{{ (item.altText || '').length }}/255</span>
          </label>
          <input
            v-model="item.altText"
            type="text"
            placeholder="Ex: Tela mosquiteira instalada em janela"
            maxlength="255"
            class="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        <div v-if="item.status !== 'idle' && item.status !== 'completed'" class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div
            class="h-full transition-all duration-200"
            :class="item.status === 'error' ? 'bg-red-500' : 'bg-indigo-500'"
            :style="{ width: `${item.progress}%` }"
          ></div>
        </div>

        <p v-if="item.error" class="text-[11px] text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-800/30">
          {{ item.error }}
        </p>
      </div>
    </div>
  </div>
</template>
