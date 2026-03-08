export function useScrollTo() {
  const scrollTo = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Calcular offset para compensar o header fixo
      const headerHeight = 120 // Altura aproximada do header (h-24 md:h-28)
      const elementPosition = element.offsetTop - headerHeight
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }

  return { scrollTo }
}
