<script setup>
import { ref, computed } from 'vue'
import { useAnalyticsIdentity } from '~/composables/useAnalyticsIdentity'
import { useAttribution } from '~/composables/useAttribution'

const props = defineProps({
  variant: {
    type: String,
    default: 'desktop' // 'desktop' ou 'modal'
  }
})

const identity = useAnalyticsIdentity()
const attribution = useAttribution()
let activeSubmissionId = null

const mediaUploaderRef = ref(null)

// Estado do formulário em 2 passos
const currentStep = ref(1)
const formData = ref({
  // Passo 1 - Obrigatórios
  nome: '',
  cidade: '',
  telefone: '',
  // Passo 2 - Opcionais
  bairro: '',
  servico: '',
  email: '',
  mensagem: ''
})

const isSubmitting = ref(false)
const isSubmitted = ref(false)

// Validação estrita do passo 1 (Nome >= 2 chars e Telefone 10-11 dígitos)
const canContinue = computed(() => {
  const cleanNome = (formData.value.nome || '').trim()
  const rawDigits = (formData.value.telefone || '').replace(/\D/g, '')
  const cleanDigits = rawDigits.startsWith('55') && rawDigits.length >= 12 ? rawDigits.slice(2) : (rawDigits.startsWith('0') ? rawDigits.slice(1) : rawDigits)
  return cleanNome.length >= 2 && cleanDigits.length >= 10 && cleanDigits.length <= 11
})

// Ir para passo 2 (opcional)
const goToStep2 = () => {
  if (canContinue.value) {
    currentStep.value = 2
  } else {
    alert('Por favor, preencha seu nome e um WhatsApp/telefone válido com DDD.')
  }
}

// Voltar para passo 1
const goToStep1 = () => {
  currentStep.value = 1
}

// Enviar formulário (envia lead, aciona upload de mídias e redireciona para obrigado)
const submitLead = async () => {
  if (!canContinue.value || isSubmitting.value) {
    if (!canContinue.value) alert('Por favor, preencha nome e telefone com DDD.')
    return
  }

  isSubmitting.value = true
  
  try {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : 'home'
    const visitorId = identity.getOrCreateVisitorId()
    const { sessionId } = identity.getOrCreateSessionId(currentPath)
    const landingPath = identity.getSessionLandingPath(currentPath)
    const attr = attribution.getOrInitAttribution()
    const firstTouch = identity.getFirstTouchChannel()

    if (!activeSubmissionId) {
      activeSubmissionId = identity.generateUUID()
    }

    // 1. Enviar lead comercial para API (/api/send-lead)
    const response = await $fetch('/api/send-lead', {
      method: 'POST',
      body: {
        submission_id: activeSubmissionId,
        visitor_id: visitorId,
        session_id: sessionId,
        landing_path: landingPath,
        conversion_path: currentPath,
        channel: attr.channel,
        first_touch_channel: firstTouch,
        utm_source: attr.utm_source,
        utm_medium: attr.utm_medium,
        utm_campaign: attr.utm_campaign,
        utm_content: attr.utm_content,
        utm_term: attr.utm_term,
        gclid: attr.gclid,
        nome: formData.value.nome,
        cidade: formData.value.cidade || 'São Paulo',
        bairro: formData.value.bairro || '',
        servico: formData.value.servico || 'Não especificado',
        telefone: formData.value.telefone || '',
        email: formData.value.email || '',
        mensagem: formData.value.mensagem || '',
        origem: 'formulario_hero_' + currentPath,
        media_selection_summary: (mediaUploaderRef.value?.photos?.length || mediaUploaderRef.value?.videos?.length)
          ? {
              photoCount: mediaUploaderRef.value.photos?.length || 0,
              videoCount: mediaUploaderRef.value.videos?.length || 0
            }
          : null
      }
    })

    // 2. Se houver fotos/vídeos selecionados e uploadToken retornado, envia diretamente ao R2
    if (response?.success) {
      if (mediaUploaderRef.value?.hasFiles && response.uploadToken) {
        try {
          await mediaUploaderRef.value.uploadAllMedia(response.uploadToken)
        } catch (mediaErr) {
          console.warn('[LeadForm] Erro no upload de mídias:', mediaErr)
        }
      }

      activeSubmissionId = null
      await navigateTo('/obrigado')
    }
  } catch (error) {
    console.error('Erro ao enviar lead:', error)
    
    // Fallback: abrir WhatsApp se a requisição falhar
    let message = `Olá! Meu nome é ${formData.value.nome}, moro em ${formData.value.cidade}`
    
    if (formData.value.bairro) {
      message += `, região ${formData.value.bairro}`
    }
    
    message += `.`
    
    if (formData.value.servico) {
      message += ` Gostaria de um orçamento para: ${formData.value.servico}.`
    } else {
      message += ` Gostaria de um orçamento para telas mosquiteiras. Vim pelo site: https://www.adtelasmosquiteiras.com.br`
    }
    
    const whatsappUrl = `https://wa.me/5511983586611?text=${encodeURIComponent(message)}`
    
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank')
    }
    
    alert('Não foi possível enviar pelo formulário, mas você pode continuar pelo WhatsApp.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    data-cta-location="quote_form"
    :class="[
      'bg-white rounded-xl shadow-lg border border-gray-200',
      variant === 'desktop' ? 'p-6' : 'p-5'
    ]"
  >
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
        Resposta em alguns minutos
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
        {{ currentStep === 1 ? 'Passo 1 - Dados Rápidos' : 'Passo 2 - Detalhes e Fotos (Opcional)' }}
      </p>
    </div>

    <!-- Form -->
    <form @submit.prevent="submitLead" class="space-y-4">
      
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

        <!-- Telefone -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp / Telefone <span class="text-xs font-normal text-gray-500">(opcional)</span>
          </label>
          <input
            v-model="formData.telefone"
            type="tel"
            placeholder="(11) 98765-4321"
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

        <!-- Botão Continuar / Enviar -->
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
          
          <Icon v-else name="lucide:send" class="w-5 h-5" />

          <span v-if="isSubmitting">Enviando...</span>
          <span v-else-if="isSubmitted">Enviado!</span>
          <span v-else>Solicitar Orçamento</span>
        </button>

        <!-- Link para passo 2 (opcional) -->
        <button
          type="button"
          @click="goToStep2"
          :disabled="!canContinue"
          class="w-full text-sm text-gray-600 hover:text-primary underline transition-colors"
        >
          Ou adicionar fotos e detalhes para orçamento mais preciso
        </button>
      </div>

      <!-- ========== PASSO 2: DETALHES OPCIONAIS ========== -->
      <div v-show="currentStep === 2" class="space-y-4">
        <!-- Aviso de Opcional -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-xs text-blue-800 text-center">
            <strong>Opcional</strong> — Ajuda a enviar um orçamento mais rápido e preciso
          </p>
        </div>

        <!-- E-mail -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            E-mail <span class="text-gray-400 text-xs">(opcional)</span>
          </label>
          <input
            v-model="formData.email"
            type="email"
            placeholder="seuemail@exemplo.com"
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300 text-sm"
          />
        </div>

        <!-- Região / Endereço -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Região / Endereço <span class="text-gray-400 text-xs">(opcional)</span>
          </label>
          <input
            v-model="formData.bairro"
            type="text"
            placeholder="Ex: Zona Sul, Moema, Centro"
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300 text-sm"
          />
        </div>

        <!-- Tipo de Serviço -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Serviço <span class="text-gray-400 text-xs">(opcional)</span>
          </label>
          <select
            v-model="formData.servico"
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300 text-sm"
          >
            <option value="">Selecione um serviço</option>
            <option value="Telas Mosquiteiras">Telas Mosquiteiras</option>
            <option value="Redes de Proteção">Redes de Proteção</option>
            <option value="Telas Pet Screen">Telas Pet Screen</option>
            <option value="Redes para Crianças">Redes para Crianças</option>
            <option value="Redes para Pets">Redes para Pets</option>
            <option value="Telas Removíveis">Telas Removíveis</option>
            <option value="Outro">Outro serviço</option>
          </select>
        </div>

        <!-- Mensagem / Observações -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Mensagem ou observações <span class="text-gray-400 text-xs">(opcional)</span>
          </label>
          <textarea
            v-model="formData.mensagem"
            rows="3"
            maxlength="1500"
            placeholder="Conte um pouco sobre o que você precisa, medidas aproximadas, quantidade de janelas..."
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300 text-sm resize-y"
          ></textarea>
        </div>

        <!-- Uploader de Fotos e Vídeos -->
        <MediaUploader ref="mediaUploaderRef" :max-photos="4" :max-videos="2" />

        <!-- Botões -->
        <div class="flex gap-2 pt-2">
          <!-- Voltar -->
          <button
            type="button"
            @click="goToStep1"
            class="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-1 text-sm"
          >
            <Icon name="lucide:arrow-left" class="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <!-- Enviar -->
          <button
            type="submit"
            :disabled="isSubmitting || isSubmitted"
            :class="[
              'flex-[2] font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 py-3 text-base',
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
            
            <Icon v-else name="lucide:send" class="w-5 h-5" />

            <span v-if="isSubmitting">Enviando...</span>
            <span v-else-if="isSubmitted">Enviado!</span>
            <span v-else>Enviar Solicitação</span>
          </button>
        </div>
      </div>

    </form>

    <!-- Trust Indicators -->
    <div class="mt-4 pt-4 border-t border-gray-100">
      <div class="flex items-center justify-center gap-4 text-xs text-gray-500">
        <div class="flex items-center gap-1">
          <Icon name="lucide:shield-check" class="w-3.5 h-3.5 text-green-500" />
          <span>Mais Segurança</span>
        </div>
        <div class="flex items-center gap-1">
          <Icon name="lucide:lock" class="w-3.5 h-3.5 text-blue-500" />
          <span>Sem Spam</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
