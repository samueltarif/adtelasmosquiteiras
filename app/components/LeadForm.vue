<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'desktop' // 'desktop' ou 'modal'
  }
})

// Estado do formulário em 2 passos
const currentStep = ref(1)
const formData = ref({
  // Passo 1 - Obrigatórios
  nome: '',
  cidade: '',
  // Passo 2 - Opcionais
  bairro: '',
  servico: ''
})

const isSubmitting = ref(false)
const isSubmitted = ref(false)
const isClient = ref(false)

onMounted(() => {
  isClient.value = true
})

// Validação do passo 1
const canContinue = computed(() => {
  return formData.value.nome.trim() !== '' && 
         formData.value.cidade.trim() !== ''
})

// Ir para passo 2 (opcional)
const goToStep2 = () => {
  if (canContinue.value) {
    currentStep.value = 2
  } else {
    alert('Por favor, preencha todos os campos.')
  }
}

// Voltar para passo 1
const goToStep1 = () => {
  currentStep.value = 1
}

// Enviar para WhatsApp (pode ser do passo 1 ou 2)
const sendToWhatsApp = async () => {
  if (!canContinue.value) {
    alert('Por favor, preencha todos os campos obrigatórios.')
    return
  }

  isSubmitting.value = true
  
  try {
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Criar mensagem para WhatsApp
    let message = `Olá! Meu nome é ${formData.value.nome}, moro em ${formData.value.cidade}`
    
    if (formData.value.bairro) {
      message += `, bairro ${formData.value.bairro}`
    }
    
    message += `.`
    
    if (formData.value.servico) {
      message += ` Gostaria de um orçamento para: ${formData.value.servico}.`
    } else {
      message += ` Gostaria de um orçamento para telas mosqueteiras.`
    }
    
    const whatsappUrl = `https://wa.me/5511983586611?text=${encodeURIComponent(message)}`
    
    // Abrir WhatsApp
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank')
    }
    
    isSubmitted.value = true
    
    // Reset após 3 segundos
    setTimeout(() => {
      formData.value = { nome: '', cidade: '', bairro: '', servico: '' }
      currentStep.value = 1
      isSubmitted.value = false
    }, 3000)
    
  } catch (error) {
    console.error('Erro:', error)
    alert('Erro ao enviar. Tente novamente.')
  } finally {
    isSubmitting.value = false
  }
}

// Remover funções de máscara WhatsApp (não é mais necessário)
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
      
      <!-- Indicador de Passos -->
      <div class="flex items-center justify-center gap-2 mt-3">
        <div :class="[
          'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all',
          currentStep === 1 ? 'bg-[#25D366] text-white' : 'bg-green-100 text-green-600'
        ]">
          <svg v-if="currentStep === 2" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          <span v-else>1</span>
        </div>
        <div class="w-8 h-0.5 bg-gray-200"></div>
        <div :class="[
          'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all',
          currentStep === 2 ? 'bg-[#25D366] text-white' : 'bg-gray-200 text-gray-600'
        ]">
          2
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">
        {{ currentStep === 1 ? 'Passo 1 - Dados Rápidos' : 'Passo 2 - Detalhes (Opcional)' }}
      </p>
    </div>

    <!-- Form -->
    <form v-if="isClient" @submit.prevent="currentStep === 1 ? sendToWhatsApp() : sendToWhatsApp()" class="space-y-4">
      
      <!-- ========== PASSO 1: DADOS RÁPIDOS ========== -->
      <div v-show="currentStep === 1" class="space-y-4">
        <!-- Nome -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Nome <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.nome"
            type="text"
            placeholder="Digite seu nome"
            required
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300"
            :class="variant === 'desktop' ? 'text-base' : 'text-sm'"
          />
        </div>

        <!-- Cidade -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Cidade <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.cidade"
            type="text"
            placeholder="Ex: São Paulo"
            required
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300"
            :class="variant === 'desktop' ? 'text-base' : 'text-sm'"
          />
        </div>

        <!-- Botão Continuar no WhatsApp -->
        <button
          type="submit"
          :disabled="!canContinue || isSubmitting || isSubmitted"
          :class="[
            'w-full font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2',
            variant === 'desktop' ? 'py-4 text-lg' : 'py-3 text-base',
            isSubmitted
              ? 'bg-green-500 text-white cursor-default'
              : canContinue
                ? 'bg-[#25D366] hover:bg-[#1fb854] text-white hover:shadow-lg hover:scale-105 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
          <span v-else>Continuar no WhatsApp</span>
        </button>

        <!-- Link para passo 2 (opcional) -->
        <button
          type="button"
          @click="goToStep2"
          :disabled="!canContinue"
          class="w-full text-sm text-gray-600 hover:text-primary underline transition-colors"
        >
          Ou adicionar mais detalhes para orçamento mais preciso
        </button>
      </div>

      <!-- ========== PASSO 2: DETALHES OPCIONAIS ========== -->
      <div v-show="currentStep === 2" class="space-y-4">
        <!-- Aviso de Opcional -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p class="text-sm text-blue-800 text-center">
            <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <strong>Opcional</strong> - Ajuda a enviar um orçamento mais preciso
          </p>
        </div>

        <!-- Bairro/Região -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Bairro/Região <span class="text-gray-400 text-xs">(opcional)</span>
          </label>
          <input
            v-model="formData.bairro"
            type="text"
            placeholder="Ex: Vila Mariana, Pinheiros"
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300"
            :class="variant === 'desktop' ? 'text-base' : 'text-sm'"
          />
        </div>

        <!-- Tipo de Serviço -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Serviço <span class="text-gray-400 text-xs">(opcional)</span>
          </label>
          <select
            v-model="formData.servico"
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300"
            :class="variant === 'desktop' ? 'text-base' : 'text-sm'"
          >
            <option value="">Selecione um serviço</option>
            <option value="Tela Mosqueteira">Tela Mosqueteira</option>
            <option value="Rede de Proteção">Rede de Proteção</option>
            <option value="Tela Pet Screen">Tela Pet Screen</option>
            <option value="Proteção Infantil">Proteção Infantil</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <!-- Botões -->
        <div class="flex gap-2">
          <!-- Voltar -->
          <button
            type="button"
            @click="goToStep1"
            class="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
            </svg>
            <span>Voltar</span>
          </button>

          <!-- Enviar -->
          <button
            type="submit"
            :disabled="isSubmitting || isSubmitted"
            :class="[
              'flex-[2] font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2',
              'py-3 text-base',
              isSubmitted 
                ? 'bg-green-500 text-white cursor-default' 
                : 'bg-[#25D366] hover:bg-[#1fb854] text-white hover:shadow-lg hover:scale-105 active:scale-95'
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
            <span v-else>Enviar no WhatsApp</span>
          </button>
        </div>
      </div>

    </form>

    <!-- Loading placeholder -->
    <div v-else class="space-y-4">
      <div class="w-full h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      <div class="w-full h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      <div class="w-full h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      <div class="w-full h-12 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>

    <!-- Trust Indicators -->
    <div class="mt-4 pt-4 border-t border-gray-100">
      <div class="flex items-center justify-center gap-4 text-xs text-gray-500">
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
/* Correção para inputs com texto invisível */
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
  }
  
  .form-input:-webkit-autofill,
  .form-input:-webkit-autofill:hover,
  .form-input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 30px #ffffff inset !important;
    -webkit-text-fill-color: #1f2937 !important;
  }
}

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
