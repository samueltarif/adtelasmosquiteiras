<script setup>
// Ativar animações de scroll
useScrollAnimation()

// Estado do modal de formulário
const showFormModal = ref(false)

const openFormModal = () => {
  showFormModal.value = true
}
</script>

<template>
  <div>
    <HeroSection />
    
    <!-- Cards de Serviços Clicáveis -->
    <ServicesCards />
    
    <ProblemsSection />
    <ValueProposition />
    <CaseStudies />
    <ReviewsCarousel />
    <SegmentedSolutions />
    <FaqSection />
    <CtaSection />
    
    <!-- Mobile Unified CTA -->
    <MobileUnifiedCTA
      servico-atual="Redes de Proteção ou Telas Mosquiteiras"
      @open-form="openFormModal"
    />
    
    <!-- Quick Help Chat -->
    <QuickHelpChat />
    
    <!-- Modal de Formulário -->
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>
