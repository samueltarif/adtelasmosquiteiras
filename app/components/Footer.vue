<template>
  <footer class="bg-text-primary text-white py-10 text-center">
    <div class="max-w-[1200px] mx-auto px-5">
      <p class="font-bold">AD Telas e Redes © 2026 — Proteção Profissional em São Paulo</p>
      <p class="text-xs mt-2.5 opacity-80">Endereço: São Paulo - SP | CNPJ: 40.297.694/0001-9</p>
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
  </footer>
</template>
