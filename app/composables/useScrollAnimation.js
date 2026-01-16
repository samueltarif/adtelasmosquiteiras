import { onMounted, onUnmounted } from 'vue'

export const useScrollAnimation = () => {
  const observeElements = () => {
    const observer = new IntersectionObserver(
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
      observer.observe(section)
    })

    return observer
  }

  onMounted(() => {
    // Pequeno delay para garantir que o DOM está pronto
    setTimeout(() => {
      observeElements()
    }, 100)
  })

  return {
    observeElements
  }
}
