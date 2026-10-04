<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import WhatsappAttributionSection from '../WhatsappAttributionSection.vue'

const { data, status, error, refresh } = await useFetch<any>('/api/admin/whatsapp-prospects')
const isOpen = ref(false)
const showAttributions = ref(false)
const search = ref('')
const campaignOnly = ref(false)
const page = ref(1)

const filtered = computed(() => (data.value?.items || []).filter((r: any) =>
  (!campaignOnly.value || r.campaign || r.campaign_id) &&
  [r.service, r.campaign, r.campaign_id, r.source, r.page, r.keyword].join(' ').toLowerCase().includes(search.value.toLowerCase())
))

const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20))
watch([search, campaignOnly], () => { page.value = 1 })

function date(value: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}
</script>

<template>
  <section class="rounded-2xl border border-white/[0.08] bg-slate-900/60 overflow-hidden text-slate-200 shadow-lg">
    <!-- Header / Toggle Accordion -->
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
    >
      <div class="flex items-center gap-2.5 flex-wrap">
        <Icon name="lucide:mouse-pointer-click" class="w-5 h-5 text-slate-400" />
        <h2 class="font-bold text-base sm:text-lg text-slate-200">
          Cliques WhatsApp sem identificação
        </h2>
        <span class="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/10 text-slate-300">
          {{ data?.items?.length || 0 }} clique(s)
        </span>
      </div>

      <div class="flex items-center gap-2 text-slate-400">
        <span class="text-xs hidden sm:inline">{{ isOpen ? 'Recolher' : 'Expandir histórico' }}</span>
        <Icon :name="isOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="w-5 h-5" />
      </div>
    </button>

    <!-- Collapsible Content (Recolhido por padrão) -->
    <div v-if="isOpen" class="p-4 sm:p-6 border-t border-white/[0.08] space-y-4 bg-slate-900/90">
      <div class="flex flex-wrap justify-between items-center gap-3">
        <p class="text-xs sm:text-sm text-slate-400">
          Cliques legados e acessos onde o visitante clicou no botão do WhatsApp mas não concluiu a identificação.
        </p>
        <button
          class="min-h-[40px] px-3.5 rounded-xl bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white transition-all text-xs font-semibold cursor-pointer"
          @click="refresh()"
        >
          Atualizar cliques
        </button>
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <div class="relative w-full sm:w-80">
          <input
            v-model="search"
            aria-label="Buscar cliques sem lead"
            placeholder="Buscar campanha, serviço ou página..."
            class="min-h-[44px] w-full rounded-xl bg-slate-800 border border-white/10 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <label class="flex gap-2 items-center text-xs text-slate-300 cursor-pointer">
          <input v-model="campaignOnly" type="checkbox" class="rounded border-slate-700 bg-slate-800" />
          <span>Com campanha identificada</span>
        </label>
      </div>

      <p v-if="error" role="alert" class="text-rose-400 text-xs">
        Não foi possível carregar os cliques. Tente atualizar.
      </p>
      <p v-else-if="status === 'pending'" class="text-xs text-slate-400">
        Carregando cliques...
      </p>
      <template v-else>
        <p v-if="!filtered.length" class="text-xs text-slate-400 py-4 text-center">
          Nenhum clique sem identificação encontrado.
        </p>
        <div v-else class="space-y-2.5">
          <div
            v-for="item in visible"
            :key="item.id"
            class="rounded-xl border border-white/10 p-3.5 sm:p-4 space-y-2 break-words bg-slate-800/40"
          >
            <div class="flex flex-wrap justify-between items-center gap-2">
              <strong class="text-white text-sm">{{ item.service }}</strong>
              <span class="text-xs text-amber-300 font-medium">Contato a confirmar · {{ item.clicks }} clique(s)</span>
            </div>
            <p class="text-xs text-slate-300">
              Campanha: {{ item.campaign || (item.campaign_id ? `ID ${item.campaign_id}` : 'Não identificada') }}
            </p>
            <p class="text-[11px] text-slate-400">
              {{ item.source }} · {{ date(item.created_at) }} · {{ item.page }}
            </p>
            <p v-if="item.keyword" class="text-xs text-slate-300">
              Palavra-chave: {{ item.keyword }}
            </p>
            <p v-if="item.has_click_id" class="text-xs text-emerald-400 font-semibold">
              Identificador Google Ads registrado
            </p>
          </div>

          <div class="flex items-center justify-between gap-2 text-xs pt-2">
            <button
              :disabled="page === 1"
              class="min-h-[40px] px-3.5 rounded-xl bg-white/5 disabled:opacity-30 text-slate-300 hover:text-white transition-colors cursor-pointer"
              @click="page--"
            >
              Anterior
            </button>
            <span class="text-slate-400 font-mono">{{ page }} / {{ Math.max(1, Math.ceil(filtered.length / 20)) }}</span>
            <button
              :disabled="page * 20 >= filtered.length"
              class="min-h-[40px] px-3.5 rounded-xl bg-white/5 disabled:opacity-30 text-slate-300 hover:text-white transition-colors cursor-pointer"
              @click="page++"
            >
              Próxima
            </button>
          </div>
        </div>
      </template>

      <details class="border-t border-white/10 pt-4" @toggle="showAttributions = ($event.target as HTMLDetailsElement).open">
        <summary class="cursor-pointer min-h-[44px] text-emerald-400 text-xs font-semibold hover:text-emerald-300 flex items-center gap-1.5">
          <span>Vincular código do WhatsApp a um cliente existente</span>
        </summary>
        <div class="mt-3">
          <WhatsappAttributionSection v-if="showAttributions" />
        </div>
      </details>
    </div>
  </section>
</template>
