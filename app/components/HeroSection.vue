<script setup>
// Não precisa mais dos composables aqui, o CtaButtons gerencia tudo
</script>

<template>
  <section class="mt-24 md:mt-28 py-10 md:py-[60px] bg-gradient-to-br from-primary to-primary-dark text-white relative overflow-hidden">
    <div class="absolute top-0 -right-[200px] w-[600px] h-[600px] bg-white/5 rounded-full"></div>
    <div class="max-w-[1200px] mx-auto px-5 relative z-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[50px] items-center">
        <div>
          <h1 class="text-[28px] md:text-[48px] font-extrabold leading-tight mb-5">
            Telas Mosquiteiras e Redes de Proteção sob Medida em São Paulo
          </h1>
          <p class="text-base md:text-xl mb-6 opacity-95 leading-relaxed">
            Instalação profissional de telas mosquiteiras e redes de proteção para janelas, sacadas e áreas externas, com garantia e atendimento rápido em São Paulo.
          </p>
          
          <!-- Prova Social -->
          <div class="mb-8 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
            <!-- Avaliação Google -->
            <a 
              href="https://www.google.com/search?sca_esv=59de4d94fc229621&sxsrf=ADLYWIIjEuoUVhAIFwXy5vUQP17RrHg2ig:1729605268236&kgmid=/g/11rnbd2wmb&q=AD+TELAS+MOSQUITEIRAS&shndl=30&source=sh/x/loc/uni/m1/1&kgs=5e4e7713d87c37c6&zx=1768571227913&no_sw_cr=1#lrd=0x94ce595a4d5fb92b:0xe81c9935ae058bde,1,,,,"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 hover:opacity-80 transition-opacity duration-300 cursor-pointer group"
            >
              <!-- Logo Google -->
              <svg class="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div class="flex">
                <svg v-for="i in 5" :key="i" class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <span class="text-sm font-semibold group-hover:underline">5.0</span>
            </a>
            
            <!-- Separador -->
            <div class="hidden sm:block w-px h-6 bg-white/30"></div>
            
            <!-- Clientes Atendidos -->
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
              <span class="text-sm font-semibold">+500 Clientes Atendidos</span>
            </div>
            
            <!-- Separador -->
            <div class="hidden sm:block w-px h-6 bg-white/30"></div>
            
            <!-- Experiência -->
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              <span class="text-sm font-semibold">+10 Anos de Experiência</span>
            </div>
          </div>

          <CtaButtons 
            variant="hero" 
            size="large"
            primary-text="Quero Orçamento Agora"
            secondary-text="Falar no WhatsApp"
          />
        </div>
        <div class="w-full h-[300px] md:h-[400px] bg-white/10 rounded-xl overflow-hidden shadow-lg relative group animate-fade-in">
          <!-- Borda animada -->
          <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-light via-white to-primary-light opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
          
          <!-- Imagem com animação -->
          <img 
            src="/images/familia.png" 
            alt="Família protegida em varanda com rede de segurança instalada"
            class="w-full h-full object-cover transform transition-all duration-700 group-hover:scale-110 animate-float"
          />
          
          <!-- Overlay com efeito hover -->
          <div class="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </div>
    </div>
  </section>
</template>
