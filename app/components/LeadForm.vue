<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'desktop' // 'desktop' ou 'modal'
  }
})

const formData = ref({
  nome: '',
  bairro: '',
  telefone: '',
  email: ''
})

const isSubmitting = ref(false)
const isSubmitted = ref(false)
const isClient = ref(false)

onMounted(() => {
  isClient.value = true
})

const submitForm = async () => {
  if (props.variant === 'modal') {
    // Modal: apenas nome e bairro
    if (!formData.value.nome || !formData.value.bairro) {
      alert('Por favor, preencha nome e bairro.')
      return
    }
  } else {
    // Desktop: nome e telefone obrigatórios
    if (!formData.value.nome || !formData.value.telefone) {
      alert('Por favor, preencha nome e telefone.')
      return
    }
  }

  isSubmitting.value = true
  
  try {
    // Simular envio
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Criar mensagem baseada no variant
    let message = ''
    if (props.variant === 'modal') {
      message = `Olá! Meu nome é ${formData.value.nome}, moro no bairro ${formData.value.bairro}. Gostaria de um orçamento para telas mosquiteiras.`
    } else {
      message = `Olá! Meu nome é ${formData.value.nome}, telefone ${formData.value.telefone}. Gostaria de um orçamento para telas mosquiteiras.`
    }
    
    const whatsappUrl = `https://wa.me/5511983586611?text=${encodeURIComponent(message)}`
    
    // Verificar se window está disponível
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank')
    }
    
    isSubmitted.value = true
    
    // Reset form after 3 seconds
    setTimeout(() => {
      formData.value = { nome: '', bairro: '', telefone: '', email: '' }
      isSubmitted.value = false
    }, 3000)
    
  } catch (error) {
    console.error('Erro ao enviar formulário:', error)
    alert('Erro ao enviar. Tente novamente.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div :class="[
    'bg-white rounded-xl shadow-lg border border-gray-200',
    variant === 'desktop' ? 'p-6' : 'p-5'
  ]">
    <!-- Header -->
    <div class="text-center mb-5">
      <h3 :class="[
        'font-bold text-gray-800 mb-2',
        variant === 'desktop' ? 'text-xl' : 'text-lg'
      ]">
        Orçamento Grátis
      </h3>
      <p :class="[
        'text-gray-600',
        variant === 'desktop' ? 'text-sm' : 'text-xs'
      ]">
        Resposta em até 2 horas
      </p>
    </div>

    <!-- Form -->
    <form v-if="isClient" @submit.prevent="submitForm" class="space-y-4">
      <!-- Nome -->
      <div>
        <input
          v-model="formData.nome"
          type="text"
          placeholder="Seu nome completo"
          required
          class="form-input"
          :class="[
            'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300',
            variant === 'desktop' ? 'text-base' : 'text-sm'
          ]"
        />
      </div>

      <!-- Bairro (apenas no modal) -->
      <div v-if="variant === 'modal'">
        <input
          v-model="formData.bairro"
          type="text"
          placeholder="Seu bairro"
          required
          class="form-input"
          :class="[
            'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300',
            'text-sm'
          ]"
        />
      </div>

      <!-- Telefone (apenas no desktop) -->
      <div v-if="variant === 'desktop'">
        <input
          v-model="formData.telefone"
          type="tel"
          placeholder="(11) 99999-9999"
          required
          maxlength="15"
          class="form-input"
          :class="[
            'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300',
            'text-base'
          ]"
        />
      </div>

      <!-- Email (opcional - apenas desktop) -->
      <div v-if="variant === 'desktop'">
        <input
          v-model="formData.email"
          type="email"
          placeholder="Seu e-mail (opcional)"
          class="form-input"
          :class="[
            'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300',
            'text-base'
          ]"
        />
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="isSubmitting || isSubmitted"
        :class="[
          'w-full font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2',
          variant === 'desktop' ? 'py-4 text-lg' : 'py-3 text-base',
          isSubmitted 
            ? 'bg-green-500 text-white cursor-default' 
            : 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg hover:scale-105 active:scale-95'
        ]"
      >
        <svg v-if="isSubmitting" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        
        <svg v-else-if="isSubmitted" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        
        <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
        </svg>

        <span v-if="isSubmitting">Enviando...</span>
        <span v-else-if="isSubmitted">Enviado!</span>
        <span v-else-if="variant === 'modal'">Enviar no WhatsApp</span>
        <span v-else>Obter Orçamento</span>
      </button>
    </form>

    <!-- Loading placeholder while not client -->
    <div v-else class="space-y-4">
      <div class="w-full h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      <div class="w-full h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      <div class="w-full h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      <div class="w-full h-12 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>

    <!-- Trust Indicators -->
    <div class="mt-4 pt-4 border-t border-gray-100">
      <div :class="[
        'flex items-center justify-center gap-4 text-gray-500',
        variant === 'desktop' ? 'text-xs' : 'text-xs'
      ]">
        <div class="flex items-center gap-1">
          <svg class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span>100% Seguro</span>
        </div>
        <div class="flex items-center gap-1">
          <svg class="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
          </svg>
          <span>Sem Spam</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Correção para inputs com texto invisível - aplicada apenas em desktop */
@media (min-width: 1024px) {
  .form-input {
    color: #1f2937 !important;
    background-color: #ffffff !important;
    -webkit-text-fill-color: #1f2937 !important;
  }
  
  .form-input::placeholder {
    color: #9ca3af !important;
    opacity: 1 !important;
  }
  
  .form-input:focus {
    color: #1f2937 !important;
    -webkit-text-fill-color: #1f2937 !important;
    border-color: #25D366 !important;
  }
  
  .form-input:disabled {
    color: #6b7280 !important;
    -webkit-text-fill-color: #6b7280 !important;
    background-color: #f9fafb !important;
  }
  
  /* Correção específica para autofill do Chrome/Edge */
  .form-input:-webkit-autofill,
  .form-input:-webkit-autofill:hover,
  .form-input:-webkit-autofill:focus,
  .form-input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #ffffff inset !important;
    -webkit-text-fill-color: #1f2937 !important;
    color: #1f2937 !important;
    background-color: #ffffff !important;
  }
  
  /* Garantir que o texto seja visível em todos os estados */
  .form-input:valid {
    color: #1f2937 !important;
    -webkit-text-fill-color: #1f2937 !important;
  }
  
  .form-input:invalid {
    color: #1f2937 !important;
    -webkit-text-fill-color: #1f2937 !important;
  }
}

/* Garantir que mobile continue funcionando normalmente */
@media (max-width: 1023px) {
  .form-input {
    color: #1f2937;
    background-color: #ffffff;
  }
  
  .form-input::placeholder {
    color: #9ca3af;
  }
}
</style>