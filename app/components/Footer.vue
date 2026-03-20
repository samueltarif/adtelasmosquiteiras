<template>
  <footer class="bg-text-primary text-white py-10">
    <div class="max-w-[1200px] mx-auto px-5">
      
      <!-- Bairros Atendidos -->
      <div class="mb-8 pb-8 border-b border-white/20">
        <h3 class="font-bold text-lg mb-4 text-center">Bairros Atendidos em São Paulo</h3>
        <div class="text-center">
          <NuxtLink 
            to="/bairros" 
            class="inline-flex items-center gap-2 px-6 py-3 bg-[#F49A1A] hover:bg-[#e08910] text-white rounded-xl font-semibold transition-colors"
          >
            <Icon name="lucide:map-pin" class="w-4 h-4" />
            Ver todos os bairros atendidos
          </NuxtLink>
        </div>
      </div>

      <!-- Informações da Empresa -->
      <div class="text-center">
        <p class="font-bold">AD Telas e Redes © 2026 — Proteção Profissional em São Paulo</p>
        <p class="text-xs mt-2.5 opacity-80">Endereço: São Paulo - SP | CNPJ: 40.297.694/0001-95</p>
        <p class="text-xs opacity-80">Atendimento: (11) 98358-6611 | vendas.adtelaseredes@gmail.com</p>
        
        <!-- Redes Sociais -->
        <div class="flex justify-center mt-6">
          <SocialButtons variant="inline" :show-labels="true" />
        </div>
        
        <!-- Links Legais -->
        <div class="flex justify-center gap-4 mt-4 text-xs opacity-70">
          <a href="/termos-de-uso.html" target="_blank" class="hover:opacity-100 transition-opacity">
            Termos de Uso
          </a>
          <span>|</span>
          <a href="/politica-de-privacidade.html" target="_blank" class="hover:opacity-100 transition-opacity">
            Política de Privacidade
          </a>
        </div>
        
        <p class="text-[11px] mt-5 opacity-60">Todos os direitos reservados | Desenvolvido com foco em conversão e segurança</p>
      </div>
    </div>
  </footer>
</template>
