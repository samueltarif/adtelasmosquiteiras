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
      subheadline="Instalação em 48h • Garantia 2 Anos • +500 Clientes Satisfeitos"
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
            <p class="text-sm text-gray-600">Instalamos em até 48h após a medição</p>
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
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
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
