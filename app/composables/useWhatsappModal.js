import { ref } from 'vue'

export function useWhatsappModal() {
  const isOpen = ref(false)
  const whatsappNumber = '+5511983586611'

  const openModal = () => {
    isOpen.value = true
  }

  const closeModal = () => {
    isOpen.value = false
  }

  const generateWhatsappUrl = (formData) => {
    const message = `Olá, meu nome é ${formData.nome}\n\nEu vim pelo site.\n\nMoro em ${formData.bairro} - ${formData.cidade}.\n\nTenho interesse no serviço de ${formData.tipoServico}.\n\nAguardo retorno, Por favor!`
    
    return `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(message)}`
  }

  return {
    isOpen,
    openModal,
    closeModal,
    generateWhatsappUrl
  }
}