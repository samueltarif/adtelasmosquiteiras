<script setup lang="ts">
import { ref, watch } from 'vue'
import Badge from '../../ui/badge/Badge.vue'
import { formatWhatsAppLink } from '~/utils/phone'

const props = defineProps<{
  lead: any | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'status-updated', newStatus: string): void
}>()

const interactions = ref<any[]>([])
const isLoadingInteractions = ref(false)
const isUpdatingStatus = ref(false)
const updateError = ref<string | null>(null)
const currentStatus = ref('Novo')

const statusOptions = ['Novo', 'Em contato', 'Sem resposta', 'Fechado', 'Perdido']

watch(() => props.lead, async (newLead) => {
  if (!newLead) {
    interactions.value = []
    return
  }
  currentStatus.value = newLead.status || 'Novo'
  updateError.value = null
  await loadInteractions(newLead.id)
}, { immediate: true })

async function loadInteractions(leadId: string) {
  if (!leadId) return
  isLoadingInteractions.value = true
  try {
    const res = await $fetch<any>(`/api/admin/leads/${encodeURIComponent(leadId)}/whatsapp-interactions`)
    if (res?.success) {
      interactions.value = res.interactions || []
    }
  } catch (err) {
    console.warn('[WhatsappLeadDetailModal] Falha ao carregar histórico:', err)
  } finally {
    isLoadingInteractions.value = false
  }
}

async function handleStatusChange(newStatus: string) {
  if (!props.lead?.id || isUpdatingStatus.value) return
  isUpdatingStatus.value = true
  updateError.value = null
  try {
    const res = await $fetch<any>(`/api/admin/leads/${encodeURIComponent(props.lead.id)}/status`, {
      method: 'PATCH',
      body: { status: newStatus }
    })
    if (res?.success) {
      currentStatus.value = res.lead.status
      emit('status-updated', res.lead.status)
    }
  } catch (err: any) {
    updateError.value = err?.data?.message || 'Falha ao atualizar status'
  } finally {
    isUpdatingStatus.value = false
  }
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function statusVariant(status: string) {
  const map: Record<string, any> = {
    'Novo': 'cyan',
    'Em contato': 'amber',
    'Em Atendimento': 'amber',
    'Sem resposta': 'purple',
    'Fechado': 'success',
    'Perdido': 'destructive'
  }
  return map[status] || 'secondary'
}
</script>

<template>
  <div v-if="isOpen && lead" class="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
    <!-- Click outside backdrop -->
    <div class="fixed inset-0" @click="emit('close')"></div>

    <div class="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 sm:rounded-3xl shadow-2xl flex flex-col max-h-screen sm:max-h-[92vh] z-10 overflow-hidden">
      <!-- Modal Header -->
      <div class="flex items-start justify-between p-4 sm:p-6 border-b border-white/[0.08] bg-slate-900/90 backdrop-blur">
        <div class="min-w-0 flex-1 pr-3">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h2 class="text-lg sm:text-xl font-extrabold text-white truncate">
              {{ lead.nome || 'Lead sem nome' }}
            </h2>
            <Badge :variant="statusVariant(currentStatus)" class="uppercase tracking-wider text-[10px]">
              {{ currentStatus }}
            </Badge>
          </div>
          <p class="text-xs text-slate-400 mt-1 font-mono flex items-center gap-2">
            <span>{{ lead.telefone || 'Sem telefone' }}</span>
            <span class="text-slate-600">·</span>
            <span>Criado em {{ formatDate(lead.created_at) }}</span>
          </p>
        </div>

        <button
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          title="Fechar"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-300 text-xs sm:text-sm">
        
        <!-- Status Comercial Rápido -->
        <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white text-xs uppercase tracking-wider">Alterar Status Comercial</span>
            <span v-if="isUpdatingStatus" class="text-xs text-indigo-400 flex items-center gap-1.5">
              <Icon name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" /> Salvando...
            </span>
          </div>

          <div class="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              v-for="st in statusOptions"
              :key="st"
              type="button"
              :disabled="isUpdatingStatus"
              @click="handleStatusChange(st)"
              class="px-3 py-2 rounded-xl text-xs font-semibold transition-all min-h-[38px] cursor-pointer"
              :class="currentStatus === st
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-white/5'"
            >
              {{ st }}
            </button>
          </div>
          <p v-if="updateError" class="text-xs text-rose-400 mt-1">{{ updateError }}</p>
        </div>

        <!-- Dados Principais -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <div>
            <span class="text-[10px] text-slate-500 font-bold uppercase block">Telefone / WhatsApp</span>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-white font-mono font-medium">{{ lead.telefone || '-' }}</span>
              <a
                v-if="lead.telefone"
                :href="formatWhatsAppLink(lead.telefone)"
                target="_blank"
                rel="noopener noreferrer"
                class="px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-[11px] font-bold flex items-center gap-1"
              >
                <Icon name="lucide:message-circle" class="w-3 h-3" /> Conversar
              </a>
            </div>
          </div>

          <div>
            <span class="text-[10px] text-slate-500 font-bold uppercase block">Serviço de Interesse</span>
            <span class="text-white font-medium block mt-0.5">
              {{ lead.servico || (lead.origem === 'whatsapp_gate' ? 'WhatsApp — Geral' : 'Não especificado') }}
            </span>
          </div>

          <div>
            <span class="text-[10px] text-slate-500 font-bold uppercase block">Localização</span>
            <span class="text-slate-300 block mt-0.5">
              {{ [lead.bairro, lead.cidade].filter(Boolean).join(', ') || 'Não informada' }}
            </span>
          </div>

          <div>
            <span class="text-[10px] text-slate-500 font-bold uppercase block">Total de Interações WhatsApp</span>
            <span class="text-indigo-300 font-extrabold block mt-0.5">
              {{ interactions.length || lead.interactions_count || 1 }} interação(ões)
            </span>
          </div>
        </div>

        <!-- Origem & Atribuição (Sessão Atual vs First Touch) -->
        <div class="space-y-3">
          <h3 class="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
            <Icon name="lucide:compass" class="w-4 h-4 text-indigo-400" />
            Origem e Atribuição de Marketing
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Canal Atual -->
            <div class="p-3.5 rounded-2xl bg-slate-800/60 border border-white/[0.06] space-y-2">
              <span class="text-[11px] font-bold text-indigo-300 uppercase block">Canal da Conversão</span>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span class="text-slate-400">Canal:</span>
                  <span class="font-semibold text-white">{{ lead.channel || lead.session_channel || 'direct' }}</span>
                </div>
                <div class="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span class="text-slate-400">Origem / Mídia:</span>
                  <span class="text-slate-200 truncate max-w-[160px]">{{ [lead.utm_source, lead.utm_medium].filter(Boolean).join(' / ') || '-' }}</span>
                </div>
                <div class="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span class="text-slate-400">Campanha:</span>
                  <span class="text-slate-200 truncate max-w-[160px]">{{ lead.utm_campaign || '-' }}</span>
                </div>
                <div class="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span class="text-slate-400">Termo:</span>
                  <span class="text-slate-200 truncate max-w-[160px]">{{ lead.utm_term || '-' }}</span>
                </div>
                <div class="flex justify-between py-0.5">
                  <span class="text-slate-400">GCLID presente:</span>
                  <span :class="lead.gclid ? 'text-emerald-400 font-bold' : 'text-slate-500'">{{ lead.gclid ? 'Sim' : 'Não' }}</span>
                </div>
              </div>
            </div>

            <!-- First Touch -->
            <div class="p-3.5 rounded-2xl bg-slate-800/60 border border-white/[0.06] space-y-2">
              <span class="text-[11px] font-bold text-amber-300 uppercase block">Primeiro Acesso (First Touch)</span>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span class="text-slate-400">Canal First Touch:</span>
                  <span class="font-semibold text-white">{{ lead.first_touch_channel || lead.channel || 'direct' }}</span>
                </div>
                <div class="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span class="text-slate-400">Landing Path:</span>
                  <span class="text-slate-200 truncate max-w-[160px] font-mono text-[11px]">{{ lead.first_touch_landing_path || lead.landing_path || '/' }}</span>
                </div>
                <div class="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span class="text-slate-400">Referrer:</span>
                  <span class="text-slate-200 truncate max-w-[160px]">{{ lead.first_touch_referrer || lead.referrer || 'Direto' }}</span>
                </div>
                <div class="flex justify-between py-0.5">
                  <span class="text-slate-400">Origem FT:</span>
                  <span class="text-slate-200 truncate max-w-[160px]">{{ [lead.first_touch_utm_source, lead.first_touch_utm_campaign].filter(Boolean).join(' / ') || '-' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Histórico Completo de Interações WhatsApp -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Icon name="lucide:history" class="w-4 h-4 text-emerald-400" />
              Histórico Completo de Interações WhatsApp
            </h3>
            <span class="text-xs text-slate-400 font-mono">
              {{ interactions.length }} clique(s) registrado(s)
            </span>
          </div>

          <div v-if="isLoadingInteractions" class="p-4 text-center rounded-2xl bg-white/[0.02] border border-white/[0.04] text-slate-400">
            <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
            <span>Carregando histórico...</span>
          </div>

          <div v-else-if="interactions.length === 0" class="p-4 text-center rounded-2xl bg-white/[0.02] border border-white/[0.04] text-slate-400">
            Nenhuma atribuição detalhada encontrada para este lead.
          </div>

          <div v-else class="space-y-2.5">
            <div
              v-for="(item, idx) in interactions"
              :key="item.id || idx"
              class="p-3.5 rounded-2xl bg-slate-800/40 border border-white/[0.06] hover:border-emerald-500/30 transition-all space-y-2"
            >
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span class="font-bold text-white text-xs">{{ formatDate(item.clicked_at || item.created_at) }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    REF: {{ item.short_code }}
                  </span>
                  <span class="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
                    {{ item.channel || 'direct' }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-white/[0.04]">
                <div>
                  <span class="text-[10px] text-slate-500 font-bold uppercase block">Página</span>
                  <span class="text-slate-200 font-mono text-[11px] truncate block">{{ item.landing_path || '/' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 font-bold uppercase block">Local do Botão (CTA)</span>
                  <span class="text-slate-200 truncate block">{{ item.cta_location || 'Botão WhatsApp' }}</span>
                </div>
                <div v-if="item.utm_campaign || item.campaign_name || item.google_campaign_id" class="sm:col-span-2">
                  <span class="text-[10px] text-slate-500 font-bold uppercase block">Campanha</span>
                  <span class="text-slate-300 truncate block">
                    {{ item.campaign_name || item.utm_campaign || `Campanha ID ${item.google_campaign_id}` }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="p-4 sm:p-5 border-t border-white/[0.08] bg-slate-900/90 flex justify-end gap-3">
        <button
          @click="emit('close')"
          class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs min-h-[44px] cursor-pointer"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>
