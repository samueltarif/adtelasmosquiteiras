<script setup lang="ts">
import { ref, watch } from 'vue'
import type { WhatsappAttributionItem } from '~/types/adminWhatsappAttribution'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'createClient', item: WhatsappAttributionItem): void
}>()

const quickCode = ref('')
const quickSearchLoading = ref(false)
const quickSearchResult = ref<WhatsappAttributionItem | null>(null)
const quickSearchError = ref<string | null>(null)

watch(() => props.isOpen, (open) => {
  if (open) {
    quickCode.value = ''
    quickSearchResult.value = null
    quickSearchError.value = null
  }
})

async function executeQuickSearch() {
  const code = quickCode.value.trim().toUpperCase()
  if (!code || code.length !== 8) {
    quickSearchError.value = 'Informe um código de exatamente 8 caracteres.'
    return
  }

  quickSearchLoading.value = true
  quickSearchError.value = null
  quickSearchResult.value = null

  try {
    const res = await $fetch<any>(`/api/admin/marketing/whatsapp-attributions/by-code/${code}`)
    if (res?.success && res.attribution) {
      quickSearchResult.value = res.attribution
    } else {
      quickSearchError.value = 'Nenhuma atribuição encontrada para este código.'
    }
  } catch (err: any) {
    quickSearchError.value = err?.data?.message || err?.message || 'Erro na consulta do código.'
  } finally {
    quickSearchLoading.value = false
  }
}

function formatDatetime(iso?: string | null): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return iso
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
  >
    <div class="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Icon name="lucide:search" class="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-white">Localizar Ref. de WhatsApp</h4>
            <p class="text-[11px] text-slate-400">Verifique os dados da mensagem recebida</p>
          </div>
        </div>
        <button type="button" @click="emit('close')" class="text-slate-400 hover:text-white cursor-pointer">
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <div class="space-y-2">
        <label class="block text-xs font-semibold text-slate-300">Código de 8 Caracteres</label>
        <div class="flex items-center gap-2">
          <input
            v-model="quickCode"
            type="text"
            maxlength="8"
            placeholder="Ex: 8K3M7QFA"
            @keyup.enter="executeQuickSearch"
            class="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono uppercase text-xs focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            @click="executeQuickSearch"
            :disabled="quickSearchLoading"
            class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {{ quickSearchLoading ? 'Consultando...' : 'Consultar' }}
          </button>
        </div>
      </div>

      <div v-if="quickSearchError" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
        {{ quickSearchError }}
      </div>

      <div v-if="quickSearchResult" class="p-3.5 rounded-xl bg-slate-950 border border-white/10 space-y-2 text-xs">
        <div class="flex items-center justify-between border-b border-white/5 pb-2">
          <span class="font-mono text-emerald-400 font-bold text-sm">{{ quickSearchResult.short_code }}</span>
          <span
            class="text-[10px] px-2 py-0.5 rounded-full border"
            :class="quickSearchResult.has_click_id ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-white/5'"
          >
            {{ quickSearchResult.has_click_id ? `Click ID: ${quickSearchResult.click_id_type?.toUpperCase()}` : 'Sem Click ID' }}
          </span>
        </div>

        <div class="space-y-1 text-slate-300">
          <div><span class="text-slate-500">Campanha:</span> {{ quickSearchResult.campaign_name || quickSearchResult.utm_campaign || 'Sem campanha' }}</div>
          <div><span class="text-slate-500">Landing:</span> <span class="font-mono">{{ quickSearchResult.landing_path || '/' }}</span></div>
          <div><span class="text-slate-500">Horário:</span> {{ formatDatetime(quickSearchResult.clicked_at) }}</div>
        </div>

        <div class="pt-2 border-t border-white/5 flex items-center justify-end gap-2">
          <button
            v-if="quickSearchResult.attribution_status === 'unassigned'"
            type="button"
            @click="emit('createClient', quickSearchResult); emit('close')"
            class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Icon name="lucide:user-plus" class="w-3.5 h-3.5" />
            <span>Criar Cliente com esta Ref.</span>
          </button>
          <span v-else class="text-slate-400 text-[11px]">
            Status: {{ quickSearchResult.attribution_status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
