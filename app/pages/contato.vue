<script setup>
import { ref } from 'vue'

// SEO
useHead({
  title: 'Contato - AD Telas e Redes | Orçamento Grátis',
  meta: [
    { name: 'description', content: 'Entre em contato com a AD Telas e Redes. WhatsApp, telefone, formulário. Atendimento rápido em São Paulo. Orçamento grátis!' },
    { property: 'og:title', content: 'Contato - AD Telas e Redes' },
    { property: 'og:description', content: 'Fale conosco via WhatsApp, telefone ou formulário. Resposta rápida garantida!' }
  ]
})

// Dados de contato
const WHATSAPP_NUMBER = '5511983586611'
const PHONE_DISPLAY = '(11) 98358-6611'
const EMAIL = 'vendas.adtelaseredes@gmail.com'
const ADDRESS = 'São Paulo - SP'

// Estado do formulário
const formData = ref({
  nome: '',
  telefone: '',
  email: '',
  cidade: '',
  mensagem: ''
})

const mediaUploaderRef = ref(null)
const isSubmitting = ref(false)
const isSubmitted = ref(false)
const { redirectToThankYou } = useFormSubmit()

// Enviar para WhatsApp / Formulário
const sendToWhatsApp = async () => {
  const cleanNome = (formData.value.nome || '').trim()
  if (cleanNome.length < 2) {
    alert('Por favor, informe seu nome completo (mínimo 2 caracteres).')
    return
  }

  const digits = (formData.value.telefone || '').replace(/\D/g, '')
  const cleanDigits = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : (digits.startsWith('0') ? digits.slice(1) : digits)
  if (cleanDigits.length < 10 || cleanDigits.length > 11) {
    alert('Por favor, informe um telefone/WhatsApp válido com DDD (10 ou 11 dígitos).')
    return
  }

  isSubmitting.value = true
  try {
    await redirectToThankYou(formData.value, mediaUploaderRef)
  } catch {
    console.error('[ContatoPage] Erro ao enviar contato')
  } finally {
    isSubmitting.value = false
  }
}

// Links diretos
const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de solicitar um orçamento.')}`
const phoneLink = `tel:+${WHATSAPP_NUMBER}`
const emailLink = `mailto:${EMAIL}`
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Contato -->
    <section class="bg-gradient-to-br from-[#1D7BA6] to-[#0F4F7D] text-white py-10 sm:py-14 md:py-20 mt-16 md:mt-24">
      <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-2xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-4">
            Entre em Contato
          </h1>
          <p class="text-sm sm:text-base md:text-xl text-white/90 max-w-2xl mx-auto">
            Estamos prontos para atender você. Escolha a forma de contato que preferir!
          </p>
        </div>
      </div>
    </section>

    <!-- Conteúdo Principal -->
    <section class="py-8 sm:py-12 md:py-16">
      <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start">
          
          <!-- Coluna Esquerda - Informações de Contato -->
          <div class="space-y-4 sm:space-y-6">
            <div>
              <h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Fale Conosco
              </h2>
              <p class="text-xs sm:text-sm text-gray-600">
                Resposta rápida garantida! Atendemos de segunda a sábado.
              </p>
            </div>

            <!-- Cards de Contato -->
            <div class="space-y-3 sm:space-y-4">
              <!-- WhatsApp -->
              <a 
                :href="whatsappLink" 
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center p-3.5 sm:p-5 bg-gradient-to-r from-[#25D366] to-[#20BA5A] text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-[1.01] active:scale-98"
              >
                <div class="w-11 h-11 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <WhatsappIcon class="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs text-white/80 font-medium">WhatsApp Oficial</div>
                  <div class="text-base sm:text-lg font-bold truncate">{{ PHONE_DISPLAY }}</div>
                  <div class="text-xs text-white/90">Atendimento Imediato</div>
                </div>
                <Icon name="lucide:arrow-right" class="w-5 h-5 opacity-75 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </a>

              <!-- Telefone -->
              <a 
                :href="phoneLink"
                class="flex items-center p-3.5 sm:p-5 bg-white border-2 border-gray-200 hover:border-[#1D7BA6] text-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group hover:scale-[1.01] active:scale-98"
              >
                <div class="w-11 h-11 sm:w-12 sm:h-12 bg-[#1D7BA6]/10 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 text-[#1D7BA6]">
                  <Icon name="lucide:phone" class="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs text-gray-500 font-medium">Ligue para nós</div>
                  <div class="text-base sm:text-lg font-bold truncate text-[#1D7BA6]">{{ PHONE_DISPLAY }}</div>
                  <div class="text-xs text-gray-600">Seg a Sáb: 8h às 18h</div>
                </div>
                <Icon name="lucide:arrow-right" class="w-5 h-5 text-gray-400 group-hover:text-[#1D7BA6] group-hover:translate-x-1 transition-all flex-shrink-0" />
              </a>

              <!-- E-mail -->
              <a 
                :href="emailLink"
                class="flex items-center p-3.5 sm:p-5 bg-white border-2 border-gray-200 hover:border-[#1D7BA6] text-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group hover:scale-[1.01] active:scale-98"
              >
                <div class="w-11 h-11 sm:w-12 sm:h-12 bg-[#1D7BA6]/10 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 text-[#1D7BA6]">
                  <Icon name="lucide:mail" class="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs text-gray-500 font-medium">E-mail Comercial</div>
                  <div class="text-xs sm:text-sm font-bold truncate text-gray-900">{{ EMAIL }}</div>
                  <div class="text-xs text-gray-600">Retorno em até 24h</div>
                </div>
                <Icon name="lucide:arrow-right" class="w-5 h-5 text-gray-400 group-hover:text-[#1D7BA6] group-hover:translate-x-1 transition-all flex-shrink-0" />
              </a>

              <!-- Endereço -->
              <div class="flex items-center p-3.5 sm:p-5 bg-white border-2 border-gray-200 text-gray-900 rounded-2xl shadow-sm">
                <div class="w-11 h-11 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 text-gray-600">
                  <Icon name="lucide:map-pin" class="w-5 h-5 sm:w-6 sm:h-6 text-[#F49A1A]" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs text-gray-500 font-medium">Localização</div>
                  <div class="text-base font-bold text-gray-900">{{ ADDRESS }}</div>
                  <div class="text-xs text-gray-600">Atendemos 19 cidades da Grande SP</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Coluna Direita - Formulário -->
          <div>
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-3.5 sm:p-6 md:p-8">
              <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                Envie sua Mensagem
              </h2>
              <p class="text-xs sm:text-sm text-gray-600 mb-5">
                Preencha o formulário e entraremos em contato rapidamente
              </p>

              <form @submit.prevent="sendToWhatsApp" class="space-y-4">
                <!-- Nome -->
                <div>
                  <label class="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Nome Completo <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.nome"
                    type="text"
                    required
                    placeholder="Seu nome"
                    class="w-full px-3.5 sm:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all text-base"
                  />
                </div>

                <!-- Telefone -->
                <div>
                  <label class="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Telefone/WhatsApp <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.telefone"
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    class="w-full px-3.5 sm:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all text-base"
                  />
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Email <span class="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <input
                    v-model="formData.email"
                    type="email"
                    placeholder="seu@email.com"
                    class="w-full px-3.5 sm:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all text-base"
                  />
                </div>

                <!-- Cidade -->
                <div>
                  <label class="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Cidade <span class="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <input
                    v-model="formData.cidade"
                    type="text"
                    placeholder="Ex: São Paulo"
                    class="w-full px-3.5 sm:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all text-base"
                  />
                </div>

                <!-- Mensagem -->
                <div>
                  <label class="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Mensagem <span class="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <textarea
                    v-model="formData.mensagem"
                    rows="3"
                    maxlength="1500"
                    placeholder="Conte um pouco sobre o que você precisa, medidas aproximadas ou outras informações..."
                    class="w-full px-3.5 sm:px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all resize-y text-base"
                  ></textarea>
                </div>

                <!-- Fotos e Vídeos do Local -->
                <MediaUploader ref="mediaUploaderRef" :max-photos="4" :max-videos="2" />

                <!-- Botão Enviar -->
                <button
                  type="submit"
                  :disabled="isSubmitting || isSubmitted"
                  class="w-full min-h-[50px] px-4 sm:px-6 py-3.5 bg-[#25D366] hover:bg-[#20B858] text-white rounded-xl font-bold text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <svg v-if="isSubmitting" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  
                  <svg v-else-if="isSubmitted" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  
                  <WhatsappIcon v-else class="w-5 h-5" />

                  <span v-if="isSubmitting">Enviando...</span>
                  <span v-else-if="isSubmitted">Enviado!</span>
                  <span v-else>Enviar Mensagem</span>
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  </div>
</template>
