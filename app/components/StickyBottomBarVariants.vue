<script setup>
// Props para customização
const props = defineProps({
  variant: {
    type: String,
    default: 'split', // 'split', 'stacked', 'primary-only', 'with-price'
    validator: (value) => ['split', 'stacked', 'primary-only', 'with-price'].includes(value)
  },
  whatsappNumber: {
    type: String,
    default: '5511983586611'
  },
  whatsappMessage: {
    type: String,
    default: 'Olá! Gostaria de solicitar um orçamento.'
  },
  phoneNumber: {
    type: String,
    default: '+5511983586611'
  },
  primaryText: {
    type: String,
    default: 'WhatsApp'
  },
  secondaryText: {
    type: String,
    default: 'Ligar'
  },
  price: {
    type: String,
    default: 'R$ 299'
  }
})

const whatsappLink = computed(() => 
  `https://wa.me/${props.whatsappNumber}?text=${encodeURIComponent(props.whatsappMessage)}`
)
</script>

<template>
  <div class="md:hidden">
    
    <!-- ========== VARIANT 1: SPLIT (60/40) ========== -->
    <div v-if="variant === 'split'" class="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div class="h-20"></div>
      <div class="flex gap-2 p-3">
        <a 
          :href="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          class="flex-[3] flex items-center justify-center gap-2 h-14 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-xl font-bold text-base shadow-lg active:scale-[0.98] transition-all"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
          <span>{{ primaryText }}</span>
        </a>

        <a 
          :href="`tel:${phoneNumber}`"
          class="flex-[2] flex items-center justify-center gap-2 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base shadow-lg active:scale-[0.98] transition-all"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
          </svg>
          <span>{{ secondaryText }}</span>
        </a>
      </div>
    </div>

    <!-- ========== VARIANT 2: STACKED (Botões empilhados) ========== -->
    <div v-else-if="variant === 'stacked'" class="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div class="h-32"></div>
      <div class="p-3 space-y-2">
        <a 
          :href="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-xl font-bold text-base shadow-lg active:scale-[0.98] transition-all"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
          <span>{{ primaryText }}</span>
        </a>

        <a 
          :href="`tel:${phoneNumber}`"
          class="flex items-center justify-center gap-2 w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base shadow-lg active:scale-[0.98] transition-all"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
          </svg>
          <span>{{ secondaryText }}</span>
        </a>
      </div>
    </div>

    <!-- ========== VARIANT 3: PRIMARY ONLY (Só WhatsApp) ========== -->
    <div v-else-if="variant === 'primary-only'" class="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div class="h-20"></div>
      <div class="p-3">
        <a 
          :href="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-3 w-full h-14 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
          <span>{{ primaryText }}</span>
        </a>
      </div>
    </div>

    <!-- ========== VARIANT 4: WITH PRICE (Com preço à esquerda) ========== -->
    <div v-else-if="variant === 'with-price'" class="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div class="h-20"></div>
      <div class="flex items-center gap-3 p-3">
        <!-- Preço -->
        <div class="flex flex-col items-start">
          <span class="text-xs text-gray-500">A partir de</span>
          <span class="text-xl font-bold text-gray-900">{{ price }}</span>
        </div>

        <!-- Botão WhatsApp -->
        <a 
          :href="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          class="flex-1 flex items-center justify-center gap-2 h-14 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-xl font-bold text-base shadow-lg active:scale-[0.98] transition-all"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
          <span>Pedir Orçamento</span>
        </a>
      </div>
    </div>

  </div>
</template>
