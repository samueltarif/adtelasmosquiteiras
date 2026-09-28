<script setup>
defineProps({
  servico: {
    type: Object,
    required: true
  },
  whatsappUrl: {
    type: String,
    required: true
  }
})

defineEmits(['whatsapp-click'])
</script>

<template>
  <section class="py-16 md:py-24 bg-gradient-to-b from-white to-[#F9FAFB]">
    <div class="container mx-auto px-4 md:px-6 max-w-7xl">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        <!-- Imagem Demo -->
        <div class="order-2 md:order-1">
          <div class="relative rounded-3xl overflow-hidden shadow-2xl">
            <img
              :src="servico.imagemDemo"
              :alt="`${servico.titulo} instalado`"
              class="w-full h-auto"
              loading="lazy"
            />
          </div>
        </div>

        <!-- Especificações Técnicas -->
        <div class="order-1 md:order-2">
          <h2 class="text-3xl md:text-4xl font-bold text-[#22345F] mb-6">
            Especificações Técnicas
          </h2>

          <div class="space-y-4">
            <div
              v-for="(spec, index) in servico.especificacoes"
              :key="index"
              class="flex items-start gap-4 p-4 bg-white rounded-xl border-2 border-[#E5EDF8]"
            >
              <div class="w-10 h-10 bg-[#E5EDF8] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-[#22345F]" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-semibold text-[#4B5563] mb-1">{{ spec.label }}</p>
                <p class="text-base font-bold text-[#22345F]">{{ spec.valor }}</p>
              </div>
            </div>
          </div>

          <!-- CTA Especificações -->
          <a
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-8 w-full px-8 py-4 bg-[#F49A1A] text-white rounded-xl font-bold text-lg hover:bg-[#d88715] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
            data-cta-location="especificacoes"
            data-gtm="servico-specs-whatsapp"
            @click="$emit('whatsapp-click', 'especificacoes')"
          >
            <WhatsappIcon class="w-6 h-6" />
            Solicitar Orçamento Detalhado
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
