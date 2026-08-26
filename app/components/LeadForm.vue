<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFormSubmit } from '~/composables/useFormSubmit'
import { getServiceFromPath } from '~/utils/ctaTaxonomy'
import MediaUploader from '~/components/MediaUploader.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'desktop' // 'desktop' ou 'modal'
  },
  serviceName: {
    type: String,
    default: ''
  },
  serviceKey: {
    type: String,
    default: ''
  }
})

const route = useRoute()
const { isSubmitting, redirectToThankYou } = useFormSubmit()
const submitError = ref(false)
const mediaUploaderRef = ref(null)

// Estado do formulário em 2 passos
const currentStep = ref(1)
const formData = ref({
  // Passo 1 - Obrigatórios
  nome: '',
  telefone: '',
  cidade: 'São Paulo',
  // Passo 2 - Opcionais
  bairro: '',
  servico: '',
  email: '',
  mensagem: ''
})

// Auto-detectar serviço a partir de props ou rota atual
function initializeService() {
  if (props.serviceName) {
    formData.value.servico = props.serviceName
    return
  }
  const detected = getServiceFromPath(route.path)
  if (detected?.name) {
    formData.value.servico = detected.name
  }
}

onMounted(() => {
  initializeService()
})

watch(() => props.serviceName, (newVal) => {
  if (newVal) formData.value.servico = newVal
})

watch(() => route.path, () => {
  initializeService()
})

// Validação estrita do passo 1 (Nome >= 2 chars e Telefone 10-11 dígitos)
const canContinue = computed(() => {
  const cleanNome = (formData.value.nome || '').trim()
  const rawDigits = (formData.value.telefone || '').replace(/\D/g, '')
  const cleanDigits = rawDigits.startsWith('55') && rawDigits.length >= 12 
    ? rawDigits.slice(2) 
    : (rawDigits.startsWith('0') ? rawDigits.slice(1) : rawDigits)
  return cleanNome.length >= 2 && cleanDigits.length >= 10 && cleanDigits.length <= 11
})

// Ir para passo 2 (opcional)
const goToStep2 = () => {
  if (canContinue.value) {
    currentStep.value = 2
  } else {
    alert('Por favor, informe seu nome e um WhatsApp/telefone válido com DDD (10 ou 11 dígitos).')
  }
}

// Voltar para passo 1
const goToStep1 = () => {
  currentStep.value = 1
}

// Enviar formulário através do pipeline canônico de useFormSubmit
const submitLead = async () => {
  submitError.value = false

  const cleanNome = (formData.value.nome || '').trim()
  if (cleanNome.length < 2) {
    alert('Por favor, informe seu nome completo (mínimo 2 caracteres).')
    return
  }

  const digits = (formData.value.telefone || '').replace(/\D/g, '')
  const cleanDigits = digits.startsWith('55') && digits.length >= 12 
    ? digits.slice(2) 
    : (digits.startsWith('0') ? digits.slice(1) : digits)
  if (cleanDigits.length < 10 || cleanDigits.length > 11) {
    alert('Por favor, informe um WhatsApp/telefone válido com DDD (10 ou 11 dígitos).')
    return
  }

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
  const detected = getServiceFromPath(currentPath)
  const effectiveServico = formData.value.servico || detected?.name || 'Não especificado'

  const payload = {
    nome: cleanNome,
    telefone: cleanDigits,
    cidade: formData.value.cidade || 'São Paulo',
    bairro: formData.value.bairro || '',
    servico: effectiveServico,
    email: formData.value.email || '',
    mensagem: formData.value.mensagem || '',
    origem: (props.variant === 'modal' ? 'formulario_modal_' : 'formulario_servico_') + currentPath
  }

  try {
    await redirectToThankYou(payload, mediaUploaderRef)
  } catch (error) {
    console.error('[LeadForm] Erro ao enviar formulário:', error)
    submitError.value = true
  }
}
</script>

<template>
  <div
    data-cta-location="quote_form"
    :class="[
      'bg-white rounded-xl shadow-lg border border-gray-200',
      variant === 'desktop' ? 'p-6' : 'p-4 sm:p-5'
    ]"
  >
    <!-- Header (Exibido apenas na variante desktop para evitar duplicação no modal) -->
    <div v-if="variant === 'desktop'" class="text-center mb-5">
      <h3 class="font-bold text-gray-800 mb-2 text-xl">
        Orçamento Grátis
      </h3>
      <p class="text-gray-600 text-sm">
        Resposta em alguns minutos
      </p>
    </div>

    <!-- Indicador de Passos -->
    <div class="mb-5">
      <div class="flex items-center justify-center gap-2">
        <div :class="[
          'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all',
          currentStep === 1 ? 'bg-[#25D366] text-white ring-2 ring-[#25D366]/30' : 'bg-green-100 text-green-700'
        ]">
          <svg v-if="currentStep === 2" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          <span v-else>1</span>
        </div>
        <div class="w-10 h-0.5 bg-gray-200"></div>
        <div :class="[
          'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all',
          currentStep === 2 ? 'bg-[#25D366] text-white ring-2 ring-[#25D366]/30' : 'bg-gray-100 text-gray-500'
        ]">
          2
        </div>
      </div>
      <p class="text-xs text-center text-gray-500 mt-2 font-medium">
        {{ currentStep === 1 ? 'Passo 1 — Dados Rápidos' : 'Passo 2 — Detalhes e Fotos (Opcional)' }}
      </p>
    </div>

    <!-- Feedback de Erro -->
    <div v-if="submitError" class="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm">
      Ocorreu um erro ao enviar seu formulário. Por favor, tente novamente ou fale conosco diretamente pelo WhatsApp.
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
            placeholder="Digite seu nome completo"
            required
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300 text-base"
          />
        </div>

        <!-- Telefone / WhatsApp -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp / Telefone <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.telefone"
            type="tel"
            placeholder="(11) 98765-4321"
            required
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300 text-base"
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
            placeholder="Ex: São Paulo, Santo André, Campinas..."
            required
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300 text-base"
          />
        </div>

        <!-- Botão Enviar Rápido -->
        <button
          type="submit"
          :disabled="!canContinue || isSubmitting"
          :class="[
            'w-full font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md min-h-[48px]',
            variant === 'desktop' ? 'py-4 text-lg' : 'py-3.5 text-base',
            canContinue && !isSubmitting
              ? 'bg-[#25D366] hover:bg-[#1fb854] text-white hover:shadow-lg active:scale-[0.98]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
        >
          <svg v-if="isSubmitting" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <Icon v-else name="lucide:send" class="w-5 h-5" />

          <span>{{ isSubmitting ? 'Enviando Orçamento...' : 'Solicitar Orçamento Grátis' }}</span>
        </button>

        <!-- Link para passo 2 (opcional) -->
        <button
          type="button"
          @click="goToStep2"
          :disabled="!canContinue"
          class="w-full text-xs sm:text-sm text-gray-600 hover:text-[#22345F] underline transition-colors pt-1 text-center font-medium disabled:opacity-50 disabled:no-underline"
        >
          Ou adicionar fotos e detalhes para orçamento mais preciso &rarr;
        </button>
      </div>

      <!-- ========== PASSO 2: DETALHES OPCIONAIS ========== -->
      <div v-show="currentStep === 2" class="space-y-4">
        <!-- Aviso de Opcional -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p class="text-xs text-blue-900 text-center">
            <strong>Opcional</strong> — Ajuda nossa equipe a enviar um orçamento exato e rápido.
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
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300 text-base"
          />
        </div>

        <!-- Região / Endereço / Bairro -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Bairro ou Região <span class="text-gray-400 text-xs">(opcional)</span>
          </label>
          <input
            v-model="formData.bairro"
            type="text"
            placeholder="Ex: Moema, Pinheiros, Centro..."
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300 text-base"
          />
        </div>

        <!-- Tipo de Serviço -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Serviço <span class="text-gray-400 text-xs">(opcional)</span>
          </label>
          <select
            v-model="formData.servico"
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300 text-base bg-white"
          >
            <option value="">Selecione um serviço</option>
            <option value="Telas Mosquiteiras">Telas Mosquiteiras</option>
            <option value="Telas Mosquiteiras para Janelas">Telas Mosquiteiras para Janelas</option>
            <option value="Telas Mosquiteiras para Portas">Telas Mosquiteiras para Portas</option>
            <option value="Telas Mosquiteiras Pet Screen">Telas Mosquiteiras Pet Screen</option>
            <option value="Telas Mosquiteiras Removíveis">Telas Mosquiteiras Removíveis</option>
            <option value="Telas Mosquiteiras para Sacadas">Telas Mosquiteiras para Sacadas</option>
            <option value="Redes de Proteção">Redes de Proteção</option>
            <option value="Redes de Proteção para Janelas">Redes de Proteção para Janelas</option>
            <option value="Redes de Proteção para Sacadas e Varandas">Redes de Proteção para Sacadas e Varandas</option>
            <option value="Redes de Proteção para Gatos e Pets">Redes de Proteção para Gatos e Pets</option>
            <option value="Redes de Proteção para Crianças">Redes de Proteção para Crianças</option>
            <option value="Redes de Proteção para Escadas e Mezaninos">Redes de Proteção para Escadas e Mezaninos</option>
            <option value="Serviços de Vidraçaria">Serviços de Vidraçaria</option>
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
            class="form-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all duration-300 text-base resize-y"
          ></textarea>
        </div>

        <!-- Uploader de Fotos e Vídeos (Cloudflare R2 Privado) -->
        <MediaUploader ref="mediaUploaderRef" :max-photos="4" :max-videos="2" />

        <!-- Botões de Ação do Passo 2 -->
        <div class="flex gap-2.5 pt-2">
          <!-- Voltar ao Passo 1 -->
          <button
            type="button"
            @click="goToStep1"
            :disabled="isSubmitting"
            class="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-1 text-sm min-h-[48px]"
          >
            <Icon name="lucide:arrow-left" class="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <!-- Enviar Completo -->
          <button
            type="submit"
            :disabled="isSubmitting"
            :class="[
              'flex-[2] font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 py-3.5 text-base shadow-md min-h-[48px]',
              !isSubmitting
                ? 'bg-[#25D366] hover:bg-[#1fb854] text-white hover:shadow-lg active:scale-[0.98]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            <svg v-if="isSubmitting" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <Icon v-else name="lucide:send" class="w-5 h-5" />

            <span>{{ isSubmitting ? 'Enviando...' : 'Enviar Solicitação Completa' }}</span>
          </button>
        </div>
      </div>

    </form>

    <!-- Trust Indicators -->
    <div class="mt-4 pt-4 border-t border-gray-100">
      <div class="flex items-center justify-center gap-4 text-xs text-gray-500">
        <div class="flex items-center gap-1">
          <Icon name="lucide:shield-check" class="w-3.5 h-3.5 text-green-500" />
          <span>Atendimento Rápido</span>
        </div>
        <div class="flex items-center gap-1">
          <Icon name="lucide:lock" class="w-3.5 h-3.5 text-blue-500" />
          <span>Privacidade Garantida</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
</style>
