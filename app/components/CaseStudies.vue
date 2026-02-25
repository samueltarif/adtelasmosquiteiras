<script setup>
// Cores da marca AD Telas Mosquiteiras:
// Azul escuro: #22345F (títulos)
// Laranja: #F49A1A (destaques, badges, linha decorativa)
// Azul claro: #E5EDF8 (bordas)
// Cinza escuro: #4B5563 (texto secundário)
// Verde: #25D366 (sucesso)

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
    result: 'Instalado em 3 horas | Garantia 2 anos',
    resultIcon: 'lucide:check-circle'
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
    result: 'Instalado em 4 horas | Teste de Carga: 500kg',
    resultIcon: 'lucide:check-circle'
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
    result: 'Espaço protegido, seguro e pronto para uso diário',
    resultIcon: 'lucide:check-circle'
  }
]
</script>

<template>
  <section data-section="cases" class="py-10 md:py-20 bg-white border-t border-[#E5EDF8]">
    <div class="max-w-[1200px] mx-auto px-5">
      <h2 class="text-2xl md:text-4xl text-center mb-5 text-[#22345F] font-bold">Histórias de Clientes Satisfeitos</h2>
      <div class="h-[3px] w-[60px] bg-[#F49A1A] mx-auto mb-8"></div>
      <p class="text-base md:text-lg text-center text-[#4B5563] mb-12">Projetos reais, resultados comprovados</p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        <div 
          v-for="(caseItem, index) in cases" 
          :key="index"
          class="bg-white rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-2 animate-fade-in-up border-2 border-[#E5EDF8] hover:border-[#F49A1A]"
        >
          <div class="w-full h-[200px] md:h-[250px] bg-gray-50 overflow-hidden">
            <img :src="caseItem.image" :alt="caseItem.alt" class="w-full h-full object-cover" />
          </div>
          <div class="p-5 md:p-8">
            <span class="inline-block bg-[#F49A1A] text-white px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase">
              {{ caseItem.label }}
            </span>
            <div class="text-sm text-[#4B5563] mb-4">
              <strong class="text-[#22345F]">{{ caseItem.meta }}</strong> | {{ caseItem.location }}
            </div>
            <h4 class="text-lg font-semibold mb-3 text-[#22345F]">{{ caseItem.title }}</h4>
            <p class="text-sm text-[#4B5563] mb-2"><strong class="text-[#22345F]">Problema:</strong> {{ caseItem.problem }}</p>
            <p class="text-sm text-[#4B5563] mb-4"><strong class="text-[#22345F]">Solução:</strong> {{ caseItem.solution }}</p>
            <div class="bg-[#25D366]/10 text-[#25D366] px-4 py-2.5 rounded-md text-[13px] font-semibold border border-[#25D366]/30 flex items-center gap-2">
              <Icon :name="caseItem.resultIcon" class="w-4 h-4 flex-shrink-0" />
              <span>{{ caseItem.result }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
