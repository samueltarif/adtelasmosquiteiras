<script setup>
const { activeSegment, switchSegment, isActive } = useSegments()
// Removido o useWhatsappModal pois agora é gerenciado pelo CtaButton

const segments = [
  { id: 'kids', label: 'Para Quem Tem Crianças' },
  { id: 'pets', label: 'Para Quem Tem Pets' },
  { id: 'highrise', label: 'Moradores de Andar Alto' }
]

const segmentContent = {
  kids: {
    bgClass: 'from-purple-500/5 to-purple-400/5',
    title: 'Proteção Completa Para Crianças',
    items: [
      { icon: 'lucide:check-circle', bold: 'Material testado:', text: 'Resistência comprovada a 500kg' },
      { icon: 'lucide:check-circle', bold: 'Sem pontos de risco:', text: 'Toda costura reforçada e segura' },
      { icon: 'lucide:check-circle', bold: 'Fácil limpeza:', text: 'Protege a criança e permite ventilação' },
      { icon: 'lucide:check-circle', bold: 'Instalação por profissional:', text: 'Técnico certificado em sua casa' },
      { icon: 'lucide:check-circle', bold: 'Avaliação gratuita:', text: 'Visitamos e analisamos todos os pontos de risco' }
    ],
    buttonText: 'Quero Orçamento Agora'
  },
  pets: {
    bgClass: 'from-red-500/5 to-red-600/5',
    title: 'Proteção Total Para Seus Pets',
    items: [
      { icon: 'lucide:cat', bold: 'Malha resistente a garras:', text: 'Suporta arranhões de gatos' },
      { icon: 'lucide:dog', bold: 'Para cães:', text: 'Rede forte para saltos e movimentos rápidos' },
      { icon: 'lucide:wind', bold: 'Circulação de ar:', text: 'Ambiente fresco e confortável' },
      { icon: 'lucide:leaf', bold: 'Livre de tóxicos:', text: 'Material 100% seguro para animais' },
      { icon: 'lucide:wrench', bold: 'Instalação discreta:', text: 'Não interfere na visão do imóvel' }
    ],
    buttonText: 'Solicitar Orçamento'
  },
  highrise: {
    bgClass: 'from-blue-500/5 to-blue-600/5',
    title: 'Segurança Extra Para Andares Altos',
    items: [
      { icon: 'lucide:building', bold: 'Acesso condomínio:', text: 'Todos os documentos preparados' },
      { icon: 'lucide:clipboard-check', bold: 'Aprovação com síndico:', text: 'Consultoria sobre regulamentação' },
      { icon: 'lucide:zap', bold: 'Instalação especializada:', text: 'Experiência em edifícios altos' },
      { icon: 'lucide:shield', bold: 'Reforço de segurança:', text: 'Fixação garantida contra vento' },
      { icon: 'lucide:phone', bold: 'Suporte pós-venda:', text: 'Reparos por defeito de instalação ou material são gratuitos; danos por mau uso são cobrados.' }
    ],
    buttonText: 'Começar Agora'
  }
}
</script>

<template>
  <section data-section="solutions" class="py-10 md:py-20 bg-background">
    <div class="max-w-[1200px] mx-auto px-5">
      <h2 class="text-2xl md:text-4xl text-center mb-5 text-text-primary font-bold">Soluções por Perfil</h2>
      <div class="h-[3px] w-[60px] bg-gradient-to-r from-primary to-primary-light mx-auto mb-10"></div>

      <div class="flex flex-wrap gap-2.5 mb-10 justify-center">
        <button 
          v-for="segment in segments" 
          :key="segment.id"
          @click="switchSegment(segment.id)"
          :class="[
            'px-4 md:px-6 py-3 border-2 rounded-lg font-semibold transition-all duration-300 text-sm md:text-base',
            isActive(segment.id) 
              ? 'bg-primary text-white border-primary' 
              : 'bg-white text-text-primary border-border hover:border-primary hover:text-primary'
          ]"
        >
          {{ segment.label }}
        </button>
      </div>

      <div 
        v-for="(content, key) in segmentContent" 
        :key="key"
        v-show="isActive(key)"
        :class="['bg-gradient-to-br p-6 md:p-10 rounded-xl', content.bgClass]"
      >
        <h3 class="text-xl md:text-2xl font-bold mb-5 text-text-primary">{{ content.title }}</h3>
        <ul class="list-none mt-5">
          <li v-for="(item, index) in content.items" :key="index" class="mb-4 text-sm md:text-base text-text-primary flex items-start gap-2">
            <Icon :name="item.icon" class="w-5 h-5 text-[#F49A1A] flex-shrink-0 mt-0.5" />
            <span><strong>{{ item.bold }}</strong> {{ item.text }}</span>
          </li>
        </ul>
        <CtaButton 
          :text="content.buttonText"
          variant="primary"
          size="large"
          :full-width="true"
          class="mt-8"
        />
      </div>
    </div>
  </section>
</template>
