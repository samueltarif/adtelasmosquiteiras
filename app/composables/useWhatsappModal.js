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
    const message = `Olá, meu nome é ${formData.nome}%0A%0AEu vim pelo site.%0A%0AMoro em ${formData.bairro} - ${formData.cidade}.%0A%0ATenho interesse no serviço de ${formData.tipoServico}.%0A%0AAguardo retorno, Por favor!`
    
    return `https://wa.me/${whatsappNumber.replace('+', '')}?text=${message}`
  }

  return {
    isOpen,
    openModal,
    closeModal,
    generateWhatsappUrl
  }
}