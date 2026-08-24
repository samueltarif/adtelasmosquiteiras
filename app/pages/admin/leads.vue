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
    const data = await $fetch(`/api/admin/leads?tab=${activeTab.value}`)
    if (data?.success) {
      leads.value = data.leads || []
      if (data.counts) {
        counts.value = data.counts
      }
    }
  } catch (err) {
    console.error('Erro ao buscar leads:', err)
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
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 md:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto flex flex-col gap-6">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Gestão Comercial de Leads V2
          </h2>
          <p class="text-xs text-slate-400 mt-1">Isolamento rigoroso de registros técnicos e jornada completa de conversão</p>
        </div>

        <button 
          @click="fetchLeads" 
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
        >
          <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5" :class="isLoading ? 'animate-spin' : ''" />
          Atualizar
        </button>
      </div>

      <!-- Tab Switcher (Reais vs Histórico Técnico) -->
      <div class="flex items-center gap-3">
        <button 
          @click="handleTabChange('real')"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
          :class="activeTab === 'real' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:text-white'"
        >
          <Icon name="lucide:user-check" class="w-4 h-4" />
          Leads Comerciais Reais
          <span class="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {{ counts.real }}
          </span>
        </button>

        <button 
          @click="handleTabChange('technical_history')"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
          :class="activeTab === 'technical_history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:text-white'"
        >
          <Icon name="lucide:archive" class="w-4 h-4" />
          Histórico Técnico & Testes
          <span class="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {{ counts.legacy_synthetic + counts.automated_test + counts.manual_validation }}
          </span>
        </button>
      </div>

      <!-- Filters Row -->
      <div class="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white/[0.02] p-3 rounded-2xl border border-white/[0.04]">
        <!-- Search -->
        <div class="relative w-full sm:w-80">
          <Icon name="lucide:search" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nome, bairro, cidade, serviço..."
            class="w-full bg-slate-900 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <span class="text-xs text-slate-400 font-medium">Status:</span>
          <select 
            v-model="selectedStatusFilter" 
            class="bg-slate-900 border border-slate-700/60 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
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

      <!-- Leads Table -->
      <Card class="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow class="bg-white/[0.01]">
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
              :key="lead.id"
              class="cursor-pointer"
              @click="openLeadDetails(lead)"
            >
              <TableCell class="py-3.5 px-4">
                <p class="font-bold text-white text-sm">{{ lead.nome || 'Sem nome' }}</p>
                <p class="text-slate-400 text-[11px] mt-0.5">{{ lead.telefone || lead.email || '-' }}</p>
              </TableCell>

              <TableCell class="py-3.5 px-4">
                <span class="text-slate-200 font-medium">{{ lead.servico || 'Não especificado' }}</span>
              </TableCell>

              <TableCell class="py-3.5 px-4">
                <Badge variant="outline" class="text-[10px] font-semibold text-slate-300">
                  {{ lead.channel || lead.session_channel || 'direct' }}
                </Badge>
              </TableCell>

              <TableCell class="py-3.5 px-4 text-slate-400">
                {{ [lead.bairro, lead.cidade].filter(Boolean).join(', ') || '-' }}
              </TableCell>

              <TableCell class="py-3.5 px-4">
                <Badge :variant="statusBadgeVariant(lead.status || 'Novo')" class="uppercase tracking-wider">
                  {{ lead.status || 'Novo' }}
                </Badge>
              </TableCell>

              <TableCell class="py-3.5 px-4 text-right text-slate-400 font-medium tabular-nums">
                {{ formatDate(lead.created_at) }}
              </TableCell>

              <TableCell class="py-3.5 px-4 text-center" @click.stop>
                <button 
                  @click="openLeadDetails(lead)" 
                  class="p-2 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors"
                  title="Ver jornada e detalhes"
                >
                  <Icon name="lucide:eye" class="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>

            <TableRow v-else>
              <TableCell colspan="7" class="py-12 text-center text-slate-500">
                <Icon name="lucide:inbox" class="w-8 h-8 mx-auto mb-2 text-slate-700" />
                Nenhum lead encontrado com os filtros selecionados.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

    </div>

    <!-- Lead Journey Drawer -->
    <LeadJourneyDrawer 
      :lead-id="selectedLeadId"
      :is-open="isDrawerOpen"
      @close="isDrawerOpen = false"
      @updated="fetchLeads"
    />
  </div>
</template>
