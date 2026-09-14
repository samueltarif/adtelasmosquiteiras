<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isOpen: boolean
  workOrderId: string
  workOrder: any
  proposal: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'proposal-accepted', result: any): void
}>()

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

function friendlyErrorMessage(rawMsg: string): string {
  if (rawMsg.includes('ERR_CONCURRENCY_CONFLICT') || rawMsg.includes('STALE_VERSION')) {
    return 'Esta Ordem de Serviço foi alterada por outra ação antes do aceite. A página foi atualizada — tente novamente.'
  }
  if (rawMsg.includes('ERR_PROPOSAL_NOT_FOUND')) {
    return 'Orçamento não encontrado. Atualize a página e tente novamente.'
  }
  if (rawMsg.includes('ERR_PROPOSAL_ALREADY_ACCEPTED') || rawMsg.includes('ERR_WORK_ORDER_ALREADY_APPROVED')) {
    return 'Este orçamento já foi aprovado anteriormente.'
  }
  if (rawMsg.includes('ERR_INVALID_STATUS')) {
    return 'Não é possível aprovar: a Ordem de Serviço não está no status "Orçamento".'
  }
  if (rawMsg.includes('ERR_WORK_ORDER_ARCHIVED')) {
    return 'Não é possível aprovar um orçamento de uma OS arquivada.'
  }
  if (rawMsg.includes('ERR_PROPOSAL_NOT_READY')) {
    return 'Só é possível aprovar orçamentos com status "Emitida".'
  }
  return rawMsg || 'Falha ao aceitar proposta comercial. Tente novamente.'
}

async function handleAccept() {
  if (!props.proposal || !props.workOrder) return
  errorMessage.value = null
  isLoading.value = true

  try {
    // Busca o updated_at mais recente da OS imediatamente antes de aceitar,
    // evitando ERR_CONCURRENCY_CONFLICT causado por agendamentos ou outras
    // ações que atualizam updated_at sem que o usuário perceba.
    let freshUpdatedAt: string | null = props.workOrder?.updated_at || null
    try {
      const fresh = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}`)
      if (fresh?.workOrder?.updated_at) {
        freshUpdatedAt = fresh.workOrder.updated_at
      }
    } catch {
      // Se o GET falhar, continua com o updated_at da prop (melhor esforço)
    }

    const payload = {
      expectedUpdatedAt: freshUpdatedAt
    }

    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}/proposals/${props.proposal.id}/accept`, {
      method: 'POST',
      body: payload
    })

    if (res?.success) {
      emit('proposal-accepted', res.result)
      emit('close')
    } else {
      errorMessage.value = 'Resposta inesperada ao aceitar orçamento.'
    }
  } catch (err: any) {
    console.error('[ProposalAcceptModal] Falha ao aceitar orçamento')
    const raw = err?.data?.statusMessage || err?.data?.message || err?.statusMessage || err?.message || ''
    errorMessage.value = friendlyErrorMessage(raw)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div v-if="isOpen && proposal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 space-y-6">
      <!-- Header do Modal -->
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <Icon name="lucide:check-circle-2" class="w-5 h-5 text-emerald-400" />
            <span>Aprovar Orçamento Comercial</span>
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            Confirmar aceite do cliente para a OS {{ workOrder?.numero_os }}
          </p>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Detalhes da Proposta -->
      <div class="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs space-y-2">
        <div class="flex items-center justify-between">
          <span class="font-bold text-emerald-300 text-sm">{{ proposal.versionLabel || `Rev. ${proposal.versionNumber}` }}</span>
          <span class="text-emerald-400 font-medium">Status: Emitida</span>
        </div>
        <div class="text-slate-300 text-xs">
          Ao aprovar esta versão, a Ordem de Serviço será automaticamente transicionada do status <strong>Orçamento</strong> para <strong>Aprovada</strong> e esta proposta será vinculada como o orçamento oficial contratado.
        </div>
      </div>

      <!-- Alerta de Erro -->
      <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
        {{ errorMessage }}
      </div>

      <!-- Ações do Modal -->
      <div class="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          @click="emit('close')"
          :disabled="isLoading"
          class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-semibold cursor-pointer min-h-[44px] disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          @click="handleAccept"
          :disabled="isLoading"
          class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer min-h-[44px] disabled:opacity-50"
        >
          <Icon v-if="isLoading" name="lucide:loader-2" class="w-4 h-4 animate-spin text-white" />
          <Icon v-else name="lucide:check" class="w-4 h-4 text-white" />
          <span>Confirmar Aprovação do Cliente</span>
        </button>
      </div>
    </div>
  </div>
</template>
