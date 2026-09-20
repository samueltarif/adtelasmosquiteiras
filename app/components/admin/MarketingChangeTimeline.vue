<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMarketingChangeLog } from '../../composables/useMarketingChangeLog'
import Card from '../ui/card/Card.vue'
import Badge from '../ui/badge/Badge.vue'
import MarketingChangeModal from './MarketingChangeModal.vue'

const {
  items,
  isLoading,
  isSaving,
  error,
  selectedScope,
  selectedType,
  selectedStatus,
  fetchChanges,
  createChange,
  archiveChange
} = useMarketingChangeLog()

const isModalOpen = ref(false)
const expandedItems = ref<Set<string>>(new Set())

function toggleExpand(id: string) {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id)
  } else {
    expandedItems.value.add(id)
  }
}

function formatIsoToSp(isoStr?: string) {
  if (!isoStr) return '-'
  try {
    const d = new Date(isoStr)
    return d.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return isoStr
  }
}

function getChangeTypeIcon(type: string) {
  switch (type) {
    case 'landing_page': return 'lucide:layout-template'
    case 'url_suffix': return 'lucide:link'
    case 'tracking': return 'lucide:target'
    case 'negative_keyword': return 'lucide:shield-alert'
    case 'keyword': return 'lucide:key'
    case 'ad_copy': return 'lucide:edit-3'
    case 'budget': return 'lucide:dollar-sign'
    case 'bid': return 'lucide:trending-up'
    case 'sitelink': return 'lucide:external-link'
    case 'conversion': return 'lucide:check-circle'
    default: return 'lucide:clipboard-list'
  }
}

function getChangeTypeColor(type: string) {
  switch (type) {
    case 'landing_page': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    case 'url_suffix': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    case 'tracking': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    case 'negative_keyword': return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    case 'keyword': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    case 'ad_copy': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    case 'budget': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    case 'bid': return 'text-violet-400 bg-violet-500/10 border-violet-500/20'
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  }
}

function getChangeTypeLabel(type: string) {
  const map: Record<string, string> = {
    landing_page: 'Landing Page',
    url_suffix: 'Sufixo de URL',
    tracking: 'Rastreamento',
    negative_keyword: 'Palavras Negativas',
    keyword: 'Palavras-chave',
    ad_copy: 'Anúncio / Copy',
    budget: 'Orçamento',
    bid: 'Lances',
    sitelink: 'Recursos / Sitelinks',
    conversion: 'Conversão',
    campaign_setting: 'Configuração',
    other: 'Anotação Geral'
  }
  return map[type] || type
}

async function handleSave(payload: any) {
  const ok = await createChange(payload)
  if (ok) {
    isModalOpen.value = false
  }
}

async function handleArchive(id: string) {
  if (confirm('Deseja arquivar este registro de alteração?')) {
    await archiveChange(id)
  }
}

onMounted(() => {
  fetchChanges()
})
</script>

<template>
  <Card class="p-5 sm:p-6 flex flex-col gap-6 border border-indigo-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/20 shadow-xl">
    
    <!-- CABEÇALHO DA TIMELINE -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
      <div>
        <div class="flex items-center gap-2.5 flex-wrap">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Icon name="lucide:history" class="w-4 h-4" />
          </div>
          <h3 class="text-sm sm:text-base font-bold text-white tracking-tight">
            Histórico de Alterações de Marketing
          </h3>
          <Badge variant="outline" class="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 text-[10px] font-mono">
            {{ items.length }} {{ items.length === 1 ? 'registro' : 'registros' }}
          </Badge>
        </div>
        <p class="text-xs text-slate-400 mt-1">
          Anotações cronológicas de mudanças em campanhas, palavras-chave, URLs e anúncios
        </p>
      </div>

      <button
        type="button"
        @click="isModalOpen = true"
        class="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition-all active:scale-95 shrink-0"
      >
        <Icon name="lucide:plus" class="w-3.5 h-3.5" />
        <span>Registrar Alteração</span>
      </button>
    </div>

    <!-- BARRA DE FILTROS RÁPIDOS -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
      <!-- Filtro de Escopo (Tabs) -->
      <div class="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/10 overflow-x-auto">
        <button
          v-for="sc in [
            { id: 'all', label: 'Todos' },
            { id: 'landing', label: 'Landing' },
            { id: 'campaign', label: 'Campanha' },
            { id: 'tracking', label: 'Tracking' }
          ]"
          :key="sc.id"
          type="button"
          @click="selectedScope = sc.id"
          class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap"
          :class="selectedScope === sc.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'"
        >
          {{ sc.label }}
        </button>
      </div>

      <!-- Filtro de Tipo e Status -->
      <div class="flex items-center gap-2">
        <select
          v-model="selectedType"
          class="bg-slate-950/60 border border-white/10 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">Todos os Tipos</option>
          <option value="landing_page">Landing Page</option>
          <option value="url_suffix">Sufixo de URL</option>
          <option value="tracking">Rastreamento</option>
          <option value="negative_keyword">Palavras Negativas</option>
          <option value="keyword">Palavras-chave</option>
          <option value="ad_copy">Anúncio / Copy</option>
          <option value="budget">Orçamento</option>
          <option value="other">Outros</option>
        </select>

        <select
          v-model="selectedStatus"
          class="bg-slate-950/60 border border-white/10 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="active">Ativos</option>
          <option value="archived">Arquivados</option>
          <option value="all">Todos</option>
        </select>
      </div>
    </div>

    <!-- FEED CRONOLÓGICO (TIMELINE VERTICAL) -->
    <div v-if="isLoading" class="flex flex-col gap-4 animate-pulse">
      <div v-for="i in 3" :key="i" class="h-20 bg-white/[0.03] rounded-xl"></div>
    </div>

    <div v-else-if="items.length > 0" class="relative pl-6 sm:pl-8 flex flex-col gap-5 border-l border-indigo-500/20 ml-2 sm:ml-3 my-2">
      <div
        v-for="item in items"
        :key="item.id"
        class="relative flex flex-col gap-2 group"
      >
        <!-- Marcador Circular da Timeline -->
        <div
          class="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center border shadow-md"
          :class="getChangeTypeColor(item.change_type)"
        >
          <Icon :name="getChangeTypeIcon(item.change_type)" class="w-3 h-3" />
        </div>

        <!-- Conteúdo do Item -->
        <div class="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/30 transition-all flex flex-col gap-2.5">
          
          <!-- Linha Superior: Data/Hora, Badges e Ações -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-mono font-bold text-white">
                {{ formatIsoToSp(item.occurred_at) }}
              </span>
              <Badge variant="outline" :class="getChangeTypeColor(item.change_type)" class="text-[10px] font-semibold">
                {{ getChangeTypeLabel(item.change_type) }}
              </Badge>
              <span
                v-if="item.entry_source === 'migration'"
                class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                title="Registro inicial com evidência comprovada no banco"
              >
                EVIDÊNCIA
              </span>
              <span
                v-else
                class="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20"
              >
                MANUAL
              </span>
            </div>

            <div class="flex items-center gap-2 text-xs self-end sm:self-auto">
              <button
                v-if="item.status === 'active'"
                @click="handleArchive(item.id)"
                class="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                title="Arquivar anotação"
              >
                Arquivar
              </button>
            </div>
          </div>

          <!-- Título e Descrição -->
          <div>
            <h4 class="text-xs sm:text-sm font-bold text-slate-100">
              {{ item.title }}
            </h4>
            <p v-if="item.description" class="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-line">
              {{ item.description }}
            </p>
          </div>

          <!-- Metadados de Campanha, Landing e Autoria -->
          <div class="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap pt-1 border-t border-white/5">
            <span v-if="item.campaign_name" class="flex items-center gap-1 text-indigo-300">
              <Icon name="lucide:target" class="w-3 h-3 text-indigo-400" />
              <span>{{ item.campaign_name }}</span>
            </span>

            <span v-if="item.landing_path" class="flex items-center gap-1 font-mono text-slate-400">
              <Icon name="lucide:layout" class="w-3 h-3 text-slate-500" />
              <span>{{ item.landing_path }}</span>
            </span>

            <span class="text-slate-500 ml-auto text-[10px]">
              {{ item.created_by_email_snapshot ? `Registrado por ${item.created_by_email_snapshot}` : 'Sistema' }}
            </span>
          </div>

          <!-- Seção Expansível "Ver Detalhes" para Valores Anteriores/Novos -->
          <div v-if="item.previous_value || item.new_value" class="pt-1">
            <button
              type="button"
              @click="toggleExpand(item.id)"
              class="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>{{ expandedItems.has(item.id) ? 'Ocultar detalhes' : 'Ver detalhes da alteração' }}</span>
              <Icon :name="expandedItems.has(item.id) ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="w-3 h-3" />
            </button>

            <div v-if="expandedItems.has(item.id)" class="mt-2 p-3 rounded-lg bg-slate-950/70 border border-white/5 text-[11px] font-mono grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div v-if="item.previous_value">
                <span class="text-slate-500 uppercase text-[9px] block">Valor Anterior</span>
                <pre class="text-slate-300 mt-0.5 whitespace-pre-wrap break-all">{{ JSON.stringify(item.previous_value, null, 2) }}</pre>
              </div>

              <div v-if="item.new_value">
                <span class="text-indigo-400 uppercase text-[9px] block">Novo Valor</span>
                <pre class="text-emerald-300 mt-0.5 whitespace-pre-wrap break-all">{{ JSON.stringify(item.new_value, null, 2) }}</pre>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Estado Vazio -->
    <div v-else class="text-center py-8 text-xs text-slate-500 flex flex-col items-center gap-2">
      <Icon name="lucide:clipboard-x" class="w-6 h-6 text-slate-600" />
      <span>Nenhuma alteração encontrada com os filtros selecionados.</span>
    </div>

    <!-- Modal de Nova Alteração -->
    <MarketingChangeModal
      :is-open="isModalOpen"
      :is-saving="isSaving"
      @close="isModalOpen = false"
      @save="handleSave"
    />

  </Card>
</template>
