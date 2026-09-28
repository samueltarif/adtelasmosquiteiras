<script setup lang="ts">
import { ref, watch } from 'vue'
import { getChannelLabel, getChannelBadgeStyle } from '~/utils/channelDisplay'

const props = defineProps<{
  isOpen: boolean
  sessionId: string | null
  shortCode?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const journeyData = ref<{
  session_id: string
  summary: {
    total_events: number
    entry_channel: string | null
    entry_landing: string
    first_event_at: string | null
    last_event_at: string | null
  }
  timeline: Array<{
    id: string
    type: string
    title: string
    timestamp: string
    path: string | null
    channel: string | null
    campaign: string | null
    cta: string | null
    short_code: string | null
    status: string | null
    technical_details: Record<string, any>
  }>
} | null>(null)

const expandedDetails = ref<Record<string, boolean>>({})

function toggleDetails(id: string) {
  expandedDetails.value = {
    ...expandedDetails.value,
    [id]: !expandedDetails.value[id]
  }
}

async function fetchJourney(sid: string) {
  loading.value = true
  error.value = null
  journeyData.value = null
  expandedDetails.value = {}

  try {
    const res = await $fetch<any>(`/api/admin/marketing/session-journey?session_id=${encodeURIComponent(sid)}`)
    if (res?.success) {
      journeyData.value = res
    } else {
      error.value = 'Falha ao obter jornada da sessão.'
    }
  } catch (err: any) {
    console.error('[SessionJourneyDrawer] Erro:', err)
    error.value = err?.data?.message || err?.message || 'Erro ao carregar a jornada.'
  } finally {
    loading.value = false
  }
}

watch([() => props.isOpen, () => props.sessionId], ([open, sid]) => {
  if (open && sid) {
    fetchJourney(sid)
  }
})

function formatTime(iso?: string | null): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return iso
  }
}

function formatDate(iso?: string | null): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return iso
  }
}

function getEventIcon(type: string): string {
  switch (type) {
    case 'landing':
      return 'lucide:log-in'
    case 'pageview':
      return 'lucide:file-text'
    case 'whatsapp_click':
      return 'lucide:message-square'
    case 'whatsapp_attribution':
      return 'lucide:check-circle-2'
    case 'client_assigned':
      return 'lucide:user-check'
    case 'lead_submission':
      return 'lucide:mail-check'
    default:
      return 'lucide:mouse-pointer'
  }
}

function getEventColor(type: string): string {
  switch (type) {
    case 'landing':
      return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    case 'pageview':
      return 'text-slate-300 bg-slate-800 border-white/10'
    case 'whatsapp_click':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    case 'whatsapp_attribution':
      return 'text-emerald-300 bg-emerald-900/30 border-emerald-500/30'
    case 'client_assigned':
      return 'text-emerald-400 bg-emerald-600/20 border-emerald-500/40'
    case 'lead_submission':
      return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    default:
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex justify-end"
  >
    <div
      class="w-full max-w-xl bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col h-full transform transition-all duration-300"
    >
      <!-- Header do Drawer -->
      <div class="p-4 sm:p-5 border-b border-white/10 bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Icon name="lucide:route" class="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          </div>
          <div class="min-w-0">
            <h3 class="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 flex-wrap">
              <span>Auditoria de Jornada</span>
              <span v-if="shortCode" class="text-[11px] px-1.5 py-0.5 rounded-md font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ref: {{ shortCode }}
              </span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5 font-mono truncate">
              Sessão: {{ sessionId }}
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
          title="Fechar painel"
        >
          <Icon name="lucide:x" class="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <!-- Resumo da Sessão -->
      <div v-if="journeyData?.summary" class="p-4 bg-slate-950/40 border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div class="p-2 rounded-lg bg-slate-900 border border-white/5">
          <span class="text-slate-500 block text-[10px]">Origem Inicial</span>
          <span class="font-semibold text-slate-200 truncate block">
            {{ getChannelLabel(journeyData.summary.entry_channel) }}
          </span>
        </div>
        <div class="p-2 rounded-lg bg-slate-900 border border-white/5">
          <span class="text-slate-500 block text-[10px]">Página de Entrada</span>
          <span class="font-mono text-slate-300 truncate block">
            {{ journeyData.summary.entry_landing }}
          </span>
        </div>
        <div class="p-2 rounded-lg bg-slate-900 border border-white/5">
          <span class="text-slate-500 block text-[10px]">Total de Eventos</span>
          <span class="font-bold text-indigo-400 block">
            {{ journeyData.summary.total_events }}
          </span>
        </div>
        <div class="p-2 rounded-lg bg-slate-900 border border-white/5">
          <span class="text-slate-500 block text-[10px]">Data da Visita</span>
          <span class="text-slate-300 block">
            {{ formatDate(journeyData.summary.first_event_at) }}
          </span>
        </div>
      </div>

      <!-- Conteúdo com Scroll -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4">
        <div v-if="loading" class="py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
          <span>Rastreando jornada cronológica...</span>
        </div>

        <div v-else-if="error" class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {{ error }}
        </div>

        <div v-else-if="!journeyData || journeyData.timeline.length === 0" class="py-16 text-center text-slate-500 text-sm">
          <Icon name="lucide:search-x" class="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p>Nenhum evento registrado para esta sessão.</p>
        </div>

        <div v-else class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
          <div
            v-for="(event, idx) in journeyData.timeline"
            :key="event.id"
            class="relative group"
          >
            <!-- Bolinha / Ícone na Linha -->
            <div
              class="absolute -left-[27px] top-1 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 z-10"
              :class="getEventColor(event.type)"
            >
              <Icon :name="getEventIcon(event.type)" class="w-3.5 h-3.5" />
            </div>

            <!-- Card do Evento -->
            <div class="rounded-xl border border-white/10 bg-slate-950/70 p-3.5 space-y-2 hover:border-white/20 transition-colors">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="text-xs font-bold text-white flex items-center gap-1.5">
                  {{ event.title }}
                </span>
                <span class="text-[11px] font-mono text-slate-400">
                  {{ formatTime(event.timestamp) }}
                </span>
              </div>

              <!-- Badges e Metadados do Evento -->
              <div class="flex items-center gap-2 flex-wrap text-xs">
                <!-- Canal do evento -->
                <span
                  v-if="event.channel"
                  class="px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1"
                  :class="[getChannelBadgeStyle(event.channel).bg, getChannelBadgeStyle(event.channel).text, getChannelBadgeStyle(event.channel).border]"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="getChannelBadgeStyle(event.channel).dot"></span>
                  {{ getChannelLabel(event.channel) }}
                </span>

                <!-- Campanha -->
                <span v-if="event.campaign" class="text-[11px] text-indigo-300 font-medium truncate max-w-[200px]">
                  Campanha: {{ event.campaign }}
                </span>

                <!-- CTA -->
                <span v-if="event.cta" class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  CTA: {{ event.cta }}
                </span>

                <!-- Path -->
                <span v-if="event.path" class="text-[11px] font-mono text-slate-400 truncate max-w-[240px]">
                  {{ event.path }}
                </span>
              </div>

              <!-- Detalhes Técnicos Recolhíveis -->
              <div v-if="event.technical_details && Object.keys(event.technical_details).some(k => event.technical_details[k] !== null && event.technical_details[k] !== undefined)" class="pt-2 border-t border-white/5">
                <button
                  type="button"
                  @click="toggleDetails(event.id)"
                  class="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Icon :name="expandedDetails[event.id] ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="w-3 h-3" />
                  <span>{{ expandedDetails[event.id] ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos' }}</span>
                </button>

                <div
                  v-if="expandedDetails[event.id]"
                  class="mt-2 p-2.5 rounded-lg bg-slate-900 border border-white/5 text-[11px] font-mono text-slate-300 space-y-1 overflow-x-auto"
                >
                  <div
                    v-for="(val, key) in event.technical_details"
                    :key="key"
                    v-show="val !== null && val !== undefined"
                    class="flex items-start gap-2"
                  >
                    <span class="text-slate-500 shrink-0">{{ key }}:</span>
                    <span class="text-slate-200 break-all">{{ typeof val === 'object' ? JSON.stringify(val) : val }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
