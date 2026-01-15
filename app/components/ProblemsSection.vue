<script setup>
// Removido o useWhatsappModal pois agora é gerenciado pelo CtaButton

const problems = [
  {
    icon: '/images/mosquitoo.png',
    title: 'Mosquitos e Insetos',
    description: 'Barreira completa contra dengue, zika e outras doenças transmitidas por insetos.',
    isImage: true
  },
  {
    icon: '/images/menino_janela.png',
    title: 'Segurança de Crianças',
    description: 'Proteção contra quedas. Material resistente testado e aprovado para usar com confiança.',
    isImage: true
  },
  {
    icon: '/images/pets_pro.png',
    title: 'Pets Seguros',
    description: 'Seus gatos e cães livres para aproveitar a varanda sem risco de fugas ou quedas.',
    isImage: true
  }
]
</script>

<template>
  <section data-section="problems" class="py-10 md:py-20 bg-background">
    <div class="max-w-[1200px] mx-auto px-5">
      <h2 class="text-2xl md:text-4xl text-center mb-5 text-text-primary font-bold">O Que Resolvemos Para Você</h2>
      <div class="h-[3px] w-[60px] bg-gradient-to-r from-primary to-primary-light mx-auto mb-8"></div>
      <p class="text-base md:text-lg text-center text-text-secondary mb-12">Proteção contra os maiores riscos do dia a dia</p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-10">
        <div 
          v-for="(problem, index) in problems" 
          :key="index"
          class="bg-surface p-6 md:p-10 rounded-xl border-2 border-border text-center transition-all duration-300 cursor-pointer hover:border-primary hover:shadow-lg hover:-translate-y-2"
        >
          <div v-if="problem.isImage" class="w-20 h-20 mx-auto mb-5 flex items-center justify-center">
            <img :src="problem.icon" :alt="problem.title" class="w-20 h-20 object-contain" />
          </div>
          <div v-else class="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-[40px]">
            <span>{{ problem.icon }}</span>
          </div>
          <h3 class="text-xl md:text-[22px] mb-4 text-text-primary font-semibold">{{ problem.title }}</h3>
          <p class="text-sm md:text-base text-text-secondary">{{ problem.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
