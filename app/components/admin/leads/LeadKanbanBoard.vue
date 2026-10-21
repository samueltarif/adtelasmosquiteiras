<script setup lang="ts">
import { computed } from 'vue'
import { formatWhatsAppLink } from '~/utils/phone'

interface LeadItem {
  id: string
  nome: string
  telefone?: string | null
  email?: string | null
  cidade?: string | null
  bairro?: string | null
  servico?: string | null
  status?: string | null
  pipeline_stage?: string | null
  contact_attempts?: number | null
  need_type?: string | null
  quantity_range?: string | null
  property_type?: string | null
  installation_timeline?: string | null
  has_photos?: boolean | null
  landing_path?: string | null
  utm_campaign?: string | null
  created_at: string
  [key: string]: any
}

const props = defineProps<{
  leads: LeadItem[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'open-detail', lead: LeadItem): void
  (e: 'update-stage', lead: LeadItem, newStage: string): void
  (e: 'increment-attempt', lead: LeadItem): void
}>()

const columns = [
  { id: 'NOVO', title: 'Novo', color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' },
  { id: 'CONTATO', title: 'Contato', color: 'border-amber-500/50 bg-amber-500/10 text-amber-400' },
  { id: 'AGUARDANDO_FOTOS', title: 'Aguardando Fotos', color: 'border-blue-500/50 bg-blue-500/10 text-blue-400' },
  { id: 'QUALIFICADO', title: 'Qualificado', color: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' },
  { id: 'VISITA', title: 'Visita / Medição', color: 'border-purple-500/50 bg-purple-500/10 text-purple-400' },
  { id: 'ORCAMENTO', title: 'Orçamento Enviado', color: 'border-orange-500/50 bg-orange-500/10 text-orange-400' },
  { id: 'FOLLOW_UP', title: 'Follow-up', color: 'border-pink-500/50 bg-pink-500/10 text-pink-400' },
  { id: 'FECHADO', title: 'Fechado (Ganho)', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' },
  { id: 'PERDIDO', title: 'Perdido', color: 'border-rose-500/50 bg-rose-500/10 text-rose-400' }
]

function resolveLeadColumn(lead: LeadItem): string {
  if (lead.pipeline_stage) {
    const stage = lead.pipeline_stage.toUpperCase()
    if (columns.some(c => c.id === stage)) return stage
  }
  // Mapeamento de fallback baseado no status canonical legado
  const st = (lead.status || 'Novo').toLowerCase()
  if (st.includes('fechado')) return 'FECHADO'
  if (st.includes('perdido')) return 'PERDIDO'
  if (st.includes('contato')) return 'CONTATO'
  if (st.includes('resposta')) return 'CONTATO'
  return 'NOVO'
}

const leadsByColumn = computed(() => {
  const map: Record<string, LeadItem[]> = {}
  columns.forEach(c => { map[c.id] = [] })

  props.leads.forEach(l => {
    const colId = resolveLeadColumn(l)
    if (map[colId]) {
      map[colId].push(l)
    } else {
      map['NOVO'].push(l)
    }
  })

  return map
})

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="w-full overflow-x-auto pb-6">
    <div class="flex gap-4 min-w-[1700px] items-start pt-2">
      <!-- Coluna Kanban -->
      <div
        v-for="col in columns"
        :key="col.id"
        class="w-[280px] shrink-0 bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-col max-h-[78vh] shadow-sm"
      >
        <!-- Header da Coluna -->
        <div class="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" :class="col.color.split(' ')[1]" />
            <span class="font-bold text-xs text-slate-200 uppercase tracking-wider">{{ col.title }}</span>
          </div>
          <span class="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300">
            {{ leadsByColumn[col.id]?.length || 0 }}
          </span>
        </div>

        <!-- Lista de Cards -->
        <div class="flex-1 overflow-y-auto p-3 space-y-3">
          <div
            v-if="leadsByColumn[col.id]?.length === 0"
            class="py-8 text-center text-xs text-slate-500 font-medium"
          >
            Nenhum lead nesta etapa
          </div>

          <!-- Card do Lead -->
          <div
            v-for="lead in leadsByColumn[col.id]"
            :key="lead.id"
            class="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700/60 hover:border-amber-500/50 shadow transition-all cursor-pointer space-y-2.5"
            @click="emit('open-detail', lead)"
          >
            <!-- Topo do Card -->
            <div class="flex items-start justify-between gap-2">
              <div>
                <h4 class="font-bold text-sm text-white leading-tight">
                  {{ lead.nome }}
                </h4>
                <span class="text-[11px] text-slate-400 block mt-0.5">
                  {{ [lead.bairro, lead.cidade].filter(Boolean).join(', ') || 'SP' }}
                </span>
              </div>
              <span class="text-[10px] text-slate-500 font-mono shrink-0">
                {{ formatDate(lead.created_at) }}
              </span>
            </div>

            <!-- Badges do Funil (se preenchidos) -->
            <div v-if="lead.need_type || lead.quantity_range" class="flex flex-wrap gap-1">
              <span v-if="lead.need_type" class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                {{ lead.need_type }}
              </span>
              <span v-if="lead.quantity_range" class="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-semibold">
                {{ lead.quantity_range }} locais
              </span>
              <span v-if="lead.property_type" class="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] capitalize">
                {{ lead.property_type }}
              </span>
              <span v-if="lead.has_photos" class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                📷 Com Fotos
              </span>
            </div>

            <!-- Tentativas de Contato (na etapa CONTATO) -->
            <div v-if="col.id === 'CONTATO'" class="pt-1 flex items-center justify-between text-xs" @click.stop>
              <span class="text-[11px] text-amber-300 font-semibold">
                Tentativas: {{ lead.contact_attempts || 0 }}/3
              </span>
              <button
                type="button"
                class="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold transition-colors"
                @click="emit('increment-attempt', lead)"
              >
                +1 Tentativa
              </button>
            </div>

            <!-- Rodapé do Card com Ações Rápidas -->
            <div class="pt-2 border-t border-slate-700/50 flex items-center justify-between gap-2" @click.stop>
              <!-- Link WhatsApp -->
              <a
                v-if="lead.telefone"
                :href="formatWhatsAppLink(lead.telefone)"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-[11px] font-bold transition-colors"
              >
                <Icon name="lucide:message-circle" class="w-3.5 h-3.5" />
                WhatsApp
              </a>

              <!-- Seletor de Avançar Etapa -->
              <select
                :value="resolveLeadColumn(lead)"
                class="text-[11px] bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
                @change="emit('update-stage', lead, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="c in columns" :key="c.id" :value="c.id">
                  Mover: {{ c.title }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
