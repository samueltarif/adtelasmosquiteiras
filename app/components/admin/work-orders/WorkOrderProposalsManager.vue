<script setup lang="ts">
import { ref, onMounted } from 'vue'
import WorkOrderProposalModal from './WorkOrderProposalModal.vue'
import WorkOrderProposalAcceptModal from './WorkOrderProposalAcceptModal.vue'

const props = defineProps<{
  workOrderId: string
  workOrder: any
}>()

const emit = defineEmits<{
  (e: 'work-order-updated', updatedWo: any): void
}>()

const proposals = ref<any[]>([])
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

const isProposalModalOpen = ref(false)
const isAcceptModalOpen = ref(false)
const selectedProposalForAccept = ref<any | null>(null)

async function fetchProposals() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}/proposals`)
    if (res?.proposals) {
      proposals.value = res.proposals
    }
  } catch (err: any) {
    console.error('[ProposalsManager] Falha ao carregar orçamentos')
    errorMessage.value = err?.data?.message || err?.message || 'Falha ao carregar histórico de orçamentos.'
  } finally {
    isLoading.value = false
  }
}

async function handleViewPdf(proposalId: string) {
  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}/proposals/${proposalId}/signed-url`)
    if (res?.signedUrl) {
      window.open(res.signedUrl, '_blank')
    }
  } catch (err: any) {
    console.error('[ProposalsManager] Falha ao gerar link de visualização')
    alert(err?.data?.message || err?.message || 'Falha ao abrir documento PDF.')
  }
}

async function handleDownloadPdf(proposal: any) {
  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}/proposals/${proposal.id}/signed-url`)
    if (res?.signedUrl) {
      const a = document.createElement('a')
      a.href = res.signedUrl
      a.download = `orcamento-${props.workOrder?.numero_os || 'os'}-${proposal.versionLabel || 'rev'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  } catch (err: any) {
    console.error('[ProposalsManager] Falha no download do PDF')
    alert(err?.data?.message || err?.message || 'Falha ao baixar documento PDF.')
  }
}

function openAcceptModal(proposal: any) {
  selectedProposalForAccept.value = proposal
  isAcceptModalOpen.value = true
}

function handleProposalIssued(newProposal: any) {
  fetchProposals()
}

function handleProposalAccepted(result: any) {
  fetchProposals()
  if (result) {
    emit('work-order-updated', {
      status_os: 'aprovada',
      accepted_proposal_id: result.proposal_id,
      updated_at: result.wo_updated_at || new Date().toISOString()
    })
  }
}

function formatDate(iso?: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatBytes(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

onMounted(() => {
  fetchProposals()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header da Aba de Orçamentos -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-white/10 bg-slate-900/60 shadow-lg">
      <div>
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Icon name="lucide:file-signature" class="w-4 h-4 text-indigo-400" />
          <span>Orçamentos Comerciais & Revisões</span>
        </h3>
        <p class="text-xs text-slate-400 mt-1">
          Emissão oficial em PDF, versionamento imutável e controle de aceite do cliente
        </p>
      </div>

      <!-- Botão de Ação Primária -->
      <button
        v-if="workOrder?.status_os === 'orcamento'"
        @click="isProposalModalOpen = true"
        class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
      >
        <Icon name="lucide:plus-circle" class="w-4 h-4" />
        <span>{{ proposals.length === 0 ? 'Gerar Orçamento' : 'Emitir Nova Revisão' }}</span>
      </button>

      <div v-else class="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
        <span>Novas revisões só podem ser geradas quando a OS está em <strong>Orçamento</strong>.</span>
      </div>
    </div>

    <!-- Feedback de Erro -->
    <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
      {{ errorMessage }}
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
      <span>Carregando histórico de orçamentos...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="proposals.length === 0"
      class="rounded-2xl border border-dashed border-white/10 bg-slate-900/30 p-12 text-center space-y-3"
    >
      <div class="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
        <Icon name="lucide:file-text" class="w-6 h-6" />
      </div>
      <h4 class="text-sm font-semibold text-white">Nenhum orçamento emitido ainda</h4>
      <p class="text-xs text-slate-400 max-w-md mx-auto">
        Configure os prazos e condições comerciais para gerar o documento PDF oficial da OS {{ workOrder?.numero_os }}.
      </p>
      <button
        v-if="workOrder?.status_os === 'orcamento'"
        @click="isProposalModalOpen = true"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer min-h-[44px] mt-2"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        <span>Gerar Primeiro Orçamento</span>
      </button>
    </div>

    <!-- Lista de Revisões -->
    <div v-else class="space-y-4">
      <div
        v-for="prop in proposals"
        :key="prop.id"
        class="rounded-2xl border transition-all p-5 shadow-lg space-y-4"
        :class="prop.isAccepted ? 'border-emerald-500/30 bg-emerald-950/10' : prop.status === 'issued' ? 'border-indigo-500/30 bg-slate-900/80' : 'border-white/10 bg-slate-900/50 opacity-90'"
      >
        <!-- Header da Revisão -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs"
              :class="prop.isAccepted ? 'bg-emerald-500/20 text-emerald-300' : prop.status === 'issued' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'"
            >
              {{ prop.versionLabel }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold text-white">{{ prop.versionLabel }}</h4>

                <!-- Badge de Estado -->
                <span
                  v-if="prop.isAccepted"
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                >
                  <Icon name="lucide:check-circle" class="w-3 h-3" />
                  <span>Aprovada pelo Cliente</span>
                </span>
                <span
                  v-else-if="prop.status === 'issued'"
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                >
                  Emitida / Vigente
                </span>
                <span
                  v-else-if="prop.status === 'superseded'"
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700"
                >
                  Substituída
                </span>
                <span
                  v-else-if="prop.generationStatus === 'failed'"
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30"
                >
                  Falha na Geração
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                Emitida em {{ formatDate(prop.issuedAt || prop.createdAt) }}
                <span v-if="prop.validUntil">• Válida até {{ formatDate(prop.validUntil) }}</span>
                <span v-if="prop.pdfSizeBytes">• {{ formatBytes(prop.pdfSizeBytes) }}</span>
              </p>
            </div>
          </div>

          <!-- Ações da Revisão -->
          <div class="flex items-center gap-2 self-end sm:self-center">
            <!-- Botão Aprovar (apenas em issued e com OS em orcamento) -->
            <button
              v-if="prop.status === 'issued' && workOrder?.status_os === 'orcamento'"
              @click="openAcceptModal(prop)"
              class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer min-h-[44px]"
            >
              <Icon name="lucide:check" class="w-4 h-4" />
              <span>Aprovar</span>
            </button>

            <!-- Botão Visualizar PDF -->
            <button
              v-if="prop.hasPdf"
              @click="handleViewPdf(prop.id)"
              class="px-3 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
            >
              <Icon name="lucide:eye" class="w-4 h-4 text-indigo-400" />
              <span>Visualizar</span>
            </button>

            <!-- Botão Baixar PDF -->
            <button
              v-if="prop.hasPdf"
              @click="handleDownloadPdf(prop)"
              class="px-3 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
            >
              <Icon name="lucide:download" class="w-4 h-4 text-slate-400" />
              <span>Baixar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modais -->
    <WorkOrderProposalModal
      :is-open="isProposalModalOpen"
      :work-order-id="workOrderId"
      :work-order="workOrder"
      :is-first-revision="proposals.length === 0"
      @close="isProposalModalOpen = false"
      @proposal-issued="handleProposalIssued"
    />

    <WorkOrderProposalAcceptModal
      :is-open="isAcceptModalOpen"
      :work-order-id="workOrderId"
      :work-order="workOrder"
      :proposal="selectedProposalForAccept"
      @close="isAcceptModalOpen = false"
      @proposal-accepted="handleProposalAccepted"
    />
  </div>
</template>
