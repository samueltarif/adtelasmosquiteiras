<script setup>
// Cores da marca AD Telas Mosquiteiras:
// Azul escuro: #22345F (títulos e textos principais)
// Laranja: #F49A1A (destaques, selos URGENTE, botões)
// Azul claro: #E5EDF8 (bordas)
// Cinza escuro: #4B5563 (texto comum)

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
  <section data-section="problems" class="py-10 md:py-20 bg-gray-50">
    <div class="max-w-[1200px] mx-auto px-5">
      <!-- Título principal - Azul escuro #22345F -->
      <h2 class="text-2xl md:text-4xl text-center mb-5 text-[#22345F] font-bold">
        Você Está CANSADO Desses Problemas?
      </h2>
      
      <!-- Linha decorativa - Laranja #F49A1A -->
      <div class="h-[3px] w-[60px] bg-[#F49A1A] mx-auto mb-8"></div>
      
      <!-- Subtítulo - Cinza escuro #4B5563 -->
      <p class="text-base md:text-lg text-center text-[#4B5563] mb-12">
        Milhares de famílias em São Paulo sofrem com isso TODOS OS DIAS
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-10 mb-12">
        <div 
          v-for="(problem, index) in problems" 
          :key="index"
          class="bg-white p-6 md:p-10 rounded-xl border-2 border-[#E5EDF8] text-center transition-all duration-300 cursor-pointer hover:border-[#22345F]/30 hover:shadow-xl hover:-translate-y-3 relative overflow-hidden"
        >
          <!-- Badge de Urgência - Laranja #F49A1A -->
          <div class="absolute top-4 right-4 bg-[#F49A1A] text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse shadow-lg">
            URGENTE
          </div>

          <div v-if="problem.isImage" class="w-20 h-20 mx-auto mb-5 flex items-center justify-center">
            <img :src="problem.icon" :alt="problem.title" class="w-20 h-20 object-contain filter drop-shadow-lg" />
          </div>
          <div v-else class="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[#22345F] to-[#1a2847] rounded-full flex items-center justify-center text-[40px]">
            <span>{{ problem.icon }}</span>
          </div>
          
          <!-- Título do card - Azul escuro #22345F -->
          <h3 class="text-xl md:text-[22px] mb-4 text-[#22345F] font-bold leading-tight">
            {{ problem.title }}
          </h3>
          
          <!-- Descrição - Cinza escuro #4B5563 -->
          <p class="text-sm md:text-base text-[#4B5563] mb-4 leading-relaxed">
            {{ problem.description }}
          </p>
          
          <!-- Call to Action Emocional - Fundo laranja claro com borda laranja -->
          <div class="bg-[#FFF7ED] border-2 border-[#F49A1A]/30 rounded-lg p-3 mt-4">
            <p class="text-[#F49A1A] font-semibold text-sm">{{ problem.urgency }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
