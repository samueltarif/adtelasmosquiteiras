<script setup>
const { isOpen, openModal, closeModal, generateWhatsappUrl } = useWhatsappModal()

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'primary', // 'primary', 'secondary', 'outline', 'whatsapp'
    validator: (value) => ['primary', 'secondary', 'outline', 'whatsapp'].includes(value)
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

// Detectar se é botão do WhatsApp
const isWhatsappButton = computed(() => {
  return props.text.toLowerCase().includes('whatsapp') || 
         props.text.toLowerCase().includes('falar') ||
         props.variant === 'whatsapp'
})

// Classes dinâmicas baseadas nas props
const buttonClasses = computed(() => {
  const base = 'rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2'
  
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
  if (isWhatsappButton.value) {
    // Estilo oficial do WhatsApp
    variantClasses = 'text-white hover:shadow-xl'
  } else {
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
  }
  
  return `${base} ${sizeClasses} ${widthClass} ${variantClasses}`
})
</script>

<template>
  <button 
    @click="openModal"
    :class="buttonClasses"
    :style="isWhatsappButton ? { backgroundColor: '#25D366' } : {}"
    @mouseover="isWhatsappButton ? $event.target.style.backgroundColor = '#1DA851' : null"
    @mouseout="isWhatsappButton ? $event.target.style.backgroundColor = '#25D366' : null"
  >
    <!-- Ícone do WhatsApp para botões relacionados -->
    <svg 
      v-if="isWhatsappButton" 
      class="w-5 h-5" 
      fill="currentColor" 
      viewBox="0 0 24 24"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
    </svg>
    
    {{ text }}
  </button>

  <!-- WhatsApp Modal -->
  <WhatsappModal 
    :is-open="isOpen" 
    @close="closeModal" 
    @submit="handleWhatsappSubmit" 
  />
</template>