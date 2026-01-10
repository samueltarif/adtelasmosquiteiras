<script setup>
const values = [
  { icon: '✅', title: 'Garantia Completa', description: '2 anos de garantia contra defeitos de material e instalação. Obs: Danos decorrentes de mau uso não estão cobertos' },
  { icon: '⚡', title: 'Instalação Rápida', description: 'Agendamento em até 48h e instalação em poucas horas.' },
  { icon: '💰', title: 'Parcelamento Fácil', description: 'Parcelamos no cartão de crédito. Sem juros para compras acima de R$1000.' },
  { icon: '🎯', title: 'Atendimento SP', description: 'Cobertura total em São Paulo. Técnicos treinados e experientes.' },
  { icon: '📏', title: 'Customizado', description: 'Medidas sob demanda para qualquer tamanho de janela ou varanda.' },
  { icon: '🏆', title: 'Material Premium', description: 'Telas resistentes com durabilidade comprovada de 5+ anos.' }
]
</script>

<template>
  <section data-section="value" class="py-10 md:py-20 bg-surface border-t border-border">
    <div class="max-w-[1200px] mx-auto px-5">
      <h2 class="text-2xl md:text-4xl text-center mb-5 text-text-primary font-bold">Por Que Escolher a AD Telas e Redes?</h2>
      <div class="h-[3px] w-[60px] bg-gradient-to-r from-primary to-primary-light mx-auto mb-12"></div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
        <div 
          v-for="(value, index) in values" 
          :key="index"
          class="p-6 md:p-8 bg-gradient-to-br from-primary/5 to-primary-light/5 border border-border rounded-xl text-center"
        >
          <h4 class="text-primary text-base md:text-lg font-semibold mb-2.5">{{ value.icon }} {{ value.title }}</h4>
          <p class="text-sm text-text-secondary">{{ value.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
