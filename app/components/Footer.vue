<template>
  <footer data-cta-location="footer" class="bg-text-primary text-white py-10">
    <div class="max-w-[1200px] mx-auto px-5">
      <nav aria-label="Serviços e atendimento" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1 pb-8 mb-8 border-b border-white/20 text-sm">
        <NuxtLink to="/servicos/redes" class="py-3 hover:underline">Redes de proteção em São Paulo</NuxtLink>
        <NuxtLink to="/servicos/telas" class="py-3 hover:underline">Telas mosquiteiras sob medida</NuxtLink>
        <NuxtLink to="/servicos/vidracaria" class="py-3 hover:underline">Serviços de vidraçaria</NuxtLink>
        <NuxtLink to="/servicos/redes/janelas" class="py-3 hover:underline">Redes de proteção para janelas</NuxtLink>
        <NuxtLink to="/servicos/redes/sacadas-e-varandas" class="py-3 hover:underline">Redes para sacadas e varandas</NuxtLink>
        <NuxtLink to="/servicos/redes/gatos-e-pets" class="py-3 hover:underline">Redes para gatos e pets</NuxtLink>
        <NuxtLink to="/areas-atendidas" class="py-3 hover:underline">Consultar áreas atendidas</NuxtLink>
      </nav>
      <!-- Informações da Empresa -->
      <div class="text-center">
        <p class="font-bold">AD Telas e Redes © 2026 — Proteção Profissional em São Paulo</p>
        <p class="text-xs mt-2.5 opacity-80">Endereço: São Paulo - SP | CNPJ: 40.297.694/0001-95</p>
        <p class="text-xs opacity-80" v-html="'Atendimento: (11) 98358-6611 | <!--email_off-->vendas.adtelaseredes@gmail.com<!--/email_off-->'"></p>
        
        <!-- Redes Sociais -->
        <div class="flex justify-center mt-6">
          <SocialButtons variant="inline" :show-labels="true" />
        </div>
        
        <!-- Links Legais -->
        <div class="flex justify-center items-center gap-2 mt-4 text-xs opacity-70">
          <a href="/termos-de-uso.html" target="_blank" class="hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3">
            Termos de Uso
          </a>
          <span>|</span>
          <a href="/politica-de-privacidade.html" target="_blank" class="hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3">
            Política de Privacidade
          </a>
        </div>
        
        <p class="text-[11px] mt-5 opacity-60">Todos os direitos reservados | Desenvolvido com foco em conversão e segurança</p>
      </div>
    </div>
  </footer>
</template>
