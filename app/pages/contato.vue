<script setup>
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

const isSubmitting = ref(false)
const isSubmitted = ref(false)
const { redirectToThankYou } = useFormSubmit()

// Enviar para WhatsApp
const sendToWhatsApp = async () => {
  if (!formData.value.nome || !formData.value.telefone) {
    alert('Por favor, preencha pelo menos nome e telefone.')
    return
  }
  try {
    await redirectToThankYou(formData.value)
  } catch (e) {
    console.error('Erro ao enviar contato:', e)
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
    <section class="bg-gradient-to-br from-[#1D7BA6] to-[#0F4F7D] text-white py-16 md:py-24 mt-28 md:mt-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-3xl md:text-5xl font-bold mb-4">
            Entre em Contato
          </h1>
          <p class="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Estamos prontos para atender você. Escolha a forma de contato que preferir!
          </p>
        </div>
      </div>
    </section>

    <!-- Conteúdo Principal -->
    <section class="py-12 md:py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-8 lg:gap-12">
          
          <!-- Coluna Esquerda - Informações de Contato -->
          <div class="space-y-6">
            <!-- Título -->
            <div>
              <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Fale Conosco
              </h2>
              <p class="text-gray-600">
                Resposta rápida garantida! Atendemos de segunda a sábado.
              </p>
            </div>

            <!-- Cards de Contato -->
            <div class="space-y-4">
              
              <!-- WhatsApp -->
              <a 
                :href="whatsappLink"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-start gap-4 p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-[#25D366] group"
              >
                <div class="flex-shrink-0 w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <WhatsappIcon class="w-6 h-6 text-white" />
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-gray-900 mb-1">WhatsApp</h3>
                  <p class="text-gray-600 text-sm mb-2">Resposta mais rápida</p>
                  <p class="text-[#25D366] font-semibold">{{ PHONE_DISPLAY }}</p>
                </div>
                <Icon name="lucide:arrow-right" class="w-5 h-5 text-gray-400 group-hover:text-[#25D366] group-hover:translate-x-1 transition-all" />
              </a>

              <!-- Telefone -->
              <a 
                :href="phoneLink"
                class="flex items-start gap-4 p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-blue-500 group"
              >
                <div class="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="lucide:phone" class="w-6 h-6 text-white" />
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-gray-900 mb-1">Telefone</h3>
                  <p class="text-gray-600 text-sm mb-2">Ligue agora</p>
                  <p class="text-blue-600 font-semibold">{{ PHONE_DISPLAY }}</p>
                </div>
                <Icon name="lucide:arrow-right" class="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </a>

              <!-- Email -->
              <a 
                :href="emailLink"
                class="flex items-start gap-4 p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-orange-500 group"
              >
                <div class="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="lucide:mail" class="w-6 h-6 text-white" />
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-gray-900 mb-1">Email</h3>
                  <p class="text-gray-600 text-sm mb-2">Envie sua mensagem</p>
                  <p class="text-orange-600 font-semibold break-all" v-html="`<!--email_off-->${EMAIL}<!--/email_off-->`"></p>
                </div>
                <Icon name="lucide:arrow-right" class="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
              </a>

              <!-- Localização -->
              <div class="flex items-start gap-4 p-6 bg-white rounded-xl shadow-md">
                <div class="flex-shrink-0 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <Icon name="lucide:map-pin" class="w-6 h-6 text-white" />
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-gray-900 mb-1">Localização</h3>
                  <p class="text-gray-600 text-sm mb-2">Atendemos toda região</p>
                  <p class="text-purple-600 font-semibold">{{ ADDRESS }}</p>
                </div>
              </div>
            </div>

            <!-- Horário de Atendimento -->
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div class="flex items-start gap-3">
                <Icon name="lucide:clock" class="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 class="text-lg font-bold text-gray-900 mb-2">Horário de Atendimento</h3>
                  <div class="space-y-1 text-sm text-gray-700">
                    <p><strong>Segunda a Sexta:</strong> 8h às 18h</p>
                    <p><strong>Sábado:</strong> 8h às 13h</p>
                    <p><strong>Domingo:</strong> Fechado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Coluna Direita - Formulário -->
          <div>
            <div class="bg-white rounded-xl shadow-lg p-6 md:p-8 sticky top-32">
              <h2 class="text-2xl font-bold text-gray-900 mb-2">
                Envie sua Mensagem
              </h2>
              <p class="text-gray-600 mb-6">
                Preencha o formulário e entraremos em contato rapidamente
              </p>

              <form @submit.prevent="sendToWhatsApp" class="space-y-4">
                <!-- Nome -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.nome"
                    type="text"
                    required
                    placeholder="Seu nome"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all"
                  />
                </div>

                <!-- Telefone -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Telefone/WhatsApp <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.telefone"
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all"
                  />
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Email <span class="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <input
                    v-model="formData.email"
                    type="email"
                    placeholder="seu@email.com"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all"
                  />
                </div>

                <!-- Cidade -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Cidade <span class="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <input
                    v-model="formData.cidade"
                    type="text"
                    placeholder="Ex: São Paulo"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all"
                  />
                </div>

                <!-- Mensagem -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem <span class="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <textarea
                    v-model="formData.mensagem"
                    rows="4"
                    placeholder="Conte-nos sobre seu projeto ou dúvida..."
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all resize-none"
                  ></textarea>
                </div>

                <!-- Botão Enviar -->
                <button
                  type="submit"
                  :disabled="isSubmitting || isSubmitted"
                  :class="[
                    'w-full py-4 rounded-lg font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2',
                    isSubmitted
                      ? 'bg-green-500 text-white cursor-default'
                      : 'bg-[#25D366] hover:bg-[#1fb854] text-white hover:shadow-lg hover:scale-[1.02] active:scale-95'
                  ]"
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
                  <span v-else>Enviar via WhatsApp</span>
                </button>

                <!-- Trust Indicators -->
                <div class="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2">
                  <div class="flex items-center gap-1">
                    <Icon name="lucide:shield-check" class="w-4 h-4 text-green-500" />
                    <span>Mais Segurança</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Icon name="lucide:zap" class="w-4 h-4 text-yellow-500" />
                    <span>Resposta Rápida</span>
                  </div>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>

  </div>
</template>
