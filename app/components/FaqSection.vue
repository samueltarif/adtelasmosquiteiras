<script setup>
const { toggleFaq, isOpen } = useFaq()

const faqs = [
  {
    question: 'Quanto tempo a tela/rede dura?',
    answer: 'Nossa rede de segurança tem durabilidade de 5 a 7 anos com manutenção básica. A tela mosquiteira dura 1 a 3 anos dependendo da exposição ao sol e chuva. Incluímos 2 anos de garantia completa contra defeitos.'
  },
  {
    question: 'A rede aguenta peso? É realmente segura?',
    answer: 'Sim! Nossa rede é testada para suportar até 500kg distribuído. Cada ponto de fixação é reforçado com parafusos de aço inoxidável. Usamos apenas material de primeira qualidade, aprovado para uso residencial e comercial.'
  },
  {
    question: 'É seguro para crianças e pets?',
    answer: '100% seguro! O material é atóxico, testado para crianças e animais de estimação. Não tem arestas ou pontos de risco. A malha é fechada o suficiente para evitar quedas, mas permite ventilação. Todos os acabamentos são arredondados.'
  },
  {
    question: 'Dá para parcelar? Quais são as opções?',
    answer: 'Sim! Oferecemos parcelamento no cartão de crédito. Compras acima de R$1000 saem sem juros. Também aceitamos PIX, transferência bancária e dinheiro na instalação.'
  },
  {
    question: 'Quanto tempo leva a instalação?',
    answer: 'Agendamento em até 48 horas e instalação geralmente leva de 1 a 3 horas, dependendo do tamanho e complexidade. Para projetos pequenos (janelas únicas), pode ser feito no mesmo dia. Agendamos conforme sua disponibilidade.'
  },
  {
    question: 'Preciso preparar algo em casa?',
    answer: 'Não! Nossos técnicos chegam com todo o material e ferramentas. Você só precisa deixar acessível o local onde será instalado. Fazemos limpeza ao final do serviço.'
  },
  {
    question: 'E se eu morar em condomínio? Precisa de aprovação?',
    answer: 'Fornecemos toda a documentação e orientação sobre regulamentações do condomínio. A maioria dos condomínios aprova redes de segurança pois aumentam a segurança. Fazemos consultoria gratuita sobre isso.'
  }
]
</script>

<template>
  <section data-section="faq" class="py-10 md:py-20 bg-surface border-t border-border">
    <div class="max-w-[1200px] mx-auto px-5">
      <h2 class="text-2xl md:text-4xl text-center mb-5 text-text-primary font-bold">Dúvidas Frequentes</h2>
      <div class="h-[3px] w-[60px] bg-gradient-to-r from-primary to-primary-light mx-auto mb-10"></div>

      <div class="max-w-[800px] mx-auto">
        <div 
          v-for="(faq, index) in faqs" 
          :key="index"
          @click="toggleFaq(index)"
          :class="[
            'bg-surface p-5 md:p-6 mb-4 rounded-xl border border-border cursor-pointer transition-all duration-300 hover:border-primary hover:shadow-md hover:-translate-y-1',
            isOpen(index) ? 'border-primary shadow-lg scale-[1.02]' : ''
          ]"
          :style="{ animationDelay: `${index * 0.1}s` }"
          class="animate-fade-in-up"
        >
          <div class="flex justify-between items-center">
            <h4 class="text-base md:text-lg text-text-primary font-semibold pr-4 transition-colors duration-300">
              {{ faq.question }}
            </h4>
            <span 
              :class="[
                'text-primary text-2xl font-bold transition-all duration-500 ease-in-out',
                isOpen(index) ? 'rotate-45 scale-110' : 'rotate-0 scale-100'
              ]"
            >
              +
            </span>
          </div>
          <Transition
            enter-active-class="transition-all duration-500 ease-out"
            enter-from-class="opacity-0 max-h-0 transform -translate-y-2"
            enter-to-class="opacity-100 max-h-96 transform translate-y-0"
            leave-active-class="transition-all duration-300 ease-in"
            leave-from-class="opacity-100 max-h-96 transform translate-y-0"
            leave-to-class="opacity-0 max-h-0 transform -translate-y-2"
          >
            <div 
              v-show="isOpen(index)"
              class="mt-5 pt-5 border-t border-border text-text-secondary leading-relaxed text-sm md:text-base overflow-hidden"
            >
              {{ faq.answer }}
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>
