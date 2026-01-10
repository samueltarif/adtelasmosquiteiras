<script setup>
const { isOpen, openModal, closeModal, generateWhatsappUrl } = useWhatsappModal()

const props = defineProps({
  variant: {
    type: String,
    default: 'hero', // 'hero', 'inline', 'stacked'
    validator: (value) => ['hero', 'inline', 'stacked'].includes(value)
  },
  primaryText: {
    type: String,
    default: 'Quero Orçamento Agora'
  },
  secondaryText: {
    type: String,
    default: 'Falar no WhatsApp'
  },
  showBothButtons: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'large', // 'small', 'medium', 'large'
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})

const handleWhatsappSubmit = (formData) => {
  const whatsappUrl = generateWhatsappUrl(formData)
  window.open(whatsappUrl, '_blank')
}

// Classes dinâmicas baseadas nas props
const containerClasses = computed(() => {
  const base = 'flex gap-5'
  
  switch (props.variant) {
    case 'hero':
      return `${base} flex-col sm:flex-row`
    case 'inline':
      return `${base} flex-row justify-center`
    case 'stacked':
      return `${base} flex-col`
    default:
      return `${base} flex-col sm:flex-row`
  }
})

const buttonClasses = computed(() => {
  const base = 'rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg'
  
  switch (props.size) {
    case 'small':
      return `${base} px-4 py-2 text-sm`
    case 'medium':
      return `${base} px-6 py-3 text-base`
    case 'large':
      return `${base} px-9 py-4 text-lg`
    default:
      return `${base} px-9 py-4 text-lg`
  }
})

const primaryButtonClasses = computed(() => {
  const base = buttonClasses.value
  const responsive = props.variant === 'hero' ? 'w-full sm:w-auto' : 'w-auto'
  
  return `${base} ${responsive} bg-primary text-white hover:bg-primary-dark`
})

const secondaryButtonClasses = computed(() => {
  const base = buttonClasses.value
  const responsive = props.variant === 'hero' ? 'w-full sm:w-auto' : 'w-auto'
  
  // Diferentes estilos baseados no contexto
  if (props.variant === 'hero') {
    return `${base} ${responsive} border-2 border-white text-white text-center hover:bg-white hover:text-primary`
  } else {
    return `${base} ${responsive} border-2 border-primary text-primary hover:bg-primary hover:text-white`
  }
})
</script>

<template>
  <div :class="containerClasses">
    <!-- Botão Primário -->
    <button 
      @click="openModal"
      :class="primaryButtonClasses"
    >
      {{ primaryText }}
    </button>

    <!-- Botão Secundário -->
    <button 
      v-if="showBothButtons"
      @click="openModal"
      :class="secondaryButtonClasses"
    >
      {{ secondaryText }}
    </button>
  </div>

  <!-- WhatsApp Modal -->
  <WhatsappModal 
    :is-open="isOpen" 
    @close="closeModal" 
    @submit="handleWhatsappSubmit" 
  />
</template>