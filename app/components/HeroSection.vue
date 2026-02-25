<script setup>
// iOS-inspired clean design with brand colors
// Paleta: Alta conversão focada em CTA
// Azul escuro: #22345F (da logo)
// Laranja: #F49A1A (da logo)
// Verde WhatsApp: #25D366
</script>

<template>
  <!-- CLEAN iOS-STYLE HERO - Brand Colors -->
  <section class="mt-16 md:mt-28 bg-white relative overflow-hidden">
    
    <!-- ========== MOBILE VERSION (< 768px) - iOS Clean Style ========== -->
    <div class="block md:hidden">
      <div class="px-5 pt-8 pb-10">
        
        <!-- 1. PROVA SOCIAL - Card Clean com cores da marca -->
        <a 
          href="https://www.google.com/search?sca_esv=59de4d94fc229621&sxsrf=ADLYWIIjEuoUVhAIFwXy5vUQP17RrHg2ig:1729605268236&kgmid=/g/11rnbd2wmb&q=AD+TELAS+MOSQUITEIRAS&shndl=30&source=sh/x/loc/uni/m1/1&kgs=5e4e7713d87c37c6&zx=1768571227913&no_sw_cr=1#lrd=0x94ce595a4d5fb92b:0xe81c9935ae058bde,1,,,,"
          target="_blank"
          rel="noopener noreferrer"
          class="block bg-white rounded-3xl p-5 mb-6 border-2 border-gray-100 shadow-sm active:scale-[0.98] transition-transform"
        >
          <!-- Rating -->
          <div class="flex items-center justify-center gap-2 mb-3">
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <div class="flex gap-0.5">
              <svg v-for="i in 5" :key="i" class="w-4 h-4 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <span class="text-[#22345F] font-bold text-sm">5.0</span>
            <span class="text-gray-500 text-xs">(487)</span>
          </div>
          
          <!-- Testimonial -->
          <p class="text-gray-700 text-sm text-center mb-3 leading-relaxed">
            "Instalação perfeita, super pontuais"
          </p>
          
          <!-- Cliente -->
          <div class="flex items-center justify-center gap-3">
            <img 
              src="/images/giovana_naomi.png" 
              alt="Cliente"
              class="w-10 h-10 rounded-full object-cover border-2 border-[#F49A1A]/20 shadow-sm"
            />
            <div class="text-left">
              <p class="text-[#22345F] font-semibold text-sm">Giovana Naomi</p>
              <p class="text-gray-500 text-xs">Cliente verificada</p>
            </div>
          </div>
        </a>

        <!-- 2. HEADLINE - Clean Typography com cor da marca -->
        <h1 class="text-[32px] leading-[1.1] font-bold mb-2 text-center text-[#22345F] tracking-tight">
          Telas Mosqueteiras<br>em São Paulo
        </h1>
        
        <!-- 3. BENEFÍCIO - Badge Style com cores da marca -->
        <div class="flex items-center justify-center gap-3 mb-6">
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#22345F] rounded-full text-xs font-medium border-2 border-[#22345F]/10">
            <svg class="w-3.5 h-3.5 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Instalação 48h
          </span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#22345F] rounded-full text-xs font-medium border-2 border-[#22345F]/10">
            <svg class="w-3.5 h-3.5 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Garantia 2 Anos
          </span>
        </div>

        <!-- 4. CTA PRINCIPAL - WhatsApp Verde com borda -->
        <a 
          href="https://wa.me/5511983586611?text=Olá! Gostaria de solicitar um orçamento para telas mosqueteiras."
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-2.5 w-full h-14 bg-[#25D366] text-white rounded-2xl font-semibold text-base shadow-lg shadow-[#25D366]/20 active:scale-[0.98] transition-all mb-3 border-2 border-[#25D366]"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
          <span>Orçamento Grátis no WhatsApp</span>
        </a>

        <!-- 5. CTA SECUNDÁRIO - Outline Laranja -->
        <a 
          href="tel:+5511983586611"
          class="flex items-center justify-center gap-2.5 w-full h-12 bg-white text-[#F49A1A] rounded-2xl font-medium text-sm border-2 border-[#F49A1A] active:scale-[0.98] active:bg-[#F49A1A]/5 transition-all mb-6"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
          </svg>
          <span>Ligar: (11) 98358-6611</span>
        </a>

        <!-- 6. TRUST BADGES - Minimal com ícones laranja -->
        <div class="flex items-center justify-center gap-6 text-xs text-gray-600 mb-6">
          <div class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span class="font-medium">+500 clientes</span>
          </div>
          <div class="w-px h-4 bg-gray-200"></div>
          <div class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span class="font-medium">10+ anos</span>
          </div>
        </div>

        <!-- 7. IMAGEM - Clean Card com borda -->
        <div class="w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border-2 border-gray-100">
          <img 
            src="/images/familia.png" 
            alt="Família protegida"
            class="w-full h-full object-cover"
          />
        </div>

      </div>
    </div>


    <!-- ========== DESKTOP VERSION (>= 768px) - Clean & Minimal com cores da marca ========== -->
    <div class="hidden md:block py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <!-- Coluna de Conteúdo -->
          <div>
            <!-- Badge com cores da marca -->
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#22345F] rounded-full text-sm font-medium mb-6 border-2 border-[#22345F]/10">
              <svg class="w-4 h-4 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              Instalação em 48h • Garantia 2 Anos
            </div>

            <!-- Headline com cores da marca -->
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-[#22345F] mb-6 leading-tight tracking-tight">
              Telas Mosqueteiras<br>
              <span class="text-[#F49A1A]">em São Paulo</span>
            </h1>
            
            <!-- Subheadline -->
            <p class="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              Instalação profissional de telas e redes para janelas, sacadas e áreas externas.
            </p>
            
            <!-- Prova Social Desktop -->
            <div class="flex flex-wrap items-center gap-6 mb-10">
              <a 
                href="https://www.google.com/search?sca_esv=59de4d94fc229621&sxsrf=ADLYWIIjEuoUVhAIFwXy5vUQP17RrHg2ig:1729605268236&kgmid=/g/11rnbd2wmb&q=AD+TELAS+MOSQUITEIRAS&shndl=30&source=sh/x/loc/uni/m1/1&kgs=5e4e7713d87c37c6&zx=1768571227913&no_sw_cr=1#lrd=0x94ce595a4d5fb92b:0xe81c9935ae058bde,1,,,,"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <div class="flex">
                  <svg v-for="i in 5" :key="i" class="w-4 h-4 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <span class="text-sm font-semibold text-[#22345F]">5.0 (487)</span>
              </a>
              
              <div class="w-px h-6 bg-gray-200"></div>
              
              <div class="flex items-center gap-2 text-gray-600">
                <svg class="w-5 h-5 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
                <span class="text-sm font-medium">+500 Clientes</span>
              </div>
              
              <div class="w-px h-6 bg-gray-200"></div>
              
              <div class="flex items-center gap-2 text-gray-600">
                <svg class="w-5 h-5 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span class="text-sm font-medium">10+ Anos</span>
              </div>
            </div>


            <!-- CTAs Desktop com cores da marca -->
            <div class="flex flex-col sm:flex-row gap-4">
              <a 
                href="https://wa.me/5511983586611?text=Olá! Gostaria de um orçamento para telas mosqueteiras."
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#25D366] text-white rounded-2xl font-semibold text-base shadow-lg shadow-[#25D366]/20 hover:bg-[#1fb854] hover:shadow-xl hover:shadow-[#25D366]/30 transition-all border-2 border-[#25D366]"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
                </svg>
                <span>Orçamento Grátis</span>
              </a>

              <a 
                href="tel:+5511983586611"
                class="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white text-[#F49A1A] rounded-2xl font-medium text-base border-2 border-[#F49A1A] hover:bg-[#F49A1A]/5 transition-all"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
                <span>Ligar Agora</span>
              </a>
            </div>
          </div>

          <!-- Coluna de Imagem/Form -->
          <div class="relative">
            <!-- Imagem com Card de Prova Social -->
            <div class="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-100">
              <img 
                src="/images/familia.png" 
                alt="Família protegida"
                class="w-full h-[500px] object-cover"
              />
              
              <!-- Card de Prova Social Flutuante -->
              <div class="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl border-2 border-[#F49A1A]/10">
                <div class="flex items-center gap-4">
                  <img 
                    src="/images/giovana_naomi.png" 
                    alt="Cliente"
                    class="w-14 h-14 rounded-full object-cover border-2 border-[#F49A1A]/20 shadow-md"
                  />
                  <div class="flex-1">
                    <div class="flex items-center gap-1 mb-1">
                      <svg v-for="i in 5" :key="i" class="w-4 h-4 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                    <p class="text-gray-700 text-sm font-medium mb-1">"Instalação perfeita, super pontuais"</p>
                    <p class="text-gray-500 text-xs">Giovana Naomi • Cliente verificada</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
