<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Slugs de páginas de bairro que existem no projeto
const BAIRRO_SLUGS: Record<string, string> = {
  'butantã': '/bairros/butanta',
  'butanta': '/bairros/butanta',
  'pinheiros': '/bairros/pinheiros',
  'itaim bibi': '/bairros/itaim-bibi',
  'vila olímpia': '/bairros/vila-olimpia',
  'vila olimpia': '/bairros/vila-olimpia',
  'jardim paulista': '/bairros/jardim-paulista',
  'jardim bonfiglioli': '/bairros/jardim-bonfiglioli',
  'jardim das vertentes': '/bairros/jardim-das-vertentes',
  'jardim monte kemel': '/bairros/jardim-monte-kemel',
  'vila sônia': '/bairros/vila-sonia',
  'vila sonia': '/bairros/vila-sonia',
}

function getBairroPage(bairroNome: string): string {
  const key = bairroNome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  // try normalized key
  for (const [k, v] of Object.entries(BAIRRO_SLUGS)) {
    const kNorm = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (kNorm === key) return v
  }
  return '/bairros'
}

interface CepResult {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
  atendido: boolean
  cidadeAtendida: string | null
}

const isOpen = ref(false)
const query = ref('')
const loading = ref(false)
const result = ref<CepResult | null>(null)
const errorMsg = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const isCep = computed(() => /^\d{5}-?\d{3}$/.test(query.value) || /^\d{8}$/.test(query.value))

const whatsappUrl = computed(() => {
  if (!result.value) return '#'
  const loc = result.value.bairro
    ? `${result.value.bairro}, ${result.value.cidade}`
    : result.value.cidade
  const msg = `Olá! Gostaria de um orçamento para ${loc} (CEP ${result.value.cep}). Vim pelo site.`
  return `https://wa.me/5511983586611?text=${encodeURIComponent(msg)}`
})

function openSearch() {
  isOpen.value = true
  nextTick(() => inputRef.value?.focus())
}

function closeSearch() {
  isOpen.value = false
  query.value = ''
  result.value = null
  errorMsg.value = ''
}

async function doSearch() {
  const digits = query.value.replace(/\D/g, '')
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
    errorMsg.value = err?.data?.message ?? 'CEP não encontrado.'
  } finally {
    loading.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') doSearch()
  if (e.key === 'Escape') closeSearch()
}

function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    closeSearch()
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div ref="containerRef" class="relative">
    <!-- Lupa trigger -->
    <button
      @click="openSearch"
      class="flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:text-[#22345F] hover:bg-gray-100 transition-colors"
      aria-label="Buscar por CEP"
    >
      <Icon name="lucide:search" class="w-5 h-5" />
    </button>

    <!-- Dropdown de busca -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50"
      >
        <!-- Input CEP -->
        <div class="flex gap-2">
          <div class="relative flex-1">
            <Icon name="lucide:map-pin" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref="inputRef"
              v-model="query"
              @keydown="onKeydown"
              type="text"
              inputmode="numeric"
              maxlength="9"
              placeholder="Digite seu CEP..."
              class="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F49A1A] focus:ring-1 focus:ring-[#F49A1A]"
            />
          </div>
          <button
            @click="doSearch"
            :disabled="loading"
            class="px-3 py-2.5 bg-[#22345F] hover:bg-[#1a2847] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <Icon v-else name="lucide:search" class="w-4 h-4" />
          </button>
        </div>

        <!-- Erro -->
        <p v-if="errorMsg" class="mt-2 text-xs text-red-500 flex items-center gap-1">
          <Icon name="lucide:alert-triangle" class="w-3.5 h-3.5 flex-shrink-0" />
          {{ errorMsg }}
        </p>

        <!-- Preview resultado -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div v-if="result" class="mt-3">
            <!-- Atendido -->
            <div
              v-if="result.atendido"
              class="rounded-xl border-2 border-[#25D366]/40 bg-[#25D366]/5 p-3"
            >
              <div class="flex items-start gap-2.5 mb-3">
                <div class="bg-[#25D366] p-1.5 rounded-lg flex-shrink-0">
                  <Icon name="lucide:check" class="w-3.5 h-3.5 text-white" />
                </div>
                <div class="min-w-0">
                  <p class="font-bold text-[#22345F] text-sm leading-tight">Atendemos sua região!</p>
                  <p class="text-gray-700 text-xs mt-0.5 font-semibold">
                    {{ result.bairro }}<span v-if="result.bairro">, </span>{{ result.cidade }}
                  </p>
                  <p class="text-gray-400 text-xs">{{ result.cep }}</p>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <NuxtLink
                  :to="getBairroPage(result.bairro)"
                  @click="closeSearch"
                  class="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#22345F] hover:bg-[#1a2847] text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <Icon name="lucide:map-pin" class="w-3.5 h-3.5" />
                  Ver página de {{ result.bairro || result.cidade }}
                </NuxtLink>
                <a
                  :href="whatsappUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click="closeSearch"
                  class="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <Icon name="lucide:message-circle" class="w-3.5 h-3.5" />
                  Pedir orçamento via WhatsApp
                </a>
              </div>
            </div>

            <!-- Não atendido -->
            <div
              v-else
              class="rounded-xl border-2 border-orange-200 bg-orange-50 p-3"
            >
              <div class="flex items-start gap-2.5">
                <div class="bg-orange-400 p-1.5 rounded-lg flex-shrink-0">
                  <Icon name="lucide:alert-triangle" class="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p class="font-bold text-gray-800 text-sm leading-tight">Fora da área de atendimento</p>
                  <p class="text-gray-600 text-xs mt-0.5">
                    <span v-if="result.bairro" class="font-semibold">{{ result.bairro }}, </span>{{ result.cidade }} não está na nossa cobertura atual.
                  </p>
                </div>
              </div>
              <a
                href="https://wa.me/5511983586611?text=Olá! Gostaria de saber se atendem minha região."
                target="_blank"
                rel="noopener noreferrer"
                @click="closeSearch"
                class="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#22345F] hover:bg-[#1a2847] text-white rounded-lg text-xs font-bold transition-colors"
              >
                <Icon name="lucide:message-circle" class="w-3.5 h-3.5" />
                Consultar disponibilidade
              </a>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>
