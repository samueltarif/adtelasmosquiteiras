<script setup>
// Não precisa mais dos composables aqui, o CtaButtons gerencia tudo
</script>

<template>
  <section data-section="contact" class="py-10 md:py-20 bg-background">
    <div class="max-w-[1200px] mx-auto px-5">
      <div class="text-center py-10 md:py-[60px] px-5 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl">
        <h2 class="text-2xl md:text-4xl font-bold mb-5">Não Deixe Sua Família em Risco</h2>
        <p class="text-base md:text-lg mb-8 opacity-95">Agende uma avaliação gratuita e receba orçamento em até 30 minutos</p>
        <CtaButtons 
          variant="inline" 
          size="large"
          primary-text="Quero Orçamento"
          secondary-text="Falar no WhatsApp"
        />
      </div>
    </div>
  </section>
</template>
