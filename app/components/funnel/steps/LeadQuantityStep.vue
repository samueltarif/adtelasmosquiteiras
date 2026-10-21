<script setup lang="ts">
const props = defineProps<{
  quantity: string | null
  propertyType: string | null
}>()

const emit = defineEmits<{
  (e: 'update:quantity', val: string): void
  (e: 'update:propertyType', val: string): void
  (e: 'next'): void
  (e: 'back'): void
}>()

const quantityOptions = [
  { value: '1-2', label: '1 a 2 locais' },
  { value: '3-5', label: '3 a 5 locais' },
  { value: '6-10', label: '6 a 10 locais' },
  { value: '10+', label: 'Mais de 10' }
]

const propertyOptions = [
  { value: 'apartamento', label: 'Apartamento', icon: 'lucide:building' },
  { value: 'casa', label: 'Casa / Sobrado', icon: 'lucide:home' },
  { value: 'comercio', label: 'Comércio / Escritório', icon: 'lucide:store' },
  { value: 'condominio', label: 'Condomínio', icon: 'lucide:building-2' }
]

const canAdvance = computed(() => !!props.quantity && !!props.propertyType)
</script>

<template>
  <div class="space-y-5">
    <div class="text-center sm:text-left">
      <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 mb-2">
        Etapa 2 de 5
      </span>
      <h3 class="text-xl sm:text-2xl font-bold text-[#22345F]">
        Dimensões e Tipo do Imóvel
      </h3>
      <p class="text-sm text-gray-600 mt-1">
        Essas informações nos ajudam a calcular uma estimativa precisa.
      </p>
    </div>

    <!-- Pergunta 1: Quantidade -->
    <div class="space-y-2">
      <label class="block text-sm font-semibold text-[#22345F]">
        Aproximadamente quantos locais precisam de tela?
      </label>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          v-for="q in quantityOptions"
          :key="q.value"
          type="button"
          class="p-3 rounded-xl border-2 text-center text-sm font-bold transition-all duration-150 focus:outline-none"
          :class="quantity === q.value ? 'border-[#F49A1A] bg-amber-50 text-[#22345F] shadow-sm' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'"
          @click="emit('update:quantity', q.value)"
        >
          {{ q.label }}
        </button>
      </div>
    </div>

    <!-- Pergunta 2: Tipo de Imóvel -->
    <div class="space-y-2 pt-2">
      <label class="block text-sm font-semibold text-[#22345F]">
        Qual é o tipo do imóvel?
      </label>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          v-for="p in propertyOptions"
          :key="p.value"
          type="button"
          class="p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 text-center text-sm font-medium transition-all duration-150 focus:outline-none"
          :class="propertyType === p.value ? 'border-[#F49A1A] bg-amber-50 text-[#22345F] font-bold shadow-sm' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'"
          @click="emit('update:propertyType', p.value)"
        >
          <Icon :name="p.icon" class="w-5 h-5 text-[#F49A1A]" />
          <span class="text-xs sm:text-sm">{{ p.label }}</span>
        </button>
      </div>
    </div>

    <!-- Navegação -->
    <div class="flex items-center justify-between pt-4 border-t border-gray-100">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#22345F] rounded-lg transition-colors"
        @click="emit('back')"
      >
        <Icon name="lucide:arrow-left" class="w-4 h-4" />
        Voltar
      </button>

      <button
        type="button"
        :disabled="!canAdvance"
        class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#F49A1A] hover:bg-[#e78b0e] text-[#22345F] font-bold text-sm rounded-xl shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        @click="emit('next')"
      >
        Avançar
        <Icon name="lucide:arrow-right" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
