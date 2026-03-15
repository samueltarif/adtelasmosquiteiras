<script setup>
import { ref } from 'vue'

// SEO
useHead({
  title: 'Contato - AD Telas e Redes | Orçamento Grátis',
  meta: [
    { name: 'description', content: 'Entre em contato com a AD Telas e Redes. WhatsApp, telefone, formulário. Atendimento rápido em São Paulo. Orçamento grátis!' },
    { name: 'keywords', content: 'contato ad telas, orçamento telas, whatsapp telas, telefone ad telas' },
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
  isSubmitting.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  isSubmitting.value = false
  isSubmitted.value = true
  redirectToThankYou(formData.value)
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
                  <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
                  </svg>
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
                  <p class="text-orange-600 font-semibold break-all">{{ EMAIL }}</p>
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
                  
                  <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
                  </svg>

                  <span v-if="isSubmitting">Enviando...</span>
                  <span v-else-if="isSubmitted">Enviado!</span>
                  <span v-else>Enviar via WhatsApp</span>
                </button>

                <!-- Trust Indicators -->
                <div class="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2">
                  <div class="flex items-center gap-1">
                    <Icon name="lucide:shield-check" class="w-4 h-4 text-green-500" />
                    <span>100% Seguro</span>
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

    <!-- CTA Final -->
    <CtaSection />
  </div>
</template>
