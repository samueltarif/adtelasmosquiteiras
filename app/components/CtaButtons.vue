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
  const base = 'rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2'
  
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
  
  // Estilo oficial do WhatsApp para botões secundários
  return `${base} ${responsive} text-white hover:shadow-xl`
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

    <!-- Botão Secundário (WhatsApp) -->
    <button 
      v-if="showBothButtons"
      @click="openModal"
      :class="secondaryButtonClasses"
      style="background-color: #25D366;"
      @mouseover="$event.target.style.backgroundColor = '#1DA851'"
      @mouseout="$event.target.style.backgroundColor = '#25D366'"
    >
      <!-- Ícone do WhatsApp -->
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
      </svg>
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