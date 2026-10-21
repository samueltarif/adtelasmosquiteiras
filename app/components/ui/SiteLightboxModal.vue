<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useSiteLightbox } from '~/composables/useSiteLightbox'
import { useLightboxZoom } from '~/composables/useLightboxZoom'

const {
  isOpen,
  photos,
  currentIndex,
  currentPhoto,
  hasMultiple,
  hasPrev,
  hasNext,
  counterText,
  close,
  next,
  prev
} = useSiteLightbox()

const viewportRef = ref<HTMLElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)
const modalRef = ref<HTMLElement | null>(null)
let previousActiveElement: HTMLElement | null = null

// Mobile touch swipe variables
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0

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
  handlePointerUp,
  handleDoubleClick
} = useLightboxZoom(viewportRef, imageRef)

const MIN_ZOOM = 1
const MAX_ZOOM = 5

function handleClose() {
  resetZoom()
  close()
}

function handlePrev() {
  resetZoom()
  prev()
}

function handleNext() {
  resetZoom()
  next()
}

// Backdrop click: close if clicking the backdrop and not zoomed in
function handleBackdropClick(e: MouseEvent) {
  if (e.target === viewportRef.value || (e.target as HTMLElement)?.classList.contains('lightbox-backdrop-area')) {
    if (scale.value <= 1) {
      handleClose()
    } else {
      resetZoom()
    }
  }
}

// Touch swipe handling for mobile
function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1 && scale.value <= 1) {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
    touchStartTime = Date.now()
  }
}

function onTouchEnd(e: TouchEvent) {
  if (scale.value > 1 || !hasMultiple.value) return
  if (e.changedTouches.length === 1) {
    const deltaX = e.changedTouches[0].clientX - touchStartX
    const deltaY = e.changedTouches[0].clientY - touchStartY
    const deltaTime = Date.now() - touchStartTime

    // Check if horizontal swipe
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && deltaTime < 400) {
      if (deltaX < 0) {
        // Swiped left -> next
        handleNext()
      } else {
        // Swiped right -> prev
        handlePrev()
      }
    }
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (!isOpen.value) return

  switch (e.key) {
    case 'Escape':
      e.preventDefault()
      handleClose()
      break
    case 'ArrowLeft':
      if (scale.value <= 1 && hasMultiple.value) {
        e.preventDefault()
        handlePrev()
      }
      break
    case 'ArrowRight':
      if (scale.value <= 1 && hasMultiple.value) {
        e.preventDefault()
        handleNext()
      }
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
  }
}

watch(isOpen, (open) => {
  if (open) {
    resetZoom()
    if (typeof document !== 'undefined') {
      previousActiveElement = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
    }
    nextTick(() => {
      const closeBtn = modalRef.value?.querySelector<HTMLElement>('#site-lightbox-close')
      closeBtn?.focus()
    })
  } else {
    resetZoom()
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
      if (previousActiveElement?.focus) {
        try { previousActiveElement.focus() } catch {}
      }
    }
  }
})

// Global click interceptor to allow clicking on any content photo across the site
function onGlobalDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target) return

  // If lightbox is already open or click is inside lightbox, let lightbox handle it
  if (isOpen.value || target.closest('[data-site-lightbox-root]')) return

  // Check if click was on or inside an image
  const img = target.tagName === 'IMG' ? (target as HTMLImageElement) : target.closest('img')
  if (!img) return

  // Ignore logos, icons, avatars and elements explicitly marked as no-lightbox
  if (
    img.hasAttribute('data-no-lightbox') ||
    img.closest('[data-no-lightbox]') ||
    img.closest('header') ||
    img.closest('.site-header') ||
    img.closest('.td-header') ||
    img.closest('.td-logo') ||
    img.classList.contains('no-lightbox') ||
    img.classList.contains('avatar') ||
    img.src.includes('logo') ||
    img.src.includes('icon') ||
    (img.naturalWidth > 0 && img.naturalWidth < 45 && img.naturalHeight > 0 && img.naturalHeight < 45)
  ) {
    return
  }

  // If inside admin section, do not intercept
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return
  }

  // If the image or its parent has an explicit lightbox handler, let that handler do it
  if (img.hasAttribute('data-custom-lightbox') || img.closest('[data-custom-lightbox]')) {
    return
  }

  // If inside a link or button, prevent navigation so the photo opens in large view!
  const parentLink = img.closest('a, button, [role="button"]')
  if (parentLink) {
    e.preventDefault()
    e.stopPropagation()
  }

  // Open the clicked photo
  const photoSrc = img.currentSrc || img.getAttribute('src') || ''
  if (!photoSrc) return

  const photoAlt = img.getAttribute('alt') || ''
  const photoTitle = img.getAttribute('title') || photoAlt

  useSiteLightbox().open({
    src: photoSrc,
    alt: photoAlt || 'Foto ampliada',
    title: photoTitle || undefined
  })
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
    document.addEventListener('click', onGlobalDocumentClick, true)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('click', onGlobalDocumentClick, true)
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen && currentPhoto"
      ref="modalRef"
      data-site-lightbox-root
      role="dialog"
      aria-modal="true"
      :aria-label="`Visualizador de fotos: foto ${currentIndex + 1} de ${photos.length}`"
      class="fixed inset-0 z-[999999] flex flex-col justify-between bg-black/95 backdrop-blur-md text-white select-none overflow-hidden touch-none"
      tabindex="-1"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @wheel="handleWheel"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <!-- Header do Lightbox -->
      <div class="relative z-30 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Contador de fotos (quando mais de 1) -->
          <span
            v-if="counterText"
            class="text-xs sm:text-sm font-semibold tracking-wider bg-white/15 px-3 py-1.5 rounded-full border border-white/20 shadow-sm"
            aria-live="polite"
          >
            {{ counterText }}
          </span>

          <!-- Indicador de Zoom -->
          <span
            v-if="scale > 1"
            class="text-xs text-sky-300 font-mono hidden sm:inline-block bg-sky-950/70 px-2.5 py-1 rounded-md border border-sky-500/30 shadow-sm"
          >
            Zoom: {{ zoomPercent }}
          </span>
        </div>

        <!-- Botões de Ação do Topo -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          <!-- Controles de Zoom (Desktop) -->
          <div class="hidden sm:flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/15 shadow-sm">
            <button
              @click.stop="zoomOut"
              :disabled="scale <= MIN_ZOOM"
              class="p-2 text-white/80 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/15 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
              title="Diminuir Zoom (-)"
              aria-label="Diminuir Zoom"
            >
              <Icon name="lucide:zoom-out" class="w-5 h-5" />
            </button>
            <button
              @click.stop="resetZoom"
              :disabled="scale === 1"
              class="px-2.5 py-1 text-xs font-mono text-white/80 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/15 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
              title="Resetar Zoom (0)"
              aria-label="Resetar Zoom para 100%"
            >
              1x
            </button>
            <button
              @click.stop="zoomIn"
              :disabled="scale >= MAX_ZOOM"
              class="p-2 text-white/80 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/15 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
              title="Aumentar Zoom (+)"
              aria-label="Aumentar Zoom"
            >
              <Icon name="lucide:zoom-in" class="w-5 h-5" />
            </button>
          </div>

          <!-- Botão Fechar com alta visibilidade (Mobile e Desktop) -->
          <button
            id="site-lightbox-close"
            @click.stop="handleClose"
            class="flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 bg-red-600/90 hover:bg-red-600 active:bg-red-700 text-white font-semibold text-sm rounded-xl min-h-[46px] min-w-[46px] cursor-pointer transition-all active:scale-95 border border-white/20 shadow-xl"
            title="Fechar foto (Esc)"
            aria-label="Fechar foto ampliada"
          >
            <Icon name="lucide:x" class="w-5 h-5" />
            <span class="text-xs font-bold uppercase tracking-wide">Fechar</span>
          </button>
        </div>
      </div>

      <!-- Viewport Central com Foto -->
      <div
        ref="viewportRef"
        class="lightbox-backdrop-area relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-2 sm:p-6"
        @click="handleBackdropClick"
      >
        <!-- Botão Foto Anterior -->
        <button
          v-if="hasMultiple"
          @click.stop="handlePrev"
          class="absolute left-2 sm:left-6 z-20 p-3 bg-black/60 hover:bg-black/85 text-white/90 hover:text-white rounded-2xl border border-white/20 min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer transition-all backdrop-blur-md shadow-2xl active:scale-95"
          title="Foto anterior (Seta esquerda)"
          aria-label="Foto anterior"
        >
          <Icon name="lucide:chevron-left" class="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        <!-- Imagem Ampliada com Transformação Suave -->
        <div
          class="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-75 ease-out"
          :style="{
            transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
          }"
          @dblclick="handleDoubleClick"
        >
          <img
            ref="imageRef"
            :src="currentPhoto.src"
            :alt="currentPhoto.alt || 'Foto ampliada'"
            class="max-w-[94vw] max-h-[76vh] sm:max-h-[82vh] object-contain rounded-xl shadow-2xl pointer-events-none transition-opacity duration-200"
            draggable="false"
          />
        </div>

        <!-- Botão Próxima Foto -->
        <button
          v-if="hasMultiple"
          @click.stop="handleNext"
          class="absolute right-2 sm:right-6 z-20 p-3 bg-black/60 hover:bg-black/85 text-white/90 hover:text-white rounded-2xl border border-white/20 min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer transition-all backdrop-blur-md shadow-2xl active:scale-95"
          title="Próxima foto (Seta direita)"
          aria-label="Próxima foto"
        >
          <Icon name="lucide:chevron-right" class="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>

      <!-- Footer do Lightbox (Título, Legenda e Dica) -->
      <div
        class="relative z-30 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex flex-col items-center text-center max-w-3xl mx-auto w-full"
      >
        <p v-if="currentPhoto.title" class="text-sm sm:text-base font-bold text-white mb-0.5 leading-snug">
          {{ currentPhoto.title }}
        </p>
        <p v-if="currentPhoto.caption" class="text-xs sm:text-sm text-white/80 leading-relaxed max-w-xl">
          {{ currentPhoto.caption }}
        </p>
        <p v-else-if="currentPhoto.alt && !currentPhoto.title" class="text-xs sm:text-sm text-white/75 leading-relaxed">
          {{ currentPhoto.alt }}
        </p>
        
        <!-- Dica mobile discreta -->
        <div class="mt-1 flex items-center gap-2 text-[11px] text-white/60">
          <span v-if="hasMultiple">Toque nas setas ou deslize para ver mais fotos</span>
          <span v-if="hasMultiple && scale === 1">•</span>
          <span>Toque duas vezes para dar zoom</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Suaviza transições no visualizador */
.touch-none {
  touch-action: none;
}
</style>
