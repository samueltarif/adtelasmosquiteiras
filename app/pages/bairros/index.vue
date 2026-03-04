<script setup>
useHead({
  title: 'Bairros Atendidos em São Paulo | AD Telas e Redes',
  meta: [
    { name: 'description', content: 'Instalação de telas mosquiteiras e redes de proteção em diversos bairros de São Paulo. Orçamento grátis e instalação rápida.' }
  ]
})

const bairros = [
  {
    nome: 'Vila Sônia',
    slug: 'vila-sonia',
    descricao: 'Atendimento especializado em telas e redes de proteção'
  },
  {
    nome: 'Pinheiros',
    slug: 'pinheiros',
    descricao: 'Instalação profissional com garantia de 2 anos'
  },
  {
    nome: 'Itaim Bibi',
    slug: 'itaim-bibi',
    descricao: 'Orçamento grátis e instalação em até 48h'
  },
  {
    nome: 'Jardim Bonfiglioli',
    slug: 'jardim-bonfiglioli',
    descricao: 'Proteção para sua família e pets'
  },
  {
    nome: 'Butantã',
    slug: 'butanta',
    descricao: 'Equipe qualificada e experiente'
  },
  {
    nome: 'Vila Olímpia',
    slug: 'vila-olimpia',
    descricao: 'Telas mosquiteiras e redes de segurança'
  },
  {
    nome: 'Jardim das Vertentes',
    slug: 'jardim-das-vertentes',
    descricao: 'Atendimento rápido e profissional'
  },
  {
    nome: 'Jardim Monte Kemel',
    slug: 'jardim-monte-kemel',
    descricao: 'Soluções completas em proteção'
  },
  {
    nome: 'Jardim Paulista',
    slug: 'jardim-paulista',
    descricao: 'Instalação com garantia e qualidade'
  }
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    
    <Breadcrumb />
    
    <section class="bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-16 md:py-20">
      <div class="container mx-auto px-4 max-w-6xl text-center">
        <h1 class="text-3xl md:text-5xl font-bold mb-4">
          Bairros Atendidos em São Paulo
        </h1>
        <p class="text-lg md:text-xl text-white/90 mb-6">
          Instalação profissional de telas e redes de proteção em toda região
        </p>
        <div class="flex flex-wrap justify-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <Icon name="lucide:map-pin" class="w-5 h-5 text-[#F49A1A]" />
            <span>9 Bairros Atendidos</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:clock" class="w-5 h-5 text-[#25D366]" />
            <span>Instalação 48h</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:shield-check" class="w-5 h-5 text-[#25D366]" />
            <span>Garantia 2 Anos</span>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16">
      <div class="container mx-auto px-4 max-w-6xl">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="bairro in bairros"
            :key="bairro.slug"
            :to="`/bairros/${bairro.slug}`"
            class="bg-white rounded-xl shadow-lg border-2 border-[#E5EDF8] p-6 hover:border-[#F49A1A] hover:shadow-xl transition-all group"
          >
            <div class="flex items-start gap-4">
              <div class="bg-[#F49A1A]/10 p-3 rounded-lg group-hover:bg-[#F49A1A] transition-colors">
                <Icon name="lucide:map-pin" class="w-6 h-6 text-[#F49A1A] group-hover:text-white transition-colors" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-[#22345F] mb-2 group-hover:text-[#F49A1A] transition-colors">
                  {{ bairro.nome }}
                </h3>
                <p class="text-gray-600 text-sm mb-3">
                  {{ bairro.descricao }}
                </p>
                <div class="flex items-center gap-2 text-[#F49A1A] text-sm font-semibold">
                  <span>Ver página do bairro</span>
                  <Icon name="lucide:arrow-right" class="w-4 h-4" />
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div class="mt-12 bg-gradient-to-br from-[#22345F] to-[#1a2847] rounded-2xl p-8 text-center text-white">
          <h2 class="text-2xl font-bold mb-4">Não encontrou seu bairro?</h2>
          <p class="text-white/90 mb-6">
            Atendemos toda a região de São Paulo. Entre em contato para verificar disponibilidade!
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <NuxtLink
              to="/orcamento"
              class="px-8 py-4 bg-[#F49A1A] hover:bg-[#e08910] text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
            >
              <Icon name="lucide:file-text" class="w-5 h-5" />
              Solicitar Orçamento
            </NuxtLink>
            <a
              href="https://wa.me/5511983586611?text=Olá! Gostaria de saber se atendem meu bairro."
              target="_blank"
              class="px-8 py-4 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
            >
              <Icon name="lucide:message-circle" class="w-5 h-5" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>
