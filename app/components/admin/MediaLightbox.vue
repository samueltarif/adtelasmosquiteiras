<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

export interface MediaItem {
  id: string
  lead_id: string
  media_type: 'photo' | 'video'
  safe_filename: string
  file_size_bytes: number
  upload_status: string
  created_at: string
}

const props = defineProps<{
  isOpen: boolean
  mediaList: MediaItem[]
  initialMediaId: string | null
  leadId: string
  requestSignedUrl: (mediaId: string) => Promise<string | null>
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// Lista de fotos e vídeos filtrados
const photos = computed(() => (props.mediaList || []).filter(m => m.media_type === 'photo' && m.upload_status === 'uploaded'))
const allMedia = computed(() => (props.mediaList || []).filter(m => m.upload_status === 'uploaded'))

// Índice atual no visualizador
const currentIndex = ref(0)
const currentMedia = computed<MediaItem | null>(() => {
  return allMedia.value[currentIndex.value] || null
})

const isPhoto = computed(() => currentMedia.value?.media_type === 'photo')
const isVideo = computed(() => currentMedia.value?.media_type === 'video')

// Estado de carregamento da imagem e URL
const signedUrl = ref<string | null>(null)
const isImageLoading = ref(true)
const isUrlLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref<string | null>(null)

// Constantes de zoom
const MIN_ZOOM = 1
const MAX_ZOOM = 5

// Estado de transformação (Zoom & Pan)
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const isPinching = ref(false)

// Rastreamento de ponteiros (Pointer Events)
const activePointers = new Map<number, { x: number; y: number }>()
let initialPinchDistance = 0
let initialPinchScale = 1
let lastPointerPos = { x: 0, y: 0 }
let touchStartPos = { x: 0, y: 0, time: 0 }
let lastTapTime = 0

// Elementos DOM
const viewportRef = ref<HTMLElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)
let previousActiveElement: HTMLElement | null = null

// Rótulo de porcentagem de zoom
const zoomPercent = computed(() => `${Math.round(scale.value * 100)}%`)

// Contador de fotos
const counterText = computed(() => {
  if (allMedia.value.length <= 1) return ''
  return `${currentIndex.value + 1} / ${allMedia.value.length}`
})

// Permissões de navegação
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < allMedia.value.length - 1)

/**
 * Carrega a signed URL atualizada para o item atual
 */
async function loadMediaUrl(mediaId: string) {
  if (!mediaId) return
  isUrlLoading.value = true
  isImageLoading.value = true
  hasError.value = false
  errorMessage.value = null

  try {
    const url = await props.requestSignedUrl(mediaId)
    if (url) {
      signedUrl.value = url
    } else {
      hasError.value = true
      errorMessage.value = 'Não foi possível carregar esta imagem.'
    }
  } catch (err) {
    hasError.value = true
    errorMessage.value = 'Erro ao solicitar autorização de visualização.'
  } finally {
    isUrlLoading.value = false
  }
}

/**
 * Reseta o zoom e o deslocamento da imagem
 */
function resetZoom() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
  isDragging.value = false
  isPinching.value = false
}

/**
 * Aumenta o zoom
 */
function zoomIn() {
  if (!isPhoto.value) return
  const newScale = Math.min(MAX_ZOOM, scale.value + 0.5)
  scale.value = Number(newScale.toFixed(2))
}

/**
 * Reduz o zoom
 */
function zoomOut() {
  if (!isPhoto.value) return
  const newScale = Math.max(MIN_ZOOM, scale.value - 0.5)
  scale.value = Number(newScale.toFixed(2))
  if (scale.value === 1) {
    translateX.value = 0
    translateY.value = 0
  }
}

/**
 * Alterna entre zoom 1x e 2.5x (Double click / Double tap)
 */
function toggleZoom(originX?: number, originY?: number) {
  if (!isPhoto.value) return
  if (scale.value > 1.2) {
    resetZoom()
  } else {
    scale.value = 2.5
    if (originX !== undefined && originY !== undefined && viewportRef.value) {
      const rect = viewportRef.value.getBoundingClientRect()
      const offsetX = originX - (rect.left + rect.width / 2)
      const offsetY = originY - (rect.top + rect.height / 2)
      translateX.value = -offsetX * 1.2
      translateY.value = -offsetY * 1.2
      clampPan()
    } else {
      translateX.value = 0
      translateY.value = 0
    }
  }
}

/**
 * Limita o pan para não perder a imagem fora da viewport
 */
function clampPan() {
  if (!viewportRef.value || scale.value <= 1) {
    translateX.value = 0
    translateY.value = 0
    return
  }

  const rect = viewportRef.value.getBoundingClientRect()
  const maxPanX = Math.max(0, ((rect.width * scale.value) - rect.width) / 2)
  const maxPanY = Math.max(0, ((rect.height * scale.value) - rect.height) / 2)

  translateX.value = Math.max(-maxPanX, Math.min(maxPanX, translateX.value))
  translateY.value = Math.max(-maxPanY, Math.min(maxPanY, translateY.value))
}

/**
 * Navega para a foto anterior
 */
function prevMedia() {
  if (!hasPrev.value) return
  currentIndex.value--
  resetZoom()
  const nextItem = allMedia.value[currentIndex.value]
  if (nextItem) loadMediaUrl(nextItem.id)
}

/**
 * Navega para a próxima foto
 */
function nextMedia() {
  if (!hasNext.value) return
  currentIndex.value++
  resetZoom()
  const nextItem = allMedia.value[currentIndex.value]
  if (nextItem) loadMediaUrl(nextItem.id)
}

/**
 * Handler do Mouse Wheel no Desktop
 */
function handleWheel(e: WheelEvent) {
  if (!isPhoto.value) return
  e.preventDefault()

  const delta = e.deltaY < 0 ? 0.3 : -0.3
  const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale.value + delta))
  scale.value = Number(newScale.toFixed(2))

  if (scale.value === 1) {
    translateX.value = 0
    translateY.value = 0
  } else {
    clampPan()
  }
}

/**
 * Pointer Down (Mouse, Touch, Pen)
 */
function handlePointerDown(e: PointerEvent) {
  if (!isPhoto.value) return
  const target = e.currentTarget as HTMLElement
  if (target && target.setPointerCapture) {
    try {
      target.setPointerCapture(e.pointerId)
    } catch (_) {}
  }

  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  const now = Date.now()

  // 1 Pointer (Mouse ou 1 Dedo)
  if (activePointers.size === 1) {
    isDragging.value = true
    lastPointerPos = { x: e.clientX, y: e.clientY }
    touchStartPos = { x: e.clientX, y: e.clientY, time: now }

    // Detecção de Double Tap / Double Click (< 300ms)
    if (now - lastTapTime < 300) {
      toggleZoom(e.clientX, e.clientY)
      lastTapTime = 0
    } else {
      lastTapTime = now
    }
  } 
  // 2 Pointers (Pinch to Zoom com 2 dedos)
  else if (activePointers.size === 2) {
    isPinching.value = true
    isDragging.value = false
    const pts = Array.from(activePointers.values())
    initialPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
    initialPinchScale = scale.value
  }
}

/**
 * Pointer Move
 */
function handlePointerMove(e: PointerEvent) {
  if (!isPhoto.value) return
  if (!activePointers.has(e.pointerId)) return
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

  // Modo Pinch to Zoom com 2 dedos
  if (isPinching.value && activePointers.size === 2) {
    const pts = Array.from(activePointers.values())
    const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
    if (initialPinchDistance > 0) {
      const factor = currentDist / initialPinchDistance
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialPinchScale * factor))
      scale.value = Number(newScale.toFixed(2))
      clampPan()
    }
    return
  }

  // Modo Drag / Pan com 1 dedo ou mouse
  if (isDragging.value && activePointers.size === 1) {
    const dx = e.clientX - lastPointerPos.x
    const dy = e.clientY - lastPointerPos.y
    lastPointerPos = { x: e.clientX, y: e.clientY }

    if (scale.value > 1) {
      translateX.value += dx
      translateY.value += dy
      clampPan()
    }
  }
}

/**
 * Pointer Up / Cancel / End
 */
function handlePointerUp(e: PointerEvent) {
  if (!isPhoto.value) return
  const target = e.currentTarget as HTMLElement
  if (target && target.releasePointerCapture) {
    try {
      target.releasePointerCapture(e.pointerId)
    } catch (_) {}
  }

  activePointers.delete(e.pointerId)

  if (activePointers.size < 2) {
    isPinching.value = false
  }

  if (activePointers.size === 0) {
    isDragging.value = false

    // Detecção de Swipe Horizontal quando zoom = 1
    if (scale.value === 1) {
      const deltaX = e.clientX - touchStartPos.x
      const deltaY = e.clientY - touchStartPos.y
      const elapsed = Date.now() - touchStartPos.time

      // Swipe rápido (> 50px de deslocamento horizontal e < 400ms)
      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 60 && elapsed < 400) {
        if (deltaX < 0) {
          nextMedia()
        } else {
          prevMedia()
        }
      }
    } else {
      clampPan()
    }
  }
}

/**
 * Suporte a Teclado (Acessibilidade)
 */
function handleKeyDown(e: KeyboardEvent) {
  if (!props.isOpen) return

  switch (e.key) {
    case 'Escape':
      closeModal()
      break
    case 'ArrowLeft':
      if (scale.value <= 1) prevMedia()
      break
    case 'ArrowRight':
      if (scale.value <= 1) nextMedia()
      break
    case '+':
    case '=':
      zoomIn()
      break
    case '-':
    case '_':
      zoomOut()
      break
    case '0':
      resetZoom()
      break
  }
}

function handleImageLoaded() {
  isImageLoading.value = false
}

function handleImageError() {
  isImageLoading.value = false
  hasError.value = true
  errorMessage.value = 'Falha ao renderizar a imagem.'
}

function retryMedia() {
  if (currentMedia.value) {
    loadMediaUrl(currentMedia.value.id)
  }
}

function closeModal() {
  resetZoom()
  emit('close')
}

// Observa abertura do modal
watch(() => props.isOpen, (open) => {
  if (open) {
    previousActiveElement = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'

    // Localiza índice inicial
    if (props.initialMediaId && allMedia.value.length > 0) {
      const idx = allMedia.value.findIndex(m => m.id === props.initialMediaId)
      currentIndex.value = idx >= 0 ? idx : 0
    } else {
      currentIndex.value = 0
    }

    resetZoom()
    if (currentMedia.value) {
      loadMediaUrl(currentMedia.value.id)
    }

    nextTick(() => {
      viewportRef.value?.focus()
    })
  } else {
    document.body.style.overflow = ''
    resetZoom()
    if (previousActiveElement && previousActiveElement.focus) {
      previousActiveElement.focus()
    }
  }
})

// Observa mudança do initialMediaId
watch(() => props.initialMediaId, (newId) => {
  if (newId && props.isOpen && allMedia.value.length > 0) {
    const idx = allMedia.value.findIndex(m => m.id === newId)
    if (idx >= 0) {
      currentIndex.value = idx
      resetZoom()
      loadMediaUrl(newId)
    }
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div
    v-if="isOpen"
    role="dialog"
    aria-modal="true"
    aria-label="Visualizador de fotos em tela cheia"
    tabindex="-1"
    class="fixed inset-0 z-70 bg-black/95 backdrop-blur-md flex flex-col justify-between overflow-hidden select-none w-screen h-[100dvh]"
  >
    <!-- ====================================================================== -->
    <!-- BARRA SUPERIOR (TOOLBAR)                                               -->
    <!-- ====================================================================== -->
    <div 
      class="w-full flex items-center justify-between px-3 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-2.5 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent"
    >
      <!-- Esquerda: Título & Contador -->
      <div class="flex items-center gap-2.5 min-w-0 pr-2">
        <span 
          v-if="counterText" 
          class="px-2.5 py-1 rounded-full bg-white/10 text-white font-mono text-xs font-bold shrink-0 border border-white/10"
        >
          {{ counterText }}
        </span>
        <span 
          v-else-if="isVideo"
          class="px-2.5 py-1 rounded-full bg-purple-600/30 text-purple-300 font-mono text-xs font-bold shrink-0 border border-purple-500/30"
        >
          Vídeo
        </span>
        <p class="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-xs" :title="currentMedia?.safe_filename">
          {{ currentMedia?.safe_filename || 'Mídia do Cliente' }}
        </p>
      </div>

      <!-- Centro: Controles de Zoom no Desktop -->
      <div v-if="isPhoto" class="hidden sm:flex items-center gap-1.5 bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl px-2 py-1">
        <!-- Zoom Out -->
        <button
          type="button"
          :disabled="scale <= MIN_ZOOM"
          @click="zoomOut"
          class="p-1.5 rounded-xl text-slate-200 hover:text-white hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
          title="Diminuir Zoom (-)"
          aria-label="Diminuir Zoom"
        >
          <Icon name="lucide:minus" class="w-4 h-4" />
        </button>

        <!-- Indicador de Zoom % -->
        <button
          type="button"
          @click="resetZoom"
          class="px-2 py-1 text-xs font-mono font-bold text-slate-200 hover:text-white transition-colors cursor-pointer min-w-[54px] text-center"
          title="Clique para resetar (100%)"
        >
          {{ zoomPercent }}
        </button>

        <!-- Zoom In -->
        <button
          type="button"
          :disabled="scale >= MAX_ZOOM"
          @click="zoomIn"
          class="p-1.5 rounded-xl text-slate-200 hover:text-white hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
          title="Aumentar Zoom (+)"
          aria-label="Aumentar Zoom"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
        </button>

        <!-- Reset 1:1 -->
        <button
          v-if="scale > 1"
          type="button"
          @click="resetZoom"
          class="px-2 py-1 text-[11px] font-bold text-indigo-300 hover:text-white bg-indigo-600/30 hover:bg-indigo-600/50 rounded-lg transition-colors cursor-pointer ml-1"
          title="Resetar Zoom (0)"
        >
          1:1
        </button>
      </div>

      <!-- Direita: Download e Fechar -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Botão Baixar com Signed URL Autenticada -->
        <a
          v-if="signedUrl && !hasError"
          :href="signedUrl"
          :download="currentMedia?.safe_filename || 'arquivo'"
          target="_blank"
          referrerpolicy="no-referrer"
          class="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
          title="Baixar arquivo original"
        >
          <Icon name="lucide:download" class="w-4 h-4" />
          <span class="hidden sm:inline">Baixar</span>
        </a>

        <!-- Botão Fechar -->
        <button
          type="button"
          @click="closeModal"
          class="p-2.5 rounded-xl bg-white/10 hover:bg-red-600/80 text-slate-200 hover:text-white transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center border border-white/15"
          title="Fechar visualizador (Esc)"
          aria-label="Fechar visualizador"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- ====================================================================== -->
    <!-- ÁREA DE VISUALIZAÇÃO COM ZOOM / PAN / GESTOS (TOUCH-ACTION: NONE)     -->
    <!-- ====================================================================== -->
    <div
      ref="viewportRef"
      class="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing focus:outline-none"
      :style="{ touchAction: isPhoto ? 'none' : 'auto' }"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @wheel="handleWheel"
    >
      <!-- Loading Spinner / Skeleton -->
      <div v-if="isUrlLoading || isImageLoading" class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 z-10 pointer-events-none">
        <Icon name="lucide:loader-2" class="w-10 h-10 text-indigo-400 animate-spin" />
        <span class="text-xs font-medium">Carregando imagem em alta resolução...</span>
      </div>

      <!-- Erro de Carregamento -->
      <div v-if="hasError" class="flex flex-col items-center justify-center gap-3 p-6 text-center z-10 max-w-sm">
        <div class="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <Icon name="lucide:alert-triangle" class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-white">{{ errorMessage || 'Não foi possível carregar esta mídia.' }}</p>
        <button
          type="button"
          @click="retryMedia"
          class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 min-h-[44px]"
        >
          <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5" /> Tentar novamente
        </button>
      </div>

      <!-- Imagem com Transformações de Zoom & Pan -->
      <div
        v-if="isPhoto && signedUrl && !hasError"
        class="w-full h-full flex items-center justify-center select-none"
      >
        <img
          ref="imageRef"
          :src="signedUrl"
          :alt="currentMedia?.safe_filename || 'Foto em tela cheia'"
          referrerpolicy="no-referrer"
          decoding="async"
          @load="handleImageLoaded"
          @error="handleImageError"
          class="max-w-full max-h-full object-contain pointer-events-none will-change-transform rounded-lg"
          :style="{
            transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
            transition: isDragging || isPinching ? 'none' : 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
            transformOrigin: 'center center'
          }"
        />
      </div>

      <!-- Player de Vídeo Responsivo (Sem Gestos de Zoom) -->
      <div
        v-else-if="isVideo && signedUrl && !hasError"
        class="w-full max-w-4xl max-h-[85vh] max-h-[85dvh] p-3 flex items-center justify-center"
      >
        <video
          controls
          preload="metadata"
          :src="signedUrl"
          class="max-w-full max-h-full rounded-2xl border border-white/10 shadow-2xl bg-black"
          @loadeddata="isImageLoading = false"
          @error="handleImageError"
        ></video>
      </div>

      <!-- ==================================================================== -->
      <!-- BOTÕES DE NAVEGAÇÃO ANTERIOR / PRÓXIMA (FOTOS)                        -->
      <!-- ==================================================================== -->
      <button
        v-if="hasPrev"
        type="button"
        @click.stop="prevMedia"
        class="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-indigo-600/90 text-white border border-white/20 flex items-center justify-center transition-all duration-200 shadow-xl cursor-pointer active:scale-95 z-20"
        title="Foto Anterior (Seta Esquerda)"
        aria-label="Foto Anterior"
      >
        <Icon name="lucide:chevron-left" class="w-6 h-6 sm:w-7 sm:h-7" />
      </button>

      <button
        v-if="hasNext"
        type="button"
        @click.stop="nextMedia"
        class="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-indigo-600/90 text-white border border-white/20 flex items-center justify-center transition-all duration-200 shadow-xl cursor-pointer active:scale-95 z-20"
        title="Próxima Foto (Seta Direita)"
        aria-label="Próxima Foto"
      >
        <Icon name="lucide:chevron-right" class="w-6 h-6 sm:w-7 sm:h-7" />
      </button>
    </div>

    <!-- ====================================================================== -->
    <!-- BARRA INFERIOR MOBILE COM DICAS & CONTROLES COMPACTOS                  -->
    <!-- ====================================================================== -->
    <div class="w-full flex items-center justify-between px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
      <!-- Dica de Gestos no Mobile / Desktop -->
      <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
        <Icon name="lucide:zoom-in" class="w-3.5 h-3.5 text-indigo-400" />
        <span class="hidden sm:inline">Use a roda do mouse ou duplo clique para zoom</span>
        <span class="sm:hidden">Toque 2x ou faça pinça para zoom</span>
      </div>

      <!-- Controles Rápidos Mobile (Reset & Zoom) -->
      <div v-if="isPhoto" class="sm:hidden flex items-center gap-2">
        <button
          v-if="scale > 1"
          type="button"
          @click="resetZoom"
          class="px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 rounded-lg shadow-md min-h-[32px] cursor-pointer"
        >
          Reset 1:1
        </button>
        <span class="text-xs font-mono font-bold text-slate-300 bg-white/10 px-2 py-1 rounded-lg">
          {{ zoomPercent }}
        </span>
      </div>
    </div>
  </div>
</template>
