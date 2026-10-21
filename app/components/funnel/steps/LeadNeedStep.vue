<script setup lang="ts">
interface NeedOption {
  value: string
  label: string
  desc: string
  icon: string
}

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'next'): void
}>()

const options: NeedOption[] = [
  {
    value: 'window',
    label: 'Janelas',
    desc: 'Modelos de correr, maxim-ar e basculantes com esquadria de alumínio.',
    icon: 'lucide:layout-grid'
  },
  {
    value: 'door',
    label: 'Portas',
    desc: 'Portas de correr e abrir sob medida para passagens frequentes.',
    icon: 'lucide:door-open'
  },
  {
    value: 'balcony',
    label: 'Sacada / Varanda',
    desc: 'Fechamentos para sacadas envidraçadas e áreas gourmet.',
    icon: 'lucide:sun'
  },
  {
    value: 'multiple',
    label: 'Em vários locais',
    desc: 'Proteção completa para mais de um ambiente da casa ou apartamento.',
    icon: 'lucide:home'
  }
]

function select(val: string) {
  emit('update:modelValue', val)
  emit('next')
}
</script>

<template>
  <div class="space-y-4">
    <div class="text-center sm:text-left">
      <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 mb-2">
        Etapa 1 de 5
      </span>
      <h3 class="text-xl sm:text-2xl font-bold text-[#22345F]">
        Onde você precisa instalar a tela?
      </h3>
      <p class="text-sm text-gray-600 mt-1">
        Selecione o local principal para personalizarmos a recomendação.
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all duration-200 hover:border-[#F49A1A] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F49A1A]"
        :class="modelValue === opt.value ? 'border-[#F49A1A] bg-amber-50/50 shadow-sm' : 'border-gray-200 bg-white'"
        @click="select(opt.value)"
      >
        <div
          class="shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-colors"
          :class="modelValue === opt.value ? 'bg-[#F49A1A] text-white' : 'bg-gray-100 text-[#22345F]'"
        >
          <Icon :name="opt.icon" class="w-6 h-6" />
        </div>
        <div>
          <div class="font-bold text-[#22345F] text-base leading-tight">
            {{ opt.label }}
          </div>
          <p class="text-xs text-gray-500 mt-1 leading-relaxed">
            {{ opt.desc }}
          </p>
        </div>
      </button>
    </div>
  </div>
</template>
