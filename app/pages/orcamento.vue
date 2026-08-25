<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Carrosseis do hero
const heroCarousels = [
  {
    label: 'Telas Mosquiteiras',
    link: '/servicos/telas',
    images: [
      '/images/tela_mosquiteira.png',
      '/images/mosquiteira_janela.png',
      '/images/mosquiteira_area_externa.png',
      '/images/mosquiteira_para_porta.png',
      '/images/mosquiteira_removivel.png',
    ]
  },
  {
    label: 'Redes de Proteção',
    link: '/servicos/redes',
    images: [
      '/images/redes_para_sacadas.jpg',
      '/images/redes_para_janelas.png',
      '/images/redes_para_criancas.png',
      '/images/redes_para_apartamentos.png',
      '/images/redes_para_coberturas.jpg',
    ]
  },
  {
    label: 'Diversos',
    link: '/servicos/telas',
    images: [
      '/images/telas_para_sacadas.jpg',
      '/images/telas_para_varandas.jpg',
      '/images/telas_pet_screen_especificacoes.jpg',
      '/images/telas_para_apartamento.jpg',
      '/images/telas_removiveis_especificacoes.jpg',
    ]
  }
]

const carouselIndexes = ref([0, 0, 0])
let carouselTimers = []

onMounted(() => {
  heroCarousels.forEach((_, i) => {
    const offset = i * 1200
    carouselTimers.push(setTimeout(() => {
      carouselTimers.push(setInterval(() => {
        carouselIndexes.value[i] = (carouselIndexes.value[i] + 1) % heroCarousels[i].images.length
      }, 3500))
    }, offset))
  })
})

onUnmounted(() => {
  carouselTimers.forEach(t => clearTimeout(t) || clearInterval(t))
})

// SEO
useHead({
  title: 'Solicitar Orçamento Grátis | AD Telas e Redes SP',
  meta: [
    { name: 'description', content: 'Solicite seu orçamento grátis de telas mosquiteiras e redes de proteção. Atendimento rápido via WhatsApp, telefone ou formulário. Instalação em 24h.' },
    { property: 'og:title', content: 'Orçamento Grátis - AD Telas e Redes' },
    { property: 'og:description', content: 'Receba seu orçamento em minutos. WhatsApp, telefone ou formulário online.' }
  ]
})

// Estado do formulário
const formData = ref({
  nome: '',
  telefone: '',
  email: '',
  cidade: 'São Paulo',
  bairro: '',
  servico: '',
  mensagem: ''
})

const mediaUploaderRef = ref(null)
const { isSubmitting, redirectToThankYou } = useFormSubmit()
const submitError = ref(false)

// Opções de serviços
const servicosOptions = [
  'Telas Mosquiteiras',
  'Redes de Proteção',
  'Telas Pet Screen',
  'Redes para Crianças',
  'Redes para Pets',
  'Telas Removíveis',
  'Outro serviço'
]

// Submeter formulário
const submitForm = async () => {
  submitError.value = false

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

  try {
    await redirectToThankYou(formData.value, mediaUploaderRef)
  } catch (error) {
    console.error('Erro no formulário de orçamento:', error)
    submitError.value = true
  }
}

const whatsappUrl = `https://api.whatsapp.com/send/?phone=5511983586611&text=${encodeURIComponent('Olá! Gostaria de solicitar um orçamento. Vim pelo site: https://www.adtelasmosquiteiras.com.br')}&type=phone_number&app_absent=0`

const trackWhatsApp = (origem) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event: 'contact_click', method: 'whatsapp', origem })
  }
}

// Ligar
const callPhone = () => {
  window.location.href = 'tel:+5511983586611'
  
  // Tracking
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'contact_click',
      method: 'phone'
    })
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-16 md:pt-24 overflow-x-hidden">
    
    <!-- Breadcrumb -->
    <Breadcrumb />
    
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-5 sm:py-6 md:py-8">
      <div class="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl">
        <div class="flex flex-col md:flex-row md:items-center md:gap-8">
          
          <!-- Título -->
          <div class="text-center md:text-left md:flex-shrink-0 mb-4 md:mb-0">
            <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
              Orçamento<br class="hidden md:block"/> Grátis
            </h1>
            <p class="text-xs sm:text-sm text-white/80 mt-1">Resposta rápida em poucos minutos</p>
          </div>

          <!-- 3 carrosseis lado a lado -->
          <div class="grid grid-cols-3 gap-2 sm:gap-3 flex-1">
            <NuxtLink
              v-for="(carousel, i) in heroCarousels"
              :key="i"
              :to="carousel.link"
              class="card-glow relative rounded-xl overflow-hidden shadow-lg cursor-pointer group h-32 sm:h-44 md:h-56"
            >
              <transition-group name="fade">
                <img
                  v-for="(img, idx) in carousel.images"
                  v-show="carouselIndexes[i] === idx"
                  :key="img"
                  :src="img"
                  :alt="carousel.label"
                  class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </transition-group>
              <!-- Label -->
              <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 sm:p-3">
                <p class="text-white text-[10px] sm:text-xs font-bold text-center leading-tight truncate">{{ carousel.label }}</p>
              </div>
              <!-- Hover overlay -->
              <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl ring-2 ring-white/60"></div>
            </NuxtLink>
          </div>

        </div><!-- fim flex row -->
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-6 md:py-10">
      <div class="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-start">
          
          <!-- Coluna Esquerda: Formulário Comercial -->
          <div class="w-full">
            <div class="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-[#E5EDF8] p-4 sm:p-6 md:p-8">
              
              <div class="text-center mb-5 sm:mb-6">
                <h2 class="text-xl sm:text-2xl font-bold text-[#22345F] mb-1">
                  Preencha o Formulário
                </h2>
                <p class="text-[#4B5563] text-xs sm:text-sm">
                  Retornamos em alguns minutos via WhatsApp
                </p>
              </div>

              <div v-if="submitError" class="bg-red-50 border-2 border-red-200 rounded-xl p-3.5 mb-5 text-center">
                <Icon name="lucide:alert-circle" class="w-6 h-6 text-red-500 mx-auto mb-1.5" />
                <div class="text-xs sm:text-sm text-red-600 font-medium">Erro ao enviar. Tente novamente ou use nosso WhatsApp direto.</div>
              </div>

              <form @submit.prevent="submitForm" class="space-y-4">
                <div>
                  <label class="block text-xs sm:text-sm font-semibold text-[#22345F] mb-1.5">Nome Completo *</label>
                  <input
                    v-model="formData.nome"
                    type="text"
                    required
                    placeholder="Seu nome"
                    class="w-full px-3.5 sm:px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none transition-colors text-base"
                  />
                </div>

                <div>
                  <label class="block text-xs sm:text-sm font-semibold text-[#22345F] mb-1.5">WhatsApp / Telefone *</label>
                  <input
                    v-model="formData.telefone"
                    type="tel"
                    required
                    placeholder="(11) 98765-4321"
                    class="w-full px-3.5 sm:px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none transition-colors text-base"
                  />
                </div>

                <div>
                  <label class="block text-xs sm:text-sm font-semibold text-[#22345F] mb-1.5">
                    E-mail <span class="text-[11px] font-normal text-gray-500">(opcional)</span>
                  </label>
                  <input
                    v-model="formData.email"
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    class="w-full px-3.5 sm:px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none transition-colors text-base"
                  />
                </div>

                <div>
                  <label class="block text-xs sm:text-sm font-semibold text-[#22345F] mb-1.5">Bairro / Região *</label>
                  <input
                    v-model="formData.bairro"
                    type="text"
                    required
                    placeholder="Ex: Moema, Morumbi, Tatuapé, Centro"
                    class="w-full px-3.5 sm:px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none transition-colors text-base"
                  />
                </div>

                <div>
                  <label class="block text-xs sm:text-sm font-semibold text-[#22345F] mb-1.5">Serviço de Interesse *</label>
                  <select
                    v-model="formData.servico"
                    required
                    class="w-full px-3.5 sm:px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none transition-colors text-base bg-white"
                  >
                    <option value="">Selecione um serviço</option>
                    <option v-for="servico in servicosOptions" :key="servico" :value="servico">{{ servico }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs sm:text-sm font-semibold text-[#22345F] mb-1.5">
                    Mensagem ou observações <span class="text-[11px] font-normal text-gray-500">(opcional)</span>
                  </label>
                  <textarea
                    v-model="formData.mensagem"
                    rows="3"
                    maxlength="1500"
                    placeholder="Medidas aproximadas, quantidade de janelas, portas, sacadas ou detalhes para o orçamento..."
                    class="w-full px-3.5 sm:px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none transition-colors resize-y text-base"
                  ></textarea>
                </div>

                <!-- Componente de Upload de Fotos e Vídeos -->
                <MediaUploader ref="mediaUploaderRef" :max-photos="4" :max-videos="2" />

                <!-- Botão Enviar -->
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="w-full min-h-[52px] px-6 py-3.5 sm:py-4 bg-[#F49A1A] hover:bg-[#e08910] text-white rounded-xl font-bold text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Icon v-if="!isSubmitting" name="lucide:send" class="w-5 h-5" />
                  <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ isSubmitting ? 'Enviando Solicitação...' : 'Enviar Solicitação' }}</span>
                </button>

                <p class="text-[11px] text-[#4B5563] text-center pt-1">
                  Ao enviar, você concorda com nossa 
                  <NuxtLink to="/politica-de-privacidade" class="text-[#F49A1A] hover:underline font-medium">Política de Privacidade</NuxtLink>
                </p>
              </form>
            </div>
          </div>

          <!-- Coluna Direita: Meios de Contato Imediato -->
          <div class="space-y-4 sm:space-y-6">
            <div>
              <h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-[#22345F] mb-1">
                Fale Conosco Agora
              </h2>
              <p class="text-xs sm:text-sm text-[#4B5563]">
                Escolha o canal de sua preferência para atendimento imediato
              </p>
            </div>

            <!-- WhatsApp Card -->
            <a
              :href="whatsappUrl"
              target="_blank"
              rel="noopener noreferrer"
              @click="trackWhatsApp('card')"
              class="w-full bg-[#25D366] hover:bg-[#1fb854] text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 shadow-lg hover:shadow-xl group flex items-center gap-3 sm:gap-4"
            >
              <div class="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <WhatsappIcon class="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div class="flex-1 text-left min-w-0">
                <div class="font-bold text-base sm:text-lg leading-tight">WhatsApp Oficial</div>
                <div class="text-white/90 text-xs sm:text-sm mt-0.5">Resposta imediata • Orçamento rápido</div>
                <div class="text-white font-semibold text-xs sm:text-sm mt-1">(11) 98358-6611</div>
              </div>
              <Icon name="lucide:arrow-right" class="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" />
            </a>

            <!-- Telefone Card -->
            <button
              @click="callPhone"
              class="w-full bg-white hover:bg-gray-50 border-2 border-[#22345F] text-[#22345F] p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 shadow-md hover:shadow-lg group flex items-center gap-3 sm:gap-4 text-left cursor-pointer"
            >
              <div class="w-12 h-12 sm:w-14 sm:h-14 bg-[#22345F]/10 rounded-2xl flex items-center justify-center shrink-0">
                <Icon name="lucide:phone" class="w-6 h-6 sm:w-7 sm:h-7 text-[#22345F]" />
              </div>
              <div class="flex-1 text-left min-w-0">
                <div class="font-bold text-base sm:text-lg leading-tight">Telefone Direto</div>
                <div class="text-[#4B5563] text-xs sm:text-sm mt-0.5">Ligue agora • Atendimento direto</div>
                <div class="text-[#22345F] font-semibold text-xs sm:text-sm mt-1">(11) 98358-6611</div>
              </div>
              <Icon name="lucide:arrow-right" class="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" />
            </button>

            <!-- Trust Badges Card -->
            <div class="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs space-y-3">
              <div class="text-xs font-bold text-gray-700 uppercase tracking-wider">Garantia & Confiança</div>
              <div class="grid grid-cols-2 gap-3 text-xs text-gray-600">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:shield-check" class="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>2 Anos de Garantia</span>
                </div>
                <div class="flex items-center gap-2">
                  <Icon name="lucide:clock" class="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Instalação em 24h</span>
                </div>
                <div class="flex items-center gap-2">
                  <Icon name="lucide:award" class="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Materiais Certificados</span>
                </div>
                <div class="flex items-center gap-2">
                  <Icon name="lucide:map-pin" class="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Toda Grande SP</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
