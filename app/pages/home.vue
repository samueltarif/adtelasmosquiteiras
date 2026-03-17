<script setup>
useScrollAnimation()

const showFormModal = ref(false)
const openFormModal = () => { showFormModal.value = true }
</script>

<template>
  <div>
    <HeroSection />
    <ServicesCards />
    <ProblemsSection />
    <ValueProposition />
    <CaseStudies />
    <ReviewsCarousel />
    <SegmentedSolutions />
    <FaqSection />
    <CtaSection />
    <MobileUnifiedCTA
      servico-atual="Redes de Proteção ou Telas Mosquiteiras"
      @open-form="openFormModal"
    />
    <QuickHelpChat />
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>
