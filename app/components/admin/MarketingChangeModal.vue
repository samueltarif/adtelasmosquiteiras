<script setup lang="ts">
import type { CreateMarketingChangePayload } from '../../types/adminMarketingChangeLog'

const props = defineProps<{
  isOpen: boolean
  isSaving?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: CreateMarketingChangePayload): void
}>()

// Gera datetime-local no horário de São Paulo (YYYY-MM-DDTHH:mm) sem deslocamento de timezone
function getCurrentSaoPauloDatetimeLocal() {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
  return formatter.format(new Date()).replace(' ', 'T')
}

const form = ref<CreateMarketingChangePayload>({
  occurred_at: getCurrentSaoPauloDatetimeLocal(),
  change_type: 'landing_page',
  scope: 'landing',
  title: '',
  description: '',
  campaign_name: 'AD Telas | Pesquisa | Leads | SP',
  google_campaign_id: '24258184938',
  landing_path: '/lp/telas-mosquiteiras',
  previous_value: '',
  new_value: ''
})

const errorMessage = ref<string | null>(null)

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.value = {
      occurred_at: getCurrentSaoPauloDatetimeLocal(),
      change_type: 'landing_page',
      scope: 'landing',
      title: '',
      description: '',
      campaign_name: 'AD Telas | Pesquisa | Leads | SP',
      google_campaign_id: '24258184938',
      landing_path: '/lp/telas-mosquiteiras',
      previous_value: '',
      new_value: ''
    }
    errorMessage.value = null
  }
})

function handleSubmit() {
  if (!form.value.title.trim()) {
    errorMessage.value = 'Por favor, informe o título da alteração.'
    return
  }
  errorMessage.value = null
  emit('save', { ...form.value })
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
    <div class="bg-slate-900 border border-slate-700/70 rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-2xl my-8 flex flex-col gap-4">
      
      <div class="flex items-center justify-between pb-3 border-b border-white/10">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Icon name="lucide:file-plus" class="w-4 h-4" />
          </div>
          <h3 class="text-sm sm:text-base font-bold text-white">Registrar Alteração de Marketing</h3>
        </div>
        <button @click="emit('close')" class="text-slate-400 hover:text-white transition-colors">
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="flex flex-col gap-3.5 text-xs">
        <!-- Linha 1: Data/Hora e Escopo -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Data / Hora (São Paulo)</label>
            <input
              v-model="form.occurred_at"
              type="datetime-local"
              required
              class="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
          </div>

          <div>
            <label class="block text-slate-300 font-semibold mb-1">Escopo</label>
            <select
              v-model="form.scope"
              class="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs cursor-pointer"
            >
              <option value="landing">Landing Page</option>
              <option value="campaign">Campanha Google Ads</option>
              <option value="tracking">Rastreamento / ValueTrack</option>
              <option value="account">Conta Global</option>
            </select>
          </div>
        </div>

        <!-- Linha 2: Tipo de Alteração -->
        <div>
          <label class="block text-slate-300 font-semibold mb-1">Tipo de Alteração</label>
          <select
            v-model="form.change_type"
            class="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs cursor-pointer"
          >
            <option value="landing_page">Landing Page (Ativação / Layout)</option>
            <option value="url_suffix">Sufixo de URL / Parâmetros</option>
            <option value="tracking">Rastreamento / Tag / Pixel</option>
            <option value="negative_keyword">Palavras-chave Negativas</option>
            <option value="keyword">Palavras-chave Positivas</option>
            <option value="ad_copy">Anúncio / Título / Descrição</option>
            <option value="budget">Orçamento Diário</option>
            <option value="bid">Estratégia de Lances</option>
            <option value="sitelink">Recursos / Sitelinks / Frases</option>
            <option value="conversion">Ação de Conversão</option>
            <option value="campaign_setting">Configuração de Campanha</option>
            <option value="other">Outros / Anotação Geral</option>
          </select>
        </div>

        <!-- Linha 3: Título -->
        <div>
          <label class="block text-slate-300 font-semibold mb-1">Título da Alteração *</label>
          <input
            v-model="form.title"
            type="text"
            required
            placeholder="Ex: Adicionadas palavras negativas ou Novo sufixo ativado"
            class="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs placeholder:text-slate-500"
          />
        </div>

        <!-- Linha 4: Descrição -->
        <div>
          <label class="block text-slate-300 font-semibold mb-1">Descrição / Contexto Detalhado</label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Detalhes sobre o que mudou e o motivo..."
            class="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs placeholder:text-slate-500 resize-none"
          ></textarea>
        </div>

        <!-- Linha 5: Campanha e Landing -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1">Nome da Campanha</label>
            <input
              v-model="form.campaign_name"
              type="text"
              class="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Landing Path</label>
            <input
              v-model="form.landing_path"
              type="text"
              class="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs font-mono"
            />
          </div>
        </div>

        <!-- Linha 6: Valor Anterior e Novo Valor (Opcional) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1">Valor Anterior (Opcional)</label>
            <input
              v-model="form.previous_value"
              type="text"
              placeholder="Ex: /servicos/telas"
              class="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs font-mono"
            />
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Novo Valor (Opcional)</label>
            <input
              v-model="form.new_value"
              type="text"
              placeholder="Ex: /lp/telas-mosquiteiras"
              class="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs font-mono"
            />
          </div>
        </div>

        <!-- Rodapé do Modal -->
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-white/10 mt-1">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isSaving"
            class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <Icon v-if="isSaving" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSaving ? 'Salvando...' : 'Salvar Alteração' }}</span>
          </button>
        </div>
      </form>

    </div>
  </div>
</template>
