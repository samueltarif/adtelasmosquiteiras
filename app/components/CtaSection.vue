<script setup>
// Não precisa mais dos composables aqui, o CtaButtons gerencia tudo
</script>

<template>
  <section data-section="contact" class="py-10 md:py-20 bg-background">
    <div class="max-w-[1200px] mx-auto px-5">
      <div class="text-center py-10 md:py-[60px] px-5 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl relative overflow-hidden">
        <!-- Elementos de fundo animados -->
        <div class="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
        <div class="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full animate-bounce"></div>
        <div class="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full animate-ping"></div>
        
        <!-- Conteúdo principal -->
        <div class="relative z-10">
          <h2 class="text-2xl md:text-4xl font-bold mb-5 animate-pulse">Não Deixe Sua Família em Risco</h2>
          <p class="text-base md:text-lg mb-8 opacity-95">Agende uma avaliação gratuita e receba orçamento em até 30 minutos</p>
          
          <!-- Indicador visual chamativo -->
          <div class="flex items-center justify-center gap-2 mb-6 animate-bounce">
            <span class="text-2xl animate-pulse">👇</span>
            <span class="text-lg font-semibold animate-pulse">Clique aqui para falar conosco</span>
            <span class="text-2xl animate-pulse">👇</span>
          </div>
          
          <!-- Botões com animação extra -->
          <div class="animate-pulse hover:animate-none">
            <CtaButtons 
              variant="inline" 
              size="large"
              primary-text="Quero Orçamento"
              secondary-text="Falar no WhatsApp"
            />
          </div>
          
          <!-- Urgência visual -->
          <div class="mt-6 flex items-center justify-center gap-3 text-yellow-300 animate-pulse">
            <span class="text-xl">⚡</span>
            <span class="text-sm md:text-base font-semibold">Resposta rápida garantida!</span>
            <span class="text-xl">⚡</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
