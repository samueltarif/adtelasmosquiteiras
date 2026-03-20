<script setup>
const bairro = 'Jardim Bonfiglioli'
const whatsappUrl = `https://wa.me/5511983586611?text=${encodeURIComponent(`Olá! Gostaria de um orçamento para ${bairro}. Vim pelo site: https://www.adtelasmosquiteiras.com.br/bairros/jardim-bonfiglioli`)}`

useHead({
  title: `Telas e Redes de Proteção em ${bairro} SP | Orçamento Grátis`,
  meta: [
    { name: 'description', content: `Instalação de telas mosquiteiras e redes de proteção em ${bairro}. Orçamento grátis, instalação rápida em 48h. Atendemos ${bairro} e região.` },
  ]
})

const fotos = [
  { src: '/images/telas_para_sacadas.jpg', alt: 'Tela mosquiteira para sacadas' },
  { src: '/images/telas_para_varandas.jpg', alt: 'Tela mosquiteira para varandas' },
  { src: '/images/telas_para_apartamento.jpg', alt: 'Tela mosquiteira para apartamento' },
  { src: '/images/telas_de_correr.jpg', alt: 'Tela mosquiteira de correr' },
  { src: '/images/telas_removiveis.webp', alt: 'Tela mosquiteira removível' },
  { src: '/images/telas_para_portas.jpeg', alt: 'Tela mosquiteira para portas' },
  { src: '/images/telas_com_aluminio.jpg', alt: 'Tela mosquiteira com alumínio' },
  { src: '/images/telas_com_aco_inox.jpg', alt: 'Tela mosquiteira com aço inox' },
  { src: '/images/telas_pet_screen.webp', alt: 'Tela Pet Screen' },
  { src: '/images/telas_para_banheiro.jpg', alt: 'Tela mosquiteira para banheiro' },
  { src: '/images/telas_anti-pernilongos.jpg', alt: 'Tela anti-pernilongos' },
  { src: '/images/telas_para_coberturas.jpg', alt: 'Tela mosquiteira para coberturas' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50">

    <Breadcrumb />

    <!-- Hero -->
    <section class="bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-16 md:py-24">
      <div class="container mx-auto px-5 max-w-4xl text-center">
        <p class="text-[#F49A1A] font-semibold text-sm uppercase tracking-widest mb-4">
          AD Telas Mosquiteiras · São Paulo
        </p>
        <h1 class="text-3xl md:text-5xl font-bold mb-5 leading-tight">
          Telas e Redes em {{ bairro }}
        </h1>
        <p class="text-lg text-white/80 mb-8 max-w-xl mx-auto leading-relaxed">
          Instalação profissional de telas mosquiteiras e redes de proteção em {{ bairro }}. Orçamento grátis e instalação em até 48h.
        </p>
        <div class="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm mb-10">
          <div class="flex items-center gap-2">
            <Icon name="lucide:check-circle" class="w-5 h-5 text-[#25D366]" />
            <span>Instalação em 48h</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:shield-check" class="w-5 h-5 text-[#25D366]" />
            <span>Garantia 2 Anos</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:star" class="w-5 h-5 text-[#F49A1A]" />
            <span>5.0 · 487 avaliações</span>
          </div>
        </div>
        <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-2xl font-bold text-lg shadow-xl transition-all">
          <Icon name="lucide:message-circle" class="w-6 h-6" />
          Solicitar Orçamento Grátis
        </a>
      </div>
    </section>

    <!-- Benefícios -->
    <section class="py-14 bg-white">
      <div class="container mx-auto px-5 max-w-5xl">
        <h2 class="text-2xl font-bold text-[#22345F] text-center mb-10">
          Por que escolher a AD Telas em {{ bairro }}?
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div class="bg-gray-50 rounded-2xl p-6 text-center">
            <Icon name="lucide:clock" class="w-10 h-10 text-[#F49A1A] mx-auto mb-3" />
            <h3 class="font-bold text-[#22345F] mb-2">Instalação Rápida</h3>
            <p class="text-sm text-gray-600">Em até 48h após aprovação do orçamento</p>
          </div>
          <div class="bg-gray-50 rounded-2xl p-6 text-center">
            <Icon name="lucide:shield-check" class="w-10 h-10 text-[#25D366] mx-auto mb-3" />
            <h3 class="font-bold text-[#22345F] mb-2">Garantia 2 Anos</h3>
            <p class="text-sm text-gray-600">Cobertura total contra defeitos de fabricação</p>
          </div>
          <div class="bg-gray-50 rounded-2xl p-6 text-center">
            <Icon name="lucide:award" class="w-10 h-10 text-[#0891b2] mx-auto mb-3" />
            <h3 class="font-bold text-[#22345F] mb-2">Profissionais Qualificados</h3>
            <p class="text-sm text-gray-600">Equipe treinada e experiente em {{ bairro }}</p>
          </div>
          <div class="bg-gray-50 rounded-2xl p-6 text-center">
            <Icon name="lucide:credit-card" class="w-10 h-10 text-[#F49A1A] mx-auto mb-3" />
            <h3 class="font-bold text-[#22345F] mb-2">Facilidade de Pagamento</h3>
            <p class="text-sm text-gray-600">Cartão, PIX e parcelamento disponíveis</p>
          </div>
          <div class="bg-gray-50 rounded-2xl p-6 text-center">
            <Icon name="lucide:map-pin" class="w-10 h-10 text-[#25D366] mx-auto mb-3" />
            <h3 class="font-bold text-[#22345F] mb-2">Atendemos {{ bairro }}</h3>
            <p class="text-sm text-gray-600">Cobertura completa no bairro e região</p>
          </div>
          <div class="bg-gray-50 rounded-2xl p-6 text-center">
            <Icon name="lucide:message-circle" class="w-10 h-10 text-[#0891b2] mx-auto mb-3" />
            <h3 class="font-bold text-[#22345F] mb-2">Orçamento Grátis</h3>
            <p class="text-sm text-gray-600">Sem compromisso, resposta em minutos</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA intermediário -->
    <section class="py-10 bg-[#25D366]">
      <div class="container mx-auto px-5 max-w-3xl text-center">
        <p class="text-white font-bold text-xl mb-4">Fale agora e receba seu orçamento em minutos</p>
        <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#25D366] rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all">
          <Icon name="lucide:message-circle" class="w-6 h-6" />
          Chamar no WhatsApp
        </a>
      </div>
    </section>

    <!-- Galeria de fotos -->
    <section class="py-14 bg-gray-50">
      <div class="container mx-auto px-5 max-w-6xl">
        <h2 class="text-2xl font-bold text-[#22345F] text-center mb-3">
          Nossos Produtos
        </h2>
        <p class="text-gray-500 text-center text-sm mb-10">
          Telas mosquiteiras e redes de proteção instaladas em {{ bairro }} e região
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div v-for="foto in fotos" :key="foto.src"
            class="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow aspect-square bg-white">
            <img :src="foto.src" :alt="foto.alt"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </section>

    <!-- CTA final -->
    <section class="py-14 bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white text-center">
      <div class="container mx-auto px-5 max-w-2xl">
        <h2 class="text-2xl md:text-3xl font-bold mb-4">
          Proteja sua família em {{ bairro }}
        </h2>
        <p class="text-white/80 mb-8 leading-relaxed">
          Orçamento gratuito e instalação em até 48 horas. Sem compromisso.
        </p>
        <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-2xl font-bold text-lg shadow-xl transition-all">
          <Icon name="lucide:message-circle" class="w-6 h-6" />
          Falar no WhatsApp
        </a>
      </div>
    </section>

  </div>
</template>
