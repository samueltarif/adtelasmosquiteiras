<script setup lang="ts">
useHead({
  title: 'Por que instalar tela mosquiteira? Casos reais e riscos de saúde | AD Telas',
  meta: [
    { name: 'description', content: 'Dengue, zika, malária, chikungunya: veja casos reais de mortes e doenças causadas por mosquitos em SP e entenda por que a tela mosquiteira é essencial.' },
    { name: 'keywords', content: 'dengue morte, zika gestante, mosquito doença, tela mosquiteira proteção, chikungunya, malária' },
  ],
})

const noticias = [
  {
    categoria: 'Dengue',
    cor: 'red',
    icone: 'lucide:alert-triangle',
    titulo: 'Brasil registra mais de 5.000 mortes por dengue em 2024 — o pior ano da história',
    data: 'Agosto 2024',
    fonte: 'Ministério da Saúde — Painel de Arboviroses',
    fonteUrl: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/aedes-aegypti/monitoramento-das-arboviroses',
    resumo: 'O Brasil registrou mais de 5.000 mortes por dengue em 2024 — quatro vezes mais do que em 2023. Com 6,5 milhões de casos prováveis, foi o maior surto da história do país, segundo o Painel de Monitoramento das Arboviroses do Ministério da Saúde. São Paulo foi um dos estados mais afetados, com áreas residenciais entre os principais focos de transmissão.',
    destaque: 'A dengue grave pode evoluir para óbito em menos de 48 horas. Crianças, idosos e gestantes são os grupos de maior risco. A tela mosquiteira é a barreira física mais eficaz dentro de casa.',
  },
  {
    categoria: 'Zika na Gestação',
    cor: 'purple',
    icone: 'lucide:baby',
    titulo: 'Mais de 2.000 bebês nasceram com microcefalia por Zika no Brasil',
    data: '2015–2024',
    fonte: 'Ministério da Saúde — Zika Vírus',
    fonteUrl: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/z/zika-virus',
    resumo: 'Desde o surto de 2015, o Ministério da Saúde confirmou mais de 2.000 casos de microcefalia associados ao vírus Zika no Brasil. O vírus, transmitido pelo Aedes aegypti, atravessa a barreira placentária e causa malformações cerebrais irreversíveis no feto. Crianças afetadas vivem com sequelas neurológicas permanentes.',
    destaque: 'O vírus Zika em gestantes causa a Síndrome Congênita do Zika (SCZ), com microcefalia e comprometimento neurológico grave. O Ministério da Saúde recomenda proteção reforçada contra mosquitos para todas as grávidas.',
  },
  {
    categoria: 'Chikungunya',
    cor: 'orange',
    icone: 'lucide:activity',
    titulo: 'Chikungunya pode causar artrite crônica que dura meses ou anos',
    data: '2024',
    fonte: 'Ministério da Saúde — Chikungunya',
    fonteUrl: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/c/chikungunya',
    resumo: 'Em 2024, o Brasil concentrou a grande maioria dos casos de chikungunya nas Américas. A doença causa febre alta e dores articulares intensas que, em muitos pacientes, evoluem para artrite crônica com duração de meses ou anos, especialmente em idosos e pessoas com doenças preexistentes, conforme documentado pelo Ministério da Saúde.',
    destaque: 'A chikungunya pode causar dores articulares crônicas que incapacitam o paciente por meses. Não existe tratamento específico — apenas controle dos sintomas. A prevenção da picada é a única proteção eficaz.',
  },
  {
    categoria: 'Dengue — Maior Epidemia',
    cor: 'red',
    icone: 'lucide:trending-up',
    titulo: '2024: a maior epidemia de dengue da história do Brasil',
    data: '2024',
    fonte: 'Ministério da Saúde — Dengue',
    fonteUrl: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/d/dengue',
    resumo: 'O Ministério da Saúde registrou 2024 como o ano com o maior número de casos de dengue da história do Brasil. A epidemia se espalhou por todas as regiões do país, com São Paulo entre os estados de maior incidência. O calor, as chuvas e a urbanização aceleraram a proliferação do Aedes aegypti em regiões residenciais.',
    destaque: 'A expansão urbana e o calor intenso aumentam a reprodução do mosquito em cidades como São Paulo. Janelas sem tela são a principal porta de entrada do Aedes aegypti nas residências.',
  },
  {
    categoria: 'Zika — Impacto Duradouro',
    cor: 'purple',
    icone: 'lucide:brain',
    titulo: 'Síndrome Congênita do Zika: sequelas neurológicas permanentes em crianças',
    data: '2024',
    fonte: 'Ministério da Saúde — Zika Vírus',
    fonteUrl: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/z/zika-virus',
    resumo: 'Milhares de crianças brasileiras nascidas com a Síndrome Congênita do Zika (SCZ) continuam enfrentando desafios severos: dificuldade para andar, falar, ver e aprender. O Ministério da Saúde acompanha esses casos e reforça que o vírus Zika segue circulando no Brasil, transmitido pelo mesmo mosquito da dengue.',
    destaque: 'A Síndrome Congênita do Zika não tem cura. Crianças afetadas precisam de cuidados especializados por toda a vida. Uma tela mosquiteira pode ser a diferença entre uma gravidez saudável e uma tragédia irreversível.',
  },
  {
    categoria: 'Chikungunya — Grupos de Risco',
    cor: 'orange',
    icone: 'lucide:heart-pulse',
    titulo: 'Idosos e pessoas com comorbidades têm risco elevado de morte por chikungunya',
    data: '2024',
    fonte: 'Ministério da Saúde — Chikungunya',
    fonteUrl: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/c/chikungunya',
    resumo: 'O Ministério da Saúde alerta que idosos e pessoas com doenças cardíacas, diabetes ou hipertensão têm risco elevado de complicações graves e morte por chikungunya. A doença pode precipitar crises em condições preexistentes, levando a internações e óbitos que nem sempre são diretamente atribuídos ao vírus.',
    destaque: 'A chikungunya pode ser fatal para idosos e pessoas com comorbidades. O mosquito Aedes aegypti transmite dengue, Zika e chikungunya — a mesma tela protege contra todas.',
  },
  {
    categoria: 'Dengue — Crianças',
    cor: 'red',
    icone: 'lucide:shield-alert',
    titulo: 'Dengue grave em crianças: sinais de alarme que os pais precisam conhecer',
    data: '2024',
    fonte: 'Ministério da Saúde — Dengue',
    fonteUrl: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/d/dengue',
    resumo: 'O Ministério da Saúde alerta que crianças com dengue grave podem deteriorar rapidamente. Os sinais de alarme — dor abdominal intensa, vômitos persistentes, sangramento e sonolência excessiva — frequentemente são confundidos com gripe pelos pais. O reconhecimento tardio é um dos principais fatores associados a óbito infantil por dengue.',
    destaque: 'Crianças com dengue grave podem ir a óbito em poucas horas se não tratadas. A prevenção da picada dentro de casa, com tela mosquiteira, é a medida mais eficaz para proteger bebês e crianças pequenas.',
  },
  {
    categoria: 'Arboviroses na Gravidez',
    cor: 'purple',
    icone: 'lucide:thermometer',
    titulo: 'Dengue, Zika e Chikungunya ameaçam a saúde de gestantes e recém-nascidos',
    data: '2024',
    fonte: 'Biblioteca Virtual em Saúde — Ministério da Saúde',
    fonteUrl: 'https://bvsms.saude.gov.br/arboviroses-complicacoes-na-gravidez-infeccao-por-zika-virus-infeccao-pelo-virus-da-dengue-infeccao-pelo-virus-chikungunya-recem-nascido',
    resumo: 'A Biblioteca Virtual em Saúde do Ministério da Saúde documenta que arboviroses representam ameaças sérias à saúde neonatal. Infecções maternas por dengue, Zika ou chikungunya no período periparto podem causar prematuridade, baixo peso ao nascer e complicações neurológicas graves no recém-nascido.',
    destaque: 'Gestantes infectadas por arboviroses podem transmitir o vírus ao bebê durante o parto. A proteção com telas mosquiteiras é recomendada pelo Ministério da Saúde como medida preventiva essencial durante a gravidez.',
  },
]

const estatisticas = [
  { numero: '5.000+', descricao: 'mortes por dengue no Brasil em 2024 (recorde histórico)', icone: 'lucide:skull', cor: 'red' },
  { numero: '2.000+', descricao: 'bebês nascidos com microcefalia por Zika no Brasil', icone: 'lucide:baby', cor: 'purple' },
  { numero: '6,5 mi', descricao: 'casos de dengue registrados em 2024 — maior surto da história', icone: 'lucide:trending-up', cor: 'orange' },
  { numero: '97%', descricao: 'dos casos de chikungunya nas Américas em 2024 foram no Brasil', icone: 'lucide:map-pin', cor: 'blue' },
]

const whatsappUrl = 'https://wa.me/5511983586611?text=' + encodeURIComponent('Olá! Vi a página sobre os riscos dos mosquitos e gostaria de um orçamento para tela mosquiteira. Vim pelo site.')
</script>

<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Hero da página -->
    <section class="bg-[#22345F] text-white pt-20 pb-16 md:pt-36 md:pb-20">
      <div class="container mx-auto px-4 max-w-4xl text-center">
        <div class="inline-flex items-center gap-2 bg-red-500/30 border border-red-400/50 rounded-full px-4 py-1.5 text-sm mb-6">
          <Icon name="lucide:alert-triangle" class="w-4 h-4 text-red-300" />
          <span class="text-white font-medium">Informação de saúde pública</span>
        </div>
        <h1 class="text-3xl md:text-5xl font-bold mb-6 leading-tight text-white">
          Por que instalar tela mosquiteira<br>
          <span class="text-[#F49A1A]">na sua casa?</span>
        </h1>
        <p class="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10">
          Casos reais de mortes, doenças em bebês, gestantes e adultos causados por mosquitos em São Paulo. Veja o que acontece quando a janela fica aberta.
        </p>
        <NuxtLink
          to="/orcamento"
          class="inline-flex items-center gap-2 px-8 py-4 bg-[#F49A1A] hover:bg-[#e08910] text-white rounded-2xl font-bold text-lg transition-all shadow-lg"
        >
          <Icon name="lucide:shield-check" class="w-5 h-5" />
          Proteger minha família agora
        </NuxtLink>
      </div>
    </section>

    <!-- Estatísticas -->
    <section class="py-10 bg-white border-b border-gray-200">
      <div class="container mx-auto px-4 max-w-4xl">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="stat in estatisticas"
            :key="stat.numero"
            class="text-center p-4 rounded-2xl bg-gray-50 border border-gray-100"
          >
            <div class="text-2xl md:text-3xl font-bold text-[#22345F] mb-1">{{ stat.numero }}</div>
            <div class="text-xs text-gray-500 leading-tight">{{ stat.descricao }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Notícias / Relatos -->
    <section class="py-12">
      <div class="container mx-auto px-4 max-w-4xl">
        <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-2 text-center">Casos reais em São Paulo</h2>
        <p class="text-gray-500 text-center mb-10">Relatos baseados em dados da Secretaria de Saúde SP e Ministério da Saúde</p>

        <div class="space-y-6">
          <article
            v-for="(noticia, i) in noticias"
            :key="i"
            class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <!-- Header do card -->
            <div
              class="px-5 py-3 flex items-center gap-2 text-sm font-semibold"
              :class="{
                'bg-red-50 text-red-700 border-b border-red-100': noticia.cor === 'red',
                'bg-purple-50 text-purple-700 border-b border-purple-100': noticia.cor === 'purple',
                'bg-orange-50 text-orange-700 border-b border-orange-100': noticia.cor === 'orange',
                'bg-green-50 text-green-700 border-b border-green-100': noticia.cor === 'green',
                'bg-yellow-50 text-yellow-700 border-b border-yellow-100': noticia.cor === 'yellow',
              }"
            >
              <div class="flex items-center gap-3 justify-between">
              <Icon
                :name="noticia.icone"
                class="w-4 h-4"
              />
              {{ noticia.categoria }}
              <span class="ml-auto text-xs font-normal opacity-70">{{ noticia.data }}</span>
            </div>
            </div>

            <!-- Conteúdo -->
            <div class="p-5">
              <h3 class="text-lg font-bold text-[#22345F] mb-3 leading-snug">{{ noticia.titulo }}</h3>
              <p class="text-gray-600 text-sm leading-relaxed mb-4">{{ noticia.resumo }}</p>

              <!-- Destaque -->
              <div class="flex gap-3 bg-amber-50 border-l-4 border-[#F49A1A] rounded-r-xl p-3 mb-3">
                <Icon name="lucide:lightbulb" class="w-4 h-4 text-[#F49A1A] flex-shrink-0 mt-0.5" />
                <p class="text-sm text-amber-900 leading-relaxed">{{ noticia.destaque }}</p>
              </div>

              <!-- Fonte com link -->
              <a
                :href="noticia.fonteUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#22345F] transition-colors"
              >
                <Icon name="lucide:external-link" class="w-3 h-3" />
                Fonte: {{ noticia.fonte }}
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA final -->
    <section class="py-14 bg-gradient-to-br from-[#22345F] to-[#1a2847]">
      <div class="container mx-auto px-4 max-w-2xl text-center text-white">
        <Icon name="lucide:shield-check" class="w-14 h-14 text-[#25D366] mx-auto mb-4" />
        <h2 class="text-2xl md:text-3xl font-bold mb-3">Não espere ser a próxima vítima</h2>
        <p class="text-gray-200 mb-8 text-lg">
          Uma tela mosquiteira custa muito menos do que uma internação. Proteja sua família hoje.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink
            to="/orcamento"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#F49A1A] hover:bg-[#e08910] text-white rounded-2xl font-bold text-lg transition-all shadow-lg"
          >
            <Icon name="lucide:file-text" class="w-5 h-5" />
            Solicitar Orçamento Grátis
          </NuxtLink>
          <a
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-2xl font-bold text-lg transition-all shadow-lg"
          >
            <Icon name="lucide:message-circle" class="w-5 h-5" />
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>

  </div>
</template>
