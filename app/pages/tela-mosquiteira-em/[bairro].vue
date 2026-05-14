<script setup lang="ts">
import { BAIRROS_DATA } from '~/composables/useBairroLanding'

const route = useRoute()
const rawSlug = route.params.bairro
const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug) as string

const bairro = (BAIRROS_DATA as Record<string, any>)[slug] ?? null
if (!bairro) {
  throw createError({ statusCode: 404, statusMessage: 'Bairro não encontrado' })
}

const pageUrl = `https://www.adtelasmosquiteiras.com.br/tela-mosquiteira-em/${slug}`
const whatsappUrl = `https://wa.me/5511983586611?text=${encodeURIComponent(`Olá! Gostaria de um orçamento de tela mosquiteira em ${bairro.nome}. Vi no site: ${pageUrl}`)}`

useHead({
  title: `Tela Mosquiteira em ${bairro.nome} SP | Instalação Profissional | AD Telas`,
  meta: [
    { name: 'description', content: `Instalação de tela mosquiteira em ${bairro.nome}, São Paulo. Proteja sua família de mosquitos e pernilongos. Orçamento grátis, instalação em 48h. ☎ (11) 98358-6611` },
    { name: 'keywords', content: `tela mosquiteira ${bairro.nome}, mosquiteiro ${bairro.nome}, tela mosquiteira ${bairro.nome} SP, instalação tela mosquiteira ${bairro.nome}` },
    { property: 'og:title', content: `Tela Mosquiteira em ${bairro.nome} | AD Telas Mosquiteiras` },
    { property: 'og:description', content: `Instalação profissional de tela mosquiteira em ${bairro.nome}. Orçamento grátis.` },
    { property: 'og:url', content: pageUrl },
    { property: 'og:type', content: 'website' },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'AD Telas Mosquiteiras',
      description: `Instalação de tela mosquiteira em ${bairro.nome}`,
      url: pageUrl,
      telephone: '+55-11-98358-6611',
      areaServed: { '@type': 'Place', name: `${bairro.nome}, São Paulo` },
      address: { '@type': 'PostalAddress', addressLocality: 'São Paulo', addressRegion: 'SP', addressCountry: 'BR' },
      priceRange: '$$',
      openingHours: 'Mo-Sa 08:00-18:00',
    })
  }]
})

// Artigos fixos editoriais — sempre relevantes, garantem conteúdo mesmo quando API falha
const artigosFixos = [
  {
    titulo: 'Brasil registra mais de 5.000 mortes por dengue em 2024 — recorde histórico',
    descricao: 'O Painel de Monitoramento das Arboviroses do Ministério da Saúde registrou 5.000+ mortes e 6,5 milhões de casos prováveis em 2024, o maior surto da história do país.',
    url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/aedes-aegypti/monitoramento-das-arboviroses',
    fonte: 'Ministério da Saúde',
    data: '2024-08-01',
  },
  {
    titulo: 'Zika vírus: mais de 2.000 bebês nasceram com microcefalia no Brasil',
    descricao: 'O Ministério da Saúde confirma que o vírus Zika, transmitido pelo Aedes aegypti, causou mais de 2.000 casos de microcefalia no Brasil desde 2015. Gestantes são o grupo de maior risco.',
    url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/z/zika-virus',
    fonte: 'Ministério da Saúde',
    data: '2024-01-01',
  },
  {
    titulo: 'Chikungunya pode causar artrite crônica por meses ou anos',
    descricao: 'O Ministério da Saúde alerta que a chikungunya causa dores articulares intensas que podem se tornar crônicas, especialmente em idosos e pessoas com comorbidades.',
    url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/c/chikungunya',
    fonte: 'Ministério da Saúde',
    data: '2024-01-01',
  },
  {
    titulo: '2024 foi o pior ano de dengue da história do Brasil',
    descricao: 'Com 6,5 milhões de casos e mais de 5.000 mortes, 2024 superou todos os registros anteriores. São Paulo foi um dos estados mais afetados pela epidemia.',
    url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/d/dengue',
    fonte: 'Ministério da Saúde',
    data: '2024-09-01',
  },
  {
    titulo: 'Dengue, Zika e Chikungunya: riscos para gestantes e recém-nascidos',
    descricao: 'A Biblioteca Virtual em Saúde documenta que arboviroses podem causar prematuridade, baixo peso e complicações neurológicas em bebês quando a mãe é infectada durante a gravidez.',
    url: 'https://bvsms.saude.gov.br/arboviroses-complicacoes-na-gravidez-infeccao-por-zika-virus-infeccao-pelo-virus-da-dengue-infeccao-pelo-virus-chikungunya-recem-nascido',
    fonte: 'Biblioteca Virtual em Saúde / MS',
    data: '2024-01-01',
  },
  {
    titulo: 'Brazil 2024: worst dengue outbreak in history with over 6.5 million cases',
    descricao: 'Brazil recorded its largest dengue epidemic in 2024, with 6.5 million probable cases and over 5,000 deaths — four times more than 2023, according to the Ministry of Health.',
    url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/aedes-aegypti/monitoramento-das-arboviroses',
    fonte: 'Ministério da Saúde (EN)',
    data: '2024-09-01',
  },
]

// Busca notícias via API — sem await para não bloquear SSR
const { data: noticiasApi } = await useFetch<typeof artigosFixos>(`/api/noticias/${slug}`, {
  default: () => []
})

// Mescla: prioriza API, completa com fixos se necessário
const noticiasExibidas = computed(() => {
  const api = noticiasApi.value ?? []
  const fixos = artigosFixos.filter(f => !api.some(a => a.url === f.url))
  return [...api, ...fixos].slice(0, 6)
})

const estatisticas = [
  { valor: '1.2M+', label: 'casos de dengue em SP em 2024', icone: 'lucide:alert-triangle' },
  { valor: '100%', label: 'dos mosquitos bloqueados pela tela', icone: 'lucide:shield-check' },
  { valor: '48h', label: 'prazo de instalação após orçamento', icone: 'lucide:clock' },
  { valor: '2 anos', label: 'de garantia em todos os produtos', icone: 'lucide:award' },
]

const tiposTela = [
  { nome: 'Tela Removível', desc: 'Fácil instalação e remoção, ideal para janelas', icone: 'lucide:grid' },
  { nome: 'Tela de Correr', desc: 'Desliza suavemente, perfeita para janelas grandes', icone: 'lucide:arrow-right' },
  { nome: 'Tela Basculante', desc: 'Abre para dentro, ideal para banheiros', icone: 'lucide:rotate-ccw' },
  { nome: 'Pet Screen', desc: 'Malha reforçada resistente a arranhões de pets', icone: 'lucide:paw-print' },
  { nome: 'Tela com Alumínio', desc: 'Estrutura em alumínio, alta durabilidade', icone: 'lucide:layers' },
  { nome: 'Tela Inox', desc: 'Aço inoxidável, máxima resistência', icone: 'lucide:shield' },
]

const fotos = [
  { src: '/images/telas_para_sacadas.jpg', alt: 'Tela mosquiteira para sacadas' },
  { src: '/images/telas_para_varandas.jpg', alt: 'Tela mosquiteira para varandas' },
  { src: '/images/telas_para_apartamento.jpg', alt: 'Tela mosquiteira para apartamento' },
  { src: '/images/telas_de_correr.jpg', alt: 'Tela mosquiteira de correr' },
  { src: '/images/telas_removiveis_especificacoes.jpg', alt: 'Tela mosquiteira removível' },
  { src: '/images/telas_para_portas.jpeg', alt: 'Tela mosquiteira para portas' },
  { src: '/images/telas_com_aluminio.jpg', alt: 'Tela mosquiteira com alumínio' },
  { src: '/images/telas_com_aco_inox.jpg', alt: 'Tela mosquiteira com aço inox' },
  { src: '/images/telas_pet_screen_especificacoes.jpg', alt: 'Tela Pet Screen' },
  { src: '/images/telas_para_banheiro.jpg', alt: 'Tela mosquiteira para banheiro' },
  { src: '/images/telas_anti-pernilongos.jpg', alt: 'Tela anti-pernilongos' },
  { src: '/images/telas_para_coberturas.jpg', alt: 'Tela mosquiteira para coberturas' },
]

const faqOpen = ref<number | null>(null)
const toggleFaq = (i: number | string) => {
  const idx = Number(i)
  faqOpen.value = faqOpen.value === idx ? null : idx
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Hero -->
    <section class="bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-16 md:py-24">
      <div class="container mx-auto px-5 max-w-5xl text-center">
        <p class="text-[#F49A1A] font-semibold text-sm uppercase tracking-widest mb-4">
          AD Telas Mosquiteiras · São Paulo
        </p>
        <h1 class="text-3xl md:text-5xl font-bold mb-5 leading-tight">
          Tela Mosquiteira em {{ bairro.nome }}
        </h1>
        <p class="text-lg text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
          Instalação profissional no {{ bairro.descricao }}. Proteja sua família de mosquitos, pernilongos e dengue.
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
          <div class="flex items-center gap-2">
            <Icon name="lucide:map-pin" class="w-5 h-5 text-[#F49A1A]" />
            <span>Atendemos {{ bairro.nome }}</span>
          </div>
        </div>
        <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-2xl font-bold text-lg shadow-xl transition-all">
          <Icon name="lucide:message-circle" class="w-6 h-6" />
          Solicitar Orçamento Grátis
        </a>
      </div>
    </section>

    <!-- Estatísticas -->
    <section class="py-12 bg-white border-b border-gray-100">
      <div class="container mx-auto px-5 max-w-5xl">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div v-for="stat in estatisticas" :key="stat.label" class="space-y-2">
            <Icon :name="stat.icone" class="w-8 h-8 mx-auto text-[#F49A1A]" />
            <p class="text-2xl font-bold text-[#22345F]">{{ stat.valor }}</p>
            <p class="text-xs text-gray-500 leading-snug">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Conteúdo + Formulário -->
    <section class="py-16">
      <div class="container mx-auto px-5 max-w-6xl">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">

          <!-- Coluna esquerda -->
          <div class="space-y-10">

            <div>
              <h2 class="text-2xl font-bold text-[#22345F] mb-4">
                Por que instalar Tela Mosquiteira em {{ bairro.nome }}?
              </h2>
              <p class="text-gray-600 leading-relaxed mb-6">{{ bairro.beneficiosMosquiteira }}</p>
              <ul class="space-y-4">
                <li v-for="(item, i) in bairro.caracteristicas" :key="i" class="flex items-start gap-3">
                  <Icon name="lucide:check-circle" class="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span class="text-gray-700 text-sm leading-relaxed">{{ item }}</span>
                </li>
              </ul>
            </div>

            <!-- Áreas verdes -->
            <div v-if="bairro.areasVerdes?.length" class="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div class="flex items-center gap-2 mb-3">
                <Icon name="lucide:trees" class="w-5 h-5 text-green-600" />
                <h3 class="font-bold text-green-800">Áreas Verdes em {{ bairro.nome }}</h3>
              </div>
              <p class="text-green-700 text-sm mb-4">
                Parques e áreas verdes próximas aumentam a presença de mosquitos e pernilongos:
              </p>
              <div class="flex flex-wrap gap-2">
                <span v-for="area in bairro.areasVerdes" :key="area"
                  class="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  🌳 {{ area }}
                </span>
              </div>
            </div>

            <!-- Tipos de tela -->
            <div>
              <h2 class="text-2xl font-bold text-[#22345F] mb-5">Tipos de Tela Mosquiteira</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div v-for="tipo in tiposTela" :key="tipo.nome"
                  class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
                  <Icon :name="tipo.icone" class="w-5 h-5 text-[#0891b2] flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="font-semibold text-[#22345F] text-sm">{{ tipo.nome }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">{{ tipo.desc }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Benefícios -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <Icon name="lucide:clock" class="w-8 h-8 text-[#F49A1A] mb-3" />
                <h3 class="font-bold text-[#22345F] mb-1">Instalação Rápida</h3>
                <p class="text-sm text-gray-600">Em até 48h após aprovação do orçamento</p>
              </div>
              <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <Icon name="lucide:shield-check" class="w-8 h-8 text-[#25D366] mb-3" />
                <h3 class="font-bold text-[#22345F] mb-1">Garantia 2 Anos</h3>
                <p class="text-sm text-gray-600">Cobertura total contra defeitos de fabricação</p>
              </div>
              <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <Icon name="lucide:credit-card" class="w-8 h-8 text-[#0891b2] mb-3" />
                <h3 class="font-bold text-[#22345F] mb-1">Facilidade de Pagamento</h3>
                <p class="text-sm text-gray-600">Cartão, PIX e parcelamento disponíveis</p>
              </div>
              <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <Icon name="lucide:award" class="w-8 h-8 text-[#F49A1A] mb-3" />
                <h3 class="font-bold text-[#22345F] mb-1">Profissionais Qualificados</h3>
                <p class="text-sm text-gray-600">Equipe treinada em {{ bairro.nome }}</p>
              </div>
            </div>

          </div>

          <!-- CTA WhatsApp -->
          <div>
            <div class="bg-white rounded-2xl shadow-xl border-2 border-[#E5EDF8] p-6 md:p-8 sticky top-6 text-center">
              <Icon name="lucide:message-circle" class="w-14 h-14 text-[#25D366] mx-auto mb-4" />
              <h3 class="text-2xl font-bold text-[#22345F] mb-2">
                Orçamento Grátis em {{ bairro.nome }}
              </h3>
              <p class="text-gray-500 text-sm mb-6">Resposta em minutos pelo WhatsApp. Sem compromisso.</p>
              <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer"
                class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-2xl font-bold text-lg shadow-lg transition-all mb-6">
                <Icon name="lucide:message-circle" class="w-6 h-6" />
                Falar no WhatsApp
              </a>
              <div class="grid grid-cols-2 gap-3 text-left">
                <div class="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <Icon name="lucide:clock" class="w-5 h-5 text-[#F49A1A] flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-xs font-bold text-[#22345F]">Instalação em 48h</p>
                    <p class="text-xs text-gray-500">Após aprovação</p>
                  </div>
                </div>
                <div class="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <Icon name="lucide:shield-check" class="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-xs font-bold text-[#22345F]">Garantia 2 Anos</p>
                    <p class="text-xs text-gray-500">Cobertura total</p>
                  </div>
                </div>
                <div class="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <Icon name="lucide:credit-card" class="w-5 h-5 text-[#0891b2] flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-xs font-bold text-[#22345F]">Parcelamento</p>
                    <p class="text-xs text-gray-500">Cartão e PIX</p>
                  </div>
                </div>
                <div class="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <Icon name="lucide:star" class="w-5 h-5 text-[#F49A1A] flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-xs font-bold text-[#22345F]">5.0 ★ 487 avaliações</p>
                    <p class="text-xs text-gray-500">Google Reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Sintomas e Tratamento -->
    <section class="py-12 bg-red-50 border-t border-red-100">
      <div class="container mx-auto px-4 max-w-5xl">
        <div class="flex items-center gap-3 mb-2">
          <Icon name="lucide:alert-circle" class="w-6 h-6 text-red-600" />
          <h2 class="text-2xl font-bold text-[#22345F]">Sintomas e Tratamento — Saiba Reconhecer</h2>
        </div>
        <p class="text-gray-600 text-sm mb-6">
          Informações oficiais do Ministério da Saúde. Se você ou alguém da família apresentar sintomas, procure atendimento médico imediatamente.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/d/dengue"
            target="_blank" rel="noopener noreferrer"
            class="bg-white border-2 border-red-200 rounded-2xl p-5 hover:border-red-400 hover:shadow-md transition-all group">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">🦟</span>
              <h3 class="font-bold text-red-700 text-base">Dengue</h3>
            </div>
            <ul class="text-xs text-gray-600 space-y-1 mb-4">
              <li>• Febre alta (acima de 38°C)</li>
              <li>• Dor de cabeça intensa</li>
              <li>• Dores no corpo e articulações</li>
              <li>• Manchas vermelhas na pele</li>
              <li>• Náuseas e vômitos</li>
            </ul>
            <div class="flex items-center gap-1 text-xs text-red-600 font-semibold group-hover:underline">
              <Icon name="lucide:external-link" class="w-3 h-3" />
              Ver sintomas completos — gov.br
            </div>
          </a>
          <a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/z/zika-virus"
            target="_blank" rel="noopener noreferrer"
            class="bg-white border-2 border-purple-200 rounded-2xl p-5 hover:border-purple-400 hover:shadow-md transition-all group">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">🤰</span>
              <h3 class="font-bold text-purple-700 text-base">Zika Vírus</h3>
            </div>
            <ul class="text-xs text-gray-600 space-y-1 mb-4">
              <li>• Febre baixa</li>
              <li>• Manchas vermelhas pelo corpo</li>
              <li>• Coceira intensa</li>
              <li>• Dor nos olhos e articulações</li>
              <li>• <span class="text-purple-700 font-semibold">Risco grave para gestantes</span></li>
            </ul>
            <div class="flex items-center gap-1 text-xs text-purple-600 font-semibold group-hover:underline">
              <Icon name="lucide:external-link" class="w-3 h-3" />
              Ver sintomas completos — gov.br
            </div>
          </a>
          <a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/c/chikungunya"
            target="_blank" rel="noopener noreferrer"
            class="bg-white border-2 border-orange-200 rounded-2xl p-5 hover:border-orange-400 hover:shadow-md transition-all group">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">🦴</span>
              <h3 class="font-bold text-orange-700 text-base">Chikungunya</h3>
            </div>
            <ul class="text-xs text-gray-600 space-y-1 mb-4">
              <li>• Febre alta de início súbito</li>
              <li>• Dores articulares intensas</li>
              <li>• Inchaço nas articulações</li>
              <li>• Dor pode durar meses ou anos</li>
              <li>• <span class="text-orange-700 font-semibold">Risco elevado para idosos</span></li>
            </ul>
            <div class="flex items-center gap-1 text-xs text-orange-600 font-semibold group-hover:underline">
              <Icon name="lucide:external-link" class="w-3 h-3" />
              Ver sintomas completos — gov.br
            </div>
          </a>
        </div>
        <div class="mt-5 bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
          <Icon name="lucide:info" class="w-5 h-5 text-[#0891b2] flex-shrink-0 mt-0.5" />
          <p class="text-xs text-gray-600 leading-relaxed">
            <span class="font-semibold text-[#22345F]">Fonte oficial:</span> Todas as informações de sintomas e tratamento são do
            <a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/aedes-aegypti" target="_blank" rel="noopener noreferrer" class="text-[#0891b2] underline">Ministério da Saúde do Brasil</a>.
            A tela mosquiteira é a medida preventiva mais eficaz dentro de casa — bloqueia fisicamente o Aedes aegypti antes da picada.
          </p>
        </div>
      </div>
    </section>

    <!-- Notícias -->
    <section class="py-12 bg-white border-t border-gray-100">
      <div class="container mx-auto px-4 max-w-5xl">
        <div class="flex items-center gap-3 mb-2">
          <Icon name="lucide:newspaper" class="w-6 h-6 text-[#0891b2]" />
          <h2 class="text-2xl font-bold text-[#22345F]">
            Notícias sobre Mosquitos e Dengue em São Paulo
          </h2>
        </div>
        <p class="text-gray-500 text-sm mb-6">
          Dados e reportagens sobre dengue, Zika e chikungunya — e como a tela mosquiteira protege sua família em {{ bairro.nome }}.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <a v-for="(noticia, i) in noticiasExibidas" :key="i"
            :href="noticia.url" target="_blank" rel="noopener noreferrer nofollow"
            class="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:border-[#0891b2] hover:shadow-md transition-all group">
            <div class="flex items-center gap-2 mb-2">
              <Icon name="lucide:external-link" class="w-4 h-4 text-[#0891b2]" />
              <span class="text-xs text-[#0891b2] font-medium">{{ noticia.fonte }}</span>
              <span class="text-xs text-gray-400 ml-auto">{{ noticia.data }}</span>
            </div>
            <h3 class="font-semibold text-[#22345F] text-sm leading-snug mb-2 group-hover:text-[#0891b2] transition-colors line-clamp-2">
              {{ noticia.titulo }}
            </h3>
            <p v-if="noticia.descricao" class="text-xs text-gray-500 line-clamp-2">
              {{ noticia.descricao }}
            </p>
          </a>
        </div>

        <div class="text-center">
          <NuxtLink to="/por-que-instalar-tela-mosquiteira"
            class="inline-flex items-center gap-2 px-6 py-3 bg-[#22345F] text-white rounded-xl font-semibold text-sm hover:bg-[#1a2847] transition-all">
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
            Ver todos os casos e notícias
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-12 bg-gray-50">
      <div class="container mx-auto px-4 max-w-3xl">
        <h2 class="text-2xl font-bold text-[#22345F] text-center mb-8">
          Perguntas Frequentes — Tela Mosquiteira em {{ bairro.nome }}
        </h2>
        <div class="space-y-3">
          <div v-for="(item, i) in bairro.faq" :key="i"
            class="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button @click="toggleFaq(i)"
              class="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-[#22345F] hover:bg-gray-50 transition-colors">
              <span>{{ item.q }}</span>
              <Icon :name="faqOpen === i ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                class="w-5 h-5 flex-shrink-0 text-gray-400" />
            </button>
            <div v-if="faqOpen === i" class="px-5 pb-4 text-gray-600 text-sm leading-relaxed">
              {{ item.r }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Galeria de fotos -->
    <section class="py-14 bg-gray-50 border-t border-gray-100">
      <div class="container mx-auto px-5 max-w-6xl">
        <h2 class="text-2xl font-bold text-[#22345F] text-center mb-3">
          Nossos Produtos
        </h2>
        <p class="text-gray-500 text-center text-sm mb-10">
          Telas mosquiteiras instaladas em {{ bairro.nome }} e região
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
    <section class="py-12 bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white text-center">
      <div class="container mx-auto px-4 max-w-2xl">
        <h2 class="text-2xl md:text-3xl font-bold mb-4">
          Proteja sua família em {{ bairro.nome }} agora
        </h2>
        <p class="text-white/80 mb-8">
          Orçamento gratuito e instalação em até 48 horas. Sem compromisso.
        </p>
        <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-2xl font-bold text-lg shadow-xl transition-all">
          <Icon name="lucide:message-circle" class="w-6 h-6" />
          Falar no WhatsApp
        </a>
      </div>
    </section>

  </div>
</template>
