<script setup>
useHead({
  title: 'Obrigado! | AD Telas e Redes',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-16">
    <div class="max-w-2xl w-full">
      
      <!-- Card principal -->
      <div class="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border-2 border-gray-100">
        
        <!-- Ícone de sucesso -->
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>

        <!-- Mensagem principal -->
        <h1 class="text-3xl md:text-4xl font-bold text-[#22345F] mb-4">
          Obrigado pela sua solicitação!
        </h1>
        
        <p class="text-lg text-gray-600 mb-2">
          Recebemos suas informações e em breve nossa equipe entrará em contato.
        </p>
        
        <p class="text-base text-gray-500 mb-8">
          Nossa equipe entrará em contato em breve para fornecer um orçamento personalizado.
        </p>

        <!-- Divider -->
        <div class="w-16 h-1 bg-[#F49A1A] mx-auto mb-8 rounded-full"></div>

        <!-- CTAs -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          
          <!-- WhatsApp -->
          <a
            href="https://wa.me/5511983586611"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#25D366] text-white rounded-2xl font-semibold text-base shadow-lg hover:bg-[#1fb854] transition-all"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
            </svg>
            Falar no WhatsApp
          </a>

          <!-- Voltar ao site -->
          <NuxtLink
            to="/home"
            class="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white text-[#22345F] rounded-2xl font-medium text-base border-2 border-[#22345F]/20 hover:bg-gray-50 transition-all"
          >
            <Icon name="lucide:home" class="w-5 h-5" />
            Voltar ao Início
          </NuxtLink>

        </div>

      </div>

      <!-- Informação adicional -->
      <p class="text-center text-sm text-gray-500 mt-6">
        Tempo médio de resposta: até 2 horas úteis
      </p>

    </div>
  </div>
</template>
