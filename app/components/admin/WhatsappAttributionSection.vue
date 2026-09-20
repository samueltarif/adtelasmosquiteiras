<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { 
  WhatsappAttributionItem, 
  WhatsappAttributionsListResponse,
  WhatsappAttributionStatus 
} from '~/types/adminWhatsappAttribution'

const router = useRouter()

const loading = ref(false)
const attributions = ref<WhatsappAttributionItem[]>([])
const counts = ref({
  total: 0,
  unassigned: 0,
  assigned: 0,
  dismissed: 0
})

const activeStatus = ref<string>('unassigned')
const searchQuery = ref('')
const page = ref(1)
const pageSize = 20

// Modal de Associação Manual
const isAssignModalOpen = ref(false)
const selectedAttribution = ref<WhatsappAttributionItem | null>(null)
const clientSearchQuery = ref('')
const isSearchingClients = ref(false)
const clientSearchResults = ref<any[]>([])
const selectedClient = ref<any | null>(null)
const assignNotes = ref('')
const isAssigning = ref(false)
const assignError = ref<string | null>(null)

// Modal de Dispensa
const isDismissModalOpen = ref(false)
const dismissNotes = ref('')
const isDismissing = ref(false)
const dismissError = ref<string | null>(null)

// Modal de Busca Rápida por Código
const isQuickSearchOpen = ref(false)
const quickCode = ref('')
const quickSearchLoading = ref(false)
const quickSearchResult = ref<WhatsappAttributionItem | null>(null)
const quickSearchError = ref<string | null>(null)

// Notificação de Copiado
const copiedCode = ref<string | null>(null)

async function fetchAttributions() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (activeStatus.value !== 'all') {
      params.set('status', activeStatus.value)
    }
    if (searchQuery.value.trim()) {
      params.set('search', searchQuery.value.trim())
    }
    params.set('page', String(page.value))
    params.set('pageSize', String(pageSize))

    const res = await $fetch<WhatsappAttributionsListResponse>(`/api/admin/marketing/whatsapp-attributions?${params.toString()}`)
    if (res?.success) {
      attributions.value = res.attributions || []
      counts.value = res.counts || { total: 0, unassigned: 0, assigned: 0, dismissed: 0 }
    }
  } catch (err: any) {
    console.error('[WhatsappAttributionSection] Erro ao carregar atribuições:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAttributions()
})

watch([activeStatus, searchQuery], () => {
  page.value = 1
  fetchAttributions()
})

function copyCode(code: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code)
    copiedCode.value = code
    setTimeout(() => {
      copiedCode.value = null
    }, 2000)
  }
}

function handleCreateClient(item: WhatsappAttributionItem) {
  // Reutilização do fluxo existente (Regra 13)
  router.push(`/admin/clientes/novo?ref=${item.short_code}`)
}

function openAssignModal(item: WhatsappAttributionItem) {
  selectedAttribution.value = item
  clientSearchQuery.value = ''
  clientSearchResults.value = []
  selectedClient.value = null
  assignNotes.value = ''
  assignError.value = null
  isAssignModalOpen.value = true
}

async function searchClients() {
  if (!clientSearchQuery.value.trim() || clientSearchQuery.value.trim().length < 2) {
    clientSearchResults.value = []
    return
  }

  isSearchingClients.value = true
  try {
    const res = await $fetch<any>('/api/admin/crm/clients/search', {
      method: 'POST',
      body: {
        search: clientSearchQuery.value.trim(),
        pageSize: 10
      }
    })
    clientSearchResults.value = res?.clients || []
  } catch (err) {
    console.error('[WhatsappAttributionSection] Erro ao buscar clientes:', err)
  } finally {
    isSearchingClients.value = false
  }
}

async function confirmAssignment() {
  if (!selectedAttribution.value || !selectedClient.value) return

  isAssigning.value = true
  assignError.value = null

  try {
    const res = await $fetch<any>(`/api/admin/marketing/whatsapp-attributions/${selectedAttribution.value.id}/assign`, {
      method: 'POST',
      body: {
        client_id: selectedClient.value.id,
        match_method: 'manual_selection', // Regra 14: manual_selection gera probable
        notes: assignNotes.value.trim() || undefined
      }
    })

    if (res?.success) {
      isAssignModalOpen.value = false
      fetchAttributions()
    }
  } catch (err: any) {
    assignError.value = err?.data?.message || err?.message || 'Erro ao associar cliente à atribuição.'
  } finally {
    isAssigning.value = false
  }
}

function openDismissModal(item: WhatsappAttributionItem) {
  selectedAttribution.value = item
  dismissNotes.value = ''
  dismissError.value = null
  isDismissModalOpen.value = true
}

async function confirmDismissal() {
  if (!selectedAttribution.value) return

  isDismissing.value = true
  dismissError.value = null

  try {
    const res = await $fetch<any>(`/api/admin/marketing/whatsapp-attributions/${selectedAttribution.value.id}/dismiss`, {
      method: 'POST',
      body: {
        notes: dismissNotes.value.trim() || undefined
      }
    })

    if (res?.success) {
      isDismissModalOpen.value = false
      fetchAttributions()
    }
  } catch (err: any) {
    dismissError.value = err?.data?.message || err?.message || 'Erro ao dispensar atribuição.'
  } finally {
    isDismissing.value = false
  }
}

async function executeQuickSearch() {
  const code = quickCode.value.trim().toUpperCase()
  if (!code || code.length !== 8) {
    quickSearchError.value = 'Informe um código de exatamente 8 caracteres.'
    return
  }

  quickSearchLoading.value = true
  quickSearchError.value = null
  quickSearchResult.value = null

  try {
    const res = await $fetch<any>(`/api/admin/marketing/whatsapp-attributions/by-code/${code}`)
    if (res?.success && res.attribution) {
      quickSearchResult.value = res.attribution
    } else {
      quickSearchError.value = 'Nenhuma atribuição encontrada para este código.'
    }
  } catch (err: any) {
    quickSearchError.value = err?.data?.message || err?.message || 'Erro na consulta do código.'
  } finally {
    quickSearchLoading.value = false
  }
}

function formatDatetime(iso: string): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return iso
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header da Fila WhatsApp -->
    <div class="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900/50 to-emerald-950/30 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <Icon name="lucide:message-square" class="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-sm sm:text-base font-bold text-white">Fila de Atribuição WhatsApp</h3>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              FASE 1.1 PARTE 3A
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            Conciliação entre mensagens com referência WhatsApp e Clientes no CRM preservando dados do Google Ads
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="isQuickSearchOpen = true; quickCode = ''; quickSearchResult = null; quickSearchError = null"
          class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Icon name="lucide:search" class="w-4 h-4 text-emerald-400" />
          <span>Localizar Ref.</span>
        </button>

        <button
          type="button"
          @click="fetchAttributions"
          :disabled="loading"
          class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs transition-colors cursor-pointer"
          title="Recarregar fila"
        >
          <Icon name="lucide:refresh-cw" class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- Cards de Contadores e Filtros Rápidos -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
      <button
        type="button"
        @click="activeStatus = 'unassigned'"
        class="p-3.5 rounded-xl border text-left transition-all cursor-pointer"
        :class="activeStatus === 'unassigned' 
          ? 'bg-amber-500/15 border-amber-500/40 shadow-sm shadow-amber-500/10' 
          : 'bg-slate-900/60 border-white/5 hover:border-white/15'"
      >
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>Aguardando Vínculo</span>
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        </div>
        <div class="text-xl sm:text-2xl font-bold font-mono text-amber-300 mt-1">
          {{ counts.unassigned }}
        </div>
        <span class="text-[10px] text-amber-400/80 mt-0.5 block">Cliques pendentes de contato</span>
      </button>

      <button
        type="button"
        @click="activeStatus = 'assigned'"
        class="p-3.5 rounded-xl border text-left transition-all cursor-pointer"
        :class="activeStatus === 'assigned' 
          ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm shadow-emerald-500/10' 
          : 'bg-slate-900/60 border-white/5 hover:border-white/15'"
      >
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>Atribuídos</span>
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        </div>
        <div class="text-xl sm:text-2xl font-bold font-mono text-emerald-300 mt-1">
          {{ counts.assigned }}
        </div>
        <span class="text-[10px] text-emerald-400/80 mt-0.5 block">Conciliados com Cliente/Lead</span>
      </button>

      <button
        type="button"
        @click="activeStatus = 'dismissed'"
        class="p-3.5 rounded-xl border text-left transition-all cursor-pointer"
        :class="activeStatus === 'dismissed' 
          ? 'bg-slate-700/30 border-slate-500/40' 
          : 'bg-slate-900/60 border-white/5 hover:border-white/15'"
      >
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>Dispensados</span>
          <span class="w-2 h-2 rounded-full bg-slate-500"></span>
        </div>
        <div class="text-xl sm:text-2xl font-bold font-mono text-slate-300 mt-1">
          {{ counts.dismissed }}
        </div>
        <span class="text-[10px] text-slate-400 mt-0.5 block">Sem continuidade / spam</span>
      </button>

      <button
        type="button"
        @click="activeStatus = 'all'"
        class="p-3.5 rounded-xl border text-left transition-all cursor-pointer"
        :class="activeStatus === 'all' 
          ? 'bg-indigo-500/15 border-indigo-500/40 shadow-sm shadow-indigo-500/10' 
          : 'bg-slate-900/60 border-white/5 hover:border-white/15'"
      >
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>Todos</span>
          <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
        </div>
        <div class="text-xl sm:text-2xl font-bold font-mono text-indigo-300 mt-1">
          {{ counts.total }}
        </div>
        <span class="text-[10px] text-indigo-400/80 mt-0.5 block">Histórico completo</span>
      </button>
    </div>

    <!-- Barra de Busca -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1">
        <Icon name="lucide:search" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por código (ex: 8K3M7QFA), campanha ou página..."
          class="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>
    </div>

    <!-- Lista / Tabela de Atribuições -->
    <div class="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-slate-400 text-xs sm:text-sm flex items-center justify-center gap-2">
        <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-emerald-400" />
        <span>Carregando fila de atribuição...</span>
      </div>

      <div v-else-if="attributions.length === 0" class="p-10 text-center text-slate-500 text-xs sm:text-sm space-y-1">
        <Icon name="lucide:inbox" class="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p class="font-semibold text-slate-400">Nenhum clique de WhatsApp encontrado para este filtro</p>
        <p class="text-[11px] text-slate-600">Novos cliques na página gerarão códigos de referência automaticamente.</p>
      </div>

      <div v-else class="divide-y divide-white/5">
        <div
          v-for="item in attributions"
          :key="item.id"
          class="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <!-- Lado Esquerdo: Código e Snapshot de Marketing -->
          <div class="space-y-2 flex-1 min-w-0">
            <div class="flex items-center gap-2.5 flex-wrap">
              <!-- Short Code com Botão de Copiar -->
              <div class="flex items-center gap-1.5 bg-slate-950 border border-emerald-500/30 rounded-lg px-2.5 py-1">
                <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Ref:</span>
                <span class="font-mono text-sm font-bold text-emerald-400 tracking-wider select-all">{{ item.short_code }}</span>
                <button
                  type="button"
                  @click="copyCode(item.short_code)"
                  class="text-slate-400 hover:text-white transition-colors ml-0.5"
                  title="Copiar código"
                >
                  <Icon v-if="copiedCode === item.short_code" name="lucide:check" class="w-3.5 h-3.5 text-emerald-400" />
                  <Icon v-else name="lucide:copy" class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Click ID Badge (Regra 12) -->
              <span
                class="text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1"
                :class="item.has_click_id 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-slate-800 text-slate-400 border-white/5'"
              >
                <Icon :name="item.has_click_id ? 'lucide:check-circle' : 'lucide:help-circle'" class="w-3 h-3" />
                <span>{{ item.has_click_id ? 'Click ID: capturado' : 'Click ID: não detectado' }}</span>
                <span v-if="item.click_id_type" class="text-[10px] font-mono text-emerald-300">({{ item.click_id_type.toUpperCase() }})</span>
              </span>

              <!-- Status Badge (Regras 11, 14 e 15) -->
              <span
                v-if="item.attribution_status === 'unassigned'"
                class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"
              >
                Aguardando Contato
              </span>
              <span
                v-else-if="item.attribution_status === 'assigned'"
                class="text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1"
                :class="item.confidence_level === 'confirmed'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'"
              >
                <Icon name="lucide:check" class="w-3 h-3" />
                <span>{{ item.confidence_level === 'confirmed' ? 'Atribuição confirmada por referência' : 'Atribuição provável por seleção manual' }}</span>
              </span>
              <span
                v-else-if="item.attribution_status === 'dismissed'"
                class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/10"
              >
                Dispensado
              </span>
            </div>

            <!-- Dados Técnicos e Origem do Clique -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-400">
              <div class="flex items-center gap-1 truncate">
                <Icon name="lucide:target" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span class="text-slate-500">Campanha:</span>
                <span class="text-slate-200 font-medium truncate">{{ item.campaign_name || 'Google Ads' }}</span>
              </div>

              <div class="flex items-center gap-1 truncate">
                <Icon name="lucide:compass" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span class="text-slate-500">Landing:</span>
                <span class="font-mono text-slate-300 truncate">{{ item.landing_path || '/' }}</span>
              </div>

              <div class="flex items-center gap-1">
                <Icon name="lucide:clock" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span class="text-slate-500">Clique:</span>
                <span class="text-slate-300 font-mono text-[11px]">{{ formatDatetime(item.clicked_at) }}</span>
              </div>

              <div v-if="item.cta_location" class="flex items-center gap-1 truncate">
                <Icon name="lucide:mouse-pointer" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span class="text-slate-500">CTA:</span>
                <span class="text-slate-300 font-mono text-[11px]">{{ item.cta_location }}</span>
              </div>

              <div v-if="item.utm_term" class="flex items-center gap-1 truncate">
                <Icon name="lucide:key" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span class="text-slate-500">Termo:</span>
                <span class="text-slate-200">{{ item.utm_term }}</span>
              </div>
            </div>

            <!-- Se Atribuído: Informações do Cliente Vinculado -->
            <div v-if="item.attribution_status === 'assigned' && item.client" class="pt-2 mt-1 border-t border-white/5 flex items-center gap-3 text-xs">
              <div class="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Icon name="lucide:user-check" class="w-4 h-4" />
                <span>Cliente:</span>
                <NuxtLink :to="`/admin/clientes/${item.client.id}`" class="underline hover:text-emerald-300">
                  {{ item.client.nome }} ({{ item.client.telefone_principal }})
                </NuxtLink>
              </div>
              <span v-if="item.assigned_by_email" class="text-slate-500 text-[11px]">
                por {{ item.assigned_by_email }} em {{ formatDatetime(item.assigned_at || '') }}
              </span>
            </div>

            <div v-if="item.notes" class="text-[11px] text-slate-400 italic">
              Obs: {{ item.notes }}
            </div>
          </div>

          <!-- Lado Direito: Ações Rápidas -->
          <div class="flex items-center gap-2 shrink-0 self-end lg:self-center">
            <template v-if="item.attribution_status === 'unassigned'">
              <!-- Botão Principal: + Criar Cliente (Regra 13) -->
              <button
                type="button"
                @click="handleCreateClient(item)"
                class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <Icon name="lucide:user-plus" class="w-3.5 h-3.5" />
                <span>+ Criar Cliente</span>
              </button>

              <!-- Botão: Vincular Existente (Regra 14) -->
              <button
                type="button"
                @click="openAssignModal(item)"
                class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Icon name="lucide:link" class="w-3.5 h-3.5 text-slate-400" />
                <span>Vincular Existente</span>
              </button>

              <!-- Botão: Dispensar -->
              <button
                type="button"
                @click="openDismissModal(item)"
                class="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-white/5 text-xs transition-colors cursor-pointer"
                title="Dispensar clique"
              >
                <Icon name="lucide:x" class="w-3.5 h-3.5" />
              </button>
            </template>

            <template v-else-if="item.attribution_status === 'assigned' && item.client">
              <NuxtLink
                :to="`/admin/clientes/${item.client.id}`"
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Icon name="lucide:external-link" class="w-3.5 h-3.5" />
                <span>Ver Cliente</span>
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Associação Manual a Cliente Existente -->
    <div
      v-if="isAssignModalOpen"
      class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-white/15 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Icon name="lucide:link" class="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-white">Vincular a Cliente Existente</h4>
              <p class="text-[11px] text-slate-400">Ref: {{ selectedAttribution?.short_code }}</p>
            </div>
          </div>
          <button @click="isAssignModalOpen = false" class="text-slate-400 hover:text-white">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>

        <!-- Aviso da Regra 14 e 15 -->
        <div class="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2">
          <Icon name="lucide:info" class="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            A associação manual definirá a confiabilidade como <strong>"Atribuição provável por seleção manual"</strong> (conforme regra de auditoria).
          </span>
        </div>

        <div v-if="assignError" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {{ assignError }}
        </div>

        <!-- Campo de Busca de Cliente -->
        <div class="space-y-2">
          <label class="block text-xs font-semibold text-slate-300">Buscar Cliente no CRM</label>
          <div class="flex items-center gap-2">
            <input
              v-model="clientSearchQuery"
              type="text"
              placeholder="Digite nome, telefone ou e-mail..."
              @keyup.enter="searchClients"
              class="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              @click="searchClients"
              :disabled="isSearchingClients"
              class="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
            >
              {{ isSearchingClients ? 'Buscando...' : 'Buscar' }}
            </button>
          </div>
        </div>

        <!-- Resultados da Busca -->
        <div v-if="clientSearchResults.length > 0" class="max-h-48 overflow-y-auto space-y-1.5 border border-white/5 rounded-xl p-2 bg-slate-950">
          <button
            v-for="c in clientSearchResults"
            :key="c.id"
            type="button"
            @click="selectedClient = c"
            class="w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer"
            :class="selectedClient?.id === c.id ? 'bg-indigo-600 text-white' : 'hover:bg-white/5 text-slate-300'"
          >
            <div>
              <span class="font-bold">{{ c.nome }}</span>
              <span class="text-[11px] block text-slate-400" :class="{ 'text-indigo-200': selectedClient?.id === c.id }">
                {{ c.telefone_principal }} · {{ c.email || 'sem e-mail' }}
              </span>
            </div>
            <Icon v-if="selectedClient?.id === c.id" name="lucide:check" class="w-4 h-4" />
          </button>
        </div>

        <!-- Observações Opcionais -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-300">Observações da Vinculação (opcional)</label>
          <input
            v-model="assignNotes"
            type="text"
            placeholder="Ex: Cliente confirmou horário da conversa por telefone"
            class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            @click="isAssignModalOpen = false"
            class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="confirmAssignment"
            :disabled="!selectedClient || isAssigning"
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Icon v-if="isAssigning" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isAssigning ? 'Vinculando...' : 'Confirmar Vinculação' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação de Dispensa -->
    <div
      v-if="isDismissModalOpen"
      class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Icon name="lucide:trash-2" class="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-white">Dispensar Clique WhatsApp</h4>
              <p class="text-[11px] text-slate-400">Ref: {{ selectedAttribution?.short_code }}</p>
            </div>
          </div>
          <button @click="isDismissModalOpen = false" class="text-slate-400 hover:text-white">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">
          Tem certeza de que deseja dispensar este clique? Ele não aparecerá mais na fila de atendimento pendente.
        </p>

        <div v-if="dismissError" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {{ dismissError }}
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-300">Motivo (opcional)</label>
          <input
            v-model="dismissNotes"
            type="text"
            placeholder="Ex: Contato sem retorno / spam / teste interno"
            class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            @click="isDismissModalOpen = false"
            class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="confirmDismissal"
            :disabled="isDismissing"
            class="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Icon v-if="isDismissing" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDismissing ? 'Dispensando...' : 'Confirmar Dispensa' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Localização Rápida por Código -->
    <div
      v-if="isQuickSearchOpen"
      class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Icon name="lucide:search" class="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-white">Localizar Ref. de WhatsApp</h4>
              <p class="text-[11px] text-slate-400">Verifique os dados da mensagem recebida</p>
            </div>
          </div>
          <button @click="isQuickSearchOpen = false" class="text-slate-400 hover:text-white">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-semibold text-slate-300">Código de 8 Caracteres</label>
          <div class="flex items-center gap-2">
            <input
              v-model="quickCode"
              type="text"
              maxlength="8"
              placeholder="Ex: 8K3M7QFA"
              @keyup.enter="executeQuickSearch"
              class="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono uppercase text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              @click="executeQuickSearch"
              :disabled="quickSearchLoading"
              class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
            >
              {{ quickSearchLoading ? 'Consultando...' : 'Consultar' }}
            </button>
          </div>
        </div>

        <div v-if="quickSearchError" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {{ quickSearchError }}
        </div>

        <div v-if="quickSearchResult" class="p-3.5 rounded-xl bg-slate-950 border border-white/10 space-y-2 text-xs">
          <div class="flex items-center justify-between border-b border-white/5 pb-2">
            <span class="font-mono text-emerald-400 font-bold text-sm">{{ quickSearchResult.short_code }}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full border"
              :class="quickSearchResult.has_click_id ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-white/5'">
              {{ quickSearchResult.has_click_id ? 'Click ID: capturado' : 'Sem Click ID' }}
            </span>
          </div>

          <div class="space-y-1 text-slate-300">
            <div><span class="text-slate-500">Campanha:</span> {{ quickSearchResult.campaign_name || 'Google Ads' }}</div>
            <div><span class="text-slate-500">Landing:</span> <span class="font-mono">{{ quickSearchResult.landing_path }}</span></div>
            <div><span class="text-slate-500">Horário:</span> {{ formatDatetime(quickSearchResult.clicked_at) }}</div>
          </div>

          <div class="pt-2 border-t border-white/5 flex items-center justify-end gap-2">
            <button
              v-if="quickSearchResult.attribution_status === 'unassigned'"
              type="button"
              @click="handleCreateClient(quickSearchResult); isQuickSearchOpen = false"
              class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Icon name="lucide:user-plus" class="w-3.5 h-3.5" />
              <span>Criar Cliente com esta Ref.</span>
            </button>
            <span v-else class="text-slate-400 text-[11px]">
              Status: {{ quickSearchResult.attribution_status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
