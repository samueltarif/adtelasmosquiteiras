<script setup lang="ts">
import { ref, computed } from 'vue'

interface CepResult {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
  atendido: boolean
  cidadeAtendida: string | null
}

const cepInput = ref('')
const result = ref<CepResult | null>(null)
const loading = ref(false)
const errorMsg = ref('')

const cepFormatted = computed(() => {
  const digits = cepInput.value.replace(/\D/g, '').slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
})

function onInput(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 8)
  cepInput.value = digits
  if (digits.length < 8) {
    result.value = null
    errorMsg.value = ''
  }
}

async function buscarCep() {
  const digits = cepInput.value.replace(/\D/g, '')
  if (digits.length !== 8) {
    errorMsg.value = 'Digite um CEP com 8 dígitos.'
    return
  }
  loading.value = true
  result.value = null
  errorMsg.value = ''
  try {
    result.value = await $fetch<CepResult>(`/api/cep/${digits}`)
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    errorMsg.value = err?.data?.message ?? 'Não foi possível consultar o CEP.'
  } finally {
    loading.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') buscarCep()
}

const whatsappUrl = computed(() => {
  if (!result.value) return '#'
  const loc = result.value.bairro
    ? `${result.value.bairro}, ${result.value.cidade}`
    : result.value.cidade
  const msg = `Olá! Gostaria de um orçamento para ${loc} (CEP ${result.value.cep}). Vim pelo site.`
  return `https://wa.me/5511983586611?text=${encodeURIComponent(msg)}`
})
</script>

<template>
  <div id="cep-search" class="bg-white rounded-2xl border-2 border-[#E5EDF8] shadow-sm p-6 md:p-8">
    <div class="flex items-center gap-3 mb-5">
      <div class="bg-[#22345F]/10 p-2.5 rounded-xl">
        <Icon name="lucide:map-pin" class="w-5 h-5 text-[#22345F]" />
      </div>
      <div>
        <h2 class="font-bold text-[#22345F] text-lg leading-tight">Consultar CEP</h2>
        <p class="text-xs text-gray-500">Verifique se atendemos sua região</p>
      </div>
    </div>

    <!-- Input -->
    <div class="flex gap-2">
      <div class="relative flex-1">
        <input
          :value="cepFormatted"
          @input="onInput"
          @keydown="onKeydown"
          type="text"
          inputmode="numeric"
          maxlength="9"
          placeholder="00000-000"
          aria-label="CEP"
          class="w-full px-4 py-3 border-2 border-[#E5EDF8] rounded-xl text-base tracking-widest focus:outline-none focus:border-[#F49A1A] focus:ring-1 focus:ring-[#F49A1A] transition-colors"
          :class="{ 'border-red-300': errorMsg }"
        />
      </div>
      <button
        @click="buscarCep"
        :disabled="loading"
        class="px-5 py-3 bg-[#22345F] hover:bg-[#1a2847] text-white rounded-xl font-semibold transition-colors disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
      >
        <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <Icon v-else name="lucide:search" class="w-4 h-4" />
        <span>Buscar</span>
      </button>
    </div>

    <!-- Erro -->
    <p v-if="errorMsg" class="mt-2 text-sm text-red-500 flex items-center gap-1.5">
      <Icon name="lucide:alert-circle" class="w-4 h-4 flex-shrink-0" />
      {{ errorMsg }}
    </p>

    <!-- Resultado -->
    <transition name="fade">
      <div v-if="result" class="mt-4">
        <!-- Atendido -->
        <div
          v-if="result.atendido"
          class="rounded-xl border-2 border-[#25D366]/40 bg-[#25D366]/5 p-4"
        >
          <div class="flex items-start gap-3">
            <div class="bg-[#25D366] p-1.5 rounded-lg flex-shrink-0 mt-0.5">
              <Icon name="lucide:check" class="w-4 h-4 text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-[#22345F] text-sm">Atendemos sua região!</p>
              <p class="text-gray-700 text-sm mt-0.5">
                <span v-if="result.logradouro">{{ result.logradouro }}, </span>
                <span v-if="result.bairro" class="font-semibold">{{ result.bairro }}</span>
              </p>
              <p class="text-gray-500 text-xs mt-0.5">{{ result.cidade }} — {{ result.cep }}</p>
            </div>
          </div>
          <a
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-xl text-sm font-bold transition-colors"
          >
            <Icon name="lucide:message-circle" class="w-4 h-4" />
            Pedir orçamento para {{ result.bairro || result.cidade }}
          </a>
        </div>

        <!-- Não atendido -->
        <div
          v-else
          class="rounded-xl border-2 border-orange-200 bg-orange-50 p-4"
        >
          <div class="flex items-start gap-3">
            <div class="bg-orange-400 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
              <Icon name="lucide:map-pin-off" class="w-4 h-4 text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-gray-800 text-sm">Fora da área de atendimento</p>
              <p class="text-gray-600 text-sm mt-0.5">
                <span v-if="result.bairro" class="font-semibold">{{ result.bairro }}, </span>{{ result.cidade }} não está na nossa cobertura atual.
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/5511983586611?text=Olá! Gostaria de saber se atendem minha região."
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#22345F] hover:bg-[#1a2847] text-white rounded-xl text-sm font-bold transition-colors"
          >
            <Icon name="lucide:message-circle" class="w-4 h-4" />
            Consultar disponibilidade
          </a>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
