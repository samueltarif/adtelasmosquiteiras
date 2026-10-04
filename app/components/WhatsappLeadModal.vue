<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useWhatsappLeadGate, formatPhoneMask } from '~/composables/useWhatsappLeadGate'
import { useModalA11y } from '~/composables/useModalA11y'

const {
  isOpen,
  isSubmitting,
  name,
  phone,
  errorMessage,
  closeGate,
  submitGate
} = useWhatsappLeadGate()

const dialogRef = ref<HTMLElement | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)

useModalA11y(isOpen, closeGate, {
  dialogRef,
  initialFocusSelector: '#wa-lead-name'
})

watch(isOpen, async (val) => {
  if (val) {
    await nextTick()
    nameInputRef.value?.focus()
  }
})

function onPhoneInput(e: Event) {
  const target = e.target as HTMLInputElement
  phone.value = formatPhoneMask(target.value)
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget && !isSubmitting.value) {
    closeGate()
  }
}

async function onSubmit() {
  await submitGate()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        data-wa-gate-modal="true"
        @click="handleOverlayClick"
      >
        <div
          ref="dialogRef"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wa-gate-title"
          class="relative w-full max-w-md rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
          @click.stop
        >
          <!-- Header do Modal -->
          <div class="bg-[#22345F] text-white p-5 sm:p-6 relative">
            <button
              type="button"
              @click="closeGate"
              :disabled="isSubmitting"
              aria-label="Fechar modal de orçamento"
              class="absolute top-4 right-4 text-white/80 hover:text-white p-2.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 min-h-[48px] min-w-[48px] w-12 h-12 flex items-center justify-center cursor-pointer"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                </svg>
              </div>
              <div>
                <h2 id="wa-gate-title" class="text-lg font-bold leading-tight">Atendimento WhatsApp</h2>
                <p class="text-xs text-white/80">Inicie sua conversa com nossa equipe técnica</p>
              </div>
            </div>
          </div>

          <!-- Formulário -->
          <form @submit.prevent="onSubmit" class="p-5 sm:p-6 space-y-4">
            <!-- Alerta de Erro -->
            <div
              v-if="errorMessage"
              role="alert"
              class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2"
            >
              <svg class="w-4 h-4 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Campo Nome -->
            <div>
              <label for="wa-lead-name" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Seu nome <span class="text-red-500">*</span>
              </label>
              <input
                id="wa-lead-name"
                ref="nameInputRef"
                v-model="name"
                type="text"
                required
                autocomplete="name"
                placeholder="Como podemos te chamar?"
                :disabled="isSubmitting"
                class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#22345F] focus:ring-2 focus:ring-[#22345F]/20 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-100 disabled:opacity-60"
              />
            </div>

            <!-- Campo WhatsApp -->
            <div>
              <label for="wa-lead-phone" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Seu WhatsApp <span class="text-red-500">*</span>
              </label>
              <input
                id="wa-lead-phone"
                :value="phone"
                @input="onPhoneInput"
                type="tel"
                required
                inputmode="numeric"
                autocomplete="tel"
                placeholder="(11) 98358-6611"
                :disabled="isSubmitting"
                class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 text-slate-900 text-sm font-mono outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-100 disabled:opacity-60"
              />
            </div>

            <!-- Botão Continuar -->
            <button
              type="submit"
              data-wa-gate-submit="true"
              :disabled="isSubmitting"
              class="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#1fb854] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100 cursor-pointer min-h-[48px]"
            >
              <svg v-if="isSubmitting" class="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <template v-else>
                <span>Continuar no WhatsApp</span>
                <span aria-hidden="true">→</span>
              </template>
            </button>

            <!-- Termos e LGPD -->
            <p class="text-center text-[11px] text-slate-500 pt-1 leading-relaxed">
              Seus dados serão utilizados apenas para atendimento do seu orçamento.
              <NuxtLink to="/politica-de-privacidade" target="_blank" class="text-slate-600 hover:text-[#22345F] underline font-medium">
                Política de Privacidade
              </NuxtLink>.
            </p>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
