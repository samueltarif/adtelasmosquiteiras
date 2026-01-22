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

      <div class="max-w-4xl mx-auto">
        <!-- Serviço: Rede de Proteção -->
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
          <div class="md:flex">
            <!-- Imagem -->
            <div class="md:w-1/2">
              <img 
                src="/images/tela_proteção_servico.png" 
                alt="Rede de Proteção para Janelas e Sacadas"
                class="w-full h-64 md:h-full object-cover"
              />
            </div>
            
            <!-- Conteúdo -->
            <div class="md:w-1/2 p-8">
              <h3 class="text-3xl font-bold text-gray-800 mb-4">
                Rede de Proteção
              </h3>
              
              <p class="text-lg text-gray-600 mb-6">
                SEGURANÇA PARA JANELAS E SACADAS<br>
                Proteção contra quedas e intrusos
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
                @click="openWhatsApp"
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
  </section>
</template>

<script setup>
const openWhatsApp = () => {
  const message = encodeURIComponent('Olá! Gostaria de saber mais sobre o serviço de Rede de Proteção para janelas e sacadas.')
  const whatsappUrl = `https://wa.me/5511983586611?text=${message}`
  window.open(whatsappUrl, '_blank')
}
</script>