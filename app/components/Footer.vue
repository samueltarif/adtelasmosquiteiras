<template>
  <footer class="bg-text-primary text-white py-10">
    <div class="max-w-[1200px] mx-auto px-5">
      
      <!-- Bairros Atendidos -->
      <div class="mb-8 pb-8 border-b border-white/20">
        <h3 class="font-bold text-lg mb-4 text-center">Bairros Atendidos em São Paulo</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
          <NuxtLink to="/bairros/vila-sonia" class="hover:text-[#F49A1A] transition-colors text-center">
            Vila Sônia
          </NuxtLink>
          <NuxtLink to="/bairros/pinheiros" class="hover:text-[#F49A1A] transition-colors text-center">
            Pinheiros
          </NuxtLink>
          <NuxtLink to="/bairros/itaim-bibi" class="hover:text-[#F49A1A] transition-colors text-center">
            Itaim Bibi
          </NuxtLink>
          <NuxtLink to="/bairros/jardim-bonfiglioli" class="hover:text-[#F49A1A] transition-colors text-center">
            Jardim Bonfiglioli
          </NuxtLink>
          <NuxtLink to="/bairros/butanta" class="hover:text-[#F49A1A] transition-colors text-center">
            Butantã
          </NuxtLink>
          <NuxtLink to="/bairros/vila-olimpia" class="hover:text-[#F49A1A] transition-colors text-center">
            Vila Olímpia
          </NuxtLink>
          <NuxtLink to="/bairros/jardim-das-vertentes" class="hover:text-[#F49A1A] transition-colors text-center">
            Jardim das Vertentes
          </NuxtLink>
          <NuxtLink to="/bairros/jardim-monte-kemel" class="hover:text-[#F49A1A] transition-colors text-center">
            Jardim Monte Kemel
          </NuxtLink>
          <NuxtLink to="/bairros/jardim-paulista" class="hover:text-[#F49A1A] transition-colors text-center">
            Jardim Paulista
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
