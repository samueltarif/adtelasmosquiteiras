<script setup>
import { useBairroLanding, slugify } from '~/composables/useBairroLanding'

const route = useRoute()
const slug = route.params.slug

const { data: bairro } = useBairroLanding(slug)

// 404 se não for um bairro conhecido
if (!bairro) {
  throw createError({ statusCode: 404, statusMessage: 'Página não encontrada' })
}

useHead({
  title: `Tela Mosquiteira e Redes de Proteção em ${bairro.nome} SP | AD Telas`,
  meta: [
    {
      name: 'description',
      content: `Instalação de telas mosquiteiras e redes de proteção em ${bairro.nome}, ${bairro.cidade}. Orçamento grátis, instalação em 24h. Proteja sua família dos insetos e quedas.`
    },
    {
      name: 'keywords',
      content: `tela mosquiteira ${bairro.nome}, rede proteção ${bairro.nome}, telas ${bairro.nome} SP, mosquiteiro ${bairro.nome}`
    },
    { property: 'og:title', content: `Tela Mosquiteira em ${bairro.nome} | AD Telas e Redes` },
    { property: 'og:description', content: `Instalação profissional de telas e redes em ${bairro.nome}. Orçamento grátis.` },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'AD Telas e Redes',
        description: `Instalação de telas mosquiteiras e redes de proteção em ${bairro.nome}`,
        url: `https://www.adtelasmosquiteiras.com.br/${slug}`,
        telephone: '+55-11-98358-6611',
        areaServed: { '@type': 'Place', name: `${bairro.nome}, ${bairro.cidade}` },
        address: { '@type': 'PostalAddress', addressLocality: bairro.cidade, addressRegion: 'SP', addressCountry: 'BR' },
      })
    }
  ]
})

const { isSubmitting, redirectToThankYou } = useFormSubmit()

const formData = ref({
  nome: '',
  telefone: '',
  email: '',
  bairro: bairro.nome,
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

const faqOpen = ref(null)
const toggleFaq = (i) => { faqOpen.value = faqOpen.value === i ? null : i }
</script>

<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Hero -->
    <section class="bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-14 md:py-20">
      <div class="container mx-auto px-4 max-w-5xl text-center">
        <p class="text-[#F49A1A] font-semibold text-sm uppercase tracking-widest mb-3">
          AD Telas e Redes · {{ bairro.cidade }}
        </p>
        <h1 class="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          Tela Mosquiteira e Redes de Proteção em {{ bairro.nome }}
        </h1>
        <p class="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
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
        <p class="text-white/80 mb-8">
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
