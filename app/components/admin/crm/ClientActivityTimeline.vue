<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  clientId: string
}>()

const activities = ref<any[]>([])
const isLoading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(15)

const actionLabels: Record<string, { label: string, color: string, icon: string }> = {
  client_created: { label: 'Cliente Criado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: 'lucide:user-plus' },
  converted_from_lead: { label: 'Convertido de Lead', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: 'lucide:sparkles' },
  client_updated: { label: 'Cadastro Atualizado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: 'lucide:user-check' },
  client_archived: { label: 'Cliente Arquivado', color: 'bg-slate-800 text-slate-400 border-slate-700', icon: 'lucide:archive' },
  address_created: { label: 'Endereço Criado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: 'lucide:map-pin' },
  address_updated: { label: 'Endereço Atualizado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: 'lucide:map-pin' },
  address_deleted: { label: 'Endereço Removido', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: 'lucide:trash-2' },
  work_order_created: { label: 'OS Criada', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: 'lucide:file-text' },
  work_order_status_changed: { label: 'Status da OS Alterado', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: 'lucide:activity' },
  note_added: { label: 'Anotação Adicionada', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: 'lucide:file-edit' },
  payment_received: { label: 'Pagamento Recebido', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: 'lucide:dollar-sign' }
}

async function fetchActivities() {
  isLoading.value = true
  try {
    const res = await $fetch<any>(`/api/admin/crm/clients/${props.clientId}/activity?page=${page.value}&pageSize=${pageSize.value}`)
    if (res?.success) {
      activities.value = res.activities || []
      total.value = res.total || 0
    }
  } catch {
    console.error('[ClientActivityTimeline] Falha ao carregar histórico')
  } finally {
    isLoading.value = false
  }
}

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getActionInfo(action: string) {
  return actionLabels[action] || { label: action, color: 'bg-slate-800 text-slate-300 border-white/10', icon: 'lucide:circle' }
}

onMounted(() => {
  fetchActivities()
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <h3 class="text-sm font-bold text-white uppercase tracking-wider">Linha do Tempo & Histórico Auditável</h3>
      <p class="text-xs text-slate-400">Trilha imutável de eventos operacionais e cadastrais</p>
    </div>

    <div v-if="isLoading" class="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-indigo-400" />
      <span>Carregando histórico...</span>
    </div>

    <div v-else-if="activities.length === 0" class="rounded-xl border border-white/5 bg-slate-900/30 p-6 text-center text-xs text-slate-400">
      Nenhuma atividade registrada até o momento.
    </div>

    <div v-else class="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
      <div
        v-for="act in activities"
        :key="act.id"
        class="relative flex items-start gap-3"
      >
        <!-- Ícone do ponto da timeline -->
        <div class="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center text-slate-400 z-10">
          <Icon :name="getActionInfo(act.acao).icon" class="w-3 h-3" />
        </div>

        <div class="flex-1 rounded-xl border border-white/10 bg-slate-900/60 p-3.5 shadow-xs flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2 flex-wrap text-xs">
            <span 
              class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border"
              :class="getActionInfo(act.acao).color"
            >
              {{ getActionInfo(act.acao).label }}
            </span>
            <span class="text-[11px] text-slate-500 font-mono">{{ formatDate(act.occurred_at) }}</span>
          </div>

          <p class="text-xs text-slate-200 leading-relaxed font-medium">
            {{ act.descricao_humana }}
          </p>

          <div v-if="act.dados_novos?.changed_fields" class="text-[11px] text-slate-400 mt-1">
            Campos alterados: <span class="text-indigo-300 font-mono">{{ act.dados_novos.changed_fields.join(', ') }}</span>
          </div>
        </div>
      </div>

      <!-- Paginação simples -->
      <div v-if="total > pageSize" class="flex items-center justify-between pt-2 text-xs text-slate-400">
        <span>Total: {{ total }} eventos</span>
        <div class="flex items-center gap-2">
          <button 
            :disabled="page <= 1" 
            @click="page--; fetchActivities()"
            class="px-3 py-2 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-white min-h-[44px] cursor-pointer"
          >
            Anterior
          </button>
          <span>Página {{ page }}</span>
          <button 
            :disabled="page * pageSize >= total" 
            @click="page++; fetchActivities()"
            class="px-3 py-2 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-white min-h-[44px] cursor-pointer"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
