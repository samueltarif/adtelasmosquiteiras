<script setup>
useHead({
  title: 'Obrigado! | AD Telas e Redes',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

// Fire conversion on page load — gtag sempre disponível via plugin GTM
onMounted(() => {
  window.gtag('event', 'conversion', { 'send_to': 'AW-17981093809/4GwPCPCPWSjoccELHvhv5C' })
  window.gtag('event', 'generate_lead', { event_category: 'lead', event_label: 'obrigado_page' })
  window.dataLayer.push({ event: 'form_submission', event_category: 'lead', event_label: 'obrigado_page' })
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
        
        <p class="text-lg text-gray-600 mb-8">
          Recebemos suas informações e em breve nossa equipe entrará em contato para fornecer um orçamento personalizado.
        </p>

        <!-- Divider -->
        <div class="w-16 h-1 bg-[#F49A1A] mx-auto mb-8 rounded-full"></div>

        <!-- CTAs -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          
          <!-- WhatsApp -->
          <a
            href="https://wa.me/5511983586611?text=Olá!%20Acabei%20de%20enviar%20meu%20orçamento%20pelo%20site%20https://www.adtelasmosquiteiras.com.br/%20e%20gostaria%20de%20confirmar."
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#25D366] text-white rounded-2xl font-semibold text-base shadow-lg hover:bg-[#1fb854] transition-all"
          >
            <WhatsappIcon class="w-5 h-5" />
            Falar no WhatsApp
          </a>

          <!-- Voltar ao site -->
          <NuxtLink
            to="/"
            class="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white text-[#22345F] rounded-2xl font-medium text-base border-2 border-[#22345F]/20 hover:bg-gray-50 transition-all"
          >
            <Icon name="lucide:home" class="w-5 h-5" />
            Voltar ao Início
          </NuxtLink>

        </div>

      </div>

      <!-- Informação adicional -->
      <p class="text-center text-sm text-gray-500 mt-6">
        Tempo médio de resposta: em alguns minutos
      </p>

    </div>
  </div>
</template>
