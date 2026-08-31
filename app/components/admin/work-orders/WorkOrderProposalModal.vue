<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  workOrderId: string
  workOrder: any
  isFirstRevision?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'proposal-issued', proposal: any): void
}>()

// Default: +15 dias a partir de hoje
function getDefaultValidUntil() {
  const d = new Date()
  d.setDate(d.getDate() + 15)
  return d.toISOString().slice(0, 10)
}

const validUntil = ref(getDefaultValidUntil())
const condicoesPagamento = ref('À vista com 5% de desconto no PIX ou em até 3x sem juros no cartão de crédito.')
const prazoInstalacaoDias = ref<number | ''>(5)
const incluirMedicoes = ref(true)
const observacoesProposta = ref('')

const isPreviewLoading = ref(false)
const isIssueLoading = ref(false)
const errorMessage = ref<string | null>(null)
const previewUrl = ref<string | null>(null)

watch(() => props.isOpen, (open) => {
  if (open) {
    validUntil.value = getDefaultValidUntil()
    errorMessage.value = null
    previewUrl.value = null
  }
})

// Gera Prévia (Sem persistir no DB ou R2)
async function handlePreview() {
  errorMessage.value = null
  isPreviewLoading.value = true
  try {
    const payload = {
      validUntil: validUntil.value || null,
      commercialTerms: {
        condicoes_pagamento: condicoesPagamento.value.trim() || null,
        prazo_instalacao_dias: prazoInstalacaoDias.value ? Number(prazoInstalacaoDias.value) : null,
        incluir_medicoes: incluirMedicoes.value,
        observacoes_proposta: observacoesProposta.value.trim() || null
      }
    }

    const blob = await $fetch<Blob>(`/api/admin/crm/work-orders/${props.workOrderId}/proposals/preview`, {
      method: 'POST',
      body: payload,
      responseType: 'blob'
    })

    if (blob) {
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    }
  } catch (err: any) {
    console.error('[ProposalModal] Falha ao gerar prévia')
    errorMessage.value = err?.data?.message || err?.message || 'Falha ao gerar prévia do orçamento.'
  } finally {
    isPreviewLoading.value = false
  }
}

// Emite Revisão Oficial (Reserva DB -> Geração PDF -> Upload R2 -> Finalize DB)
async function handleIssue() {
  errorMessage.value = null
  isIssueLoading.value = true
  try {
    const idempotencyKey = crypto.randomUUID()
    const payload = {
      idempotencyKey,
      expectedUpdatedAt: props.workOrder?.updated_at || null,
      validUntil: validUntil.value || null,
      commercialTerms: {
        condicoes_pagamento: condicoesPagamento.value.trim() || null,
        prazo_instalacao_dias: prazoInstalacaoDias.value ? Number(prazoInstalacaoDias.value) : null,
        incluir_medicoes: incluirMedicoes.value,
        observacoes_proposta: observacoesProposta.value.trim() || null
      }
    }

    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}/proposals/issue`, {
      method: 'POST',
      body: payload
    })

    if (res?.success && res.proposal) {
      emit('proposal-issued', res.proposal)
      emit('close')
    } else {
      errorMessage.value = 'Resposta inesperada ao emitir orçamento.'
    }
  } catch (err: any) {
    console.error('[ProposalModal] Falha ao emitir orçamento')
    errorMessage.value = err?.data?.message || err?.message || 'Falha ao emitir revisão oficial do orçamento.'
  } finally {
    isIssueLoading.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
      <!-- Header do Modal -->
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <Icon name="lucide:file-signature" class="w-5 h-5 text-indigo-400" />
            <span>{{ isFirstRevision ? 'Gerar Orçamento Oficial' : 'Emitir Nova Revisão do Orçamento' }}</span>
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            Configuração das condições comerciais para a OS {{ workOrder?.numero_os }}
          </p>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Aviso Explicativo da Prévia -->
      <div class="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3.5 text-xs text-indigo-300 flex items-start gap-2.5">
        <Icon name="lucide:info" class="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span class="font-semibold block">Emissão Segura & Imutável:</span>
          A <strong>Prévia</strong> gera o PDF instantaneamente em memória para conferência sem registrar nova versão. A <strong>Emissão Oficial</strong> congela os snapshots, gera a revisão (ex: Rev. 01) e armazena o documento definitivo no R2 seguro.
        </div>
      </div>

      <!-- Alerta de Erro -->
      <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
        {{ errorMessage }}
      </div>

      <!-- Formulário de Condições Comerciais -->
      <div class="space-y-4 text-xs">
        <!-- Validade da Proposta -->
        <div>
          <label class="block font-medium text-slate-300 mb-1.5">
            Validade do Orçamento:
          </label>
          <input
            v-model="validUntil"
            type="date"
            class="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
          />
        </div>

        <!-- Condições de Pagamento -->
        <div>
          <label class="block font-medium text-slate-300 mb-1.5">
            Condições de Pagamento:
          </label>
          <input
            v-model="condicoesPagamento"
            type="text"
            placeholder="Ex: 50% de entrada + 50% na conclusão / 3x sem juros"
            class="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
          />
        </div>

        <!-- Prazo de Instalação -->
        <div>
          <label class="block font-medium text-slate-300 mb-1.5">
            Prazo Estimado de Instalação (dias úteis):
          </label>
          <input
            v-model="prazoInstalacaoDias"
            type="number"
            min="1"
            max="365"
            placeholder="Ex: 5"
            class="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
          />
        </div>

        <!-- Toggle Incluir Medições no PDF -->
        <div class="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-slate-800/60">
          <div>
            <span class="font-semibold text-white block">Detalhes de Medições</span>
            <span class="text-slate-400 text-[11px]">Exibir dimensões (largura x altura) e ambientes no PDF do orçamento</span>
          </div>
          <button
            type="button"
            @click="incluirMedicoes = !incluirMedicoes"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            :class="incluirMedicoes ? 'bg-indigo-600' : 'bg-slate-700'"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="incluirMedicoes ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- Observações Comerciais da Proposta -->
        <div>
          <label class="block font-medium text-slate-300 mb-1.5">
            Observações Comerciais (impresso no orçamento):
          </label>
          <textarea
            v-model="observacoesProposta"
            rows="3"
            placeholder="Ex: Incluso mão de obra especializada e material com 5 anos de garantia de fábrica."
            class="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>

      <!-- Ações do Modal -->
      <div class="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          @click="emit('close')"
          :disabled="isPreviewLoading || isIssueLoading"
          class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-semibold cursor-pointer min-h-[44px] disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          @click="handlePreview"
          :disabled="isPreviewLoading || isIssueLoading"
          class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer min-h-[44px] disabled:opacity-50"
        >
          <Icon v-if="isPreviewLoading" name="lucide:loader-2" class="w-4 h-4 animate-spin text-indigo-400" />
          <Icon v-else name="lucide:eye" class="w-4 h-4 text-indigo-400" />
          <span>Visualizar Prévia</span>
        </button>

        <button
          type="button"
          @click="handleIssue"
          :disabled="isPreviewLoading || isIssueLoading"
          class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer min-h-[44px] disabled:opacity-50"
        >
          <Icon v-if="isIssueLoading" name="lucide:loader-2" class="w-4 h-4 animate-spin text-white" />
          <Icon v-else name="lucide:check-circle-2" class="w-4 h-4 text-white" />
          <span>{{ isFirstRevision ? 'Emitir Orçamento' : 'Emitir Nova Revisão' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
