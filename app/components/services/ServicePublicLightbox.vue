<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

export interface PublicMediaItem {
  id: string
  service_key: string
  storage_key: string
  media_type: 'photo' | 'video'
  mime_type: string
  title: string | null
  alt_text: string
  caption: string | null
  sort_order: number
  is_featured: boolean
  width: number | null
  height: number | null
  file_size_bytes: number
  created_at: string
  publicUrl: string
}

const props = defineProps<{
  isOpen: boolean
  mediaList: PublicMediaItem[]
  initialIndex: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// Índice atual no visualizador
const currentIndex = ref(props.initialIndex || 0)

watch(
  () => props.initialIndex,
  (newIdx) => {
    currentIndex.value = Math.max(0, Math.min(newIdx || 0, (props.mediaList || []).length - 1))
    resetTransform()
  }
)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      currentIndex.value = Math.max(0, Math.min(props.initialIndex || 0, (props.mediaList || []).length - 1))
      resetTransform()
      savePreviousFocus()
      nextTick(() => {
        setupFocusTrap()
      })
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden'
      }
    } else {
      pauseCurrentVideo()
      restorePreviousFocus()
      if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
      }
    }
  }
)

const currentMedia = computed<PublicMediaItem | null>(() => {
  return props.mediaList[currentIndex.value] || null
})

const isPhoto = computed(() => currentMedia.value?.media_type === 'photo')
const isVideo = computed(() => currentMedia.value?.media_type === 'video')

// Estado de transformação (Zoom & Pan)
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const isPinching = ref(false)
const MIN_ZOOM = 1
const MAX_ZOOM = 5

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
const videoRef = ref<HTMLVideoElement | null>(null)
const lightboxRef = ref<HTMLElement | null>(null)
let previousActiveElement: HTMLElement | null = null

// Rótulo de porcentagem de zoom
const zoomPercent = computed(() => `${Math.round(scale.value * 100)}%`)

// Contador de fotos
const counterText = computed(() => {
  if (!props.mediaList || props.mediaList.length <= 1) return ''
  return `${currentIndex.value + 1} / ${props.mediaList.length}`
})

// Permissões de navegação
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < (props.mediaList || []).length - 1)

function resetTransform() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
  isDragging.value = false
  isPinching.value = false
}

function pauseCurrentVideo() {
  if (videoRef.value) {
    try {
      videoRef.value.pause()
    } catch {}
  }
}

function handleClose() {
  pauseCurrentVideo()
  resetTransform()
  emit('close')
}

function prevMedia() {
  if (hasPrev.value) {
    pauseCurrentVideo()
    currentIndex.value--
    resetTransform()
  }
}

function nextMedia() {
  if (hasNext.value) {
    pauseCurrentVideo()
    currentIndex.value++
    resetTransform()
  }
}

function zoomIn() {
  if (scale.value < MAX_ZOOM) {
    scale.value = Math.min(MAX_ZOOM, +(scale.value + 0.5).toFixed(2))
    clampTranslate()
  }
}

function zoomOut() {
  if (scale.value > MIN_ZOOM) {
    scale.value = Math.max(MIN_ZOOM, +(scale.value - 0.5).toFixed(2))
    if (scale.value === 1) {
      translateX.value = 0
      translateY.value = 0
    } else {
      clampTranslate()
    }
  }
}

function resetZoom() {
  resetTransform()
}

function clampTranslate() {
  if (!viewportRef.value || !imageRef.value) return
  const vw = viewportRef.value.clientWidth
  const vh = viewportRef.value.clientHeight
  const iw = (imageRef.value.clientWidth || vw) * scale.value
  const ih = (imageRef.value.clientHeight || vh) * scale.value

  const maxTx = Math.max(0, (iw - vw) / 2)
  const maxTy = Math.max(0, (ih - vh) / 2)

  translateX.value = Math.max(-maxTx, Math.min(maxTx, translateX.value))
  translateY.value = Math.max(-maxTy, Math.min(maxTy, translateY.value))
}

// ----------------------------------------------------
// Gestos de Mouse e Toque (Pointer Events)
// ----------------------------------------------------
function handlePointerDown(e: PointerEvent) {
  if (isVideo.value) return
  const target = e.target as HTMLElement
  if (target.closest('button') || target.closest('video')) return

  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

  if (activePointers.size === 1) {
    lastPointerPos = { x: e.clientX, y: e.clientY }
    touchStartPos = { x: e.clientX, y: e.clientY, time: Date.now() }

    // Double tap para zoom
    const now = Date.now()
    if (now - lastTapTime < 300) {
      if (scale.value > 1) {
        resetTransform()
      } else {
        scale.value = 2.5
        clampTranslate()
      }
      lastTapTime = 0
      return
    }
    lastTapTime = now

    if (scale.value > 1) {
      isDragging.value = true
    }
  } else if (activePointers.size === 2) {
    isDragging.value = false
    isPinching.value = true
    const points = Array.from(activePointers.values())
    initialPinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
    initialPinchScale = scale.value
  }
}

function handlePointerMove(e: PointerEvent) {
  if (!activePointers.has(e.pointerId)) return
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

  if (isPinching.value && activePointers.size === 2) {
    const points = Array.from(activePointers.values())
    const currentDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
    if (initialPinchDistance > 0) {
      const pinchDelta = currentDistance / initialPinchDistance
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(initialPinchScale * pinchDelta).toFixed(2)))
      scale.value = newScale
      clampTranslate()
    }
  } else if (isDragging.value && scale.value > 1) {
    const dx = e.clientX - lastPointerPos.x
    const dy = e.clientY - lastPointerPos.y
    translateX.value += dx
    translateY.value += dy
    lastPointerPos = { x: e.clientX, y: e.clientY }
    clampTranslate()
  }
}

function handlePointerUp(e: PointerEvent) {
  activePointers.delete(e.pointerId)

  if (activePointers.size === 0) {
    if (isPinching.value) {
      isPinching.value = false
      if (scale.value <= 1.05) {
        resetTransform()
      } else {
        clampTranslate()
      }
    }

    // Swipe horizontal em 1x zoom
    if (!isDragging.value && scale.value === 1 && touchStartPos.time > 0) {
      const dx = e.clientX - touchStartPos.x
      const dy = e.clientY - touchStartPos.y
      const dt = Date.now() - touchStartPos.time

      if (dt < 400 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0 && hasNext.value) {
          nextMedia()
        } else if (dx > 0 && hasPrev.value) {
          prevMedia()
        }
      }
    }

    isDragging.value = false
    touchStartPos = { x: 0, y: 0, time: 0 }
  } else if (activePointers.size === 1) {
    isPinching.value = false
    const remaining = Array.from(activePointers.values())[0]
    lastPointerPos = { x: remaining.x, y: remaining.y }
    if (scale.value > 1) {
      isDragging.value = true
    }
  }
}

function handleWheel(e: WheelEvent) {
  if (isVideo.value) return
  e.preventDefault()
  if (e.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

// ----------------------------------------------------
// Acessibilidade por Teclado e Focus Trap
// ----------------------------------------------------
function handleKeydown(e: KeyboardEvent) {
  if (!props.isOpen) return

  switch (e.key) {
    case 'Escape':
      e.preventDefault()
      handleClose()
      break
    case 'ArrowLeft':
      e.preventDefault()
      prevMedia()
      break
    case 'ArrowRight':
      e.preventDefault()
      nextMedia()
      break
    case '+':
    case '=':
      e.preventDefault()
      zoomIn()
      break
    case '-':
    case '_':
      e.preventDefault()
      zoomOut()
      break
    case '0':
      e.preventDefault()
      resetZoom()
      break
    case 'Tab':
      handleTabTrap(e)
      break
  }
}

function handleTabTrap(e: KeyboardEvent) {
  if (!lightboxRef.value) return
  const focusable = lightboxRef.value.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [tabindex]:not([tabindex="-1"]), video[controls]'
  )
  if (focusable.length === 0) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

function savePreviousFocus() {
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    previousActiveElement = document.activeElement
  }
}

function setupFocusTrap() {
  if (!lightboxRef.value) return
  const closeBtn = lightboxRef.value.querySelector<HTMLElement>('#public-lightbox-close')
  if (closeBtn) {
    closeBtn.focus()
  }
}

function restorePreviousFocus() {
  if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
    previousActiveElement.focus()
  }
  previousActiveElement = null
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen && currentMedia"
      ref="lightboxRef"
      role="dialog"
      aria-modal="true"
      :aria-label="`Visualizador de imagem ${currentIndex + 1} de ${mediaList.length}`"
      class="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md text-white select-none overflow-hidden touch-none"
      tabindex="-1"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @wheel="handleWheel"
    >
      <!-- HEADER DO LIGHTBOX -->
      <div class="relative z-30 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/80 to-transparent pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <!-- Contador e Metadados -->
        <div class="flex items-center gap-3">
          <span
            v-if="counterText"
            class="text-xs sm:text-sm font-semibold tracking-wider bg-white/10 px-3 py-1.5 rounded-full border border-white/10"
            aria-live="polite"
          >
            {{ counterText }}
          </span>

          <span
            v-if="scale > 1 && isPhoto"
            class="text-xs text-indigo-300 font-mono hidden sm:inline-block bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-500/30"
          >
            Zoom: {{ zoomPercent }}
          </span>
        </div>

        <!-- Controles de Zoom & Fechar -->
        <div class="flex items-center gap-1 sm:gap-2">
          <!-- Controles de Zoom no Desktop -->
          <div v-if="isPhoto" class="hidden sm:flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/10">
            <button
              @click.stop="zoomOut"
              :disabled="scale <= MIN_ZOOM"
              class="p-2 text-white/80 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
              title="Diminuir Zoom (-)"
              aria-label="Diminuir Zoom"
            >
              <Icon name="lucide:zoom-out" class="w-5 h-5" />
            </button>

            <button
              @click.stop="resetZoom"
              :disabled="scale === 1"
              class="p-2 text-xs font-mono text-white/80 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
              title="Resetar Zoom (0)"
              aria-label="Resetar Zoom"
            >
              1x
            </button>

            <button
              @click.stop="zoomIn"
              :disabled="scale >= MAX_ZOOM"
              class="p-2 text-white/80 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
              title="Aumentar Zoom (+)"
              aria-label="Aumentar Zoom"
            >
              <Icon name="lucide:zoom-in" class="w-5 h-5" />
            </button>
          </div>

          <!-- Botão Fechar -->
          <button
            id="public-lightbox-close"
            @click.stop="handleClose"
            class="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-all active:scale-95 border border-white/10 shadow-lg"
            title="Fechar (Esc)"
            aria-label="Fechar galeria"
          >
            <Icon name="lucide:x" class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- VIEWPORT CENTRAL DA MÍDIA -->
      <div
        ref="viewportRef"
        class="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-2 sm:p-6"
      >
        <!-- NAVEGAÇÃO: Botão Anterior -->
        <button
          v-if="hasPrev"
          @click.stop="prevMedia"
          class="absolute left-3 sm:left-6 z-20 p-3 bg-black/60 hover:bg-black/85 text-white/90 hover:text-white rounded-2xl border border-white/15 min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer transition-all backdrop-blur-md shadow-2xl active:scale-95"
          title="Mídia Anterior (Seta Esquerda)"
          aria-label="Mídia Anterior"
        >
          <Icon name="lucide:chevron-left" class="w-6 h-6" />
        </button>

        <!-- Container de Renderização Visual -->
        <div
          class="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-75 ease-out"
          :style="{
            transform: isPhoto
              ? `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`
              : 'none',
            cursor: isPhoto && scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }"
        >
          <!-- Foto com Alt Text e Dimensões -->
          <img
            v-if="isPhoto"
            ref="imageRef"
            :src="currentMedia.publicUrl"
            :alt="currentMedia.alt_text || 'Foto da instalação'"
            class="max-w-[92vw] max-h-[75vh] sm:max-h-[82vh] object-contain rounded-lg shadow-2xl pointer-events-none"
            draggable="false"
          />

          <!-- Vídeo com controles e sem autoplay com áudio -->
          <div v-else-if="isVideo" class="max-w-[92vw] max-h-[75vh] sm:max-h-[82vh] flex items-center justify-center">
            <video
              ref="videoRef"
              :src="currentMedia.publicUrl"
              controls
              playsinline
              preload="metadata"
              class="max-w-full max-h-[75vh] sm:max-h-[82vh] rounded-lg shadow-2xl bg-black"
            ></video>
          </div>
        </div>

        <!-- NAVEGAÇÃO: Botão Próximo -->
        <button
          v-if="hasNext"
          @click.stop="nextMedia"
          class="absolute right-3 sm:right-6 z-20 p-3 bg-black/60 hover:bg-black/85 text-white/90 hover:text-white rounded-2xl border border-white/15 min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer transition-all backdrop-blur-md shadow-2xl active:scale-95"
          title="Próxima Mídia (Seta Direita)"
          aria-label="Próxima Mídia"
        >
          <Icon name="lucide:chevron-right" class="w-6 h-6" />
        </button>
      </div>

      <!-- FOOTER DO LIGHTBOX: Legenda e Título -->
      <div
        v-if="currentMedia.title || currentMedia.caption || currentMedia.alt_text"
        class="relative z-30 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex flex-col items-center text-center max-w-3xl mx-auto w-full"
      >
        <p v-if="currentMedia.title" class="text-sm sm:text-base font-bold text-white mb-0.5">
          {{ currentMedia.title }}
        </p>
        <p v-if="currentMedia.caption" class="text-xs sm:text-sm text-white/80 leading-relaxed max-w-xl">
          {{ currentMedia.caption }}
        </p>
        <p v-else-if="currentMedia.alt_text && !currentMedia.title" class="text-xs text-white/70">
          {{ currentMedia.alt_text }}
        </p>
      </div>
      <div v-else class="h-4 pb-[env(safe-area-inset-bottom,0px)]"></div>
    </div>
  </Teleport>
</template>
