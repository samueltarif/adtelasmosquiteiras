<script setup>
// Não precisa mais dos composables aqui, o CtaButtons gerencia tudo
</script>

<template>
  <section class="mt-16 md:mt-28 py-10 md:py-[60px] bg-gradient-to-br from-primary to-primary-dark text-white relative overflow-hidden">
    <div class="absolute top-0 -right-[200px] w-[600px] h-[600px] bg-white/5 rounded-full"></div>
    <div class="max-w-[1200px] mx-auto px-5 relative z-10">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-[50px] items-start">
        <!-- Coluna de Conteúdo (2/3) -->
        <div class="lg:col-span-2">
          <!-- CAMADA 1 - Mobile First (0-2s) -->
          <div class="block md:hidden mb-8">
            <!-- TESTIMONIAL + RATING ACIMA DA DOBRA (PRIMEIRO) -->
            <a 
              href="https://www.google.com/search?sca_esv=59de4d94fc229621&sxsrf=ADLYWIIjEuoUVhAIFwXy5vUQP17RrHg2ig:1729605268236&kgmid=/g/11rnbd2wmb&q=AD+TELAS+MOSQUITEIRAS&shndl=30&source=sh/x/loc/uni/m1/1&kgs=5e4e7713d87c37c6&zx=1768571227913&no_sw_cr=1#lrd=0x94ce595a4d5fb92b:0xe81c9935ae058bde,1,,,,"
              target="_blank"
              rel="noopener noreferrer"
              class="block bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
            >
              <!-- Rating com Google -->
              <div class="flex items-center justify-center gap-2 mb-3">
                <div class="flex">
                  <svg v-for="i in 5" :key="i" class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <span class="text-white font-bold text-sm">5.0</span>
                <span class="text-white/80 text-sm">(487 avaliações)</span>
              </div>
              
              <!-- Testimonial -->
              <blockquote class="text-center mb-3">
                <p class="text-white text-sm italic leading-relaxed">
                  "A instalação ficou perfeita, foram super pontuais e profissionais"
                </p>
              </blockquote>
              
              <!-- Cliente -->
              <div class="flex items-center justify-center gap-4">
                <!-- Foto da cliente -->
                <img 
                  src="/images/giovana_naomi.png" 
                  alt="Giovana Naomi - Cliente satisfeita"
                  class="w-16 h-16 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
                />
                <div class="text-left">
                  <p class="text-white font-semibold text-sm">Giovana Naomi</p>
                  <div class="flex items-center gap-1 mt-1">
                    <svg class="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span class="text-white/70 text-xs">Verificado no Google</span>
                  </div>
                </div>
              </div>
            </a>

            <!-- Headline Principal -->
            <h1 class="text-[32px] font-extrabold leading-tight mb-3 text-center">
              Telas Mosquiteiras e Redes Em São Paulo
            </h1>
            
            <!-- Sub-headline -->
            <p class="text-lg font-semibold mb-6 text-center opacity-95">
              Garantia 5 Anos | Orçamento Grátis
            </p>

            <!-- CAMADA 2 (2-4s) - CTAs Principais com CSS Puro -->
            <div class="mb-6">
              <PureCTAButtons />
            </div>

            <!-- CAMADA 3 (4-6s) - Copy Adicional -->
            <div class="text-center space-y-2 mb-6">
              <p class="text-sm font-medium opacity-90 bg-white/10 px-4 py-2 rounded-full inline-block">
                ⚡ Instalação em 48h | 📞 Resposta em 24h
              </p>
            </div>
          </div>

          <!-- Desktop Version -->
          <div class="hidden md:block">
            <h1 class="text-[28px] md:text-[48px] font-extrabold leading-tight mb-5 flex flex-wrap items-center gap-3">
              <span>Telas Mosquiteiras Sob Medida em São Paulo – Garantia 5 Anos. Orçamento grátis agora</span>
              <svg class="w-6 h-6 md:w-8 md:h-8 text-white animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
              <a 
                href="https://wa.me/5511983586611?text=Olá! Gostaria de um orçamento para telas e redes de proteção."
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-green-500 hover:bg-green-600 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
              >
                <svg class="w-6 h-6 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
                </svg>
              </a>
            </h1>
            
            <p class="text-base md:text-xl mb-6 opacity-95 leading-relaxed">
              Instalação profissional de telas e redes para janelas, sacadas e áreas externas, com rapidez e garantia em São Paulo.
            </p>
            
            <!-- Prova Social Desktop -->
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
          </div>

          <!-- CTAs apenas para Desktop -->
          <div class="hidden md:block">
            <CtaButtons 
              variant="hero" 
              size="large"
              primary-text="Quero Orçamento Agora"
              secondary-text="Falar no WhatsApp"
            />
          </div>
        </div>

        <!-- Formulário Desktop (1/3) -->
        <div class="hidden lg:block">
          <LeadForm variant="desktop" />
        </div>
      </div>

      <!-- Imagem Mobile -->
      <div class="block md:hidden w-full h-[300px] bg-white/10 rounded-xl overflow-hidden shadow-lg relative group animate-fade-in mt-8">
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

      <!-- Imagem Desktop -->
      <div class="hidden md:block lg:hidden w-full h-[400px] bg-white/10 rounded-xl overflow-hidden shadow-lg relative group animate-fade-in">
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
  </section>
</template>
