<script setup lang="ts">
const props = defineProps<{
  timeline: string | null
}>()

const emit = defineEmits<{
  (e: 'update:timeline', val: string): void
  (e: 'next'): void
  (e: 'back'): void
}>()

const options = [
  {
    value: 'asap',
    label: 'O mais rápido possível',
    badge: 'Urgente 🔥',
    desc: 'Preciso de proteção rápida contra mosquitos e pernilongos.'
  },
  {
    value: '30_days',
    label: 'Nos próximos 30 dias',
    badge: 'Planejando',
    desc: 'Quero organizar a instalação durante as próximas semanas.'
  },
  {
    value: '90_days',
    label: 'Nos próximos 3 meses',
    badge: 'Obra / Reforma',
    desc: 'Estou em reforma ou aguardando entrega das chaves.'
  },
  {
    value: 'researching',
    label: 'Apenas pesquisando preços',
    badge: 'Consulta',
    desc: 'Gostaria de conhecer os modelos e estimativa de valores.'
  }
]

function selectAndNext(val: string) {
  emit('update:timeline', val)
  emit('next')
}
</script>

<template>
  <div class="space-y-4">
    <div class="text-center sm:text-left">
      <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 mb-2">
        Etapa 4 de 5
      </span>
      <h3 class="text-xl sm:text-2xl font-bold text-[#22345F]">
        Quando você pretende instalar?
      </h3>
      <p class="text-sm text-gray-600 mt-1">
        Isso nos ajuda a priorizar sua agenda de produção e atendimento.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-2.5 pt-2">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-150 hover:border-[#F49A1A] hover:shadow-sm focus:outline-none"
        :class="timeline === opt.value ? 'border-[#F49A1A] bg-amber-50 shadow-sm' : 'border-gray-200 bg-white'"
        @click="selectAndNext(opt.value)"
      >
        <div class="pr-2">
          <div class="flex items-center gap-2">
            <span class="font-bold text-[#22345F] text-base">
              {{ opt.label }}
            </span>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700">
              {{ opt.badge }}
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">
            {{ opt.desc }}
          </p>
        </div>
        <div
          class="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
          :class="timeline === opt.value ? 'border-[#F49A1A] bg-[#F49A1A] text-white' : 'border-gray-300'"
        >
          <Icon v-if="timeline === opt.value" name="lucide:check" class="w-3.5 h-3.5" />
        </div>
      </button>
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
        v-if="timeline"
        type="button"
        class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#F49A1A] hover:bg-[#e78b0e] text-[#22345F] font-bold text-sm rounded-xl shadow transition-all"
        @click="emit('next')"
      >
        Avançar
        <Icon name="lucide:arrow-right" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
