<script setup>
const applications = [
  { title: 'Redes de proteção para janelas', path: '/servicos/redes/janelas', text: 'Conheça as opções para janelas de casas e apartamentos e os cuidados com a abertura das folhas.' },
  { title: 'Redes para sacadas e varandas', path: '/servicos/redes/sacadas-e-varandas', text: 'Veja como o fechamento acompanha o formato da varanda e o que considerar quando existe envidraçamento.' },
  { title: 'Redes de proteção para gatos e pets', path: '/servicos/redes/gatos-e-pets', text: 'Entenda os cuidados com cantos, frestas e vãos em ambientes com animais de estimação.' },
  { title: 'Vidraçaria para seu imóvel', path: '/servicos/vidracaria', text: 'Conheça janelas, telhados e fachadas de vidro e solicite a avaliação do seu projeto.' }
]
</script>

<template>
  <section class="py-12 md:py-16 bg-[#F9FAFB] border-y border-[#E5EDF8]" aria-labelledby="service-guide-title">
    <div class="max-w-7xl mx-auto px-5 md:px-8">
      <div class="max-w-3xl mb-8">
        <h2 id="service-guide-title" class="text-2xl md:text-3xl font-bold text-[#22345F] mb-4">Qual solução você procura para seu imóvel?</h2>
        <p class="text-gray-600 leading-relaxed">A tela mosquiteira ajuda a impedir a entrada de insetos. A rede de proteção tem outra finalidade: fechar vãos de janelas e sacadas para ajudar a prevenir quedas. A tela mosquiteira não substitui a rede de proteção.</p>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <NuxtLink v-for="item in applications" :key="item.path" :to="item.path" class="group block rounded-2xl border border-[#E5EDF8] bg-white p-6 hover:border-[#F49A1A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#22345F]">
          <h3 class="text-lg font-bold text-[#22345F] mb-3">{{ item.title }}</h3>
          <p class="text-sm text-gray-600 leading-relaxed">{{ item.text }}</p>
          <span class="inline-block mt-5 text-sm font-semibold text-[#22345F] group-hover:underline">Conhecer o serviço →</span>
        </NuxtLink>
      </div>
      <div class="mt-8 flex flex-col sm:flex-row gap-4 text-sm font-semibold text-[#22345F]">
        <NuxtLink to="/por-que-instalar-tela-mosquiteira" class="py-3 underline underline-offset-4">Entenda quando instalar uma tela mosquiteira</NuxtLink>
        <NuxtLink to="/areas-atendidas" class="py-3 underline underline-offset-4">Consulte o atendimento na sua região</NuxtLink>
      </div>
    </div>
  </section>
</template>
