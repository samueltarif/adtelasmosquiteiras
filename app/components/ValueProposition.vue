<script setup>
// Cores da marca AD Telas Mosquiteiras:
// Azul escuro: #22345F (títulos)
// Laranja: #F49A1A (destaques, linha decorativa, ícones)
// Azul claro: #E5EDF8 (bordas)
// Cinza escuro: #4B5563 (texto secundário)

const values = [
  { icon: 'lucide:shield-check', title: 'Garantia Completa', description: '2 anos de garantia contra defeitos de material e instalação. Obs: Danos decorrentes de mau uso não estão cobertos' },
  { icon: 'lucide:zap', title: 'Instalação Rápida', description: 'Agendamento em até 48h e instalação em poucas horas.' },
  { icon: 'lucide:credit-card', title: 'Parcelamento Fácil', description: 'Parcelamos no cartão de crédito. Sem juros para compras acima de R$1000.' },
  { icon: 'lucide:map-pin', title: 'Atendimento SP', description: 'Cobertura total em São Paulo. Técnicos treinados e experientes.' },
  { icon: 'lucide:ruler', title: 'Customizado', description: 'Medidas sob demanda para qualquer tamanho de janela ou varanda.' },
  { icon: 'lucide:award', title: 'Material Premium', description: 'Telas resistentes com durabilidade comprovada de 5+ anos.' }
]
</script>

<template>
  <section data-section="value" class="py-10 md:py-20 bg-gray-50 border-t border-[#E5EDF8]">
    <div class="max-w-[1200px] mx-auto px-5">
      <h2 class="text-2xl md:text-4xl text-center mb-5 text-[#22345F] font-bold">Por Que Escolher a AD Telas e Redes?</h2>
      <div class="h-[3px] w-[60px] bg-[#F49A1A] mx-auto mb-12"></div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
        <div 
          v-for="(value, index) in values" 
          :key="index"
          class="p-6 md:p-8 bg-white border-2 border-[#E5EDF8] rounded-xl text-center hover:border-[#F49A1A] hover:shadow-lg transition-all duration-300"
        >
          <div class="flex flex-col items-center gap-3 mb-3">
            <Icon :name="value.icon" class="w-10 h-10 text-[#F49A1A]" />
            <h4 class="text-[#22345F] text-base md:text-lg font-semibold">{{ value.title }}</h4>
          </div>
          <p class="text-sm text-[#4B5563]">{{ value.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
