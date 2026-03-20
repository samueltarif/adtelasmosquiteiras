<script setup>
import { BAIRROS_DATA } from '~/composables/useBairroLanding'

const route = useRoute()
const rawSlug = route.params.slug
const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug ?? '')

// Páginas estáticas que têm seu próprio .vue — não devem cair aqui
const STATIC_PAGES = [
  'por-que-instalar-tela-mosquiteira',
  'home', 'contato', 'orcamento', 'obrigado',
]

const bairro = STATIC_PAGES.includes(slug) ? null : (BAIRROS_DATA[slug] ?? null)

if (STATIC_PAGES.includes(slug)) {
  await navigateTo(`/${slug}`, { replace: true, redirectCode: 301 })
}

if (!bairro) {
  throw createError({ statusCode: 404, message: 'Página não encontrada' })
}

// Guard para SSR — garante que nada abaixo execute se bairro for null
const nome = bairro?.nome ?? ''
const cidade = bairro?.cidade ?? ''

useHead({
  title: `Tela Mosquiteira e Redes de Proteção em ${nome} SP | AD Telas`,
  meta: [
    {
      name: 'description',
      content: `Instalação de telas mosquiteiras e redes de proteção em ${nome}, ${cidade}. Orçamento grátis, instalação em 24h. Proteja sua família dos insetos e quedas.`
    },
    {
      name: 'keywords',
      content: `tela mosquiteira ${nome}, rede proteção ${nome}, telas ${nome} SP, mosquiteiro ${nome}`
    },
    { property: 'og:title', content: `Tela Mosquiteira em ${nome} | AD Telas e Redes` },
    { property: 'og:description', content: `Instalação profissional de telas e redes em ${nome}. Orçamento grátis.` },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'AD Telas e Redes',
        description: `Instalação de telas mosquiteiras e redes de proteção em ${nome}`,
        url: `https://www.adtelasmosquiteiras.com.br/${slug}`,
        telephone: '+55-11-98358-6611',
        areaServed: { '@type': 'Place', name: `${nome}, ${cidade}` },
        address: { '@type': 'PostalAddress', addressLocality: cidade, addressRegion: 'SP', addressCountry: 'BR' },
      })
    }
  ]
})

const { isSubmitting, redirectToThankYou } = useFormSubmit()

const formData = ref({
  nome: '',
  telefone: '',
  email: '',
  bairro: nome,
  servico: '',
  mensagem: ''
})

const servicosOptions = [
  'Telas Mosquiteiras',
  'Redes de Proteção',
  'Telas Pet Screen',
  'Redes para Crianças',
  'Redes para Pets',
  'Outro serviço'
]

const submitForm = async () => {
  isSubmitting.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  isSubmitting.value = false
  redirectToThankYou(formData.value)
}

const whatsappUrl = `https://wa.me/5511983586611?text=${encodeURIComponent(`Olá! Gostaria de um orçamento para ${bairro.nome}. Vim pelo site: https://www.adtelasmosquiteiras.com.br/${slug}`)}`

// Artigos fixos com links gov.br
const artigosFixos = [
  {
    titulo: 'Brasil registra mais de 5.000 mortes por dengue em 2024 — recorde histórico',
    descricao: 'O Painel de Monitoramento das Arboviroses do Ministério da Saúde registrou 5.000+ mortes e 6,5 milhões de casos prováveis em 2024.',
    url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/aedes-aegypti/monitoramento-das-arboviroses',
    fonte: 'Ministério da Saúde',
    data: '2024-08-01',
  },
  {
    titulo: 'Zika vírus: mais de 2.000 bebês nasceram com microcefalia no Brasil',
    descricao: 'O vírus Zika, transmitido pelo Aedes aegypti, causou mais de 2.000 casos de microcefalia no Brasil desde 2015.',
    url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/z/zika-virus',
    fonte: 'Ministério da Saúde',
    data: '2024-01-01',
  },
  {
    titulo: 'Chikungunya pode causar artrite crônica por meses ou anos',
    descricao: 'O Ministério da Saúde alerta que a chikungunya causa dores articulares intensas que podem se tornar crônicas, especialmente em idosos.',
    url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/c/chikungunya',
    fonte: 'Ministério da Saúde',
    data: '2024-01-01',
  },
  {
    titulo: 'Dengue, Zika e Chikungunya: riscos para gestantes e recém-nascidos',
    descricao: 'Arboviroses podem causar prematuridade, baixo peso e complicações neurológicas em bebês quando a mãe é infectada durante a gravidez.',
    url: 'https://bvsms.saude.gov.br/arboviroses-complicacoes-na-gravidez-infeccao-por-zika-virus-infeccao-pelo-virus-da-dengue-infeccao-pelo-virus-chikungunya-recem-nascido',
    fonte: 'Biblioteca Virtual em Saúde / MS',
    data: '2024-01-01',
  },
]

const { data: noticiasApi } = await useFetch(`/api/noticias/${slug}`, { default: () => [] })
const noticiasExibidas = computed(() => {
  const api = noticiasApi.value ?? []
  const fixos = artigosFixos.filter(f => !api.some((a) => a.url === f.url))
  return [...api, ...fixos].slice(0, 6)
})

const faqOpen = ref(null)
const toggleFaq = (i) => { faqOpen.value = faqOpen.value === i ? null : i }
</script>

<template>
  <div v-if="bairro" class="min-h-screen bg-gray-50">

    <!-- Hero -->
    <section class="bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-14 md:py-20">
      <div class="container mx-auto px-4 max-w-5xl text-center">
        <p class="text-[#F49A1A] font-semibold text-sm uppercase tracking-widest mb-3">
          AD Telas e Redes · {{ bairro.cidade }}
        </p>
        <h1 class="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          Tela Mosquiteira e Redes de Proteção em {{ bairro.nome }}
        </h1>
        <p class="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
          Instalação profissional no {{ bairro.descricao }}. Orçamento grátis e instalação em até 48h.
        </p>
        <div class="flex flex-wrap justify-center gap-6 text-sm mb-8">
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
        <a
          :href="whatsappUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-2xl font-bold text-lg shadow-xl transition-all"
        >
          <Icon name="lucide:message-circle" class="w-6 h-6" />
          Solicitar Orçamento Grátis
        </a>
      </div>
    </section>

    <!-- Conteúdo principal + Formulário -->
    <section class="py-14">
      <div class="container mx-auto px-4 max-w-6xl">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">

          <!-- Coluna esquerda: conteúdo -->
          <div class="space-y-8">

            <!-- Por que escolher -->
            <div>
              <h2 class="text-2xl font-bold text-[#22345F] mb-4">
                Por que instalar Tela Mosquiteira em {{ bairro.nome }}?
              </h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                {{ bairro.beneficiosMosquiteira }}
              </p>
              <ul class="space-y-3">
                <li
                  v-for="(item, i) in bairro.caracteristicas"
                  :key="i"
                  class="flex items-start gap-3"
                >
                  <Icon name="lucide:check-circle" class="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span class="text-gray-700 text-sm">{{ item }}</span>
                </li>
              </ul>
            </div>

            <!-- Áreas verdes -->
            <div v-if="bairro.areasVerdes?.length" class="bg-green-50 border border-green-200 rounded-2xl p-5">
              <div class="flex items-center gap-2 mb-3">
                <Icon name="lucide:trees" class="w-5 h-5 text-green-600" />
                <h3 class="font-bold text-green-800">Áreas Verdes em {{ bairro.nome }}</h3>
              </div>
              <p class="text-green-700 text-sm mb-3">
                A presença de parques e áreas verdes próximas aumenta a quantidade de mosquitos e insetos na região:
              </p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="area in bairro.areasVerdes"
                  :key="area"
                  class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
                >
                  🌳 {{ area }}
                </span>
              </div>
            </div>

            <!-- Redes de proteção -->
            <div>
              <h2 class="text-2xl font-bold text-[#22345F] mb-3">
                Redes de Proteção em {{ bairro.nome }}
              </h2>
              <p class="text-gray-600 leading-relaxed">
                {{ bairro.beneficiosRede }}
              </p>
            </div>

            <!-- Vantagens -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Icon name="lucide:clock" class="w-8 h-8 text-[#F49A1A] mb-2" />
                <h3 class="font-bold text-[#22345F] mb-1">Instalação Rápida</h3>
                <p class="text-sm text-gray-600">Em até 48h após aprovação do orçamento</p>
              </div>
              <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Icon name="lucide:shield-check" class="w-8 h-8 text-[#25D366] mb-2" />
                <h3 class="font-bold text-[#22345F] mb-1">Garantia 2 Anos</h3>
                <p class="text-sm text-gray-600">Cobertura total contra defeitos de fabricação</p>
              </div>
              <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Icon name="lucide:credit-card" class="w-8 h-8 text-[#0891b2] mb-2" />
                <h3 class="font-bold text-[#22345F] mb-1">Facilidade de Pagamento</h3>
                <p class="text-sm text-gray-600">Cartão, PIX e parcelamento disponíveis</p>
              </div>
              <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Icon name="lucide:award" class="w-8 h-8 text-[#F49A1A] mb-2" />
                <h3 class="font-bold text-[#22345F] mb-1">Profissionais Qualificados</h3>
                <p class="text-sm text-gray-600">Equipe treinada e experiente em {{ bairro.nome }}</p>
              </div>
            </div>

          </div>

          <!-- Coluna direita: formulário -->
          <div>
            <div class="bg-white rounded-2xl shadow-xl border-2 border-[#E5EDF8] p-6 md:p-8 sticky top-6">
              <h3 class="text-2xl font-bold text-[#22345F] mb-1 text-center">
                Orçamento Grátis em {{ bairro.nome }}
              </h3>
              <p class="text-gray-500 text-sm text-center mb-6">
                Resposta em minutos pelo WhatsApp
              </p>

              <form @submit.prevent="submitForm" class="space-y-4">
                <input
                  v-model="formData.nome"
                  type="text"
                  required
                  placeholder="Seu nome *"
                  class="w-full px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none text-sm"
                />
                <input
                  v-model="formData.telefone"
                  type="tel"
                  required
                  placeholder="WhatsApp / Telefone *"
                  class="w-full px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none text-sm"
                />
                <input
                  v-model="formData.email"
                  type="email"
                  placeholder="E-mail (opcional)"
                  class="w-full px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none text-sm"
                />
                <select
                  v-model="formData.servico"
                  required
                  class="w-full px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none text-sm"
                >
                  <option value="">Selecione o serviço *</option>
                  <option v-for="s in servicosOptions" :key="s" :value="s">{{ s }}</option>
                </select>
                <textarea
                  v-model="formData.mensagem"
                  rows="3"
                  placeholder="Mensagem (opcional)"
                  class="w-full px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none resize-none text-sm"
                ></textarea>
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="w-full px-6 py-4 bg-[#F49A1A] hover:bg-[#e08910] text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Icon v-if="!isSubmitting" name="lucide:send" class="w-5 h-5" />
                  <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {{ isSubmitting ? 'Enviando...' : 'Enviar Solicitação' }}
                </button>
              </form>

              <div class="mt-4 text-center">
                <span class="text-gray-400 text-xs">ou</span>
              </div>

              <a
                :href="whatsappUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-3 w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-xl font-semibold transition-all text-sm"
              >
                <Icon name="lucide:message-circle" class="w-5 h-5" />
                Falar direto no WhatsApp
              </a>
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
          Informações oficiais do Ministério da Saúde. Se apresentar sintomas, procure atendimento médico imediatamente.
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
            <span class="font-semibold text-[#22345F]">Fonte oficial:</span> Informações de sintomas e tratamento do
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
          <h2 class="text-2xl font-bold text-[#22345F]">Notícias sobre Dengue e Mosquitos em São Paulo</h2>
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
            <p v-if="noticia.descricao" class="text-xs text-gray-500 line-clamp-2">{{ noticia.descricao }}</p>
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
    <section class="py-12 bg-white">
      <div class="container mx-auto px-4 max-w-3xl">
        <h2 class="text-2xl font-bold text-[#22345F] text-center mb-8">
          Perguntas Frequentes — {{ bairro.nome }}
        </h2>
        <div class="space-y-3">
          <div
            v-for="(item, i) in bairro.faq"
            :key="i"
            class="border border-gray-200 rounded-xl overflow-hidden"
          >
            <button
              @click="toggleFaq(i)"
              class="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-[#22345F] hover:bg-gray-50 transition-colors"
            >
              <span>{{ item.q }}</span>
              <Icon
                :name="faqOpen === i ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                class="w-5 h-5 flex-shrink-0 text-gray-400"
              />
            </button>
            <div v-if="faqOpen === i" class="px-5 pb-4 text-gray-600 text-sm leading-relaxed">
              {{ item.r }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA final -->
    <section class="py-12 bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white text-center">
      <div class="container mx-auto px-4 max-w-2xl">
        <h2 class="text-2xl md:text-3xl font-bold mb-4">
          Pronto para proteger seu lar em {{ bairro.nome }}?
        </h2>
        <p class="text-gray-200 mb-8">
          Entre em contato agora e receba um orçamento gratuito. Instalação em até 48 horas.
        </p>
        <a
          :href="whatsappUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-2xl font-bold text-lg shadow-xl transition-all"
        >
          <Icon name="lucide:message-circle" class="w-6 h-6" />
          Falar no WhatsApp
        </a>
      </div>
    </section>

  </div>
</template>
