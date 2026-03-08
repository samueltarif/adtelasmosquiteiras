<script setup>
// SEO
useHead({
  title: 'Solicitar Orçamento Grátis | AD Telas e Redes SP',
  meta: [
    { name: 'description', content: 'Solicite seu orçamento grátis de telas mosquiteiras e redes de proteção. Atendimento rápido via WhatsApp, telefone ou formulário. Instalação em 48h.' },
    { name: 'keywords', content: 'orçamento telas, orçamento redes proteção, orçamento grátis, solicitar orçamento sp' },
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

const isSubmitting = ref(false)
const submitSuccess = ref(false)
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
  isSubmitting.value = true
  submitError.value = false
  
  try {
    // Simular envio (substituir por API real)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Tracking GA4
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'form_submit',
        form_name: 'orcamento',
        servico: formData.value.servico
      })
    }
    
    submitSuccess.value = true
    
    // Redirecionar para WhatsApp após 2 segundos
    setTimeout(() => {
      let mensagem = `Olá! Acabei de preencher o formulário de orçamento.\n\n`
      mensagem += `📝 Nome: ${formData.value.nome}\n`
      mensagem += `📞 Telefone: ${formData.value.telefone}\n`
      
      if (formData.value.email) {
        mensagem += `📧 E-mail: ${formData.value.email}\n`
      }
      
      mensagem += `📍 Bairro: ${formData.value.bairro}\n`
      mensagem += `🔧 Serviço: ${formData.value.servico}\n`
      
      if (formData.value.mensagem) {
        mensagem += `\n💬 Mensagem:\n${formData.value.mensagem}\n`
      }
      
      mensagem += `\nPode me ajudar?`
      
      window.open(`https://wa.me/5511983586611?text=${encodeURIComponent(mensagem)}`, '_blank')
    }, 2000)
    
  } catch (error) {
    submitError.value = true
  } finally {
    isSubmitting.value = false
  }
}

// Contato direto WhatsApp
const openWhatsApp = (origem) => {
  const mensagem = 'Olá! Gostaria de solicitar um orçamento.'
  window.open(`https://wa.me/5511983586611?text=${encodeURIComponent(mensagem)}`, '_blank')
  
  // Tracking
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'contact_click',
      method: 'whatsapp',
      origem
    })
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
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    
    <!-- Breadcrumb -->
    <Breadcrumb />
    
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-12 md:py-16">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        <div class="text-center max-w-3xl mx-auto">
          <div class="inline-flex items-center gap-2 bg-[#F49A1A] px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Icon name="lucide:check-circle" class="w-4 h-4" />
            Resposta em até 2 horas
          </div>
          
          <h1 class="text-3xl md:text-5xl font-bold mb-4">
            Solicite seu Orçamento Grátis
          </h1>
          
          <p class="text-lg md:text-xl text-white/90 mb-8">
            Escolha a forma de contato que preferir. Estamos prontos para atendê-lo!
          </p>
          
          <!-- Stats -->
          <div class="flex flex-wrap justify-center gap-6 md:gap-8">
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-[#25D366]">48h</div>
              <div class="text-sm text-white/80">Instalação</div>
            </div>
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-[#25D366]">2 anos</div>
              <div class="text-sm text-white/80">Garantia</div>
            </div>
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-[#25D366]">500+</div>
              <div class="text-sm text-white/80">Clientes</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-12 md:py-16">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          
          <!-- Coluna Esquerda: Meios de Contato -->
          <div class="space-y-6">
            
            <!-- Título -->
            <div>
              <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-2">
                Fale Conosco Agora
              </h2>
              <p class="text-[#4B5563]">
                Escolha o canal de sua preferência para contato imediato
              </p>
            </div>

            <!-- WhatsApp Card -->
            <button
              @click="openWhatsApp('card')"
              class="w-full bg-[#25D366] hover:bg-[#1fb854] text-white p-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
                  </svg>
                </div>
                <div class="flex-1 text-left">
                  <div class="font-bold text-lg mb-1">WhatsApp</div>
                  <div class="text-white/90 text-sm">Resposta imediata • Mais rápido</div>
                  <div class="text-white font-semibold mt-1">(11) 98358-6611</div>
                </div>
                <Icon name="lucide:arrow-right" class="w-6 h-6 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            <!-- Telefone Card -->
            <button
              @click="callPhone"
              class="w-full bg-white hover:bg-gray-50 border-2 border-[#22345F] text-[#22345F] p-6 rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg group"
            >
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 bg-[#22345F]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Icon name="lucide:phone" class="w-8 h-8 text-[#22345F]" />
                </div>
                <div class="flex-1 text-left">
                  <div class="font-bold text-lg mb-1">Telefone</div>
                  <div class="text-[#4B5563] text-sm">Ligue agora • Atendimento direto</div>
                  <div class="text-[#22345F] font-semibold mt-1">(11) 98358-6611</div>
                </div>
                <Icon name="lucide:arrow-right" class="w-6 h-6 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            <!-- Email Card -->
            <a
              href="mailto:vendas.adtelaseredes@gmail.com"
              class="block w-full bg-white hover:bg-gray-50 border-2 border-[#E5EDF8] text-[#22345F] p-6 rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg group"
            >
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 bg-[#F49A1A]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Icon name="lucide:mail" class="w-8 h-8 text-[#F49A1A]" />
                </div>
                <div class="flex-1 text-left">
                  <div class="font-bold text-lg mb-1">E-mail</div>
                  <div class="text-[#4B5563] text-sm">Envie sua dúvida</div>
                  <div class="text-[#22345F] font-semibold mt-1 text-sm break-all">vendas.adtelaseredes@gmail.com</div>
                </div>
                <Icon name="lucide:arrow-right" class="w-6 h-6 transition-transform group-hover:translate-x-1" />
              </div>
            </a>

            <!-- Horário de Atendimento -->
            <div class="bg-gradient-to-br from-[#E5EDF8] to-white p-6 rounded-2xl border-2 border-[#E5EDF8]">
              <div class="flex items-start gap-3">
                <Icon name="lucide:clock" class="w-6 h-6 text-[#F49A1A] flex-shrink-0 mt-1" />
                <div>
                  <div class="font-bold text-[#22345F] mb-2">Horário de Atendimento</div>
                  <div class="space-y-1 text-sm text-[#4B5563]">
                    <div class="flex justify-between">
                      <span>Segunda a Sexta:</span>
                      <span class="font-semibold">8h às 18h</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Sábado:</span>
                      <span class="font-semibold">8h às 13h</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Domingo:</span>
                      <span class="font-semibold">Fechado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Garantias -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white p-4 rounded-xl border-2 border-[#E5EDF8] text-center">
                <Icon name="lucide:shield-check" class="w-8 h-8 text-[#25D366] mx-auto mb-2" />
                <div class="font-bold text-[#22345F] text-sm">Orçamento Grátis</div>
              </div>
              <div class="bg-white p-4 rounded-xl border-2 border-[#E5EDF8] text-center">
                <Icon name="lucide:zap" class="w-8 h-8 text-[#F49A1A] mx-auto mb-2" />
                <div class="font-bold text-[#22345F] text-sm">Resposta Rápida</div>
              </div>
            </div>

          </div>

          <!-- Coluna Direita: Formulário -->
          <div>
            <div class="bg-white rounded-2xl shadow-xl border-2 border-[#E5EDF8] p-6 md:p-8 sticky top-24">
              
              <div class="text-center mb-6">
                <h3 class="text-2xl font-bold text-[#22345F] mb-2">
                  Ou Preencha o Formulário
                </h3>
                <p class="text-[#4B5563] text-sm">
                  Retornamos em até 2 horas úteis
                </p>
              </div>

              <!-- Mensagem de Sucesso -->
              <div v-if="submitSuccess" class="bg-[#25D366]/10 border-2 border-[#25D366] rounded-xl p-6 mb-6 text-center">
                <Icon name="lucide:check-circle" class="w-12 h-12 text-[#25D366] mx-auto mb-3" />
                <div class="font-bold text-[#22345F] mb-2">Formulário Enviado!</div>
                <div class="text-sm text-[#4B5563]">Redirecionando para WhatsApp...</div>
              </div>

              <!-- Mensagem de Erro -->
              <div v-if="submitError" class="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 text-center">
                <Icon name="lucide:alert-circle" class="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div class="text-sm text-red-600">Erro ao enviar. Tente novamente ou use WhatsApp.</div>
              </div>

              <!-- Formulário -->
              <form v-if="!submitSuccess" @submit.prevent="submitForm" class="space-y-4">
                
                <!-- Nome -->
                <div>
                  <label class="block text-sm font-semibold text-[#22345F] mb-2">
                    Nome Completo *
                  </label>
                  <input
                    v-model="formData.nome"
                    type="text"
                    required
                    placeholder="Seu nome"
                    class="w-full px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none transition-colors"
                  />
                </div>

                <!-- Telefone -->
                <div>
                  <label class="block text-sm font-semibold text-[#22345F] mb-2">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    v-model="formData.telefone"
                    type="tel"
                    required
                    placeholder="(11) 98765-4321"
                    class="w-full px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none transition-colors"
                  />
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-sm font-semibold text-[#22345F] mb-2">
                    E-mail (opcional)
                  </label>
                  <input
                    v-model="formData.email"
                    type="email"
                    placeholder="seu@email.com"
                    class="w-full px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none transition-colors"
                  />
                </div>

                <!-- Bairro -->
                <div>
                  <label class="block text-sm font-semibold text-[#22345F] mb-2">
                    Bairro / Região *
                  </label>
                  <input
                    v-model="formData.bairro"
                    type="text"
                    required
                    placeholder="Ex: Vila Mariana"
                    class="w-full px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none transition-colors"
                  />
                </div>

                <!-- Serviço -->
                <div>
                  <label class="block text-sm font-semibold text-[#22345F] mb-2">
                    Serviço de Interesse *
                  </label>
                  <select
                    v-model="formData.servico"
                    required
                    class="w-full px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none transition-colors"
                  >
                    <option value="">Selecione um serviço</option>
                    <option v-for="servico in servicosOptions" :key="servico" :value="servico">
                      {{ servico }}
                    </option>
                  </select>
                </div>

                <!-- Mensagem -->
                <div>
                  <label class="block text-sm font-semibold text-[#22345F] mb-2">
                    Mensagem (opcional)
                  </label>
                  <textarea
                    v-model="formData.mensagem"
                    rows="3"
                    placeholder="Conte-nos mais sobre sua necessidade..."
                    class="w-full px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none transition-colors resize-none"
                  ></textarea>
                </div>

                <!-- Botão Submit -->
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="w-full px-6 py-4 bg-[#F49A1A] hover:bg-[#e08910] text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Icon v-if="!isSubmitting" name="lucide:send" class="w-5 h-5" />
                  <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ isSubmitting ? 'Enviando...' : 'Enviar Solicitação' }}</span>
                </button>

                <!-- Aviso LGPD -->
                <p class="text-xs text-[#4B5563] text-center">
                  Ao enviar, você concorda com nossa 
                  <NuxtLink to="/politica-de-privacidade" class="text-[#F49A1A] hover:underline">
                    Política de Privacidade
                  </NuxtLink>
                </p>

              </form>

            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- CTA Final -->
    <section class="py-12 bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white">
      <div class="container mx-auto px-4 md:px-6 max-w-4xl text-center">
        <h2 class="text-2xl md:text-3xl font-bold mb-4">
          Prefere Falar Direto no WhatsApp?
        </h2>
        <p class="text-white/90 mb-6">
          Clique no botão abaixo e fale com nosso time agora mesmo
        </p>
        <button
          @click="openWhatsApp('footer')"
          class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-xl"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
          Abrir WhatsApp Agora
        </button>
      </div>
    </section>

  </div>
</template>
