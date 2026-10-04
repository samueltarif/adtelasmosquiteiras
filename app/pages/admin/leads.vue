<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import Card from '../../components/ui/card/Card.vue'
import Table from '../../components/ui/table/Table.vue'
import TableHeader from '../../components/ui/table/TableHeader.vue'
import TableBody from '../../components/ui/table/TableBody.vue'
import TableRow from '../../components/ui/table/TableRow.vue'
import TableHead from '../../components/ui/table/TableHead.vue'
import TableCell from '../../components/ui/table/TableCell.vue'
import Badge from '../../components/ui/badge/Badge.vue'
import WhatsappLeadKpiCards from '../../components/admin/whatsapp/WhatsappLeadKpiCards.vue'
import WhatsappLeadDetailModal from '../../components/admin/whatsapp/WhatsappLeadDetailModal.vue'
import WhatsappUnidentifiedClicks from '../../components/admin/whatsapp/WhatsappUnidentifiedClicks.vue'
import { formatWhatsAppLink } from '~/utils/phone'

definePageMeta({ layout: 'admin' })

useHead({
  title: 'Gestão de Leads WhatsApp - AD Telas e Redes',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const activeTab = ref<'whatsapp' | 'technical_history'>('whatsapp')
const isLoading = ref(false)
const searchQuery = ref('')
const selectedStatusFilter = ref('')
const selectedChannelFilter = ref('')
const page = ref(1)
const limit = ref(25)

const leads = ref<any[]>([])
const pagination = ref({
  page: 1,
  limit: 25,
  totalCount: 0,
  totalPages: 1,
  hasMore: false
})

const counts = ref({
  total: 0,
  novos: 0,
  em_contato: 0,
  sem_resposta: 0,
  fechados: 0,
  perdidos: 0,
  real: 0,
  legacy_synthetic: 0,
  automated_test: 0,
  manual_validation: 0
})

const selectedLead = ref<any | null>(null)
const isDetailModalOpen = ref(false)
let searchDebounceTimer: any = null

async function fetchLeads() {
  isLoading.value = true
  try {
    const params = new URLSearchParams({
      tab: activeTab.value,
      page: String(page.value),
      limit: String(limit.value)
    })

    if (searchQuery.value.trim()) params.set('search', searchQuery.value.trim())
    if (selectedStatusFilter.value) params.set('status', selectedStatusFilter.value)
    if (selectedChannelFilter.value) params.set('channel', selectedChannelFilter.value)

    const data = await $fetch<any>(`/api/admin/leads?${params.toString()}`)
    if (data?.success) {
      leads.value = data.leads || []
      if (data.pagination) pagination.value = data.pagination
      if (data.counts) counts.value = data.counts
    }
  } catch (err) {
    console.error('[AdminLeads] Erro ao carregar leads:', err)
  } finally {
    isLoading.value = false
  }
}

function handleTabChange(tab: 'whatsapp' | 'technical_history') {
  activeTab.value = tab
  page.value = 1
  fetchLeads()
}

function handleStatusFilterChange(status: string) {
  selectedStatusFilter.value = status
  page.value = 1
  fetchLeads()
}

function handleChannelFilterChange() {
  page.value = 1
  fetchLeads()
}

function handlePageSizeChange() {
  page.value = 1
  fetchLeads()
}

function handleSearchInput() {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    page.value = 1
    fetchLeads()
  }, 350)
}

function openLeadDetails(lead: any) {
  selectedLead.value = lead
  isDetailModalOpen.value = true
}

async function handleInlineStatusUpdate(lead: any, newStatus: string) {
  try {
    const res = await $fetch<any>(`/api/admin/leads/${encodeURIComponent(lead.id)}/status`, {
      method: 'PATCH',
      body: { status: newStatus }
    })
    if (res?.success) {
      lead.status = res.lead.status
      fetchLeads()
    }
  } catch (err) {
    console.warn('[handleInlineStatusUpdate] Falha:', err)
  }
}

function handleModalStatusUpdated(newStatus: string) {
  if (selectedLead.value) {
    selectedLead.value.status = newStatus
  }
  fetchLeads()
}

function statusBadgeVariant(status: string) {
  const map: Record<string, any> = {
    'Novo': 'cyan',
    'Em contato': 'amber',
    'Em Atendimento': 'amber',
    'Sem resposta': 'purple',
    'Fechado': 'success',
    'Perdido': 'destructive'
  }
  return map[status] || 'secondary'
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchLeads()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-3 sm:p-5 md:p-6 lg:p-8 w-full max-w-full">
    <div class="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6 w-full">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-white/[0.06] pb-4 sm:pb-5">
        <div>
          <h1 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Icon name="lucide:message-square" class="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            <span>Gestão de Leads WhatsApp & CRM</span>
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Painel comercial central com histórico completo de interações e atribuição de campanhas
          </p>
        </div>

        <button 
          @click="fetchLeads" 
          class="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white transition-all min-h-[44px] active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5" :class="isLoading ? 'animate-spin' : ''" />
          <span>Atualizar</span>
        </button>
      </div>

      <!-- Tab Switcher (Leads Reais vs Histórico Técnico) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        <button 
          @click="handleTabChange('whatsapp')"
          class="flex items-center justify-between sm:justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer"
          :class="activeTab === 'whatsapp' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:text-white'"
        >
          <div class="flex items-center gap-1.5 truncate">
            <Icon name="lucide:user-check" class="w-4 h-4 shrink-0" />
            <span class="truncate">Leads Capturados WhatsApp</span>
          </div>
          <span class="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono shrink-0">
            {{ counts.real }}
          </span>
        </button>

        <button 
          @click="handleTabChange('technical_history')"
          class="flex items-center justify-between sm:justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer"
          :class="activeTab === 'technical_history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:text-white'"
        >
          <div class="flex items-center gap-1.5 truncate">
            <Icon name="lucide:archive" class="w-4 h-4 shrink-0" />
            <span class="truncate">Histórico Técnico</span>
          </div>
          <span class="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono shrink-0">
            {{ counts.legacy_synthetic + counts.automated_test + counts.manual_validation }}
          </span>
        </button>
      </div>

      <!-- Indicadores / KPI Cards -->
      <WhatsappLeadKpiCards
        :counts="counts"
        :selected-status="selectedStatusFilter"
        @select-status="handleStatusFilterChange"
      />

      <!-- Barra de Filtros e Busca -->
      <div class="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-white/[0.02] p-3 sm:p-4 rounded-2xl border border-white/[0.06]">
        <!-- Search Input -->
        <div class="relative flex-1 min-w-[240px]">
          <Icon name="lucide:search" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            v-model="searchQuery"
            type="text"
            @input="handleSearchInput"
            placeholder="Buscar por nome, telefone, REF, campanha, página..."
            class="w-full bg-slate-900 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-sm sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 min-h-[44px]"
          />
        </div>

        <!-- Filtros Dropdowns -->
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <!-- Status Dropdown -->
          <div class="flex items-center gap-1.5 min-w-[140px] flex-1 sm:flex-initial">
            <span class="text-xs text-slate-400 font-medium shrink-0">Status:</span>
            <select 
              v-model="selectedStatusFilter" 
              @change="handleStatusFilterChange(selectedStatusFilter)"
              class="w-full bg-slate-900 border border-slate-700/60 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option value="">Todos</option>
              <option value="Novo">Novo</option>
              <option value="Em contato">Em contato</option>
              <option value="Sem resposta">Sem resposta</option>
              <option value="Fechado">Fechado</option>
              <option value="Perdido">Perdido</option>
            </select>
          </div>

          <!-- Canal Dropdown -->
          <div class="flex items-center gap-1.5 min-w-[140px] flex-1 sm:flex-initial">
            <span class="text-xs text-slate-400 font-medium shrink-0">Canal:</span>
            <select 
              v-model="selectedChannelFilter" 
              @change="handleChannelFilterChange"
              class="w-full bg-slate-900 border border-slate-700/60 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option value="">Todos</option>
              <option value="google_ads">Google Ads</option>
              <option value="google_organic">Google Orgânico</option>
              <option value="direct">Direto</option>
              <option value="meta_ads">Meta Ads</option>
              <option value="tiktok_ads">TikTok Ads</option>
            </select>
          </div>

          <!-- Itens por página -->
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-xs text-slate-400 font-medium">Por página:</span>
            <select 
              v-model="limit" 
              @change="handlePageSizeChange"
              class="bg-slate-900 border border-slate-700/60 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ====================================================================== -->
      <!-- MOBILE CARDS VIEW (< 768px)                                             -->
      <!-- ====================================================================== -->
      <div class="block md:hidden space-y-3">
        <!-- Skeleton Loading Mobile -->
        <div v-if="isLoading" v-for="i in 3" :key="'skel-m-' + i" class="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse space-y-3">
          <div class="h-4 bg-white/10 rounded w-1/2"></div>
          <div class="h-3 bg-white/5 rounded w-3/4"></div>
          <div class="h-8 bg-white/10 rounded w-full"></div>
        </div>

        <!-- Empty State Mobile -->
        <div v-else-if="leads.length === 0" class="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] text-slate-400 space-y-2">
          <Icon name="lucide:inbox" class="w-8 h-8 mx-auto text-slate-500" />
          <p class="text-xs font-semibold">Nenhum lead encontrado com os filtros selecionados.</p>
        </div>

        <!-- Mobile Lead Cards -->
        <div 
          v-else
          v-for="lead in leads" 
          :key="'mob-' + lead.id"
          class="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-indigo-500/40 transition-all space-y-3 shadow-md"
        >
          <!-- Top Row: Nome & Telefone + Interações Badge -->
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <h3 class="font-bold text-white text-sm truncate">{{ lead.nome || 'Sem nome informado' }}</h3>
              <p class="text-slate-400 text-xs mt-0.5 font-mono">{{ lead.telefone || 'Sem telefone' }}</p>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              {{ lead.interactions_count || 1 }} clique(s)
            </span>
          </div>

          <!-- Status & Canal Inline Selector -->
          <div class="grid grid-cols-2 gap-2 text-xs py-2 border-y border-white/[0.04]">
            <div>
              <span class="text-[10px] text-slate-500 font-bold uppercase block">Status</span>
              <select
                :value="lead.status || 'Novo'"
                @change="handleInlineStatusUpdate(lead, ($event.target as HTMLSelectElement).value)"
                class="mt-1 w-full bg-slate-800 border border-slate-700 text-white text-[11px] rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="Novo">Novo</option>
                <option value="Em contato">Em contato</option>
                <option value="Sem resposta">Sem resposta</option>
                <option value="Fechado">Fechado</option>
                <option value="Perdido">Perdido</option>
              </select>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 font-bold uppercase block">Origem / Canal</span>
              <span class="text-slate-200 font-medium truncate block mt-1.5">
                {{ lead.channel || lead.session_channel || 'direct' }}
              </span>
            </div>
          </div>

          <!-- Informações de Página e Contato -->
          <div class="text-[11px] text-slate-400 space-y-1">
            <div class="flex justify-between">
              <span>Última Página:</span>
              <span class="text-slate-200 font-mono truncate max-w-[180px]">{{ lead.latest_landing_path || lead.landing_path || '/' }}</span>
            </div>
            <div class="flex justify-between">
              <span>Último Contato:</span>
              <span class="text-slate-200 font-mono">{{ formatDate(lead.last_interaction_at || lead.created_at) }}</span>
            </div>
          </div>

          <!-- Bottom Row: Botão WhatsApp + Ver Detalhes -->
          <div class="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.04]">
            <span class="text-[10px] text-slate-500 font-mono">Criado: {{ formatDate(lead.created_at) }}</span>

            <div class="flex items-center gap-2">
              <a
                v-if="lead.telefone"
                :href="formatWhatsAppLink(lead.telefone)"
                target="_blank"
                rel="noopener noreferrer"
                class="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Abrir WhatsApp"
              >
                <Icon name="lucide:message-circle" class="w-4 h-4" />
              </a>

              <button
                @click="openLeadDetails(lead)"
                class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 min-h-[44px] cursor-pointer"
              >
                <Icon name="lucide:eye" class="w-3.5 h-3.5" />
                <span>Ver Detalhes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ====================================================================== -->
      <!-- DESKTOP TABLE VIEW (>= 768px)                                           -->
      <!-- ====================================================================== -->
      <Card class="hidden md:block p-0 overflow-hidden border border-white/[0.08] shadow-xl">
        <Table>
          <TableHeader>
            <TableRow class="bg-white/[0.02]">
              <TableHead class="py-3.5 px-4">Nome & WhatsApp</TableHead>
              <TableHead class="py-3.5 px-4">Status Comercial</TableHead>
              <TableHead class="py-3.5 px-4">Origem / Canal</TableHead>
              <TableHead class="py-3.5 px-4">Última Página</TableHead>
              <TableHead class="py-3.5 px-4 text-center">Interações</TableHead>
              <TableHead class="py-3.5 px-4">Último Contato</TableHead>
              <TableHead class="py-3.5 px-4">Criado Em</TableHead>
              <TableHead class="py-3.5 px-4 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading" v-for="i in 5" :key="'skel-d-' + i" class="animate-pulse">
              <TableCell colspan="8" class="py-4 px-4"><div class="h-4 bg-white/[0.04] rounded"></div></TableCell>
            </TableRow>

            <TableRow 
              v-else-if="leads.length > 0"
              v-for="lead in leads" 
              :key="'desk-' + lead.id"
              class="cursor-pointer hover:bg-white/[0.02] transition-colors"
              @click="openLeadDetails(lead)"
            >
              <!-- Nome & Telefone -->
              <TableCell class="py-3.5 px-4">
                <p class="font-bold text-white text-sm">{{ lead.nome || 'Sem nome' }}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-slate-400 text-[11px] font-mono">{{ lead.telefone || lead.email || '-' }}</span>
                  <a
                    v-if="lead.telefone"
                    :href="formatWhatsAppLink(lead.telefone)"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click.stop
                    class="text-emerald-400 hover:text-emerald-300 ml-1"
                    title="Conversar no WhatsApp"
                  >
                    <Icon name="lucide:message-circle" class="w-3.5 h-3.5 inline" />
                  </a>
                </div>
              </TableCell>

              <!-- Status Dropdown Inline -->
              <TableCell class="py-3.5 px-4" @click.stop>
                <select
                  :value="lead.status || 'Novo'"
                  @change="handleInlineStatusUpdate(lead, ($event.target as HTMLSelectElement).value)"
                  class="bg-slate-900 border border-slate-700/80 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Novo">Novo</option>
                  <option value="Em contato">Em contato</option>
                  <option value="Sem resposta">Sem resposta</option>
                  <option value="Fechado">Fechado</option>
                  <option value="Perdido">Perdido</option>
                </select>
              </TableCell>

              <!-- Canal / Origem -->
              <TableCell class="py-3.5 px-4">
                <Badge variant="outline" class="text-[10px] font-semibold text-slate-300">
                  {{ lead.channel || lead.session_channel || 'direct' }}
                </Badge>
                <p v-if="lead.utm_campaign" class="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                  {{ lead.utm_campaign }}
                </p>
              </TableCell>

              <!-- Última Página -->
              <TableCell class="py-3.5 px-4 text-slate-300 text-xs font-mono truncate max-w-[160px]">
                {{ lead.latest_landing_path || lead.landing_path || '/' }}
              </TableCell>

              <!-- Contagem de Interações -->
              <TableCell class="py-3.5 px-4 text-center">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {{ lead.interactions_count || 1 }}
                </span>
              </TableCell>

              <!-- Último Contato -->
              <TableCell class="py-3.5 px-4 text-slate-300 font-medium tabular-nums text-xs">
                {{ formatDate(lead.last_interaction_at || lead.created_at) }}
              </TableCell>

              <!-- Criado Em -->
              <TableCell class="py-3.5 px-4 text-slate-400 font-medium tabular-nums text-xs">
                {{ formatDate(lead.created_at) }}
              </TableCell>

              <!-- Ações -->
              <TableCell class="py-3.5 px-4 text-center" @click.stop>
                <button 
                  @click="openLeadDetails(lead)" 
                  class="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center mx-auto"
                  title="Ver detalhes completos e timeline"
                >
                  <Icon name="lucide:eye" class="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>

            <TableRow v-else>
              <TableCell colspan="8" class="py-8 text-center text-slate-500 text-xs">
                Nenhum lead encontrado com os filtros atuais.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      <!-- Paginação Server-Side -->
      <div v-if="pagination.totalPages > 1 || pagination.totalCount > 0" class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.02] p-3 sm:p-4 rounded-2xl border border-white/[0.06] text-xs text-slate-400">
        <div>
          Mostrando {{ (pagination.page - 1) * pagination.limit + (leads.length ? 1 : 0) }} a 
          {{ Math.min(pagination.page * pagination.limit, pagination.totalCount) }} de 
          <strong class="text-white">{{ pagination.totalCount }}</strong> leads
        </div>

        <div class="flex items-center gap-2">
          <button
            :disabled="pagination.page <= 1 || isLoading"
            @click="page--; fetchLeads()"
            class="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white disabled:opacity-30 hover:bg-slate-700 transition-colors min-h-[40px] cursor-pointer"
          >
            Anterior
          </button>

          <span class="px-3 py-1 font-mono text-slate-300">
            Página {{ pagination.page }} de {{ pagination.totalPages }}
          </span>

          <button
            :disabled="pagination.page >= pagination.totalPages || isLoading"
            @click="page++; fetchLeads()"
            class="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white disabled:opacity-30 hover:bg-slate-700 transition-colors min-h-[40px] cursor-pointer"
          >
            Próxima
          </button>
        </div>
      </div>

      <!-- SEÇÃO FINAL: Cliques do WhatsApp sem Identificação -->
      <WhatsappUnidentifiedClicks />

    </div>

    <!-- Modal de Detalhes e Timeline Completa do Lead -->
    <WhatsappLeadDetailModal 
      :lead="selectedLead"
      :is-open="isDetailModalOpen"
      @close="isDetailModalOpen = false"
      @status-updated="handleModalStatusUpdated"
    />
  </div>
</template>
