import { ref, computed } from 'vue'

export interface LightboxPhoto {
  src: string
  alt?: string
  title?: string
  caption?: string
}

// Global reactive state shared across the application
const isOpen = ref(false)
const photos = ref<LightboxPhoto[]>([])
const currentIndex = ref(0)

export function useSiteLightbox() {
  const currentPhoto = computed<LightboxPhoto | null>(() => {
    if (!photos.value.length || currentIndex.value < 0 || currentIndex.value >= photos.value.length) {
      return null
    }
    return photos.value[currentIndex.value]
  })

  const hasMultiple = computed(() => photos.value.length > 1)
  const hasPrev = computed(() => currentIndex.value > 0)
  const hasNext = computed(() => currentIndex.value < photos.value.length - 1)
  const counterText = computed(() => {
    if (photos.value.length <= 1) return ''
    return `${currentIndex.value + 1} / ${photos.value.length}`
  })

  function open(
    items: string | string[] | LightboxPhoto | LightboxPhoto[],
    initialIndex = 0
  ) {
    let normalized: LightboxPhoto[] = []

    if (Array.isArray(items)) {
      normalized = items.map((item) => {
        if (typeof item === 'string') {
          return { src: item, alt: 'Foto em tamanho ampliado' }
        }
        return {
          src: item.src,
          alt: item.alt || 'Foto em tamanho ampliado',
          title: item.title,
          caption: item.caption
        }
      })
    } else if (typeof items === 'string') {
      normalized = [{ src: items, alt: 'Foto em tamanho ampliado' }]
    } else if (items && typeof items === 'object') {
      normalized = [{
        src: items.src,
        alt: items.alt || 'Foto em tamanho ampliado',
        title: items.title,
        caption: items.caption
      }]
    }

    // Filter out invalid items
    normalized = normalized.filter((item) => Boolean(item.src))

    if (!normalized.length) return

    photos.value = normalized
    const safeIndex = Math.max(0, Math.min(initialIndex, normalized.length - 1))
    currentIndex.value = safeIndex
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function next() {
    if (hasNext.value) {
      currentIndex.value++
    } else if (photos.value.length > 1) {
      // Loop back to first photo
      currentIndex.value = 0
    }
  }

  function prev() {
    if (hasPrev.value) {
      currentIndex.value--
    } else if (photos.value.length > 1) {
      // Loop to last photo
      currentIndex.value = photos.value.length - 1
    }
  }

  function goTo(index: number) {
    if (index >= 0 && index < photos.value.length) {
      currentIndex.value = index
    }
  }

  return {
    isOpen,
    photos,
    currentIndex,
    currentPhoto,
    hasMultiple,
    hasPrev,
    hasNext,
    counterText,
    open,
    close,
    next,
    prev,
    goTo
  }
}
