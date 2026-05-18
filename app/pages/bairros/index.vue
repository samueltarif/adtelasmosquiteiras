<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBairros } from '~/composables/useBairros'

useHead({
  title: 'Bairros Atendidos | AD Telas e Redes de Proteção SP',
  meta: [
    {
      name: 'description',
      content:
        'Instalação de telas mosquiteiras e redes de proteção em 19 cidades: São Paulo, Guarulhos, Osasco, Sorocaba, Cotia, Barueri e mais. Orçamento grátis e instalação rápida.',
    },
  ],
})

const {
  cidadesFiltradas,
  loading,
  error,
  search,
  cidadeSelecionada,
  totalBairros,
  fetchBairros,
  CIDADES,
} = useBairros()

const expandedCidades = ref<Set<number>>(new Set())

function toggleCidade(id: number) {
  if (expandedCidades.value.has(id)) {
    expandedCidades.value.delete(id)
  } else {
    expandedCidades.value.add(id)
  }
  // force reactivity
  expandedCidades.value = new Set(expandedCidades.value)
}

function expandAll() {
  expandedCidades.value = new Set(CIDADES.map((c) => c.id))
}

function collapseAll() {
  expandedCidades.value = new Set()
}

const whatsappUrl = (bairro: string, cidade: string) => {
  const msg = `Olá! Gostaria de um orçamento para ${bairro} - ${cidade}. Vim pelo site.`
  return `https://wa.me/5511983586611?text=${encodeURIComponent(msg)}`
}

onMounted(() => {
  fetchBairros()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <Breadcrumb />

    <!-- Hero -->
    <section class="bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-14 md:py-20">
      <div class="container mx-auto px-4 max-w-5xl text-center">
        <div class="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-5">
          <Icon name="lucide:map-pin" class="w-4 h-4 text-[#F49A1A]" />
          <span>Cobertura na Grande São Paulo</span>
        </div>
        <h1 class="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          Bairros Atendidos
        </h1>
        <p class="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          Instalação profissional de telas e redes de proteção em
          <span class="text-[#F49A1A] font-semibold">{{ CIDADES.length }} cidades</span>
          da Grande São Paulo e região.
        </p>

        <!-- Stats -->
        <div class="flex flex-wrap justify-center gap-6 text-sm">
          <div class="flex items-center gap-2">
            <Icon name="lucide:building-2" class="w-5 h-5 text-[#F49A1A]" />
            <span>{{ CIDADES.length }} cidades</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:layers" class="w-5 h-5 text-[#25D366]" />
            <span v-if="!loading">{{ totalBairros }}+ bairros</span>
            <span v-else>Carregando...</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:clock" class="w-5 h-5 text-[#25D366]" />
            <span>Instalação em 24h</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:shield-check" class="w-5 h-5 text-[#25D366]" />
            <span>Garantia 2 anos</span>
          </div>
        </div>
      </div>
    </section>

    <!-- CEP Search -->
    <section class="bg-gray-50 py-8 border-b border-gray-200">
      <div class="container mx-auto px-4 max-w-2xl">
        <CepSearch />
      </div>
    </section>

    <!-- Filtros -->
    <section class="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm py-3">
      <div class="container mx-auto px-4 max-w-5xl">
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Busca -->
          <div class="relative flex-1">
            <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Buscar bairro ou cidade..."
              class="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F49A1A] focus:ring-1 focus:ring-[#F49A1A]"
            />
          </div>

          <!-- Filtro por cidade -->
          <select
            v-model="cidadeSelecionada"
            class="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F49A1A] bg-white min-w-[180px]"
          >
            <option :value="null">Todas as cidades</option>
            <option v-for="c in CIDADES" :key="c.id" :value="c.id">{{ c.nome }}</option>
          </select>

          <!-- Expand/Collapse -->
          <div class="flex gap-2">
            <button
              @click="expandAll"
              class="px-3 py-2.5 text-xs border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Expandir tudo
            </button>
            <button
              @click="collapseAll"
              class="px-3 py-2.5 text-xs border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Recolher
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Conteúdo principal -->
    <section class="py-10">
      <div class="container mx-auto px-4 max-w-5xl">

        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
          <svg class="animate-spin w-10 h-10 text-[#F49A1A]" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p class="text-gray-500 text-sm">Carregando bairros via IBGE...</p>
        </div>

        <!-- Erro -->
        <div v-else-if="error" class="text-center py-16">
          <Icon name="lucide:wifi-off" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p class="text-gray-500 mb-4">{{ error }}</p>
          <button
            @click="fetchBairros"
            class="px-6 py-2.5 bg-[#F49A1A] text-white rounded-xl text-sm font-semibold hover:bg-[#e08910] transition-colors"
          >
            Tentar novamente
          </button>
        </div>

        <!-- Sem resultados -->
        <div v-else-if="cidadesFiltradas.length === 0" class="text-center py-16">
          <Icon name="lucide:search-x" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p class="text-gray-500">Nenhum bairro encontrado para "<strong>{{ search }}</strong>"</p>
          <button @click="search = ''" class="mt-3 text-[#F49A1A] text-sm underline">Limpar busca</button>
        </div>

        <!-- Lista de cidades -->
        <div v-else class="space-y-4">
          <div
            v-for="cidade in cidadesFiltradas"
            :key="cidade.id"
            class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
          >
            <!-- Header da cidade -->
            <button
              class="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              @click="toggleCidade(cidade.id)"
              :aria-expanded="expandedCidades.has(cidade.id)"
            >
              <div class="flex items-center gap-3">
                <div class="bg-[#22345F]/10 p-2 rounded-lg">
                  <Icon name="lucide:building-2" class="w-5 h-5 text-[#22345F]" />
                </div>
                <div>
                  <h2 class="font-bold text-[#22345F] text-lg leading-tight">{{ cidade.nome }}</h2>
                  <p class="text-xs text-gray-500">{{ cidade.bairros.length }} bairro{{ cidade.bairros.length !== 1 ? 's' : '' }}</p>
                </div>
              </div>
              <Icon
                name="lucide:chevron-right"
                class="w-5 h-5 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-90': expandedCidades.has(cidade.id) }"
              />
            </button>

            <!-- Bairros -->
            <div v-if="expandedCidades.has(cidade.id)" class="border-t border-gray-100 px-5 py-4">
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                <a
                  v-for="bairro in cidade.bairros"
                  :key="bairro.id"
                  :href="whatsappUrl(bairro.nome, cidade.nome)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 hover:border-[#F49A1A] hover:bg-[#F49A1A]/5 transition-all text-sm"
                >
                  <Icon name="lucide:map-pin" class="w-3.5 h-3.5 text-gray-400 group-hover:text-[#F49A1A] flex-shrink-0 transition-colors" />
                  <span class="text-gray-700 group-hover:text-[#22345F] font-medium truncate leading-tight">{{ bairro.nome }}</span>
                </a>
              </div>

              <!-- CTA por cidade -->
              <div class="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                <a
                  :href="`https://wa.me/5511983586611?text=${encodeURIComponent('Olá! Gostaria de um orçamento em ' + cidade.nome + '. Vim pelo site.')}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <Icon name="lucide:message-circle" class="w-4 h-4" />
                  Orçamento em {{ cidade.nome }}
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA final -->
        <div class="mt-12 bg-gradient-to-br from-[#22345F] to-[#1a2847] rounded-2xl p-8 text-center text-white">
          <h2 class="text-2xl font-bold mb-3">Não encontrou seu bairro?</h2>
          <p class="text-white/80 mb-6 max-w-md mx-auto">
            Atendemos toda a Grande São Paulo. Entre em contato e verificamos a disponibilidade para sua região.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <NuxtLink
              to="/orcamento"
              class="px-7 py-3.5 bg-[#F49A1A] hover:bg-[#e08910] text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
            >
              <Icon name="lucide:file-text" class="w-5 h-5" />
              Solicitar Orçamento
            </NuxtLink>
            <a
              href="https://wa.me/5511983586611?text=Olá! Gostaria de saber se atendem meu bairro."
              target="_blank"
              rel="noopener noreferrer"
              class="px-7 py-3.5 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
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
