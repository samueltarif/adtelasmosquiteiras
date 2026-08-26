<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ClientDuplicateAlert from '~/components/admin/crm/ClientDuplicateAlert.vue'

definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const isSaving = ref(false)
const errorMessage = ref<string | null>(null)
const duplicateCandidates = ref<any[]>([])

const form = ref({
  nome: '',
  tipo_cliente: 'pessoa_fisica',
  telefone_principal: '',
  telefone_secundario: '',
  email: '',
  cpf_cnpj: '',
  nome_fantasia: '',
  razao_social: '',
  observacoes: '',
  confirmPossibleDuplicate: false
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

  try {
    const res = await $fetch<any>('/api/admin/crm/clients', {
      method: 'POST',
      body: form.value
    })

    if (res?.success && res.client?.id) {
      router.push(`/admin/clientes/${res.client.id}`)
    }
  } catch (err: any) {
    console.error('[ClientsNovo] Erro ao cadastrar cliente:', err)
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

    <!-- Formulário de Cadastro -->
    <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-sm">
      <form @submit.prevent="() => handleCreateClient(false)" class="space-y-5">
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
