<script setup>
import { ref, computed } from 'vue'
import { useImageCompressor } from '~/composables/useImageCompressor'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  maxPhotos: {
    type: Number,
    default: 4
  }
})

const emit = defineEmits(['update:modelValue'])

const { compressImage } = useImageCompressor()
const isProcessing = ref(false)
const errorMessage = ref('')
const fileInputRef = ref(null)

const photos = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val)
})

const remainingSlots = computed(() => {
  return Math.max(0, props.maxPhotos - photos.value.length)
})

const triggerFileInput = () => {
  if (remainingSlots.value <= 0 || isProcessing.value) return
  errorMessage.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
    fileInputRef.value.click()
  }
}

const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files || [])
  if (files.length === 0) return

  if (files.length > remainingSlots.value) {
    errorMessage.value = `Você pode selecionar no máximo mais ${remainingSlots.value} ${remainingSlots.value === 1 ? 'foto' : 'fotos'} (limite de ${props.maxPhotos}).`
  }

  const filesToProcess = files.slice(0, remainingSlots.value)
  isProcessing.value = true
  errorMessage.value = ''

  try {
    const compressedList = []
    for (const file of filesToProcess) {
      try {
        const compressed = await compressImage(file)
        compressedList.push(compressed)
      } catch (err) {
        errorMessage.value = err.message || 'Erro ao processar imagem.'
      }
    }

    if (compressedList.length > 0) {
      photos.value = [...photos.value, ...compressedList]
    }
  } catch (err) {
    errorMessage.value = 'Falha ao processar as fotos selecionadas.'
  } finally {
    isProcessing.value = false
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

const removePhoto = (index) => {
  errorMessage.value = ''
  const updated = [...photos.value]
  updated.splice(index, 1)
  photos.value = updated
}
</script>

<template>
  <div class="photo-uploader-container">
    <div class="flex items-center justify-between mb-2">
      <label class="block text-sm font-semibold text-[#22345F]">
        Fotos do local <span class="text-xs font-normal text-gray-500">(opcional)</span>
      </label>
      <span class="text-xs font-medium text-[#0F4F7D] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
        {{ photos.length }} de {{ maxPhotos }} fotos
      </span>
    </div>

    <p class="text-xs text-gray-500 mb-3 leading-relaxed">
      Envie fotos das janelas, portas, sacadas ou do local onde deseja instalar.
    </p>

    <!-- Hidden native file input with camera support on mobile -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Upload Drop / Click Area -->
    <div
      v-if="remainingSlots > 0"
      @click="triggerFileInput"
      :class="[
        'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2',
        isProcessing
          ? 'bg-gray-50 border-gray-300 cursor-wait'
          : 'border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-[#1D7BA6]'
      ]"
    >
      <div v-if="isProcessing" class="flex items-center gap-2 text-sm text-[#0F4F7D]">
        <svg class="animate-spin w-5 h-5 text-[#1D7BA6]" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Otimizando imagens...</span>
      </div>

      <template v-else>
        <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#1D7BA6] border border-blue-100">
          <Icon name="lucide:camera" class="w-5 h-5" />
        </div>
        <div class="text-xs sm:text-sm font-semibold text-[#0F4F7D]">
          Toque para anexar fotos ou tirar foto
        </div>
        <div class="text-[11px] text-gray-400">
          Formatos: JPG, PNG, WebP (até {{ remainingSlots }} {{ remainingSlots === 1 ? 'foto restante' : 'fotos restantes' }})
        </div>
      </template>
    </div>

    <!-- Error message -->
    <div v-if="errorMessage" class="mt-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-start gap-1.5">
      <Icon name="lucide:alert-circle" class="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Thumbnails Preview Grid -->
    <div v-if="photos.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
      <div
        v-for="(photo, idx) in photos"
        :key="idx"
        class="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-square shadow-sm"
      >
        <img
          :src="photo.data"
          :alt="photo.name || `Foto ${idx + 1}`"
          class="w-full h-full object-cover"
        />
        
        <!-- Badge de número da foto -->
        <span class="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          #{{ idx + 1 }}
        </span>

        <!-- Botão Remover (X) -->
        <button
          type="button"
          @click.stop="removePhoto(idx)"
          aria-label="Remover foto"
          class="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-md"
        >
          <Icon name="lucide:x" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-uploader-container {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
</style>
