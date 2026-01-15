<script setup>
// Não precisa mais dos composables aqui, o CtaButtons gerencia tudo
</script>

<template>
  <section class="mt-24 md:mt-28 py-10 md:py-[60px] bg-gradient-to-br from-primary to-primary-dark text-white relative overflow-hidden">
    <div class="absolute top-0 -right-[200px] w-[600px] h-[600px] bg-white/5 rounded-full"></div>
    <div class="max-w-[1200px] mx-auto px-5 relative z-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[50px] items-center">
        <div>
          <h1 class="text-[28px] md:text-[48px] font-extrabold leading-tight mb-5">Proteja sua família e sua casa</h1>
          <p class="text-base md:text-xl mb-8 opacity-95 leading-relaxed">Telas de segurança e redes protetoras instaladas em São Paulo com garantia, rapidez e qualidade.</p>
          <CtaButtons 
            variant="hero" 
            size="large"
            primary-text="Quero Orçamento Agora"
            secondary-text="Falar no WhatsApp"
          />
        </div>
        <div class="w-full h-[300px] md:h-[400px] bg-white/10 rounded-xl overflow-hidden shadow-lg">
          <img 
            src="/images/familia.png" 
            alt="Família protegida em varanda com rede de segurança instalada"
            class="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  </section>
</template>
