<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  workOrderId: string
}>()

const activities = ref<any[]>([])
const isLoading = ref(false)

const actionIcons: Record<string, { icon: string, color: string }> = {
  work_order_created: { icon: 'lucide:plus-circle', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  work_order_status_changed: { icon: 'lucide:refresh-cw', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  work_order_completed: { icon: 'lucide:check-circle-2', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  work_order_cancelled: { icon: 'lucide:x-circle', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  media_uploaded: { icon: 'lucide:image', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  media_removed: { icon: 'lucide:trash', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  note_added: { icon: 'lucide:sticky-note', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
}

async function fetchActivity() {
  isLoading.value = true
  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}/activity`)
    activities.value = res?.activities || []
  } catch (err) {
    console.error('[WorkOrderActivityTimeline] Erro ao carregar timeline:', err)
  } finally {
    isLoading.value = false
  }
}

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchActivity()
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <h3 class="text-sm font-bold text-white uppercase tracking-wider">Histórico da Ordem de Serviço</h3>
      <p class="text-xs text-slate-400">Trilha de auditoria operacional imutável</p>
    </div>

    <div v-if="isLoading" class="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-indigo-400" />
      <span>Carregando histórico...</span>
    </div>

    <div v-else-if="activities.length === 0" class="rounded-2xl border border-white/5 bg-slate-900/40 p-8 text-center">
      <div class="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
        <Icon name="lucide:history" class="w-5 h-5" />
      </div>
      <p class="text-xs text-slate-400">Nenhum evento registrado nesta ordem de serviço ainda.</p>
    </div>

    <div v-else class="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
      <div
        v-for="act in activities"
        :key="act.id"
        class="relative space-y-1"
      >
        <!-- Ponto da Timeline -->
        <div
          class="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border text-[10px]"
          :class="actionIcons[act.acao]?.color || 'bg-slate-800 text-slate-300 border-white/10'"
        >
          <Icon :name="actionIcons[act.acao]?.icon || 'lucide:circle'" class="w-3 h-3" />
        </div>

        <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3.5 shadow-sm space-y-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold text-white">{{ act.descricao_humana || act.acao }}</span>
            <span class="text-[11px] text-slate-500">{{ formatDate(act.occurred_at) }}</span>
          </div>

          <div v-if="act.dados_novos" class="text-[11px] text-slate-400 font-mono">
            <span v-if="act.dados_novos.status_anterior && act.dados_novos.status_novo">
              De: {{ act.dados_novos.status_anterior }} ➔ Para: {{ act.dados_novos.status_novo }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
