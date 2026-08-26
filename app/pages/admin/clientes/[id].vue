<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ClientEditModal from '~/components/admin/crm/ClientEditModal.vue'
import ClientArchiveModal from '~/components/admin/crm/ClientArchiveModal.vue'
import ClientAddressManager from '~/components/admin/crm/ClientAddressManager.vue'
import ClientNotesManager from '~/components/admin/crm/ClientNotesManager.vue'
import ClientActivityTimeline from '~/components/admin/crm/ClientActivityTimeline.vue'
import ClientWorkOrdersReadOnly from '~/components/admin/crm/ClientWorkOrdersReadOnly.vue'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const clientId = route.params.id as string

const client = ref<any | null>(null)
const addresses = ref<any[]>([])
const originLead = ref<any | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

const activeTab = ref<'geral' | 'enderecos' | 'ordens' | 'notas' | 'historico'>('geral')
const isEditModalOpen = ref(false)
const isArchiveModalOpen = ref(false)

async function fetchClientData() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<any>(`/api/admin/crm/clients/${clientId}`)
    if (res?.success) {
      client.value = res.client
      addresses.value = res.addresses || []
      originLead.value = res.originLead || null
    } else {
      errorMessage.value = 'Cliente não encontrado.'
    }
  } catch (err: any) {
    console.error('[ClientDetail] Erro:', err)
    errorMessage.value = err?.data?.message || err?.message || 'Erro ao carregar dados do cliente.'
  } finally {
    isLoading.value = false
  }
}

function handleClientUpdated(updatedClient: any) {
  client.value = {
    ...client.value,
    ...updatedClient
  }
}

function handleArchiveConfirmed(isArchived: boolean) {
  if (client.value) {
    client.value.is_archived = isArchived
  }
}

function formatPhone(phone?: string) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return phone
}

function formatWhatsAppLink(phone?: string) {
  if (!phone) return '#'
  const digits = phone.replace(/\D/g, '')
  const full = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${full}`
}

function formatDate(iso?: string) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function getTipoLabel(tipo?: string) {
  const map: Record<string, string> = {
    pessoa_fisica: 'Pessoa Física',
    empresa: 'Empresa',
    condominio: 'Condomínio'
  }
  return (tipo && map[tipo]) || tipo || 'Pessoa Física'
}

onMounted(() => {
  fetchClientData()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Header / Voltar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/admin/clientes"
          class="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Voltar"
        >
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
        </NuxtLink>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {{ client?.nome || 'Carregando cliente...' }}
            </h1>
            <span 
              v-if="client?.is_archived" 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700"
            >
              Arquivado
            </span>
            <span 
              v-else-if="client?.status === 'ativo'" 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              Ativo
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
            Cadastrado em {{ formatDate(client?.created_at) }}
            <span v-if="client?.tipo_cliente"> | {{ getTipoLabel(client.tipo_cliente) }}</span>
          </p>
        </div>
      </div>

      <!-- Ações do Cabeçalho -->
      <div v-if="client" class="flex items-center gap-2 flex-wrap">
        <a
          :href="formatWhatsAppLink(client.telefone_principal)"
          target="_blank"
          rel="noopener noreferrer"
          class="px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-xs font-bold flex items-center gap-1.5 min-h-[44px]"
          title="WhatsApp"
        >
          <Icon name="lucide:message-circle" class="w-4 h-4" />
          <span>WhatsApp</span>
        </a>

        <button
          type="button"
          @click="isEditModalOpen = true"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 min-h-[44px] cursor-pointer"
        >
          <Icon name="lucide:pencil" class="w-4 h-4" />
          <span>Editar</span>
        </button>

        <button
          type="button"
          @click="isArchiveModalOpen = true"
          class="px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 min-h-[44px] cursor-pointer"
          :class="client.is_archived ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'"
        >
          <Icon :name="client.is_archived ? 'lucide:archive-restore' : 'lucide:archive'" class="w-4 h-4" />
          <span>{{ client.is_archived ? 'Reativar' : 'Arquivar' }}</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-16 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
      <span>Carregando dados do cliente...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-300 space-y-3">
      <Icon name="lucide:alert-circle" class="w-8 h-8 mx-auto" />
      <p class="text-sm font-semibold">{{ errorMessage }}</p>
      <NuxtLink to="/admin/clientes" class="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold inline-block min-h-[40px]">
        Voltar para Clientes
      </NuxtLink>
    </div>

    <div v-else-if="client" class="space-y-6">
      <!-- Barra de Abas (Tabs) -->
      <div class="flex items-center gap-1.5 overflow-x-auto border-b border-white/10 pb-2 scrollbar-none">
        <button
          type="button"
          @click="activeTab = 'geral'"
          class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 min-h-[44px] shrink-0 cursor-pointer"
          :class="activeTab === 'geral' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:user" class="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'enderecos'"
          class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 min-h-[44px] shrink-0 cursor-pointer"
          :class="activeTab === 'enderecos' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:map-pin" class="w-4 h-4" />
          <span>Endereços ({{ addresses.length }})</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'ordens'"
          class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 min-h-[44px] shrink-0 cursor-pointer"
          :class="activeTab === 'ordens' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:file-text" class="w-4 h-4" />
          <span>Ordens de Serviço</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'notas'"
          class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 min-h-[44px] shrink-0 cursor-pointer"
          :class="activeTab === 'notas' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:file-edit" class="w-4 h-4" />
          <span>Anotações</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'historico'"
          class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 min-h-[44px] shrink-0 cursor-pointer"
          :class="activeTab === 'historico' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:history" class="w-4 h-4" />
          <span>Histórico</span>
        </button>
      </div>

      <!-- Conteúdo da Aba 1: Visão Geral -->
      <div v-if="activeTab === 'geral'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Card de Dados Cadastrais -->
          <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
            <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="lucide:contact" class="w-4 h-4 text-indigo-400" />
              <span>Dados Principais</span>
            </h3>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">Nome Completo</span>
                <span class="text-white font-medium">{{ client.nome }}</span>
              </div>

              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">Tipo</span>
                <span class="text-slate-300">{{ getTipoLabel(client.tipo_cliente) }}</span>
              </div>

              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">Telefone Principal</span>
                <span class="font-mono text-slate-200">{{ formatPhone(client.telefone_principal) }}</span>
              </div>

              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">Telefone Secundário</span>
                <span class="font-mono text-slate-300">{{ formatPhone(client.telefone_secundario) || '-' }}</span>
              </div>

              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">E-mail</span>
                <span class="text-slate-300 truncate block">{{ client.email || '-' }}</span>
              </div>

              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">CPF / CNPJ</span>
                <span class="font-mono text-slate-300">{{ client.cpf_cnpj || '-' }}</span>
              </div>

              <div v-if="client.razao_social">
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">Razão Social</span>
                <span class="text-slate-300">{{ client.razao_social }}</span>
              </div>

              <div v-if="client.nome_fantasia">
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">Nome Fantasia</span>
                <span class="text-slate-300">{{ client.nome_fantasia }}</span>
              </div>
            </div>

            <div v-if="client.observacoes" class="pt-3 border-t border-white/5">
              <span class="text-slate-500 block text-[10px] uppercase font-semibold mb-1">Observações Internas</span>
              <p class="text-xs text-slate-300 whitespace-pre-wrap bg-slate-950/60 p-3 rounded-xl border border-white/5">
                {{ client.observacoes }}
              </p>
            </div>
          </div>

          <!-- Card de Origem (Lead de Origem) -->
          <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
            <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="lucide:sparkles" class="w-4 h-4 text-indigo-400" />
              <span>Origem do Cadastro</span>
            </h3>

            <div v-if="originLead" class="space-y-3">
              <div class="p-3.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-xs space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-indigo-300">Convertido de Lead</span>
                  <span class="text-[10px] text-indigo-400 font-mono">{{ formatDate(originLead.created_at) }}</span>
                </div>
                <p class="text-slate-300">
                  <strong>Serviço Solicitado:</strong> {{ originLead.servico || 'Não especificado' }}
                </p>
                <p v-if="originLead.cidade" class="text-slate-400">
                  <strong>Região:</strong> {{ originLead.cidade }}
                </p>
              </div>

              <NuxtLink
                :to="`/admin/leads`"
                class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 pt-1"
              >
                <span>Ver lista de Leads</span>
                <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
              </NuxtLink>
            </div>

            <div v-else class="p-6 rounded-xl bg-slate-950/40 border border-white/5 text-center text-xs text-slate-400">
              <Icon name="lucide:user-check" class="w-6 h-6 text-slate-500 mx-auto mb-2" />
              <span>Cliente cadastrado diretamente no sistema pelo administrador.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Conteúdo da Aba 2: Endereços -->
      <div v-else-if="activeTab === 'enderecos'">
        <ClientAddressManager
          :client-id="clientId"
          :addresses="addresses"
          @refresh="fetchClientData"
        />
      </div>

      <!-- Conteúdo da Aba 3: Ordens de Serviço -->
      <div v-else-if="activeTab === 'ordens'">
        <ClientWorkOrdersReadOnly
          :client-id="clientId"
        />
      </div>

      <!-- Conteúdo da Aba 4: Anotações -->
      <div v-else-if="activeTab === 'notas'">
        <ClientNotesManager
          :client-id="clientId"
        />
      </div>

      <!-- Conteúdo da Aba 5: Histórico -->
      <div v-else-if="activeTab === 'historico'">
        <ClientActivityTimeline
          :client-id="clientId"
        />
      </div>
    </div>

    <!-- Modais -->
    <ClientEditModal
      :is-open="isEditModalOpen"
      :client="client"
      @close="isEditModalOpen = false"
      @updated="handleClientUpdated"
    />

    <ClientArchiveModal
      :is-open="isArchiveModalOpen"
      :client-id="client?.id || null"
      :client-name="client?.nome || ''"
      :is-archived="client?.is_archived || false"
      @close="isArchiveModalOpen = false"
      @confirmed="handleArchiveConfirmed"
    />
  </div>
</template>
