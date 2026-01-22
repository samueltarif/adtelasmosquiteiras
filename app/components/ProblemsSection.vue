<script setup>
// Removido o useWhatsappModal pois agora é gerenciado pelo CtaButton

const problems = [
  {
    icon: '/images/mosquitoo.png',
    title: 'Noites em Claro por Causa dos Mosquitos',
    description: 'Você fecha todas as janelas, mas eles SEMPRE encontram um jeito de entrar. Zumbido no ouvido, picadas que coçam por dias, medo da dengue... Sua família merece dormir em paz!',
    isImage: true,
    urgency: 'PARE de ser refém dos insetos!'
  },
  {
    icon: '/images/menino_janela.png',
    title: 'O Pesadelo de Todo Pai e Mãe',
    description: 'Seu coração dispara toda vez que vê seu filho perto da janela. E se ele subir na cadeira? E se tropeçar? Você não consegue relaxar nem por um segundo. Essa angústia TEM que acabar!',
    isImage: true,
    urgency: 'Sua paz de espírito não tem preço!'
  },
  {
    icon: '/images/pets_pro.png',
    title: 'Seu Pet Prisioneiro na Própria Casa',
    description: 'Seu gato fica horas olhando pela janela, querendo sentir o vento, mas você tem MEDO. Já imaginou perdê-lo? Ele merece liberdade SEM riscos. Você merece tranquilidade!',
    isImage: true,
    urgency: 'Liberdade segura para quem você ama!'
  }
]

// Função para scroll suave para seções
const scrollToSection = (sectionId) => {
  const element = document.querySelector(`[data-section="${sectionId}"]`)
  if (element) {
    const headerHeight = 120 // Altura do header fixo
    const elementPosition = element.offsetTop - headerHeight
    
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    })
  }
}
</script>

<template>
  <section data-section="problems" class="py-10 md:py-20 bg-background">
    <div class="max-w-[1200px] mx-auto px-5">
      <h2 class="text-2xl md:text-4xl text-center mb-5 text-text-primary font-bold">Você Está CANSADO Desses Problemas?</h2>
      <div class="h-[3px] w-[60px] bg-gradient-to-r from-red-500 to-red-600 mx-auto mb-8"></div>
      <p class="text-base md:text-lg text-center text-text-secondary mb-12">Milhares de famílias em São Paulo sofrem com isso TODOS OS DIAS</p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-10 mb-12">
        <div 
          v-for="(problem, index) in problems" 
          :key="index"
          class="bg-surface p-6 md:p-10 rounded-xl border-2 border-red-100 text-center transition-all duration-300 cursor-pointer hover:border-red-300 hover:shadow-xl hover:-translate-y-3 relative overflow-hidden"
        >
          <!-- Badge de Urgência -->
          <div class="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
            URGENTE
          </div>

          <div v-if="problem.isImage" class="w-20 h-20 mx-auto mb-5 flex items-center justify-center">
            <img :src="problem.icon" :alt="problem.title" class="w-20 h-20 object-contain filter drop-shadow-lg" />
          </div>
          <div v-else class="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-[40px]">
            <span>{{ problem.icon }}</span>
          </div>
          
          <h3 class="text-xl md:text-[22px] mb-4 text-red-700 font-bold leading-tight">{{ problem.title }}</h3>
          <p class="text-sm md:text-base text-text-secondary mb-4 leading-relaxed">{{ problem.description }}</p>
          
          <!-- Call to Action Emocional -->
          <div class="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <p class="text-red-600 font-semibold text-sm">{{ problem.urgency }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
