<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { CampaignKpiEntry, CampaignKpiPayload } from '../../../types/campaignKpi'
import CampaignKpiForm from './CampaignKpiForm.vue'
import CampaignKpiCards from './CampaignKpiCards.vue'
import CampaignKpiFunnel from './CampaignKpiFunnel.vue'
import CampaignTrackingComparison from './CampaignTrackingComparison.vue'
import CampaignKpiHistory from './CampaignKpiHistory.vue'
import CampaignMultiComparison from './CampaignMultiComparison.vue'
import CampaignActivationChecklist from './CampaignActivationChecklist.vue'

type ViewMode = 'history' | 'detail' | 'form' | 'compare' | 'checklist'

const viewMode = ref<ViewMode>('history')
const entries = ref<CampaignKpiEntry[]>([])
const selectedEntry = ref<CampaignKpiEntry | null>(null)
const editingEntry = ref<CampaignKpiEntry | null>(null)
const loading = ref(false)
const saving = ref(false)
const message = ref('')

async function fetchEntries() {
  loading.value = true
  try {
    const res = await $fetch<{ data: CampaignKpiEntry[] }>('/api/admin/marketing/campaign-kpis')
    entries.value = Array.isArray(res.data) ? res.data : []
    if (selectedEntry.value) {
      const updated = entries.value.find(e => e.id === selectedEntry.value!.id)
      selectedEntry.value = updated || selectedEntry.value
    }
  } catch (err: any) {
    message.value = 'Erro ao carregar campanhas.'
  } finally {
    loading.value = false
  }
}

function handleSelect(entry: CampaignKpiEntry) {
  selectedEntry.value = entry
  viewMode.value = 'detail'
}

function handleCreateNew() {
  editingEntry.value = null
  viewMode.value = 'form'
}

function handleEdit(entry: CampaignKpiEntry) {
  editingEntry.value = entry
  viewMode.value = 'form'
}

async function handleDelete(id: string) {
  if (!confirm('Deseja realmente remover esta entrada de campanha?')) return
  try {
    await $fetch(`/api/admin/marketing/campaign-kpis/${id}`, { method: 'DELETE' })
    message.value = 'Campanha excluída com sucesso.'
    if (selectedEntry.value?.id === id) {
      selectedEntry.value = null
      viewMode.value = 'history'
    }
    await fetchEntries()
  } catch {
    message.value = 'Erro ao excluir campanha.'
  }
}

async function handleFormSubmit(payload: CampaignKpiPayload) {
  saving.value = true
  message.value = ''
  try {
    if (editingEntry.value?.id) {
      const res = await $fetch<{ data: CampaignKpiEntry }>(
        `/api/admin/marketing/campaign-kpis/${editingEntry.value.id}`,
        { method: 'PUT', body: payload }
      )
      selectedEntry.value = res.data
      message.value = 'Campanha atualizada com sucesso!'
    } else {
      const res = await $fetch<{ data: CampaignKpiEntry }>(
        '/api/admin/marketing/campaign-kpis',
        { method: 'POST', body: payload }
      )
      selectedEntry.value = res.data
      message.value = 'Campanha criada com sucesso!'
    }
    await fetchEntries()
    viewMode.value = 'detail'
  } catch (err: any) {
    message.value = err?.data?.message || 'Erro ao salvar campanha.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchEntries()
})
</script>

<template>
  <div class="flex flex-col gap-6 w-full max-w-full min-w-0">

    <!-- Top Navigation Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
      <div>
        <h2 class="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
          <Icon name="lucide:line-chart" class="w-5 h-5 text-indigo-400" />
          <span>Gestão de Campanhas & KPIs</span>
        </h2>
        <p class="text-xs text-slate-400 mt-0.5">
          Acompanhamento manual de resultados, análise de metas e comparação com tracking proprietário
        </p>
      </div>

      <!-- Action buttons / Subtab switcher -->
      <div class="flex items-center gap-2 flex-wrap">
        <button
          @click="viewMode = 'history'"
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
          :class="viewMode === 'history' || viewMode === 'detail'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
            : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'"
        >
          <Icon name="lucide:list" class="w-3.5 h-3.5" />
          <span>Campanhas</span>
        </button>

        <button
          @click="handleCreateNew"
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
          :class="viewMode === 'form' && !editingEntry
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
            : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'"
        >
          <Icon name="lucide:plus" class="w-3.5 h-3.5" />
          <span>Nova Entrada</span>
        </button>

        <button
          @click="viewMode = 'compare'"
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
          :class="viewMode === 'compare'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
            : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'"
        >
          <Icon name="lucide:git-compare" class="w-3.5 h-3.5" />
          <span>Comparar</span>
        </button>

        <button
          @click="viewMode = 'checklist'"
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
          :class="viewMode === 'checklist'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
            : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'"
        >
          <Icon name="lucide:check-circle" class="w-3.5 h-3.5 text-cyan-400" />
          <span>Ativação Real (7A)</span>
        </button>
      </div>
    </div>

    <!-- Alert / Toast Banner -->
    <div
      v-if="message"
      class="p-3 rounded-xl text-xs flex items-center justify-between border transition-all"
      :class="message.includes('sucesso')
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
        : 'bg-rose-500/10 border-rose-500/20 text-rose-300'"
    >
      <span>{{ message }}</span>
      <button @click="message = ''" class="text-slate-400 hover:text-white ml-2 text-sm">&times;</button>
    </div>

    <!-- VIEW 1: HISTORY (List) -->
    <div v-if="viewMode === 'history'" class="flex flex-col gap-4">
      <CampaignKpiHistory
        :entries="entries"
        :loading="loading"
        @select="handleSelect"
        @delete="handleDelete"
      />
    </div>

    <!-- VIEW 2: DETAIL -->
    <div v-else-if="viewMode === 'detail' && selectedEntry" class="flex flex-col gap-6">
      <div class="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/5 border border-white/10 flex-wrap">
        <button
          @click="viewMode = 'history'"
          type="button"
          class="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-all"
        >
          <Icon name="lucide:arrow-left" class="w-3.5 h-3.5" />
          <span>Voltar para lista</span>
        </button>

        <div class="flex items-center gap-2">
          <button
            @click="handleEdit(selectedEntry)"
            type="button"
            class="px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-all flex items-center gap-1"
          >
            <Icon name="lucide:edit-2" class="w-3 h-3" />
            <span>Editar</span>
          </button>
          <button
            @click="handleDelete(selectedEntry.id)"
            type="button"
            class="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1"
          >
            <Icon name="lucide:trash-2" class="w-3 h-3" />
            <span>Excluir</span>
          </button>
        </div>
      </div>

      <!-- Cards de KPIs e Metas -->
      <CampaignKpiCards :entry="selectedEntry" />

      <!-- Funil da Campanha -->
      <CampaignKpiFunnel :entry="selectedEntry" />

      <!-- Comparação Plataforma vs Tracking Proprietário -->
      <CampaignTrackingComparison :entry="selectedEntry" />
    </div>

    <!-- VIEW 3: FORM (Create/Edit) -->
    <div v-else-if="viewMode === 'form'" class="flex flex-col gap-4">
      <CampaignKpiForm
        :entry="editingEntry"
        :loading="saving"
        @submit="handleFormSubmit"
        @cancel="viewMode = selectedEntry ? 'detail' : 'history'"
      />
    </div>

    <!-- VIEW 4: MULTI-CAMPAIGN COMPARISON -->
    <div v-else-if="viewMode === 'compare'" class="flex flex-col gap-4">
      <CampaignMultiComparison :entries="entries" />
    </div>

    <!-- VIEW 5: ACTIVATION CHECKLIST (FASE 7A) -->
    <div v-else-if="viewMode === 'checklist'" class="flex flex-col gap-4">
      <CampaignActivationChecklist />
    </div>

  </div>
</template>
