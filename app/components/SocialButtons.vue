<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'floating', // 'floating' ou 'inline'
    validator: (value) => ['floating', 'inline'].includes(value)
  },
  showLabels: {
    type: Boolean,
    default: false
  }
})

// URLs das redes sociais
const socialLinks = {
  instagram: 'https://www.instagram.com/ad.telas?igsh=endlcmVmb3h1eGsx',
  facebook: 'https://www.facebook.com/share/1AQKiSHb8k/'
}

const openSocialLink = (platform) => {
  window.open(socialLinks[platform], '_blank')
}
</script>

<template>
  <!-- Versão Floating (botões flutuantes) -->
  <div v-if="variant === 'floating'" class="fixed bottom-5 right-5 md:bottom-[30px] md:right-[30px] flex flex-col gap-3 z-[98]">
    <!-- Instagram -->
    <button
      @click="openSocialLink('instagram')"
      style="background-color: #E4405F;"
      class="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1 group"
      onmouseover="this.style.backgroundColor='#C13584'"
      onmouseout="this.style.backgroundColor='#E4405F'"
      title="Seguir no Instagram"
    >
      <!-- Instagram Icon SVG -->
      <svg class="w-6 h-6 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    </button>

    <!-- Facebook -->
    <button
      @click="openSocialLink('facebook')"
      style="background-color: #1877F2;"
      class="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1 group"
      onmouseover="this.style.backgroundColor='#166FE5'"
      onmouseout="this.style.backgroundColor='#1877F2'"
      title="Curtir no Facebook"
    >
      <!-- Facebook Icon SVG -->
      <svg class="w-6 h-6 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    </button>
  </div>

  <!-- Versão Inline (botões em linha) -->
  <div v-else class="flex gap-3 items-center">
    <!-- Instagram -->
    <button
      @click="openSocialLink('instagram')"
      :style="{ backgroundColor: '#E4405F' }"
      :class="[
        'flex items-center justify-center gap-2 text-white rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
        showLabels ? 'px-4 py-2.5 md:px-6 md:py-3 min-w-[120px]' : 'w-10 h-10 md:w-12 md:h-12'
      ]"
      @mouseover="$event.target.style.backgroundColor = '#C13584'"
      @mouseout="$event.target.style.backgroundColor = '#E4405F'"
      title="Seguir no Instagram"
    >
      <!-- Instagram Icon SVG -->
      <svg :class="showLabels ? 'w-5 h-5' : 'w-6 h-6'" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
      <span v-if="showLabels" class="text-sm">Instagram</span>
    </button>

    <!-- Facebook -->
    <button
      @click="openSocialLink('facebook')"
      :style="{ backgroundColor: '#1877F2' }"
      :class="[
        'flex items-center justify-center gap-2 text-white rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
        showLabels ? 'px-4 py-2.5 md:px-6 md:py-3 min-w-[120px]' : 'w-10 h-10 md:w-12 md:h-12'
      ]"
      @mouseover="$event.target.style.backgroundColor = '#166FE5'"
      @mouseout="$event.target.style.backgroundColor = '#1877F2'"
      title="Curtir no Facebook"
    >
      <!-- Facebook Icon SVG -->
      <svg :class="showLabels ? 'w-5 h-5' : 'w-6 h-6'" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
      <span v-if="showLabels" class="text-sm">Facebook</span>
    </button>
  </div>
</template>