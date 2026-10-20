<script setup lang="ts">
import { ref } from 'vue'
import type { GoogleAdsSessionRow } from '../../types/adminGoogleAds'
import Card from '../ui/card/Card.vue'
import SessionJourneyDrawer from './whatsapp/SessionJourneyDrawer.vue'

defineProps<{ sessions: GoogleAdsSessionRow[] }>()

const isJourneyOpen = ref(false)
const selectedSession = ref<string | null>(null)

function openJourney(id: string) {
  selectedSession.value = id
  isJourneyOpen.value = true
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

function formatDuration(sec: number) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m ? `${m}min ${s}s` : `${s}s`
}

function lastStep(s: GoogleAdsSessionRow) {
  if (s.lead) return { label: 'Virou lead', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
  if (s.sent_whatsapp) return { label: 'Enviou → WhatsApp', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' }
  if (s.typed) return { label: 'Digitou e desistiu', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' }
  if (s.opened_popup) return { label: 'Abriu pop-up e fechou', cls: 'bg-amber-500/10 text-amber-200 border-amber-500/20' }
  return { label: 'Só viu a página', cls: 'bg-slate-500/10 text-slate-300 border-slate-500/20' }
}
</script>

<template>
  <Card class="p-4 sm:p-5 bg-slate-900/40 border-slate-800">
    <div class="mb-4">
      <h3 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
        <Icon name="lucide:route" class="w-4 h-4 text-indigo-400" />
        Visitas do Google Ads (navegação de cada pessoa)
      </h3>
      <p class="text-xs text-slate-400 mt-1">
        Uma linha por visita vinda do anúncio, da mais recente para a mais antiga. Clique em "Ver jornada" para ver o passo a passo.
        Para assistir a gravação da tela, use o Microsoft Clarity.
      </p>
    </div>

    <div v-if="!sessions.length" class="text-center py-6 text-xs text-slate-500">
      Nenhuma visita do Google Ads neste período.
    </div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="s in sessions" :key="s.session_id"
        class="rounded-xl border border-slate-800 bg-slate-950/40 p-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4"
      >
        <div class="font-mono text-xs text-slate-400 w-24 shrink-0">{{ formatTime(s.started_at) }}</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm text-amber-300 truncate">{{ s.keyword || '(palavra-chave não capturada)' }}</div>
          <div class="text-[11px] text-slate-500 truncate">
            {{ s.device || 'dispositivo ?' }} · {{ s.pageviews }} página(s) · {{ formatDuration(s.duration_seconds) }}
            <span v-if="s.pages.length > 1"> · {{ s.pages.join(' → ') }}</span>
          </div>
        </div>
        <span class="text-[11px] font-semibold px-2 py-1 rounded-md border whitespace-nowrap" :class="lastStep(s).cls">
          {{ lastStep(s).label }}
        </span>
        <button
          type="button"
          class="text-xs font-semibold text-indigo-300 hover:text-indigo-200 whitespace-nowrap"
          @click="openJourney(s.session_id)"
        >
          Ver jornada →
        </button>
      </div>
    </div>

    <SessionJourneyDrawer
      :is-open="isJourneyOpen"
      :session-id="selectedSession"
      @close="isJourneyOpen = false"
    />
  </Card>
</template>
