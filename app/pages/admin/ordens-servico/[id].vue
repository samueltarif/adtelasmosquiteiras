<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WorkOrderHeader from '~/components/admin/work-orders/WorkOrderHeader.vue'
import WorkOrderStatusModal from '~/components/admin/work-orders/WorkOrderStatusModal.vue'
import WorkOrderGeneralEditModal from '~/components/admin/work-orders/WorkOrderGeneralEditModal.vue'
import WorkOrderArchiveModal from '~/components/admin/work-orders/WorkOrderArchiveModal.vue'
import WorkOrderItemsManager from '~/components/admin/work-orders/WorkOrderItemsManager.vue'
import WorkOrderProposalsManager from '~/components/admin/work-orders/WorkOrderProposalsManager.vue'
import WorkOrderMediaUploader from '~/components/admin/work-orders/WorkOrderMediaUploader.vue'
import WorkOrderMediaGallery from '~/components/admin/work-orders/WorkOrderMediaGallery.vue'
import WorkOrderNotesManager from '~/components/admin/work-orders/WorkOrderNotesManager.vue'
import WorkOrderActivityTimeline from '~/components/admin/work-orders/WorkOrderActivityTimeline.vue'
import WorkOrderAppointmentsSection from '~/components/admin/work-orders/WorkOrderAppointmentsSection.vue'
import { formatDateOnly } from '~/utils/crmDateTime'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const workOrderId = route.params.id as string

const workOrder = ref<any | null>(null)
const items = ref<any[]>([])
const media = ref<any[]>([])

const isLoading = ref(true)
const isItemsLoading = ref(false)
const isMediaLoading = ref(false)
const errorMessage = ref<string | null>(null)

const activeTab = ref<'geral' | 'itens' | 'orcamentos' | 'midias' | 'notas' | 'agendamentos' | 'historico'>('geral')

const isStatusModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isArchiveModalOpen = ref(false)

async function fetchWorkOrder() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${workOrderId}`)
    if (res?.workOrder) {
      workOrder.value = res.workOrder
      await Promise.all([
        fetchItems(),
        fetchMedia()
      ])
    } else {
      errorMessage.value = 'Ordem de serviço não encontrada.'
    }
  } catch (err: any) {
    console.error('[WorkOrderDetailPage] Falha ao carregar OS')
    errorMessage.value = err?.data?.message || err?.message || 'Erro ao carregar dados da ordem de serviço.'
  } finally {
    isLoading.value = false
  }
}

async function fetchItems() {
  isItemsLoading.value = true
  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${workOrderId}/items`)
    items.value = res?.items || []
  } catch (err) {
    console.error('[WorkOrderDetailPage] Falha ao carregar itens')
  } finally {
    isItemsLoading.value = false
  }
}

async function fetchMedia() {
  isMediaLoading.value = true
  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${workOrderId}/media`)
    media.value = res?.media || []
  } catch (err) {
    console.error('[WorkOrderDetailPage] Falha ao carregar mídias')
  } finally {
    isMediaLoading.value = false
  }
}

function handleStatusUpdated(updatedWo: any) {
  workOrder.value = {
    ...workOrder.value,
    ...updatedWo
  }
}

function handleWorkOrderUpdated(updatedWo: any) {
  workOrder.value = {
    ...workOrder.value,
    ...updatedWo
  }
}

function handleTotalsUpdated(totals: any) {
  if (workOrder.value && totals) {
    workOrder.value.valor_total = totals.valor_total
    workOrder.value.valor_desconto = totals.valor_desconto
    workOrder.value.valor_final = totals.valor_final
    if (totals.updated_at) {
      workOrder.value.updated_at = totals.updated_at
    }
  }
}

function handleArchiveUpdated(isArchived: boolean) {
  if (workOrder.value) {
    workOrder.value.is_archived = isArchived
  }
}

function formatDate(iso?: string | null) {
  return formatDateOnly(iso)
}

function formatCurrency(val?: number | string | null) {
  const num = typeof val === 'number' ? val : parseFloat(String(val || 0))
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(num) ? 0 : num)
}

onMounted(() => {
  fetchWorkOrder()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Feedback de Erro -->
    <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
      {{ errorMessage }}
    </div>

    <!-- Loading Inicial -->
    <div v-if="isLoading" class="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
      <span>Carregando ordem de serviço...</span>
    </div>

    <div v-else-if="workOrder" class="space-y-6">
      <!-- Header Executivo -->
      <WorkOrderHeader
        :work-order="workOrder"
        @open-status-modal="isStatusModalOpen = true"
        @open-edit-modal="isEditModalOpen = true"
        @open-archive-modal="isArchiveModalOpen = true"
      />

      <!-- Navegação por Abas -->
      <div class="flex items-center gap-2 overflow-x-auto border-b border-white/10 pb-1">
        <button
          @click="activeTab = 'geral'"
          class="px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          :class="activeTab === 'geral' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:file-text" class="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          @click="activeTab = 'itens'"
          class="px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          :class="activeTab === 'itens' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:package" class="w-4 h-4" />
          <span>Itens & Medições ({{ items.length }})</span>
        </button>

        <button
          @click="activeTab = 'orcamentos'"
          class="px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          :class="activeTab === 'orcamentos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:file-signature" class="w-4 h-4" />
          <span>Orçamentos</span>
        </button>

        <button
          @click="activeTab = 'midias'"
          class="px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          :class="activeTab === 'midias' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:image" class="w-4 h-4" />
          <span>Mídias Técnicas ({{ media.length }})</span>
        </button>

        <button
          @click="activeTab = 'notas'"
          class="px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          :class="activeTab === 'notas' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:sticky-note" class="w-4 h-4" />
          <span>Anotações</span>
        </button>

        <button
          @click="activeTab = 'agendamentos'"
          class="px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          :class="activeTab === 'agendamentos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:calendar" class="w-4 h-4" />
          <span>Agendamentos</span>
        </button>

        <button
          @click="activeTab = 'historico'"
          class="px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          :class="activeTab === 'historico' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:history" class="w-4 h-4" />
          <span>Histórico</span>
        </button>
      </div>

      <!-- Conteúdo da Aba Ativa -->
      <div>
        <!-- 1. Aba Visão Geral -->
        <div v-if="activeTab === 'geral'" class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <!-- Card Cliente e Local -->
          <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-5 shadow-lg space-y-4">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Icon name="lucide:user" class="w-4 h-4 text-indigo-400" />
              <span>Cliente & Local de Atendimento</span>
            </h3>

            <div class="space-y-3 text-xs">
              <div>
                <span class="text-slate-500 block">Nome do Cliente:</span>
                <NuxtLink :to="`/admin/clientes/${workOrder.client_id}`" class="font-bold text-indigo-400 hover:underline">
                  {{ workOrder.client?.nome }}
                </NuxtLink>
              </div>

              <div>
                <span class="text-slate-500 block">Telefone:</span>
                <span class="font-medium text-white">{{ workOrder.client?.telefone_principal || '-' }}</span>
              </div>

              <div>
                <span class="text-slate-500 block">Endereço da Instalação:</span>
                <p v-if="workOrder.address" class="text-slate-200 font-medium">
                  {{ workOrder.address.logradouro }}, {{ workOrder.address.numero }}
                  <span v-if="workOrder.address.complemento">({{ workOrder.address.complemento }})</span><br />
                  {{ workOrder.address.bairro }} - {{ workOrder.address.cidade }}/{{ workOrder.address.uf }}
                  <span v-if="workOrder.address.cep" class="text-slate-400 block">CEP: {{ workOrder.address.cep }}</span>
                </p>
                <p v-else class="text-slate-500">Nenhum endereço vinculado a esta OS.</p>
              </div>
            </div>
          </div>

          <!-- Card Dados Operacionais e Financeiros -->
          <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-5 shadow-lg space-y-4">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Icon name="lucide:info" class="w-4 h-4 text-indigo-400" />
              <span>Programação & Totais</span>
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span class="text-slate-500 block">Responsável Técnico:</span>
                <span class="font-medium text-white">{{ workOrder.responsible?.nome || 'Não atribuído' }}</span>
              </div>

              <div>
                <span class="text-slate-500 block">Data Prevista:</span>
                <span class="font-medium text-white">{{ formatDate(workOrder.data_prevista) }}</span>
              </div>

              <div>
                <span class="text-slate-500 block">Data de Conclusão:</span>
                <span class="font-medium text-white">{{ formatDate(workOrder.data_conclusao) }}</span>
              </div>

              <div>
                <span class="text-slate-500 block">Status da OS:</span>
                <span class="font-bold uppercase tracking-wider text-indigo-400">{{ workOrder.status_os }}</span>
              </div>
            </div>

            <!-- Resumo Financeiro -->
            <div class="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div class="p-2.5 rounded-xl bg-slate-800/60 border border-white/5">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Subtotal</span>
                <span class="font-semibold text-white">{{ formatCurrency(workOrder.valor_total) }}</span>
              </div>

              <div class="p-2.5 rounded-xl bg-slate-800/60 border border-white/5">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Desconto</span>
                <span class="font-semibold text-red-400">{{ formatCurrency(workOrder.valor_desconto) }}</span>
              </div>

              <div class="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                <span class="text-indigo-400 block text-[10px] uppercase font-bold">Valor Final</span>
                <span class="font-bold text-white">{{ formatCurrency(workOrder.valor_final) }}</span>
              </div>
            </div>

            <!-- Observações Gerais -->
            <div v-if="workOrder.observacoes_gerais" class="pt-3 border-t border-white/5 space-y-1">
              <span class="text-xs text-slate-500 block font-medium">Observações Gerais:</span>
              <p class="text-xs text-slate-300 whitespace-pre-wrap">{{ workOrder.observacoes_gerais }}</p>
            </div>
          </div>
        </div>

        <!-- 2. Aba Itens & Medições -->
        <div v-else-if="activeTab === 'itens'">
          <WorkOrderItemsManager
            :work-order-id="workOrderId"
            :work-order-status="workOrder.status_os"
            :work-order-totals="{
              valor_total: workOrder.valor_total,
              valor_desconto: workOrder.valor_desconto,
              valor_final: workOrder.valor_final
            }"
            :items="items"
            :is-loading="isItemsLoading"
            @items-changed="fetchItems"
            @totals-updated="handleTotalsUpdated"
          />
        </div>

        <!-- 3. Aba Orçamentos & Revisões -->
        <div v-else-if="activeTab === 'orcamentos'">
          <WorkOrderProposalsManager
            :work-order-id="workOrderId"
            :work-order="workOrder"
            @work-order-updated="handleWorkOrderUpdated"
          />
        </div>

        <!-- 4. Aba Mídias Técnicas -->
        <div v-else-if="activeTab === 'midias'" class="space-y-6">
          <WorkOrderMediaUploader
            :work-order-id="workOrderId"
            :items="items"
            @upload-complete="fetchMedia"
          />

          <WorkOrderMediaGallery
            :work-order-id="workOrderId"
            :media="media"
            :items="items"
            :is-loading="isMediaLoading"
            @media-changed="fetchMedia"
          />
        </div>

        <!-- 5. Aba Anotações Internas -->
        <div v-else-if="activeTab === 'notas'">
          <WorkOrderNotesManager
            :work-order-id="workOrderId"
          />
        </div>

        <!-- 6. Aba Agendamentos & Compromissos -->
        <div v-else-if="activeTab === 'agendamentos'">
          <WorkOrderAppointmentsSection
            :work-order-id="workOrderId"
            :work-order-status="workOrder.status_os"
            :is-archived="workOrder.is_archived"
            @appointments-changed="fetchWorkOrder"
          />
        </div>

        <!-- 7. Aba Histórico / Timeline -->
        <div v-else-if="activeTab === 'historico'">
          <WorkOrderActivityTimeline
            :work-order-id="workOrderId"
          />
        </div>
      </div>

      <!-- Modais Contextuais -->
      <WorkOrderStatusModal
        :is-open="isStatusModalOpen"
        :work-order="workOrder"
        @close="isStatusModalOpen = false"
        @status-updated="handleStatusUpdated"
        @open-schedule="activeTab = 'agendamentos'; isStatusModalOpen = false"
      />

      <WorkOrderGeneralEditModal
        :is-open="isEditModalOpen"
        :work-order="workOrder"
        @close="isEditModalOpen = false"
        @work-order-updated="handleWorkOrderUpdated"
      />

      <WorkOrderArchiveModal
        :is-open="isArchiveModalOpen"
        :work-order="workOrder"
        @close="isArchiveModalOpen = false"
        @archive-updated="handleArchiveUpdated"
      />
    </div>
  </div>
</template>
