import { ref } from 'vue'

export function useFaq() {
  const openIndex = ref(null)

  const toggleFaq = (index) => {
    openIndex.value = openIndex.value === index ? null : index
  }

  const isOpen = (index) => openIndex.value === index

  return { openIndex, toggleFaq, isOpen }
}
