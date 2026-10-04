<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { 
  WhatsappAttributionItem, 
  WhatsappAttributionsListResponse 
} from '~/types/adminWhatsappAttribution'
import { 
  getChannelLabel, 
  getChannelBadgeStyle, 
  CANONICAL_CHANNEL_OPTIONS 
} from '~/utils/channelDisplay'
import WhatsappAssignModal from './whatsapp/WhatsappAssignModal.vue'
import WhatsappDismissModal from './whatsapp/WhatsappDismissModal.vue'
import WhatsappQuickSearchModal from './whatsapp/WhatsappQuickSearchModal.vue'
import SessionJourneyDrawer from './whatsapp/SessionJourneyDrawer.vue'
import WhatsappAttributionCard from './whatsapp/WhatsappAttributionCard.vue'

const router = useRouter()

const loading = ref(false)
const attributions = ref<WhatsappAttributionItem[]>([])
const counts = ref({
  total: 0,
  unassigned: 0,
  lead_captured: 0,
  assigned: 0,
  dismissed: 0
})

const activeStatus = ref<string>('unassigned')
const activeChannel = ref<string>('all')
const searchQuery = ref('')
const page = ref(1)
const pageSize = 20

// Modais
const isAssignModalOpen = ref(false)
const isDismissModalOpen = ref(false)
const isQuickSearchOpen = ref(false)
const selectedAttribution = ref<WhatsappAttributionItem | null>(null)

// Drawer de Jornada
const isJourneyOpen = ref(false)
const journeySessionId = ref<string | null>(null)
const journeyShortCode = ref<string | null>(null)

// Notificação de Copiado
const copiedCode = ref<string | null>(null)

async function fetchAttributions() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (activeStatus.value !== 'all') {
      params.set('status', activeStatus.value)
    }
    if (activeChannel.value !== 'all') {
      params.set('channel', activeChannel.value)
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

watch([activeStatus, activeChannel, searchQuery], () => {
  page.value = 1
  fetchAttributions()
})

function copyText(val: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(val)
    copiedCode.value = val
    setTimeout(() => {
      copiedCode.value = null
    }, 2000)
  }
}

function handleCreateClient(item: WhatsappAttributionItem) {
  router.push(`/admin/clientes/novo?ref=${item.short_code}`)
}

function openAssignModal(item: WhatsappAttributionItem) {
  selectedAttribution.value = item
  isAssignModalOpen.value = true
}

function openDismissModal(item: WhatsappAttributionItem) {
  selectedAttribution.value = item
  isDismissModalOpen.value = true
}

function openJourney(item: WhatsappAttributionItem) {
  if (!item.session_id) return
  journeySessionId.value = item.session_id
  journeyShortCode.value = item.short_code
  isJourneyOpen.value = true
}

function formatDatetime(iso?: string | null): string {
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
    <!-- Header da Fila WhatsApp Neutra -->
    <div class="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900/50 to-emerald-950/30 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <Icon name="lucide:message-square" class="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-sm sm:text-base font-bold text-white">Fila de Atribuição WhatsApp (Multicanal)</h3>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              11 CANAIS
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            Conciliação entre referências WhatsApp e CRM para Google Ads, Meta, Instagram, Microsoft e Direto
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="isQuickSearchOpen = true"
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

    <!-- Cards de Contadores e Filtros por Status -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
      <button
        type="button"
        @click="activeStatus = 'lead_captured'"
        class="p-3.5 rounded-xl border text-left transition-all cursor-pointer"
        :class="activeStatus === 'lead_captured' 
          ? 'bg-teal-500/15 border-teal-500/40 shadow-sm shadow-teal-500/10' 
          : 'bg-slate-900/60 border-white/5 hover:border-white/15'"
      >
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>Lead Capturado</span>
          <span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
        </div>
        <div class="text-xl sm:text-2xl font-bold font-mono text-teal-300 mt-1">
          {{ counts.lead_captured || 0 }}
        </div>
        <span class="text-[10px] text-teal-400/80 mt-0.5 block">Nome e WhatsApp salvos</span>
      </button>

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
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
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
        <span class="text-[10px] text-emerald-400/80 mt-0.5 block">Conciliados com CRM</span>
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
        <span class="text-[10px] text-indigo-400/80 mt-0.5 block">Histórico total do filtro</span>
      </button>
    </div>

    <!-- Barra de Busca e Filtro de Canal -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div class="relative flex-1">
        <Icon name="lucide:search" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por código (ex: 8K3M7QFA), campanha ou página..."
          class="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      <!-- Filtro de Canal (Etapa 9) -->
      <div class="w-full sm:w-64">
        <select
          v-model="activeChannel"
          class="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
        >
          <option
            v-for="opt in CANONICAL_CHANNEL_OPTIONS"
            :key="opt.value"
            :value="opt.value"
            class="bg-slate-900 text-white"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Lista / Tabela de Atribuições -->
    <div class="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-slate-400 text-xs sm:text-sm flex items-center justify-center gap-2">
        <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-emerald-400" />
        <span>Carregando fila de atribuição multicanal...</span>
      </div>

      <div v-else-if="attributions.length === 0" class="p-10 text-center text-slate-500 text-xs sm:text-sm space-y-1">
        <Icon name="lucide:inbox" class="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p class="font-semibold text-slate-400">Nenhum clique de WhatsApp encontrado para este filtro</p>
        <p class="text-[11px] text-slate-600">Novos cliques no site gerarão referências automaticamente.</p>
      </div>

      <div v-else class="p-4 sm:p-5 space-y-3">
        <WhatsappAttributionCard
          v-for="item in attributions"
          :key="item.id"
          :item="item"
          :copied-code="copiedCode"
          @copy-code="copyText"
          @view-journey="openJourney"
          @create-client="handleCreateClient"
          @open-assign="openAssignModal"
          @open-dismiss="openDismissModal"
        />
      </div>
    </div>

    <!-- Modais Extraídos Cirurgicamente -->
    <WhatsappAssignModal
      :is-open="isAssignModalOpen"
      :attribution="selectedAttribution"
      @close="isAssignModalOpen = false"
      @assigned="fetchAttributions"
    />

    <WhatsappDismissModal
      :is-open="isDismissModalOpen"
      :attribution="selectedAttribution"
      @close="isDismissModalOpen = false"
      @dismissed="fetchAttributions"
    />

    <WhatsappQuickSearchModal
      :is-open="isQuickSearchOpen"
      @close="isQuickSearchOpen = false"
      @create-client="handleCreateClient"
    />

    <SessionJourneyDrawer
      :is-open="isJourneyOpen"
      :session-id="journeySessionId"
      :short-code="journeyShortCode"
      @close="isJourneyOpen = false"
    />
  </div>
</template>
