<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useLightboxZoom } from '~/composables/useLightboxZoom'

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

const currentIndex = ref(props.initialIndex || 0)
const currentMedia = computed<PublicMediaItem | null>(() => props.mediaList[currentIndex.value] || null)
const isPhoto = computed(() => currentMedia.value?.media_type === 'photo')
const isVideo = computed(() => currentMedia.value?.media_type === 'video')

const viewportRef = ref<HTMLElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const lightboxRef = ref<HTMLElement | null>(null)
let previousActiveElement: HTMLElement | null = null

const {
  scale,
  translateX,
  translateY,
  isDragging,
  zoomPercent,
  resetZoom,
  zoomIn,
  zoomOut,
  handleWheel,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp
} = useLightboxZoom(viewportRef, imageRef)

const MIN_ZOOM = 1
const MAX_ZOOM = 5

const counterText = computed(() => {
  if (!props.mediaList || props.mediaList.length <= 1) return ''
  return `${currentIndex.value + 1} / ${props.mediaList.length}`
})

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < (props.mediaList || []).length - 1)

function pauseCurrentVideo() {
  if (videoRef.value) {
    try { videoRef.value.pause() } catch {}
  }
}

function handleClose() {
  pauseCurrentVideo()
  resetZoom()
  emit('close')
}

function prevMedia() {
  if (hasPrev.value) {
    pauseCurrentVideo()
    currentIndex.value--
    resetZoom()
  }
}

function nextMedia() {
  if (hasNext.value) {
    pauseCurrentVideo()
    currentIndex.value++
    resetZoom()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (!props.isOpen) return
  switch (e.key) {
    case 'Escape':
      e.preventDefault()
      handleClose()
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

watch(() => props.initialIndex, (newIdx) => {
  currentIndex.value = Math.max(0, Math.min(newIdx || 0, (props.mediaList || []).length - 1))
  resetZoom()
})

watch(() => props.isOpen, (open) => {
  if (open) {
    currentIndex.value = Math.max(0, Math.min(props.initialIndex || 0, (props.mediaList || []).length - 1))
    resetZoom()
    if (typeof document !== 'undefined') {
      previousActiveElement = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
    }
    nextTick(() => {
      const closeBtn = lightboxRef.value?.querySelector<HTMLElement>('#public-lightbox-close')
      closeBtn?.focus()
    })
  } else {
    pauseCurrentVideo()
    resetZoom()
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
      if (previousActiveElement?.focus) previousActiveElement.focus()
    }
  }
})

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('keydown', handleKeydown)
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
      <!-- Header do Lightbox -->
      <div class="relative z-30 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/80 to-transparent pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <div class="flex items-center gap-3">
          <span v-if="counterText" class="text-xs sm:text-sm font-semibold tracking-wider bg-white/10 px-3 py-1.5 rounded-full border border-white/10" aria-live="polite">
            {{ counterText }}
          </span>
          <span v-if="scale > 1 && isPhoto" class="text-xs text-indigo-300 font-mono hidden sm:inline-block bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-500/30">
            Zoom: {{ zoomPercent }}
          </span>
        </div>

        <div class="flex items-center gap-1 sm:gap-2">
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

      <!-- Viewport Central -->
      <div ref="viewportRef" class="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-2 sm:p-6">
        <button
          v-if="hasPrev"
          @click.stop="prevMedia"
          class="absolute left-3 sm:left-6 z-20 p-3 bg-black/60 hover:bg-black/85 text-white/90 hover:text-white rounded-2xl border border-white/15 min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer transition-all backdrop-blur-md shadow-2xl active:scale-95"
          title="Mídia Anterior (Seta Esquerda)"
          aria-label="Mídia Anterior"
        >
          <Icon name="lucide:chevron-left" class="w-6 h-6" />
        </button>

        <div
          class="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-75 ease-out"
          :style="{
            transform: isPhoto ? `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})` : 'none',
            cursor: isPhoto && scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }"
        >
          <img
            v-if="isPhoto"
            ref="imageRef"
            :src="currentMedia.publicUrl"
            :alt="currentMedia.alt_text || 'Foto da instalação'"
            class="max-w-[92vw] max-h-[75vh] sm:max-h-[82vh] object-contain rounded-lg shadow-2xl pointer-events-none"
            draggable="false"
          />
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

      <!-- Footer do Lightbox -->
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
