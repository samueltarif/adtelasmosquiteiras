<script setup lang="ts">
import { useRouter } from 'vue-router'
import { formatDateOnly } from '~/utils/crmDateTime'

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

function navigateToDetail(id: string) {
  router.push(`/admin/ordens-servico/${id}`)
}
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-lg">
    <div class="overflow-x-auto w-full">
      <table class="w-full text-left text-xs border-collapse min-w-[700px]">
        <thead>
          <tr class="border-b border-white/10 bg-slate-950/40 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
            <th class="py-3.5 px-4">Número OS</th>
            <th class="py-3.5 px-4">Cliente</th>
            <th class="py-3.5 px-4">Status</th>
            <th class="py-3.5 px-4">Local</th>
            <th class="py-3.5 px-4">Data Prevista</th>
            <th class="py-3.5 px-4">Valor Final</th>
            <th class="py-3.5 px-4">Responsável</th>
            <th class="py-3.5 px-4 text-right">Ação</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr v-if="isLoading">
            <td colspan="8" class="py-12 text-center text-slate-400">
              <div class="flex items-center justify-center gap-2">
                <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
                <span>Carregando ordens de serviço...</span>
              </div>
            </td>
          </tr>

          <tr v-else-if="workOrders.length === 0">
            <td colspan="8" class="py-12 text-center text-slate-400">
              <div class="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Icon name="lucide:clipboard-x" class="w-6 h-6" />
              </div>
              <p class="text-xs">Nenhuma Ordem de Serviço encontrada para os filtros selecionados.</p>
            </td>
          </tr>

          <tr
            v-else
            v-for="wo in workOrders"
            :key="wo.id"
            @click="navigateToDetail(wo.id)"
            class="hover:bg-white/[0.03] transition-colors cursor-pointer group"
          >
            <td class="py-3.5 px-4">
              <span class="font-mono font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                {{ wo.numero_os }}
              </span>
            </td>

            <td class="py-3.5 px-4 font-medium text-white">
              {{ wo.client?.nome || 'Cliente não identificado' }}
            </td>

            <td class="py-3.5 px-4">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
                :class="statusLabels[wo.status_os]?.color || 'bg-slate-800 text-slate-300'"
              >
                {{ statusLabels[wo.status_os]?.label || wo.status_os }}
              </span>
            </td>

            <td class="py-3.5 px-4 text-slate-300">
              <span v-if="wo.address">
                {{ wo.address.bairro || wo.address.cidade }}, {{ wo.address.uf }}
              </span>
              <span v-else class="text-slate-500">-</span>
            </td>

            <td class="py-3.5 px-4 text-slate-300">
              {{ wo.data_prevista ? formatDateOnly(wo.data_prevista) : '-' }}
            </td>

            <td class="py-3.5 px-4 font-bold text-emerald-400">
              {{ formatCurrency(wo.valor_final) }}
            </td>

            <td class="py-3.5 px-4 text-slate-300">
              {{ wo.responsible?.nome || '-' }}
            </td>

            <td class="py-3.5 px-4 text-right" @click.stop>
              <button
                @click="navigateToDetail(wo.id)"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold transition-all cursor-pointer min-h-[44px]"
              >
                <span>Ver OS</span>
                <Icon name="lucide:chevron-right" class="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
