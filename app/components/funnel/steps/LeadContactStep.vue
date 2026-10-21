<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  nome: string
  telefone: string
  email: string
  hasPhotos: boolean
  isSubmitting: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  (e: 'update:nome', val: string): void
  (e: 'update:telefone', val: string): void
  (e: 'update:email', val: string): void
  (e: 'update:hasPhotos', val: boolean): void
  (e: 'submit'): void
  (e: 'back'): void
}>()

const phoneFormatted = computed(() => {
  const digits = (props.telefone || '').replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
})

function onPhoneInput(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11)
  emit('update:telefone', digits)
}

const isFormValid = computed(() => {
  const cleanNome = (props.nome || '').trim()
  const cleanPhone = (props.telefone || '').replace(/\D/g, '')
  return cleanNome.length >= 2 && (cleanPhone.length === 10 || cleanPhone.length === 11)
})
</script>

<template>
  <div class="space-y-4">
    <div class="text-center sm:text-left">
      <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 mb-2">
        Última Etapa ✨
      </span>
      <h3 class="text-xl sm:text-2xl font-bold text-[#22345F]">
        Para onde podemos enviar seu orçamento?
      </h3>
      <p class="text-sm text-gray-600 mt-1">
        Nossa equipe responderá com a proposta detalhada via WhatsApp.
      </p>
    </div>

    <form class="space-y-3 pt-2" @submit.prevent="emit('submit')">
      <!-- Nome -->
      <div>
        <label for="step-nome" class="block text-sm font-semibold text-[#22345F] mb-1">
          Seu Nome Completo *
        </label>
        <input
          id="step-nome"
          :value="nome"
          type="text"
          autocomplete="name"
          placeholder="Como podemos te chamar?"
          required
          minlength="2"
          class="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border-2 border-gray-200 text-[#22345F] text-base placeholder-gray-400 focus:outline-none focus:border-[#F49A1A] transition-colors"
          @input="emit('update:nome', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- WhatsApp -->
      <div>
        <label for="step-phone" class="block text-sm font-semibold text-[#22345F] mb-1">
          WhatsApp com DDD *
        </label>
        <input
          id="step-phone"
          :value="phoneFormatted"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          placeholder="(11) 99999-9999"
          required
          maxlength="15"
          class="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border-2 border-gray-200 text-[#22345F] text-base placeholder-gray-400 focus:outline-none focus:border-[#F49A1A] transition-colors"
          @input="onPhoneInput"
        />
      </div>

      <!-- E-mail (Opcional) -->
      <div>
        <label for="step-email" class="block text-sm font-medium text-gray-700 mb-1">
          E-mail <span class="text-xs text-gray-400 font-normal">(opcional)</span>
        </label>
        <input
          id="step-email"
          :value="email"
          type="email"
          autocomplete="email"
          placeholder="seuemail@exemplo.com"
          class="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-gray-200 text-[#22345F] text-sm placeholder-gray-400 focus:outline-none focus:border-[#F49A1A] transition-colors"
          @input="emit('update:email', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Checkbox Tenho fotos -->
      <div class="pt-1">
        <label class="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-amber-50/50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            :checked="hasPhotos"
            class="mt-1 h-4 w-4 rounded border-gray-300 text-[#F49A1A] focus:ring-[#F49A1A]"
            @change="emit('update:hasPhotos', ($event.target as HTMLInputElement).checked)"
          />
          <span class="text-xs sm:text-sm text-[#22345F]">
            <strong class="block font-semibold">Tenho fotos das janelas ou portas</strong>
            <span class="text-gray-500">Você poderá enviá-las na próxima tela pelo WhatsApp para acelerar seu orçamento.</span>
          </span>
        </label>
      </div>

      <!-- Erro -->
      <div v-if="errorMessage" class="p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium" role="alert">
        {{ errorMessage }}
      </div>

      <!-- CTA Principal de Submit -->
      <div class="pt-2">
        <button
          type="submit"
          :disabled="!isFormValid || isSubmitting"
          class="w-full min-h-[52px] px-6 py-3.5 bg-[#F49A1A] hover:bg-[#e78b0e] active:scale-[0.99] text-[#22345F] font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-5 h-5 animate-spin" />
          <span v-else>RECEBER MEU ORÇAMENTO</span>
        </button>
        <p class="text-center text-xs text-gray-500 mt-2 font-medium">
          🔒 Grátis e sem compromisso. Seus dados estão protegidos (LGPD).
        </p>
      </div>

      <!-- Botão Voltar -->
      <div class="pt-2 text-center">
        <button
          type="button"
          :disabled="isSubmitting"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#22345F] transition-colors"
          @click="emit('back')"
        >
          <Icon name="lucide:arrow-left" class="w-3.5 h-3.5" />
          Voltar e ajustar respostas
        </button>
      </div>
    </form>
  </div>
</template>
