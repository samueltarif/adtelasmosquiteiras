<template>
  <section class="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="container mx-auto px-4">
      <div class="text-center mb-12">
        <h2 class="text-4xl font-bold text-gray-800 mb-4">
          Nossos Serviços
        </h2>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          Soluções completas para proteger sua família e seu lar
        </p>
      </div>

      <div class="max-w-6xl mx-auto relative">
        <!-- Carousel Container -->
        <div class="overflow-hidden">
          <div 
            class="flex transition-transform duration-500 ease-in-out"
            :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
          >
            <!-- Serviço 1: Rede de Proteção -->
            <div class="w-full flex-shrink-0 px-4">
              <div class="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div class="lg:flex">
                  <!-- Imagem -->
                  <div class="lg:w-1/2">
                    <img 
                      src="/images/tela_proteção_servico.png" 
                      alt="Rede de Proteção para Janelas e Sacadas"
                      class="w-full h-64 lg:h-full object-cover"
                    />
                  </div>
                  
                  <!-- Conteúdo -->
                  <div class="lg:w-1/2 p-8">
                    <h3 class="text-3xl font-bold text-gray-800 mb-4">
                      Rede de Proteção
                    </h3>
                    
                    <p class="text-lg text-gray-600 mb-6">
                      SEGURANÇA PARA JANELAS E SACADAS<br>
                      Proteção contra quedas e intrusos<br>
                      <span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Garantia 2 anos</span>
                    </p>
                    
                    <!-- Benefícios -->
                    <div class="space-y-3 mb-8">
                      <div class="flex items-center">
                        <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="text-gray-700">Resiste Chuva e Sol</span>
                      </div>
                      
                      <div class="flex items-center">
                        <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="text-gray-700">Fácil de Limpar</span>
                      </div>
                      
                      <div class="flex items-center">
                        <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="text-gray-700">Encaixa Perfeito</span>
                      </div>
                    </div>
                    
                    <!-- Botão CTA -->
                    <button 
                      @click="openWhatsApp('rede')"
                      class="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center group"
                    >
                      <span class="mr-2">Ver Detalhes</span>
                      <svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Serviço 2: Tela Mosquiteira -->
            <div class="w-full flex-shrink-0 px-4">
              <div class="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div class="lg:flex">
                  <!-- Imagem -->
                  <div class="lg:w-1/2">
                    <img 
                      src="/images/TELA_MOSQUITEIRA.png" 
                      alt="Tela Mosquiteira Contra Dengue, Zika e Aedes"
                      class="w-full h-64 lg:h-full object-cover"
                    />
                  </div>
                  
                  <!-- Conteúdo -->
                  <div class="lg:w-1/2 p-8 overflow-y-auto max-h-[600px]">
                    <!-- Banner de Urgência -->
                    <div class="bg-gradient-to-r from-orange-100 to-red-100 border-l-4 border-orange-500 p-3 mb-4 rounded">
                      <div class="flex items-center">
                        <span class="text-lg mr-2">🌞</span>
                        <div class="text-sm">
                          <strong>VERÃO CHEGANDO</strong> Mosquitos aumentam 40% em março-abril em São Paulo.<br>
                          Proteja sua família AGORA enquanto ainda há disponibilidade.
                        </div>
                      </div>
                    </div>

                    <h3 class="text-2xl font-bold text-gray-800 mb-2">
                      Durma Protegido: Telas Mosquiteiras Contra Dengue, Zika e Aedes
                    </h3>
                    
                    <p class="text-lg text-blue-600 font-semibold mb-4">
                      Proteção inteligente com visão 100% clara | Garantia 2 anos
                    </p>

                    <p class="text-sm text-gray-600 mb-4">
                      Eficaz contra aedes | Transparência 85% | Instalação 48h | Garantia 2 anos
                    </p>
                    
                    <!-- Badges -->
                    <div class="grid grid-cols-2 gap-2 mb-6">
                      <div class="bg-blue-50 p-3 rounded-lg text-center">
                        <div class="text-2xl mb-1">🛡️</div>
                        <div class="text-xs font-semibold">Eficaz contra aedes</div>
                      </div>
                      <div class="bg-green-50 p-3 rounded-lg text-center">
                        <div class="text-2xl mb-1">✨</div>
                        <div class="text-xs font-semibold">Visão 100% clara</div>
                      </div>
                      <div class="bg-orange-50 p-3 rounded-lg text-center">
                        <div class="text-2xl mb-1">⏱️</div>
                        <div class="text-xs font-semibold">Instalação 48h</div>
                      </div>
                      <div class="bg-purple-50 p-3 rounded-lg text-center">
                        <div class="text-2xl mb-1">🔒</div>
                        <div class="text-xs font-semibold">Garantia 2 anos</div>
                      </div>
                    </div>

                    <!-- Descrição -->
                    <div class="mb-6">
                      <p class="text-sm text-gray-700 mb-3">
                        Mosquitos transmissores de dengue, zika e febre amarela são uma ameaça real em São Paulo. Eles não pedem licença para entrar - enquanto você dorme, assiste TV ou toma café na sacada, eles invadem. A solução? Uma barreira invisível que mantém você protegido e sua vista cristalina.
                      </p>
                      
                      <p class="text-sm text-gray-700 mb-3">
                        Nossa tela mosquiteira profissional é o que você realmente precisa:
                      </p>
                      
                      <div class="space-y-2 text-sm">
                        <div class="flex items-center">
                          <span class="text-green-500 mr-2">✓</span>
                          <span><strong>EFICAZ:</strong> Barreira intransponível contra mosquitos (zero entrada)</span>
                        </div>
                        <div class="flex items-center">
                          <span class="text-green-500 mr-2">✓</span>
                          <span><strong>CLARA:</strong> Transparência de 85% - você vê melhor que vidro comum</span>
                        </div>
                        <div class="flex items-center">
                          <span class="text-green-500 mr-2">✓</span>
                          <span><strong>DURÁVEL:</strong> Estrutura de alumínio resiste 5+ anos</span>
                        </div>
                        <div class="flex items-center">
                          <span class="text-green-500 mr-2">✓</span>
                          <span><strong>RÁPIDA:</strong> Instalação profissional em apenas 48h</span>
                        </div>
                        <div class="flex items-center">
                          <span class="text-green-500 mr-2">✓</span>
                          <span><strong>GARANTIDA:</strong> 2 anos de cobertura total</span>
                        </div>
                      </div>
                    </div>

                    <!-- FAQ Expandível -->
                    <div class="mb-6">
                      <button 
                        @click="toggleFaq"
                        class="w-full bg-gray-100 hover:bg-gray-200 p-3 rounded-lg flex items-center justify-between transition-colors duration-200"
                      >
                        <span class="font-semibold text-gray-800">❓ Perguntas Frequentes</span>
                        <svg 
                          class="w-5 h-5 transform transition-transform duration-200"
                          :class="{ 'rotate-180': showFaq }"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      
                      <div v-show="showFaq" class="mt-3 space-y-3 text-sm">
                        <div class="bg-gray-50 p-3 rounded">
                          <div class="font-semibold text-gray-800">❓ Quanto tempo dura?</div>
                          <div class="text-gray-600">✅ 5-7 anos com manutenção básica (limpeza 2x/ano)</div>
                        </div>
                        <div class="bg-gray-50 p-3 rounded">
                          <div class="font-semibold text-gray-800">❓ Como limpo?</div>
                          <div class="text-gray-600">✅ Água morna + sabão neutro com esponja macia</div>
                        </div>
                        <div class="bg-gray-50 p-3 rounded">
                          <div class="font-semibold text-gray-800">❓ Reduz visão?</div>
                          <div class="text-gray-600">✅ Não. Transparência 85% (você vê normal)</div>
                        </div>
                        <div class="bg-gray-50 p-3 rounded">
                          <div class="font-semibold text-gray-800">❓ Vale mais que redes externas?</div>
                          <div class="text-gray-600">✅ Sim. Redes viram "bueiro" em 2 meses. Telas duram 5+ anos</div>
                        </div>
                      </div>
                    </div>

                    <!-- Comparação Expandível -->
                    <div class="mb-6">
                      <button 
                        @click="toggleComparison"
                        class="w-full bg-blue-100 hover:bg-blue-200 p-3 rounded-lg flex items-center justify-between transition-colors duration-200"
                      >
                        <span class="font-semibold text-blue-800">📊 Comparação com Outras Soluções</span>
                        <svg 
                          class="w-5 h-5 transform transition-transform duration-200"
                          :class="{ 'rotate-180': showComparison }"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      
                      <div v-show="showComparison" class="mt-3">
                        <div class="overflow-x-auto">
                          <table class="w-full text-xs border-collapse">
                            <thead>
                              <tr class="bg-gray-100">
                                <th class="border p-2 text-left"></th>
                                <th class="border p-2 text-center">TELA MOSQUITEIRA</th>
                                <th class="border p-2 text-center">REDE EXTERNA</th>
                                <th class="border p-2 text-center">CORTINA</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td class="border p-2 font-semibold">Mosquitos fora?</td>
                                <td class="border p-2 text-center text-green-600">✅ SIM 100%</td>
                                <td class="border p-2 text-center text-yellow-600">⚠️ 60-70%</td>
                                <td class="border p-2 text-center text-red-600">❌ NÃO</td>
                              </tr>
                              <tr class="bg-gray-50">
                                <td class="border p-2 font-semibold">Visão clara?</td>
                                <td class="border p-2 text-center text-green-600">✅ 85%</td>
                                <td class="border p-2 text-center text-red-600">❌ 40-50%</td>
                                <td class="border p-2 text-center text-red-600">❌ NENHUMA</td>
                              </tr>
                              <tr>
                                <td class="border p-2 font-semibold">Ventilação?</td>
                                <td class="border p-2 text-center text-green-600">✅ TOTAL</td>
                                <td class="border p-2 text-center text-green-600">✅ SIM</td>
                                <td class="border p-2 text-center text-red-600">❌ BLOQUEADA</td>
                              </tr>
                              <tr class="bg-gray-50">
                                <td class="border p-2 font-semibold">Durabilidade</td>
                                <td class="border p-2 text-center text-green-600">✅ 5+ anos</td>
                                <td class="border p-2 text-center text-yellow-600">⚠️ 2 anos</td>
                                <td class="border p-2 text-center text-yellow-600">⚠️ 1-2 anos</td>
                              </tr>
                              <tr>
                                <td class="border p-2 font-semibold">Manutenção</td>
                                <td class="border p-2 text-center text-green-600">✅ Mínima</td>
                                <td class="border p-2 text-center text-red-600">❌ Frequente</td>
                                <td class="border p-2 text-center text-yellow-600">⚠️ Regular</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <!-- Testimonial Expandível -->
                    <div class="mb-6">
                      <button 
                        @click="toggleTestimonial"
                        class="w-full bg-yellow-100 hover:bg-yellow-200 p-3 rounded-lg flex items-center justify-between transition-colors duration-200"
                      >
                        <span class="font-semibold text-yellow-800">⭐⭐⭐⭐⭐ (4.9/5 - +500 avaliações)</span>
                        <svg 
                          class="w-5 h-5 transform transition-transform duration-200"
                          :class="{ 'rotate-180': showTestimonial }"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      
                      <div v-show="showTestimonial" class="mt-3 bg-yellow-50 p-4 rounded-lg">
                        <p class="text-sm italic text-gray-700">
                          "Em 2 semanas dormindo com a janela aberta, não vi um único mosquito. Meu filho alérgico (que não podia deixar janela aberta) agora dorme tranquilo."
                        </p>
                        <p class="text-xs text-gray-600 mt-2">— João M., São Paulo, SP</p>
                      </div>
                    </div>
                    
                    <!-- Botão CTA -->
                    <button 
                      @click="openWhatsApp('mosquiteira')"
                      class="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center group"
                    >
                      <span class="mr-2">Ver Detalhes</span>
                      <svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Arrows -->
        <button 
          @click="prevSlide"
          class="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200 z-10"
          :class="{ 'opacity-50 cursor-not-allowed': currentSlide === 0 }"
        >
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>

        <button 
          @click="nextSlide"
          class="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200 z-10"
          :class="{ 'opacity-50 cursor-not-allowed': currentSlide === 1 }"
        >
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>

        <!-- Dots Indicator -->
        <div class="flex justify-center mt-8 space-x-2">
          <button 
            v-for="(slide, index) in 2" 
            :key="index"
            @click="currentSlide = index"
            class="w-3 h-3 rounded-full transition-all duration-200"
            :class="currentSlide === index ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'"
          ></button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const currentSlide = ref(0)
const showFaq = ref(false)
const showComparison = ref(false)
const showTestimonial = ref(false)

const nextSlide = () => {
  if (currentSlide.value < 1) {
    currentSlide.value++
  }
}

const prevSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--
  }
}

const toggleFaq = () => {
  showFaq.value = !showFaq.value
}

const toggleComparison = () => {
  showComparison.value = !showComparison.value
}

const toggleTestimonial = () => {
  showTestimonial.value = !showTestimonial.value
}

const openWhatsApp = (service) => {
  let message = ''
  
  if (service === 'rede') {
    message = encodeURIComponent('Olá! Gostaria de saber mais sobre o serviço de Rede de Proteção para janelas e sacadas.')
  } else if (service === 'mosquiteira') {
    message = encodeURIComponent('Olá! Gostaria de saber mais sobre as Telas Mosquiteiras contra Dengue, Zika e Aedes.')
  }
  
  const whatsappUrl = `https://wa.me/5511983586611?text=${message}`
  window.open(whatsappUrl, '_blank')
}
</script>