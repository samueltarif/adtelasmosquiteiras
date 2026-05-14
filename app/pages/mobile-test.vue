<script setup>
// Página de teste para o componente mobile otimizado
useHead({
  title: 'Mobile Hero Test - AD Telas',
  meta: [
    { name: 'description', content: 'Teste do hero mobile otimizado para conversão' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ]
})
</script>

<template>
  <div>
    <!-- Componente Mobile Otimizado -->
    <MobileHeroOptimized
      logo-src="/images/logo ad.png"
      whatsapp-number="5511983586611"
      whatsapp-message="Olá! Vi seu site e gostaria de um orçamento para telas mosqueteiras."
      headline="Telas Mosqueteiras em São Paulo"
      subheadline="Instalação em 24h • Garantia 2 Anos • +500 Clientes Satisfeitos"
      :rating="5.0"
      :review-count="487"
      primary-cta-text="Orçamento Grátis no WhatsApp"
      secondary-cta-text="Ligar Agora: (11) 98358-6611"
      phone-number="+5511983586611"
    />

    <!-- Conteúdo adicional abaixo (opcional) -->
    <div class="md:hidden bg-white py-8 px-4">
      <h2 class="text-2xl font-bold text-gray-900 mb-4 text-center">
        Por que escolher a AD Telas?
      </h2>
      
      <div class="space-y-4">
        <!-- Benefício 1 -->
        <div class="flex gap-3 items-start">
          <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-gray-900 mb-1">Instalação Rápida</h3>
            <p class="text-sm text-gray-600">Instalamos em até 24h após a medição</p>
          </div>
        </div>

        <!-- Benefício 2 -->
        <div class="flex gap-3 items-start">
          <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-gray-900 mb-1">Garantia de 2 Anos</h3>
            <p class="text-sm text-gray-600">Cobertura total contra defeitos</p>
          </div>
        </div>

        <!-- Benefício 3 -->
        <div class="flex gap-3 items-start">
          <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-gray-900 mb-1">+500 Clientes Satisfeitos</h3>
            <p class="text-sm text-gray-600">Avaliação 5.0 no Google</p>
          </div>
        </div>
      </div>

      <!-- CTA Repetido -->
      <div class="mt-8">
        <a 
          href="https://wa.me/5511983586611?text=Olá! Gostaria de um orçamento."
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-3 w-full h-14 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-xl font-bold text-base shadow-lg active:scale-[0.98] transition-all"
        >
          <WhatsappIcon class="w-6 h-6" />
          <span>Falar no WhatsApp Agora</span>
        </a>
      </div>
    </div>

    <!-- Mensagem para Desktop -->
    <div class="hidden md:flex items-center justify-center min-h-screen bg-gray-100">
      <div class="text-center p-8">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">
          Visualização Mobile
        </h1>
        <p class="text-gray-600 mb-4">
          Este componente foi otimizado para dispositivos móveis.
        </p>
        <p class="text-sm text-gray-500">
          Abra em um celular ou reduza a largura do navegador para ver o layout mobile.
        </p>
      </div>
    </div>
  </div>
</template>
