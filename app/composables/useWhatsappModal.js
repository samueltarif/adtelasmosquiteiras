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
    const local = formData.bairro ? `${formData.bairro} - ${formData.cidade}` : formData.cidade
    const message = `Olá, meu nome é ${formData.nome}\n\nVim pelo site: https://www.adtelasmosquiteiras.com.br\n\nMoro em ${local}.\n\nTenho interesse no serviço de ${formData.tipoServico}.\n\nAguardo retorno, Por favor!`
    
    return `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(message)}`
  }

  return {
    isOpen,
    openModal,
    closeModal,
    generateWhatsappUrl
  }
}