import { onMounted, onUnmounted, ref } from 'vue'

export const useScrollAnimation = () => {
  const observer = ref(null)

  const observeElements = () => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      return null
    }

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
            entry.target.classList.remove('animate-out')
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    // Observar todas as seções
    const sections = document.querySelectorAll('[data-section]')
    sections.forEach((section) => {
      section.classList.add('animate-out')
      intersectionObserver.observe(section)
    })

    observer.value = intersectionObserver
    return intersectionObserver
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      // Pequeno delay para garantir que o DOM está pronto
      setTimeout(() => {
        observeElements()
      }, 100)
    }
  })

  onUnmounted(() => {
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }
  })

  return {
    observeElements
  }
}
