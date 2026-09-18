<script setup>
import { nextTick, reactive, ref } from 'vue'
import { useFormSubmit } from '~/composables/useFormSubmit'

const { isSubmitting, redirectToThankYou } = useFormSubmit()
const fields = reactive({ nome: '', telefone: '', cep: '', instalacao: '' })
const error = ref('')
const submitted = ref(false)
const statusElement = ref(null)
const installationTypes = ['Janelas', 'Portas', 'Sacadas e varandas', 'Ambiente comercial', 'Outros / preciso de orientação']

async function submit() {
  if (isSubmitting.value || submitted.value) return
  error.value = ''
  const phone = fields.telefone.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  const cep = fields.cep.replace(/\D/g, '')
  if (fields.nome.trim().length < 2 || !/^\d{10,11}$/.test(phone) || !/^\d{8}$/.test(cep) || !installationTypes.includes(fields.instalacao)) {
    error.value = 'Confira o nome, o WhatsApp com DDD, o CEP com 8 dígitos e o tipo de instalação.'
    return
  }
  try {
    await redirectToThankYou({
      nome: fields.nome.trim(), telefone: phone,
      cidade: 'A confirmar pelo CEP',
      servico: `Telas Mosquiteiras — ${fields.instalacao}`,
      mensagem: `CEP: ${cep.slice(0, 5)}-${cep.slice(5)}\nTipo de instalação: ${fields.instalacao}`,
      origem: 'formulario_landing_telas'
    }, null, { redirect: false })
    submitted.value = true
    await nextTick()
    statusElement.value?.focus()
  } catch {
    error.value = 'Não foi possível enviar seu pedido. Seus dados continuam aqui; tente novamente ou fale conosco pelo WhatsApp.'
  }
}
</script>

<template>
  <div id="orcamento-telas" class="scroll-mt-36 rounded-2xl bg-white p-5 sm:p-6 text-[#22345F] shadow-xl" data-cta-location="quote_form">
    <div v-if="submitted" ref="statusElement" tabindex="-1" role="status" class="py-8 focus:outline-none">
      <Icon name="lucide:check-circle" class="h-10 w-10 text-green-700 mb-3" />
      <h2 class="text-2xl font-bold">Pedido recebido!</h2>
      <p class="mt-3 text-gray-600">Nossa equipe vai entrar em contato pelo WhatsApp informado para preparar seu orçamento.</p>
    </div>
    <form v-else aria-labelledby="quote-title" :aria-busy="isSubmitting" @submit.prevent="submit">
      <!-- Prova Social Discreta -->
      <div class="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 text-xs">
        <span class="inline-flex items-center gap-1.5 font-semibold text-[#22345F]">
          <Icon name="lucide:award" class="w-4 h-4 text-[#F49A1A] shrink-0" />
          Certificado INMETRO
        </span>
        <span class="inline-flex items-center gap-1 text-gray-600 font-medium">
          <span class="text-[#F49A1A] font-bold">★ 5.0</span>
          <span class="text-[11px] text-gray-500">(487 avaliações Google)</span>
        </span>
      </div>

      <h2 id="quote-title" class="text-xl sm:text-2xl font-bold">Peça seu orçamento gratuito</h2>
      <p class="mt-1 mb-4 text-sm text-gray-600">Conte onde precisa instalar. Retornamos pelo WhatsApp.</p>
      <fieldset :disabled="isSubmitting" class="grid gap-3 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label for="quote-name" class="block text-sm font-semibold mb-1">Nome</label>
          <input id="quote-name" v-model="fields.nome" name="nome" autocomplete="name" required minlength="2" maxlength="120" class="quote-input" placeholder="Seu nome" />
        </div>
        <div>
          <label for="quote-phone" class="block text-sm font-semibold mb-1">WhatsApp com DDD</label>
          <input id="quote-phone" v-model="fields.telefone" name="telefone" type="tel" autocomplete="tel" required maxlength="22" class="quote-input" placeholder="(11) 99999-9999" />
        </div>
        <div>
          <label for="quote-cep" class="block text-sm font-semibold mb-1">CEP da instalação</label>
          <input id="quote-cep" v-model="fields.cep" name="cep" inputmode="numeric" autocomplete="postal-code" required maxlength="9" pattern="[0-9]{5}-?[0-9]{3}" class="quote-input" placeholder="00000-000" />
        </div>
        <div class="sm:col-span-2">
          <label for="quote-installation" class="block text-sm font-semibold mb-1">Tipo de instalação</label>
          <select id="quote-installation" v-model="fields.instalacao" name="instalacao" required class="quote-input">
            <option disabled value="">Selecione uma opção</option>
            <option v-for="type in installationTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>
      </fieldset>
      <p v-if="error" role="alert" class="mt-3 text-sm text-red-700">{{ error }}</p>
      <button type="submit" :disabled="isSubmitting" class="mt-4 min-h-12 w-full rounded-xl bg-[#F49A1A] px-4 py-3 font-bold text-[#22345F] hover:bg-[#e78b0e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">
        {{ isSubmitting ? 'Enviando pedido…' : 'Solicitar orçamento gratuito' }}
      </button>
      <p class="mt-3 text-xs leading-relaxed text-gray-500">Usaremos seus dados para atender ao seu pedido. <NuxtLink to="/politica-de-privacidade" class="underline">Política de Privacidade</NuxtLink>.</p>
    </form>
  </div>
</template>

<style scoped>
.quote-input { width: 100%; min-height: 48px; border: 1px solid #9ca3af; border-radius: 8px; padding: 10px 12px; color: #22345f; background: white; font-size: 16px; }
.quote-input:focus-visible { outline: 2px solid #22345f; outline-offset: 2px; }
</style>
