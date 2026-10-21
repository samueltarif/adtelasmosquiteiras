<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  postalCode: string
  cidade: string
  bairro: string
}>()

const emit = defineEmits<{
  (e: 'update:postalCode', val: string): void
  (e: 'update:cidade', val: string): void
  (e: 'update:bairro', val: string): void
  (e: 'next'): void
  (e: 'back'): void
}>()

const isLoadingCep = ref(false)
const cepError = ref('')
const cepSuccess = ref(false)

const formattedCep = computed(() => {
  const digits = (props.postalCode || '').replace(/\D/g, '').slice(0, 8)
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }
  return digits
})

async function onCepInput(e: Event) {
  const input = (e.target as HTMLInputElement).value
  const digits = input.replace(/\D/g, '').slice(0, 8)
  emit('update:postalCode', digits)
  cepError.value = ''
  cepSuccess.value = false

  if (digits.length === 8) {
    isLoadingCep.value = true
    try {
      const data = await $fetch<{
        cidade?: string
        bairro?: string
        atendido?: boolean
        erro?: boolean
      }>(`/api/cep/${digits}`)

      if (data?.erro) {
        cepError.value = 'CEP não encontrado. Preencha a cidade manualmente.'
      } else {
        if (data?.cidade) emit('update:cidade', data.cidade)
        if (data?.bairro) emit('update:bairro', data.bairro)
        cepSuccess.value = true
      }
    } catch {
      cepError.value = 'Consulta de CEP temporariamente indisponível. Preencha a cidade manualmente.'
    } finally {
      isLoadingCep.value = false
    }
  }
}

const canAdvance = computed(() => {
  return (props.cidade || '').trim().length >= 2
})
</script>

<template>
  <div class="space-y-4">
    <div class="text-center sm:text-left">
      <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 mb-2">
        Etapa 3 de 5
      </span>
      <h3 class="text-xl sm:text-2xl font-bold text-[#22345F]">
        Onde será feita a instalação?
      </h3>
      <p class="text-sm text-gray-600 mt-1">
        Atendemos a Capital, Grande São Paulo, Litoral e Interior.
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
      <!-- CEP -->
      <div class="sm:col-span-2">
        <label for="step-cep" class="block text-sm font-semibold text-[#22345F] mb-1">
          CEP da instalação
        </label>
        <div class="relative">
          <input
            id="step-cep"
            :value="formattedCep"
            type="tel"
            inputmode="numeric"
            maxlength="9"
            placeholder="00000-000"
            class="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border-2 border-gray-200 text-[#22345F] text-base placeholder-gray-400 focus:outline-none focus:border-[#F49A1A] transition-colors"
            @input="onCepInput"
          />
          <div v-if="isLoadingCep" class="absolute right-3.5 top-1/2 -translate-y-1/2">
            <Icon name="lucide:loader-2" class="w-5 h-5 text-[#F49A1A] animate-spin" />
          </div>
          <div v-else-if="cepSuccess" class="absolute right-3.5 top-1/2 -translate-y-1/2">
            <Icon name="lucide:check-circle-2" class="w-5 h-5 text-emerald-600" />
          </div>
        </div>
        <p v-if="cepError" class="text-xs text-amber-700 mt-1">
          {{ cepError }}
        </p>
        <p v-else class="text-xs text-gray-500 mt-1">
          Digite seu CEP para preencher o bairro e a cidade automaticamente.
        </p>
      </div>

      <!-- Cidade -->
      <div>
        <label for="step-cidade" class="block text-sm font-semibold text-[#22345F] mb-1">
          Cidade *
        </label>
        <input
          id="step-cidade"
          :value="cidade"
          type="text"
          placeholder="Ex: São Paulo"
          required
          class="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border-2 border-gray-200 text-[#22345F] text-base placeholder-gray-400 focus:outline-none focus:border-[#F49A1A] transition-colors"
          @input="emit('update:cidade', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Bairro -->
      <div>
        <label for="step-bairro" class="block text-sm font-semibold text-[#22345F] mb-1">
          Bairro
        </label>
        <input
          id="step-bairro"
          :value="bairro"
          type="text"
          placeholder="Ex: Moema, Pinheiros..."
          class="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border-2 border-gray-200 text-[#22345F] text-base placeholder-gray-400 focus:outline-none focus:border-[#F49A1A] transition-colors"
          @input="emit('update:bairro', ($event.target as HTMLInputElement).value)"
        />
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
