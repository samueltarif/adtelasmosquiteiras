<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true,
    // Formato: [{ label: 'Início', to: '/' }, { label: 'Serviços', to: '/servicos' }]
  }
})
</script>

<template>
  <nav class="py-4 bg-white border-b border-[#E5EDF8]" aria-label="Breadcrumb">
    <div class="container mx-auto px-4 md:px-6 max-w-7xl">
      <ol class="flex flex-wrap items-center gap-2 text-sm">
        <li v-for="(item, index) in items" :key="index" class="flex items-center gap-2">
          <!-- Link ou texto -->
          <NuxtLink
            v-if="item.to && index < items.length - 1"
            :to="item.to"
            class="text-[#4B5563] hover:text-[#F49A1A] transition-colors font-medium"
          >
            {{ item.label }}
          </NuxtLink>
          <span
            v-else
            class="text-[#22345F] font-bold"
            :aria-current="index === items.length - 1 ? 'page' : undefined"
          >
            {{ item.label }}
          </span>
          
          <!-- Separador -->
          <svg
            v-if="index < items.length - 1"
            class="w-4 h-4 text-[#4B5563]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
        </li>
      </ol>
    </div>
  </nav>
</template>
