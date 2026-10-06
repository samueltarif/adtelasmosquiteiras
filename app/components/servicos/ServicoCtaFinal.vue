<script setup>
defineProps({
  servico: {
    type: Object,
    required: true
  },
  whatsappUrl: {
    type: String,
    required: true
  },
  reviewsUrl: {
    type: String,
    default: ''
  }
})

defineEmits(['whatsapp-click', 'rating-click'])
</script>

<template>
  <section id="contato-final" class="py-16 md:py-24 bg-gradient-to-br from-[#22345F] via-[#1a2847] to-[#22345F] text-white relative overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
    </div>

    <div class="container mx-auto px-4 md:px-6 max-w-4xl relative z-10">
      <div class="text-center">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 bg-[#F49A1A] px-4 py-2 rounded-full text-sm font-bold mb-6">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
          </svg>
          Oferta por tempo limitado
        </div>

        <!-- Título -->
        <h2 class="text-3xl md:text-5xl font-bold mb-6 leading-tight">
          Proteja sua família HOJE!<br/>
          Instalação agendada
        </h2>

        <!-- Descrição -->
        <p class="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Não espere acontecer um acidente. Garanta a segurança do seu lar com {{ servico.titulo?.toLowerCase() }} de qualidade premium.
        </p>

        <!-- Benefícios Rápidos -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
          <div class="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <svg class="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span class="font-semibold">Orçamento Grátis</span>
          </div>
          <div class="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <svg class="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span class="font-semibold">Instalação agendada</span>
          </div>
          <div class="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <svg class="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span class="font-semibold">Garantia conforme proposta</span>
          </div>
        </div>

        <!-- CTA Principal -->
        <a
          :href="whatsappUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-3 px-10 py-5 bg-[#25D366] text-white rounded-2xl font-bold text-xl hover:bg-[#1fb854] transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 mb-6"
          data-cta-location="cta_final"
          data-gtm="servico-cta-final-whatsapp"
          @click="$emit('whatsapp-click', 'cta-final')"
        >
          <WhatsappIcon class="w-7 h-7" />
          Solicitar Orçamento GRÁTIS Agora
        </a>

        <!-- Prova Social -->
        <div class="flex items-center justify-center gap-6 text-sm text-white/80">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span>Atendimento sob medida</span>
          </div>
          <a
            :href="reviewsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 hover:text-white transition-colors cursor-pointer group"
            data-gtm="servico-rating-clicked"
            @click="$emit('rating-click')"
          >
            <span class="font-semibold group-hover:underline">Nota 5.0</span>
            <div class="flex gap-0.5">
              <svg v-for="s in 5" :key="s" class="w-4 h-4 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
