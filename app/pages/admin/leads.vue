<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from '../../components/ui/card/Card.vue'
import Table from '../../components/ui/table/Table.vue'
import TableHeader from '../../components/ui/table/TableHeader.vue'
import TableBody from '../../components/ui/table/TableBody.vue'
import TableRow from '../../components/ui/table/TableRow.vue'
import TableHead from '../../components/ui/table/TableHead.vue'
import TableCell from '../../components/ui/table/TableCell.vue'
import Badge from '../../components/ui/badge/Badge.vue'
import LeadJourneyDrawer from '../../components/admin/LeadJourneyDrawer.vue'
import { formatWhatsAppLink } from '~/utils/phone'

definePageMeta({ layout: 'admin' })

useHead({
  title: 'Gestão de Leads V2 - AD Telas e Redes',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const activeTab = ref<'real' | 'technical_history'>('real')
const isLoading = ref(false)
const searchQuery = ref('')
const selectedStatusFilter = ref('')
const selectedLeadId = ref<string | null>(null)
const isDrawerOpen = ref(false)

const leads = ref<any[]>([])
const counts = ref({
  real: 0,
  legacy_synthetic: 0,
  automated_test: 0,
  manual_validation: 0,
  total: 0
})

async function fetchLeads() {
  isLoading.value = true
  try {
    const data = await $fetch<any>(`/api/admin/leads?tab=${activeTab.value}`)
    if (data?.success) {
      leads.value = data.leads || []
      if (data.counts) {
        counts.value = data.counts
      }
    }
  } catch {
    console.error('[AdminLeads] Erro ao buscar leads')
  } finally {
    isLoading.value = false
  }
}

function handleTabChange(tab: 'real' | 'technical_history') {
  activeTab.value = tab
  fetchLeads()
}

const filteredLeads = computed(() => {
  return leads.value.filter(lead => {
    const query = searchQuery.value.toLowerCase()
    const matchesSearch = 
      (lead.nome || '').toLowerCase().includes(query) ||
      (lead.bairro || '').toLowerCase().includes(query) ||
      (lead.cidade || '').toLowerCase().includes(query) ||
      (lead.servico || '').toLowerCase().includes(query) ||
      (lead.telefone || '').includes(query)
    
    const matchesStatus = selectedStatusFilter.value === '' || lead.status === selectedStatusFilter.value
    return matchesSearch && matchesStatus
  })
})

function openLeadDetails(lead: any) {
  selectedLeadId.value = lead.id
  isDrawerOpen.value = true
}

function statusBadgeVariant(status: string) {
  const map: Record<string, any> = {
    'Novo': 'cyan',
    'Em Atendimento': 'amber',
    'Orçado': 'default',
    'Fechado': 'success',
    'Perdido': 'destructive'
  }
  return map[status] || 'secondary'
}

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
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
          <h1 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Gestão Comercial de Leads V2
          </h1>
          <p class="text-xs text-slate-400 mt-0.5 sm:mt-1">Isolamento rigoroso de registros técnicos e jornada completa de conversão</p>
        </div>

        <button 
          @click="fetchLeads" 
          class="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white transition-all min-h-[44px] active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5" :class="isLoading ? 'animate-spin' : ''" />
          <span>Atualizar</span>
        </button>
      </div>

      <!-- Tab Switcher (Reais vs Histórico Técnico) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        <button 
          @click="handleTabChange('real')"
          class="flex items-center justify-between sm:justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer"
          :class="activeTab === 'real' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:text-white'"
        >
          <div class="flex items-center gap-1.5 truncate">
            <Icon name="lucide:user-check" class="w-4 h-4 shrink-0" />
            <span class="truncate">Leads Comerciais</span>
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

      <!-- Filters Row -->
      <div class="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between bg-white/[0.02] p-2.5 sm:p-3 rounded-2xl border border-white/[0.04]">
        <!-- Search -->
        <div class="relative w-full sm:w-80">
          <Icon name="lucide:search" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nome, bairro, telefone..."
            class="w-full bg-slate-900 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 min-h-[44px]"
          />
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <span class="text-xs text-slate-400 font-medium shrink-0">Status:</span>
          <select 
            v-model="selectedStatusFilter" 
            class="w-full sm:w-auto bg-slate-900 border border-slate-700/60 text-white text-base sm:text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 min-h-[44px]"
          >
            <option value="">Todos os status</option>
            <option value="Novo">Novo</option>
            <option value="Em Atendimento">Em Atendimento</option>
            <option value="Orçado">Orçado</option>
            <option value="Fechado">Fechado</option>
            <option value="Perdido">Perdido</option>
          </select>
        </div>
      </div>

      <!-- ====================================================================== -->
      <!-- MOBILE CARDS VIEW (< 768px)                                             -->
      <!-- ====================================================================== -->
      <div class="block md:hidden space-y-3">
        <!-- Skeleton Loading Mobile -->
        <div v-if="isLoading" v-for="i in 3" :key="i" class="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse space-y-3">
          <div class="h-4 bg-white/10 rounded w-1/2"></div>
          <div class="h-3 bg-white/5 rounded w-3/4"></div>
          <div class="h-8 bg-white/10 rounded w-full"></div>
        </div>

        <!-- Empty State Mobile -->
        <div v-else-if="filteredLeads.length === 0" class="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] text-slate-400">
          <Icon name="lucide:inbox" class="w-8 h-8 mx-auto mb-2 text-slate-500" />
          <p class="text-xs font-semibold">Nenhum lead encontrado com os filtros atuais.</p>
        </div>

        <!-- Leads List Cards Mobile -->
        <div 
          v-else
          v-for="lead in filteredLeads" 
          :key="'mob-' + lead.id"
          class="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-indigo-500/40 transition-all space-y-3 shadow-md"
        >
          <!-- Top Row: Nome & Badge Status -->
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <h3 class="font-bold text-white text-sm truncate">{{ lead.nome || 'Sem nome informado' }}</h3>
              <p class="text-slate-400 text-xs mt-0.5 font-mono">{{ lead.telefone || 'Sem telefone' }}</p>
            </div>
            <Badge :variant="statusBadgeVariant(lead.status || 'Novo')" class="uppercase tracking-wider text-[10px] shrink-0">
              {{ lead.status || 'Novo' }}
            </Badge>
          </div>

          <!-- Middle Row: Serviço & Cidade -->
          <div class="grid grid-cols-2 gap-2 text-xs py-2 border-y border-white/[0.04]">
            <div>
              <span class="text-[10px] text-slate-500 font-bold uppercase block">Serviço</span>
              <span class="text-slate-200 font-medium truncate block">{{ lead.servico || 'Não especificado' }}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 font-bold uppercase block">Local</span>
              <span class="text-slate-300 truncate block">{{ [lead.bairro, lead.cidade].filter(Boolean).join(', ') || 'SP' }}</span>
            </div>
          </div>

          <!-- Bottom Row: Data + Ações -->
          <div class="flex items-center justify-between gap-2 pt-1">
            <span class="text-[11px] text-slate-500 font-mono">{{ formatDate(lead.created_at) }}</span>

            <div class="flex items-center gap-2">
              <a
                v-if="lead.telefone"
                :href="formatWhatsAppLink(lead.telefone)"
                target="_blank"
                rel="noopener noreferrer"
                class="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Abrir no WhatsApp"
              >
                <Icon name="lucide:message-circle" class="w-4 h-4" />
              </a>

              <button
                @click="openLeadDetails(lead)"
                class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors min-h-[44px] cursor-pointer"
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
              <TableHead class="py-3.5 px-4">Nome & Contato</TableHead>
              <TableHead class="py-3.5 px-4">Serviço de Interesse</TableHead>
              <TableHead class="py-3.5 px-4">Canal</TableHead>
              <TableHead class="py-3.5 px-4">Localização</TableHead>
              <TableHead class="py-3.5 px-4">Status</TableHead>
              <TableHead class="py-3.5 px-4 text-right">Data</TableHead>
              <TableHead class="py-3.5 px-4 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading" v-for="i in 5" :key="i" class="animate-pulse">
              <TableCell colspan="7" class="py-4 px-4"><div class="h-4 bg-white/[0.04] rounded"></div></TableCell>
            </TableRow>

            <TableRow 
              v-else-if="filteredLeads.length > 0"
              v-for="lead in filteredLeads" 
              :key="'desk-' + lead.id"
              class="cursor-pointer hover:bg-white/[0.02] transition-colors"
              @click="openLeadDetails(lead)"
            >
              <TableCell class="py-3.5 px-4">
                <p class="font-bold text-white text-sm">{{ lead.nome || 'Sem nome' }}</p>
                <p class="text-slate-400 text-[11px] mt-0.5 font-mono">{{ lead.telefone || lead.email || '-' }}</p>
              </TableCell>

              <TableCell class="py-3.5 px-4">
                <span class="text-slate-200 font-medium">{{ lead.servico || 'Não especificado' }}</span>
              </TableCell>

              <TableCell class="py-3.5 px-4">
                <Badge variant="outline" class="text-[10px] font-semibold text-slate-300">
                  {{ lead.channel || lead.session_channel || 'direct' }}
                </Badge>
              </TableCell>

              <TableCell class="py-3.5 px-4 text-slate-400 text-xs">
                {{ [lead.bairro, lead.cidade].filter(Boolean).join(', ') || '-' }}
              </TableCell>

              <TableCell class="py-3.5 px-4">
                <Badge :variant="statusBadgeVariant(lead.status || 'Novo')" class="uppercase tracking-wider text-[10px]">
                  {{ lead.status || 'Novo' }}
                </Badge>
              </TableCell>

              <TableCell class="py-3.5 px-4 text-right text-slate-400 font-medium tabular-nums text-xs">
                {{ formatDate(lead.created_at) }}
              </TableCell>

              <TableCell class="py-3.5 px-4 text-center" @click.stop>
                <button 
                  @click="openLeadDetails(lead)" 
                  class="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center mx-auto"
                  title="Ver jornada e detalhes"
                >
                  <Icon name="lucide:eye" class="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>

            <TableRow v-else>
              <TableCell colspan="7" class="py-8 text-center text-slate-500 text-xs">
                Nenhum lead encontrado com os filtros atuais.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

    </div>

    <!-- Drawer de Detalhes da Jornada do Lead -->
    <LeadJourneyDrawer 
      :lead-id="selectedLeadId"
      :is-open="isDrawerOpen"
      @close="isDrawerOpen = false"
      @updated="fetchLeads"
    />
  </div>
</template>
