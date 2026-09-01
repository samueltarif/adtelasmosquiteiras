<script setup>
import { ref, onUnmounted } from 'vue'
import { useLeadMediaUploadQueue } from '~/composables/useLeadMediaUploadQueue'

const props = defineProps({
  maxPhotos: {
    type: Number,
    default: 4
  },
  maxVideos: {
    type: Number,
    default: 2
  },
  maxTotalFiles: {
    type: Number,
    default: 6
  },
  uploadConcurrency: {
    type: Number,
    default: 2
  }
})

const emit = defineEmits(['update:count'])

const {
  mediaItems,
  isProcessing,
  isUploading,
  uploadProgressText,
  uploadErrorMessage,
  photoCount,
  videoCount,
  totalCount,
  hasFiles,
  handlePhotoSelect: onPhotoSelect,
  handleVideoSelect: onVideoSelect,
  removeItem: onRemoveItem,
  formatSize,
  uploadAllMedia,
  retryItem,
  cleanup
} = useLeadMediaUploadQueue(props)

const photoInputRef = ref(null)
const videoInputRef = ref(null)

const triggerPhotoPicker = () => {
  if (photoInputRef.value) {
    photoInputRef.value.value = ''
    photoInputRef.value.click()
  }
}

const triggerVideoPicker = () => {
  if (videoInputRef.value) {
    videoInputRef.value.value = ''
    videoInputRef.value.click()
  }
}

const handlePhotoSelect = (e) => onPhotoSelect(e, (c) => emit('update:count', c))
const handleVideoSelect = (e) => onVideoSelect(e, (c) => emit('update:count', c))
const removeItem = (id) => onRemoveItem(id, (c) => emit('update:count', c))

onUnmounted(() => {
  cleanup()
})

// Expõe métodos e estado para o componente pai
defineExpose({
  uploadAllMedia,
  retryItem,
  mediaItems,
  hasFiles,
  totalCount,
  photoCount,
  videoCount
})
</script>

<template>
  <div class="space-y-3 w-full max-w-full box-border">
    <!-- Header e Contadores -->
    <div class="flex items-center justify-between">
      <label class="block text-sm font-medium text-gray-700">
        Fotos ou vídeos do local <span class="text-gray-400 text-xs font-normal">(opcional)</span>
      </label>
      <span class="text-xs font-medium text-gray-500">
        {{ photoCount }}/{{ maxPhotos }} fotos · {{ videoCount }}/{{ maxVideos }} vídeos
      </span>
    </div>

    <p class="text-xs text-gray-500 leading-relaxed">
      Envie fotos ou vídeos das janelas, portas, sacadas ou do local onde deseja instalar para um orçamento mais preciso.
    </p>

    <!-- Inputs Invisíveis -->
    <input
      ref="photoInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/*"
      multiple
      class="hidden"
      @change="handlePhotoSelect"
    />
    <input
      ref="videoInputRef"
      type="file"
      accept="video/mp4,video/webm,video/quicktime,video/*"
      multiple
      class="hidden"
      @change="handleVideoSelect"
    />

    <!-- Botões de Ação de Seleção -->
    <div v-if="totalCount < maxTotalFiles" class="grid grid-cols-2 gap-2">
      <!-- Botão Foto -->
      <button
        type="button"
        :disabled="photoCount >= maxPhotos || isProcessing || isUploading"
        @click="triggerPhotoPicker"
        class="flex items-center justify-center gap-1.5 px-2 py-2.5 sm:p-3 border-2 border-dashed border-gray-300 hover:border-[#1D7BA6] rounded-xl text-gray-700 hover:text-[#1D7BA6] hover:bg-sky-50/50 transition-all text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
      >
        <Icon name="lucide:camera" class="w-4 h-4 text-[#1D7BA6] shrink-0" />
        <span class="truncate">Adicionar Fotos</span>
      </button>

      <!-- Botão Vídeo -->
      <button
        type="button"
        :disabled="videoCount >= maxVideos || isProcessing || isUploading"
        @click="triggerVideoPicker"
        class="flex items-center justify-center gap-1.5 px-2 py-2.5 sm:p-3 border-2 border-dashed border-gray-300 hover:border-purple-500 rounded-xl text-gray-700 hover:text-purple-600 hover:bg-purple-50/50 transition-all text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
      >
        <Icon name="lucide:video" class="w-4 h-4 text-purple-500 shrink-0" />
        <span class="truncate">Adicionar Vídeo</span>
      </button>
    </div>

    <!-- Indicador de Processamento / Compressão -->
    <div v-if="isProcessing" class="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
      <svg class="animate-spin w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Otimizando imagens para envio rápido...</span>
    </div>

    <!-- Indicador de Upload em Andamento -->
    <div v-if="isUploading" class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
      <div class="flex items-center gap-2 text-xs font-bold text-emerald-800">
        <svg class="animate-spin w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ uploadProgressText }}</span>
      </div>
      <div class="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
        <div class="bg-emerald-600 h-full animate-pulse w-full"></div>
      </div>
    </div>

    <!-- Mensagem de Aviso / Erro Parcial -->
    <div v-if="uploadErrorMessage" class="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
      {{ uploadErrorMessage }}
    </div>

    <!-- Grid de Miniaturas e Previews com Estados Individuais -->
    <div v-if="mediaItems.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 pt-1">
      <div
        v-for="(item, index) in mediaItems"
        :key="item.id"
        class="relative group rounded-xl border overflow-hidden bg-white shadow-xs transition-all"
        :class="[
          item.status === 'failed' ? 'border-red-300 bg-red-50/20' : 
          item.status === 'uploaded' ? 'border-emerald-300' : 
          item.status === 'uploading' || item.status === 'preparing' || item.status === 'finalizing' ? 'border-blue-300 ring-1 ring-blue-200' :
          'border-gray-200'
        ]"
      >
        <!-- Preview de Foto -->
        <div v-if="item.type === 'photo'" class="aspect-square bg-gray-100 relative overflow-hidden">
          <img :src="item.previewUrl" :alt="item.name" class="w-full h-full object-cover" />
          <div class="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            #{{ index + 1 }} Foto
          </div>
        </div>

        <!-- Preview de Vídeo -->
        <div v-else class="aspect-square bg-slate-900 relative flex flex-col items-center justify-center p-2 text-center text-white">
          <Icon name="lucide:play-circle" class="w-8 h-8 text-purple-400 mb-1" />
          <p class="text-[10px] font-bold truncate max-w-full px-1">{{ item.name }}</p>
          <div class="absolute top-1.5 left-1.5 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            #{{ index + 1 }} Vídeo
          </div>
        </div>

        <!-- Barra Inferior com Tamanho e Status Detalhado -->
        <div class="p-1.5 flex items-center justify-between text-[11px] bg-white border-t border-gray-100">
          <span class="text-gray-500 font-mono">{{ formatSize(item.size) }}</span>
          
          <span v-if="item.status === 'uploaded'" class="text-emerald-600 font-bold flex items-center gap-0.5 text-[10px]">
            <Icon name="lucide:check-circle" class="w-3 h-3" /> Concluído
          </span>
          <span v-else-if="item.status === 'uploading'" class="text-blue-600 font-bold flex items-center gap-0.5 text-[10px] animate-pulse">
            <Icon name="lucide:upload" class="w-3 h-3 animate-bounce" /> Enviando
          </span>
          <span v-else-if="item.status === 'finalizing'" class="text-indigo-600 font-bold flex items-center gap-0.5 text-[10px]">
            <Icon name="lucide:loader-2" class="w-3 h-3 animate-spin" /> Finalizando
          </span>
          <span v-else-if="item.status === 'preparing'" class="text-sky-600 font-bold flex items-center gap-0.5 text-[10px]">
            <Icon name="lucide:key" class="w-3 h-3" /> Preparando
          </span>
          <span v-else-if="item.status === 'waiting'" class="text-slate-400 font-medium text-[10px]">
            Aguardando
          </span>
          <span v-else-if="item.status === 'failed'" class="text-red-500 font-bold text-[10px]">
            Falhou
          </span>
          <span v-else class="text-gray-400 text-[10px]">
            Pronto
          </span>
        </div>

        <!-- Botão Remover -->
        <button
          v-if="!isUploading && item.status !== 'uploaded'"
          type="button"
          @click.stop="removeItem(item.id)"
          class="absolute top-0 right-0 p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer group/rm z-10"
          title="Remover arquivo"
          aria-label="Remover arquivo"
        >
          <span class="w-6 h-6 rounded-full bg-black/70 text-white group-hover/rm:bg-red-600 flex items-center justify-center transition-colors shadow-md">
            <Icon name="lucide:x" class="w-3.5 h-3.5" />
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
