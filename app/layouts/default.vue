<template>
  <div class="min-h-screen bg-background text-text-primary font-sans leading-relaxed">
    <Header />
    <slot />
    <Footer />
    <FloatingButtons />
    <StickyFormModal />
  </div>
</template>
