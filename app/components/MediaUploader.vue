<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useImageCompressor } from '~/composables/useImageCompressor'

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

const { compressImage } = useImageCompressor()

// Lista de arquivos selecionados no client
const mediaItems = ref([])
const isProcessing = ref(false)
const isUploading = ref(false)
const uploadProgressText = ref('')
const uploadErrorMessage = ref('')

// AbortController para cancelamento seguro
let uploadAbortController = null

const photoCount = computed(() => mediaItems.value.filter(m => m.type === 'photo').length)
const videoCount = computed(() => mediaItems.value.filter(m => m.type === 'video').length)
const totalCount = computed(() => mediaItems.value.length)
const hasFiles = computed(() => mediaItems.value.length > 0)

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

// Processa fotos selecionadas (comprimindo client-side com medição de timing)
const handlePhotoSelect = async (event) => {
  const files = Array.from(event.target.files || [])
  if (!files.length) return

  const remainingPhotos = props.maxPhotos - photoCount.value
  if (remainingPhotos <= 0) {
    alert(`Você já atingiu o limite de ${props.maxPhotos} fotos.`)
    return
  }

  const allowedFiles = files.slice(0, remainingPhotos)
  isProcessing.value = true
  uploadErrorMessage.value = ''

  for (const file of allowedFiles) {
    if (!file.type.startsWith('image/')) {
      alert(`O arquivo "${file.name}" não é uma imagem válida.`)
      continue
    }

    const t0 = performance.now()
    try {
      const compressed = await compressImage(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.8
      })
      const t1 = performance.now()

      if (import.meta.dev) {
        console.log(`[MediaTiming] Foto "${file.name}": compressão em ${(t1 - t0).toFixed(1)}ms (${Math.round(file.size / 1024)}KB ➔ ${Math.round(compressed.size / 1024)}KB)`)
      }

      const clientMediaId = crypto.randomUUID()
      mediaItems.value.push({
        id: clientMediaId,
        type: 'photo',
        name: compressed.name || (file.name.replace(/\.[^/.]+$/, '') + '.jpg'),
        mime: 'image/jpeg',
        size: compressed.size || file.size,
        blob: compressed.blob || file,
        previewUrl: compressed.dataUrl,
        status: 'selected', // 'selected' | 'waiting' | 'preparing' | 'uploading' | 'finalizing' | 'uploaded' | 'failed'
        progress: 0,
        retryCount: 0,
        errorMessage: ''
      })
    } catch (err) {
      console.error('Erro ao comprimir imagem:', err)
      alert(`Não foi possível processar a foto "${file.name}": ${err.message}`)
    }
  }

  isProcessing.value = false
  emit('update:count', totalCount.value)
}

// Processa vídeos selecionados (MP4, WebM, MOV)
const handleVideoSelect = async (event) => {
  const files = Array.from(event.target.files || [])
  if (!files.length) return

  const remainingVideos = props.maxVideos - videoCount.value
  if (remainingVideos <= 0) {
    alert(`Você já atingiu o limite de ${props.maxVideos} vídeos.`)
    return
  }

  const allowedFiles = files.slice(0, remainingVideos)
  const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime']

  for (const file of allowedFiles) {
    const mime = (file.type || '').toLowerCase()
    const isAllowed = allowedMimes.includes(mime) || file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.mov')

    if (!isAllowed) {
      alert(`O arquivo "${file.name}" não é um vídeo suportado (MP4, WebM ou MOV).`)
      continue
    }

    // Limite de 25 MB por vídeo
    if (file.size > 25 * 1024 * 1024) {
      alert(`O vídeo "${file.name}" tem ${Math.round(file.size / (1024 * 1024))} MB. O tamanho máximo permitido é 25 MB.`)
      continue
    }

    const clientMediaId = crypto.randomUUID()
    const previewUrl = URL.createObjectURL(file)

    let effectiveMime = mime
    if (!effectiveMime) {
      if (file.name.endsWith('.mp4')) effectiveMime = 'video/mp4'
      else if (file.name.endsWith('.webm')) effectiveMime = 'video/webm'
      else if (file.name.endsWith('.mov')) effectiveMime = 'video/quicktime'
      else effectiveMime = 'video/mp4'
    }

    mediaItems.value.push({
      id: clientMediaId,
      type: 'video',
      name: file.name,
      mime: effectiveMime,
      size: file.size,
      blob: file,
      previewUrl,
      status: 'selected',
      progress: 0,
      retryCount: 0,
      errorMessage: ''
    })
  }

  emit('update:count', totalCount.value)
}

// Remove um arquivo selecionado
const removeItem = (id) => {
  const idx = mediaItems.value.findIndex(m => m.id === id)
  if (idx !== -1) {
    const item = mediaItems.value[idx]
    if (item.previewUrl) {
      try { URL.revokeObjectURL(item.previewUrl) } catch {}
    }
    mediaItems.value.splice(idx, 1)
    emit('update:count', totalCount.value)
  }
}

// Formata tamanho em KB/MB
const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Executa o pipeline completo de upload de UM arquivo com métricas de timing e retry automático.
 */
const uploadSingleItem = async (item, uploadToken, signal) => {
  const MAX_AUTO_RETRIES = 1
  let attempt = 0

  while (attempt <= MAX_AUTO_RETRIES) {
    attempt++
    const tStart = performance.now()
    try {
      // 1. Autorização (T2 -> T3)
      item.status = 'preparing'
      const t2 = performance.now()

      const authRes = await $fetch('/api/media/authorize-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${uploadToken}`
        },
        body: {
          client_media_id: item.id,
          media_type: item.type,
          mime_type: item.mime,
          file_size_bytes: item.size,
          original_filename: item.name
        },
        signal
      })

      const t3 = performance.now()

      if (authRes?.alreadyUploaded) {
        item.status = 'uploaded'
        return { success: true, alreadyUploaded: true }
      }

      if (!authRes?.presignedUrl) {
        throw new Error('Servidor não retornou URL de upload')
      }

      // 2. Upload DIRETO do Browser ao Cloudflare R2 (T4 -> T5)
      item.status = 'uploading'
      const t4 = performance.now()

      const uploadResponse = await fetch(authRes.presignedUrl, {
        method: 'PUT',
        body: item.blob,
        headers: {
          'Content-Type': item.mime
        },
        signal
      })

      const t5 = performance.now()

      if (!uploadResponse.ok) {
        throw new Error(`Falha no storage R2 (HTTP ${uploadResponse.status})`)
      }

      // 3. Finalização e Verificação Server-Side (T6 -> T7)
      item.status = 'finalizing'
      const t6 = performance.now()

      const finalizeRes = await $fetch('/api/media/finalize-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${uploadToken}`
        },
        body: {
          client_media_id: item.id
        },
        signal
      })

      const t7 = performance.now()

      if (finalizeRes?.success) {
        item.status = 'uploaded'
        item.errorMessage = ''

        if (import.meta.dev) {
          const authMs = (t3 - t2).toFixed(1)
          const putMs = (t5 - t4).toFixed(1)
          const finMs = (t7 - t6).toFixed(1)
          const totalMs = (t7 - tStart).toFixed(1)
          console.log(`[MediaTiming] "${item.name}" CONCLUÍDO em ${totalMs}ms (Auth: ${authMs}ms | R2 PUT: ${putMs}ms | Fin: ${finMs}ms)`)
        }

        return { success: true }
      } else {
        throw new Error('Falha na verificação de integridade')
      }

    } catch (err) {
      if (signal?.aborted) {
        item.status = 'failed'
        item.errorMessage = 'Upload cancelado'
        return { success: false, aborted: true }
      }

      if (attempt <= MAX_AUTO_RETRIES) {
        if (import.meta.dev) {
          console.warn(`[MediaUploader] Tentativa ${attempt} falhou para "${item.name}". Tentando novamente...`, err?.message)
        }
        await new Promise(r => setTimeout(r, 800))
        continue
      }

      console.error(`[MediaUploader] Erro definitivo ao enviar "${item.name}":`, err)
      item.status = 'failed'
      item.errorMessage = err?.message || 'Falha no envio'
      return { success: false, error: err }
    }
  }

  return { success: false }
}

/**
 * Worker Pool com Concorrência Limitada (MEDIA_UPLOAD_CONCURRENCY = 2)
 */
const runConcurrentUploads = async (itemsToUpload, uploadToken, concurrency = 2) => {
  let currentIndex = 0
  const results = []
  const executing = []

  const enqueue = () => {
    if (currentIndex >= itemsToUpload.length) return Promise.resolve()
    const item = itemsToUpload[currentIndex++]
    
    item.status = 'waiting'
    const p = uploadSingleItem(item, uploadToken, uploadAbortController?.signal)
      .then(res => {
        results.push(res)
      })
      .finally(() => {
        executing.splice(executing.indexOf(p), 1)
        updateOverallProgress()
      })

    executing.push(p)

    let r = Promise.resolve()
    if (executing.length >= concurrency) {
      r = Promise.race(executing)
    }
    return r.then(() => enqueue())
  }

  await enqueue().then(() => Promise.all(executing))
  return results
}

const updateOverallProgress = () => {
  const uploaded = mediaItems.value.filter(m => m.status === 'uploaded').length
  const total = mediaItems.value.length
  uploadProgressText.value = `Enviando arquivos (${uploaded}/${total} concluídos)...`
}

/**
 * Orquestrador de Uploads com Concorrência Limitada
 */
const uploadAllMedia = async (uploadToken) => {
  if (!mediaItems.value.length || !uploadToken) {
    return { total: 0, uploaded: 0, failed: 0 }
  }

  isUploading.value = true
  uploadErrorMessage.value = ''
  uploadAbortController = new AbortController()

  const tTotalStart = performance.now()

  // Filtra itens que ainda não foram enviados com sucesso
  const pendingItems = mediaItems.value.filter(m => m.status !== 'uploaded')
  
  if (pendingItems.length === 0) {
    isUploading.value = false
    return { total: mediaItems.value.length, uploaded: mediaItems.value.length, failed: 0 }
  }

  uploadProgressText.value = `Iniciando envio de ${pendingItems.length} arquivo(s)...`

  await runConcurrentUploads(pendingItems, uploadToken, props.uploadConcurrency)

  const tTotalEnd = performance.now()
  const uploadedCount = mediaItems.value.filter(m => m.status === 'uploaded').length
  const failedCount = mediaItems.value.filter(m => m.status === 'failed').length

  if (import.meta.dev) {
    console.log(`[MediaTiming] TOTAL (${mediaItems.value.length} arquivos): ${(tTotalEnd - tTotalStart).toFixed(1)}ms | Sucesso: ${uploadedCount} | Falha: ${failedCount}`)
  }

  isUploading.value = false
  uploadProgressText.value = ''

  if (failedCount > 0) {
    uploadErrorMessage.value = `${failedCount} arquivo(s) não puderam ser enviados, mas seu pedido de orçamento foi registrado com sucesso!`
  }

  return {
    total: mediaItems.value.length,
    uploaded: uploadedCount,
    failed: failedCount
  }
}

/**
 * Retry Manual de um Item Específico
 */
const retryItem = async (item, uploadToken) => {
  if (isUploading.value || !uploadToken) return
  isUploading.value = true
  await uploadSingleItem(item, uploadToken, uploadAbortController?.signal)
  isUploading.value = false
}

onUnmounted(() => {
  if (uploadAbortController) {
    uploadAbortController.abort()
  }
  mediaItems.value.forEach(item => {
    if (item.previewUrl) {
      try { URL.revokeObjectURL(item.previewUrl) } catch {}
    }
  })
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
        class="flex items-center justify-center gap-1.5 p-3 border-2 border-dashed border-gray-300 hover:border-[#1D7BA6] rounded-xl text-gray-700 hover:text-[#1D7BA6] hover:bg-sky-50/50 transition-all text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <Icon name="lucide:camera" class="w-4 h-4 text-[#1D7BA6]" />
        <span>Adicionar Fotos</span>
      </button>

      <!-- Botão Vídeo -->
      <button
        type="button"
        :disabled="videoCount >= maxVideos || isProcessing || isUploading"
        @click="triggerVideoPicker"
        class="flex items-center justify-center gap-1.5 p-3 border-2 border-dashed border-gray-300 hover:border-purple-500 rounded-xl text-gray-700 hover:text-purple-600 hover:bg-purple-50/50 transition-all text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <Icon name="lucide:video" class="w-4 h-4 text-purple-500" />
        <span>Adicionar Vídeo</span>
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
    <div v-if="mediaItems.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
      <div
        v-for="(item, index) in mediaItems"
        :key="item.id"
        class="relative group rounded-xl border overflow-hidden bg-white shadow-sm transition-all"
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
          class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white hover:bg-red-600 flex items-center justify-center transition-colors cursor-pointer shadow-md"
          title="Remover arquivo"
        >
          <Icon name="lucide:x" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
