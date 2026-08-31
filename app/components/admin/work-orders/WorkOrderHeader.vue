<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  workOrder: any
}>()

const emit = defineEmits<{
  (e: 'openStatusModal'): void
  (e: 'openEditModal'): void
  (e: 'openArchiveModal'): void
}>()

const router = useRouter()

const statusLabels: Record<string, { label: string, color: string }> = {
  orcamento: { label: 'Orçamento', color: 'bg-slate-800 text-slate-300 border-white/10' },
  aprovada: { label: 'Aprovada', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  aguardando_agendamento: { label: 'Aguardando Agendamento', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  agendada: { label: 'Agendada', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  em_execucao: { label: 'Em Execução', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  concluida: { label: 'Concluída', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  cancelada: { label: 'Cancelada', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
}

import { formatPhoneLink, formatWhatsAppLink } from '~/utils/phone'

function navigateToClient(clientId: string) {
  router.push(`/admin/clientes/${clientId}`)
}
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-5 shadow-lg space-y-4">
    <!-- Linha Superior: Voltar + Número da OS + Status Badge + Ações -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/admin/ordens-servico"
          class="p-2 rounded-xl bg-slate-950/60 border border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          title="Voltar para a Lista de OS"
        >
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
        </NuxtLink>

        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
              {{ workOrder.numero_os }}
            </h1>

            <button
              @click="emit('openStatusModal')"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer hover:opacity-90 min-h-[44px]"
              style="min-height: 44px;"
              title="Clique para alterar status"
              :class="statusLabels[workOrder.status_os]?.color || 'bg-slate-800 text-slate-300'"
            >
              <span>{{ statusLabels[workOrder.status_os]?.label || workOrder.status_os }}</span>
              <Icon name="lucide:chevron-down" class="w-3.5 h-3.5 opacity-70" />
            </button>

            <span v-if="workOrder.is_archived" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Arquivada
            </span>
          </div>

          <p class="text-xs text-slate-400 mt-0.5 flex items-center gap-1 flex-wrap">
            <span>Solicitante:</span>
            <button
              @click="navigateToClient(workOrder.client_id)"
              class="font-semibold text-indigo-400 hover:underline cursor-pointer inline-flex items-center min-h-[44px] py-1"
              style="min-height: 44px;"
            >
              {{ workOrder.client?.nome || 'Cliente' }}
            </button>
          </p>
        </div>
      </div>

      <!-- Botões de Ação do Cabeçalho -->
      <div class="flex items-center gap-2 flex-wrap self-start sm:self-center">
        <!-- Contato Seguro (sem tracking público) -->
        <a
          v-if="workOrder.client?.telefone_principal"
          :href="formatWhatsAppLink(workOrder.client.telefone_principal)"
          target="_blank"
          rel="noopener noreferrer"
          class="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[44px] min-w-[44px]"
          title="WhatsApp (sem telemetria pública)"
        >
          <Icon name="lucide:message-circle" class="w-4 h-4" />
          <span class="hidden sm:inline">WhatsApp</span>
        </a>

        <a
          v-if="workOrder.client?.telefone_principal"
          :href="formatPhoneLink(workOrder.client.telefone_principal)"
          class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center justify-center gap-1.5 transition-all min-h-[44px] min-w-[44px]"
          title="Ligar"
        >
          <Icon name="lucide:phone" class="w-4 h-4" />
          <span class="hidden sm:inline">Ligar</span>
        </a>

        <button
          @click="emit('openEditModal')"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all min-h-[44px] cursor-pointer"
        >
          <Icon name="lucide:edit-3" class="w-4 h-4" />
          <span>Editar Geral</span>
        </button>

        <button
          @click="emit('openArchiveModal')"
          class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/10 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          :title="workOrder.is_archived ? 'Desarquivar OS' : 'Arquivar OS'"
        >
          <Icon :name="workOrder.is_archived ? 'lucide:archive-restore' : 'lucide:archive'" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
