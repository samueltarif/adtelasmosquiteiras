<script setup>
const { isOpen, openModal, closeModal, generateWhatsappUrl } = useWhatsappModal()

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'primary', // 'primary', 'secondary', 'outline'
    validator: (value) => ['primary', 'secondary', 'outline'].includes(value)
  },
  size: {
    type: String,
    default: 'medium', // 'small', 'medium', 'large'
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  fullWidth: {
    type: Boolean,
    default: false
  }
})

const handleWhatsappSubmit = (formData) => {
  const whatsappUrl = generateWhatsappUrl(formData)
  window.open(whatsappUrl, '_blank')
}

// Classes dinâmicas baseadas nas props
const buttonClasses = computed(() => {
  const base = 'rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg'
  
  // Tamanho
  let sizeClasses = ''
  switch (props.size) {
    case 'small':
      sizeClasses = 'px-4 py-2 text-sm'
      break
    case 'medium':
      sizeClasses = 'px-6 py-3 text-base'
      break
    case 'large':
      sizeClasses = 'px-9 py-4 text-lg'
      break
  }
  
  // Largura
  const widthClass = props.fullWidth ? 'w-full' : 'w-auto'
  
  // Variante
  let variantClasses = ''
  switch (props.variant) {
    case 'primary':
      variantClasses = 'bg-primary text-white hover:bg-primary-dark'
      break
    case 'secondary':
      variantClasses = 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      break
    case 'outline':
      variantClasses = 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
      break
  }
  
  return `${base} ${sizeClasses} ${widthClass} ${variantClasses}`
})
</script>

<template>
  <button 
    @click="openModal"
    :class="buttonClasses"
  >
    {{ text }}
  </button>

  <!-- WhatsApp Modal -->
  <WhatsappModal 
    :is-open="isOpen" 
    @close="closeModal" 
    @submit="handleWhatsappSubmit" 
  />
</template>