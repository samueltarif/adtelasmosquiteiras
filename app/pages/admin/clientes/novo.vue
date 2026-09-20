<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ClientDuplicateAlert from '~/components/admin/crm/ClientDuplicateAlert.vue'
import type { WhatsappAttributionItem } from '~/types/adminWhatsappAttribution'

definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const route = useRoute()
const isSaving = ref(false)
const errorMessage = ref<string | null>(null)
const duplicateCandidates = ref<any[]>([])

const refWhatsapp = ref<string>(typeof route.query.ref === 'string' ? route.query.ref.trim().toUpperCase() : '')
const whatsappPreview = ref<WhatsappAttributionItem | null>(null)
const isLoadingWhatsappPreview = ref(false)

async function fetchWhatsappPreview(code: string) {
  if (!code || !/^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/.test(code)) {
    whatsappPreview.value = null
    return
  }
  isLoadingWhatsappPreview.value = true
  try {
    const res = await $fetch<any>(`/api/admin/marketing/whatsapp-attributions/by-code/${code}`)
    if (res?.success && res.attribution) {
      whatsappPreview.value = res.attribution
    } else {
      whatsappPreview.value = null
    }
  } catch (err) {
    whatsappPreview.value = null
  } finally {
    isLoadingWhatsappPreview.value = false
  }
}

onMounted(() => {
  if (refWhatsapp.value) {
    fetchWhatsappPreview(refWhatsapp.value)
  }
})

watch(refWhatsapp, (newCode) => {
  if (newCode && newCode.length === 8) {
    fetchWhatsappPreview(newCode)
  } else if (!newCode) {
    whatsappPreview.value = null
  }
})

const form = ref<{
  nome: string
  tipo_cliente: string
  telefone_principal: string
  telefone_secundario: string
  email: string
  cpf_cnpj: string
  nome_fantasia: string
  razao_social: string
  observacoes: string
  confirmPossibleDuplicate: boolean
  ref_whatsapp?: string
}>({
  nome: '',
  tipo_cliente: 'pessoa_fisica',
  telefone_principal: '',
  telefone_secundario: '',
  email: '',
  cpf_cnpj: '',
  nome_fantasia: '',
  razao_social: '',
  observacoes: '',
  confirmPossibleDuplicate: false,
  ref_whatsapp: refWhatsapp.value || undefined
})

async function handleCreateClient(overrideDuplicate = false) {
  if (!form.value.nome.trim() || form.value.nome.trim().length < 2) {
    errorMessage.value = 'O nome do cliente deve ter pelo menos 2 caracteres.'
    return
  }
  const cleanPhone = form.value.telefone_principal.replace(/\D/g, '')
  if (!cleanPhone || cleanPhone.length < 10) {
    errorMessage.value = 'Informe um telefone válido com DDD (10 ou 11 dígitos).'
    return
  }

  isSaving.value = true
  errorMessage.value = null

  if (overrideDuplicate) {
    form.value.confirmPossibleDuplicate = true
  }

  form.value.ref_whatsapp = refWhatsapp.value ? refWhatsapp.value.trim().toUpperCase() : undefined

  try {
    const res = await $fetch<any>('/api/admin/crm/clients', {
      method: 'POST',
      body: form.value
    })

    if (res?.success && res.client?.id) {
      router.push(`/admin/clientes/${res.client.id}`)
    }
  } catch (err: any) {
    console.error('[ClientsNovo] Falha ao cadastrar cliente')
    const errData = err?.data?.data || err?.data || {}
    if (err?.statusCode === 409 && errData.code === 'POSSIBLE_DUPLICATE') {
      duplicateCandidates.value = errData.duplicates || []
    } else {
      errorMessage.value = err?.data?.message || err?.message || 'Erro ao cadastrar cliente.'
    }
  } finally {
    isSaving.value = false
  }
}

function handleOpenExisting(clientId: string) {
  router.push(`/admin/clientes/${clientId}`)
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/admin/clientes"
          class="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Voltar para listagem"
        >
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
        </NuxtLink>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">Novo Cliente</h1>
          <p class="text-xs sm:text-sm text-slate-400">Cadastre um cliente manualmente no CRM</p>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs sm:text-sm flex items-center gap-2">
      <Icon name="lucide:alert-circle" class="w-5 h-5 shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Alerta de Duplicata Server-Side -->
    <ClientDuplicateAlert
      v-if="duplicateCandidates.length > 0"
      :duplicates="duplicateCandidates"
      confirm-label="Cadastrar novo cliente mesmo assim"
      @confirm="handleCreateClient(true)"
      @cancel="duplicateCandidates = []; form.confirmPossibleDuplicate = false"
      @open-client="handleOpenExisting"
    />

    <!-- Card de Contexto de Atribuição WhatsApp (Fase 1.1 Parte 3A) -->
    <div v-if="whatsappPreview" class="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-emerald-400">
          <Icon name="lucide:message-circle" class="w-5 h-5" />
          <span>Atribuição WhatsApp Detectada — Ref: <span class="font-mono bg-emerald-900/60 px-2 py-0.5 rounded text-white">{{ whatsappPreview.short_code }}</span></span>
        </div>
        <button
          type="button"
          @click="refWhatsapp = ''; whatsappPreview = null"
          class="text-xs text-emerald-400/80 hover:text-emerald-200 underline"
        >
          Remover vínculo
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1 border-t border-emerald-500/20">
        <div>
          <span class="text-slate-400">Campanha:</span>
          <span class="font-semibold text-white ml-1">{{ whatsappPreview.campaign_name || 'Google Ads' }}</span>
        </div>
        <div>
          <span class="text-slate-400">Click ID:</span>
          <span class="font-semibold ml-1" :class="whatsappPreview.has_click_id ? 'text-emerald-400' : 'text-slate-400'">
            {{ whatsappPreview.has_click_id ? `capturado (${whatsappPreview.click_id_type?.toUpperCase()})` : 'não detectado' }}
          </span>
        </div>
        <div>
          <span class="text-slate-400">Landing Page:</span>
          <span class="font-mono text-slate-200 ml-1">{{ whatsappPreview.landing_path || '/' }}</span>
        </div>
        <div>
          <span class="text-slate-400">Horário do Clique:</span>
          <span class="text-slate-200 ml-1">{{ new Date(whatsappPreview.clicked_at).toLocaleString('pt-BR') }}</span>
        </div>
      </div>
      <p class="text-[11px] text-emerald-400/90 italic">
        Ao cadastrar, este cliente será associado com status "Atribuição confirmada por referência".
      </p>
    </div>

    <!-- Formulário de Cadastro -->
    <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-sm">
      <form @submit.prevent="() => handleCreateClient(false)" class="space-y-5">
        <!-- Ref WhatsApp manual ou pré-carregada -->
        <div class="p-3.5 rounded-xl bg-slate-950 border border-white/10">
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">
            Ref. WhatsApp (Código do Lead)
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model="refWhatsapp"
              type="text"
              maxlength="8"
              class="w-40 px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white font-mono uppercase text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Ex: 8K3M7QFA"
            />
            <span v-if="isLoadingWhatsappPreview" class="text-xs text-slate-400 flex items-center gap-1">
              <Icon name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
              Buscando clique...
            </span>
            <span v-else-if="whatsappPreview" class="text-xs text-emerald-400 flex items-center gap-1">
              <Icon name="lucide:check-circle" class="w-3.5 h-3.5" />
              Clique localizado
            </span>
            <span v-else-if="refWhatsapp && refWhatsapp.length === 8" class="text-xs text-amber-400 flex items-center gap-1">
              <Icon name="lucide:alert-triangle" class="w-3.5 h-3.5" />
              Código não encontrado
            </span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">
            Se o contato veio pelo WhatsApp com "Ref: CÓDIGO", informe aqui para herdar o rastreamento do Google Ads.
          </p>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">
            Nome Completo / Identificação <span class="text-red-400">*</span>
          </label>
          <input
            v-model="form.nome"
            type="text"
            required
            class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
            placeholder="Ex: Carlos Eduardo de Oliveira"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Tipo de Cliente <span class="text-red-400">*</span>
            </label>
            <select
              v-model="form.tipo_cliente"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
            >
              <option value="pessoa_fisica">Pessoa Física</option>
              <option value="empresa">Empresa</option>
              <option value="condominio">Condomínio</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Telefone Principal <span class="text-red-400">*</span>
            </label>
            <input
              v-model="form.telefone_principal"
              type="tel"
              required
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              placeholder="(11) 98765-4321"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Telefone Secundário / Comercial
            </label>
            <input
              v-model="form.telefone_secundario"
              type="tel"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              placeholder="(11) 3456-7890"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              E-mail
            </label>
            <input
              v-model="form.email"
              type="email"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              placeholder="cliente@email.com"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              CPF / CNPJ
            </label>
            <input
              v-model="form.cpf_cnpj"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              placeholder="000.000.000-00"
            />
          </div>

          <div v-if="form.tipo_cliente !== 'pessoa_fisica'">
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Razão Social
            </label>
            <input
              v-model="form.razao_social"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              placeholder="Razão Social Ltda"
            />
          </div>
        </div>

        <div v-if="form.tipo_cliente !== 'pessoa_fisica'">
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">
            Nome Fantasia
          </label>
          <input
            v-model="form.nome_fantasia"
            type="text"
            class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
            placeholder="Nome Comercial ou Condomínio"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">
            Observações Internas Iniciais
          </label>
          <textarea
            v-model="form.observacoes"
            rows="3"
            class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            placeholder="Preferências, notas de contato inicial, etc."
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <NuxtLink
            to="/admin/clientes"
            class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors text-sm font-semibold min-h-[44px] flex items-center justify-center"
          >
            Cancelar
          </NuxtLink>

          <button
            type="submit"
            :disabled="isSaving"
            class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all text-sm font-bold flex items-center gap-2 min-h-[44px] cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <Icon v-if="isSaving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <Icon v-else name="lucide:check" class="w-4 h-4" />
            <span>{{ isSaving ? 'Cadastrando...' : 'Cadastrar Cliente' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
