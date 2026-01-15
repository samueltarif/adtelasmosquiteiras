<script setup>
const cases = [
  {
    image: '/images/gato.png',
    alt: 'Gato seguro em janela com rede de proteção',
    label: 'Pets Seguros',
    meta: 'Marina & Gato Whiskers',
    location: 'Vila Mariana',
    title: 'Gato Livre e Protegido',
    problem: 'Gato querendo sair pela janela, risco de queda no 10º andar.',
    solution: 'Rede de proteção em 3 janelas com acabamento premium.',
    result: '✅ Instalado em 3 horas | Garantia 2 anos'
  },
  {
    image: '/images/protecaoinfantil.jpeg',
    alt: 'Criança segura em varanda protegida com rede de segurança',
    label: 'Proteção Infantil',
    meta: 'Ricardo e seu Filho',
    location: 'Bairro de Moema',
    title: 'Crianças Brincando com Segurança',
    problem: 'A criança (6 anos) com risco de queda na varanda.',
    solution: 'Rede de segurança completa com acabamento discreto.',
    result: '✅ Instalado em 4 horas | Teste de Carga: 500kg'
  },
  {
    image: '/images/bebe.png',
    alt: 'Varanda antes e depois com instalação de rede de proteção',
    label: 'Transformação Completa',
    meta: 'Fernanda',
    location: 'Brooklin',
    title: 'Varanda Renovada e Protegida',
    problem: 'Varanda ociosa por falta de segurança contra mosquitos.',
    solution: 'Mosquiteiras + rede de segurança. Agora é área de convivência!',
    result: '✅ Espaço protegido, seguro e pronto para uso diário'
  }
]
</script>

<template>
  <section data-section="cases" class="py-10 md:py-20 bg-surface border-t border-border">
    <div class="max-w-[1200px] mx-auto px-5">
      <h2 class="text-2xl md:text-4xl text-center mb-5 text-text-primary font-bold">Histórias de Clientes Satisfeitos</h2>
      <div class="h-[3px] w-[60px] bg-gradient-to-r from-primary to-primary-light mx-auto mb-8"></div>
      <p class="text-base md:text-lg text-center text-text-secondary mb-12">Projetos reais, resultados comprovados</p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        <div 
          v-for="(caseItem, index) in cases" 
          :key="index"
          class="bg-surface rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-2 animate-fade-in-up"
        >
          <div class="w-full h-[200px] md:h-[250px] bg-background overflow-hidden">
            <img :src="caseItem.image" :alt="caseItem.alt" class="w-full h-full object-cover" />
          </div>
          <div class="p-5 md:p-8">
            <span class="inline-block bg-gradient-to-br from-primary to-primary-light text-white px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase">
              {{ caseItem.label }}
            </span>
            <div class="text-sm text-text-secondary mb-4">
              <strong class="text-text-primary">{{ caseItem.meta }}</strong> | {{ caseItem.location }}
            </div>
            <h4 class="text-lg font-semibold mb-3 text-text-primary">{{ caseItem.title }}</h4>
            <p class="text-sm text-text-secondary mb-2"><strong>Problema:</strong> {{ caseItem.problem }}</p>
            <p class="text-sm text-text-secondary mb-4"><strong>Solução:</strong> {{ caseItem.solution }}</p>
            <div class="bg-success/10 text-success px-4 py-2.5 rounded-md text-[13px] font-semibold">
              {{ caseItem.result }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
