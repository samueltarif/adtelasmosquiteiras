<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  workOrders: any[]
  isLoading: boolean
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

function formatCurrency(val?: number | string | null) {
  const num = typeof val === 'number' ? val : parseFloat(String(val || 0))
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(num) ? 0 : num)
}

function formatDate(iso?: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatWhatsAppLink(phone?: string) {
  if (!phone) return '#'
  const digits = phone.replace(/\D/g, '')
  const full = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${full}`
}

function navigateToDetail(id: string) {
  router.push(`/admin/ordens-servico/${id}`)
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="isLoading" class="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-indigo-400" />
      <span>Carregando ordens de serviço...</span>
    </div>

    <div v-else-if="workOrders.length === 0" class="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center">
      <div class="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
        <Icon name="lucide:clipboard-x" class="w-6 h-6" />
      </div>
      <p class="text-xs text-slate-400">Nenhuma Ordem de Serviço encontrada.</p>
    </div>

    <div
      v-else
      v-for="wo in workOrders"
      :key="wo.id"
      @click="navigateToDetail(wo.id)"
      class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-md hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all cursor-pointer space-y-3 group"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="font-mono text-sm font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
          {{ wo.numero_os }}
        </span>
        <span
          class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
          :class="statusLabels[wo.status_os]?.color || 'bg-slate-800 text-slate-300'"
        >
          {{ statusLabels[wo.status_os]?.label || wo.status_os }}
        </span>
      </div>

      <div class="space-y-1">
        <h4 class="text-sm font-bold text-white leading-tight">
          {{ wo.client?.nome || 'Cliente não identificado' }}
        </h4>

        <p class="text-xs text-slate-300">
          <span v-if="wo.address">
            {{ wo.address.logradouro || wo.address.rotulo || 'Imóvel' }}, {{ wo.address.cidade }}
          </span>
          <span v-else class="text-slate-500">Local não vinculado</span>
        </p>

        <div class="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
          <span>Criada: {{ formatDate(wo.created_at) }}</span>
          <span v-if="wo.data_prevista">| Prevista: {{ formatDate(wo.data_prevista) }}</span>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-white/5">
        <div>
          <span class="text-[10px] uppercase text-slate-500 font-semibold block">Valor Final</span>
          <span class="text-sm font-bold text-emerald-400">{{ formatCurrency(wo.valor_final) }}</span>
        </div>

        <div class="flex items-center gap-2" @click.stop>
          <a
            v-if="wo.client?.telefone_principal"
            :href="formatWhatsAppLink(wo.client.telefone_principal)"
            target="_blank"
            rel="noopener noreferrer"
            class="w-10 h-10 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center transition-all min-h-[44px] min-w-[44px]"
            title="WhatsApp (sem tracking público)"
            aria-label="Abrir WhatsApp"
          >
            <Icon name="lucide:message-circle" class="w-5 h-5" />
          </a>

          <button
            @click="navigateToDetail(wo.id)"
            class="px-3.5 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1 transition-all min-h-[44px]"
          >
            <span>Ver OS</span>
            <Icon name="lucide:chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
