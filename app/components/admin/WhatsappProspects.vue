<script setup lang="ts">
import WhatsappAttributionSection from './WhatsappAttributionSection.vue'
const { data, status, error, refresh } = await useFetch<any>('/api/admin/whatsapp-prospects')
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
function date(value: string) { return new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) }
</script>

<template>
  <section class="rounded-2xl border border-emerald-500/20 bg-slate-900 p-4 space-y-4 text-slate-200">
    <div class="flex flex-wrap justify-between gap-3">
      <h2 class="font-bold text-lg">Leads do WhatsApp — contato a confirmar</h2>
      <button class="min-h-[44px] px-4 rounded-lg bg-white/10" @click="refresh()">Atualizar cliques</button>
    </div>
    <p class="text-sm text-slate-400">{{ data?.items?.length || 0 }} oportunidades por sessão e campanha. Cliques repetidos ficam agrupados. O clique não confirma uma mensagem recebida e não informa o telefone do visitante.</p>
    <div class="flex flex-wrap gap-4 items-center">
      <input v-model="search" aria-label="Buscar leads do WhatsApp" placeholder="Buscar campanha, serviço ou página" class="min-h-[44px] w-full sm:w-80 rounded-lg bg-slate-800 px-3" />
      <label class="flex gap-2 items-center text-sm"><input v-model="campaignOnly" type="checkbox" /> Com campanha identificada</label>
    </div>
    <p v-if="error" role="alert" class="text-red-300">Não foi possível carregar os cliques. Tente atualizar.</p>
    <p v-else-if="status === 'pending'">Carregando…</p>
    <template v-else>
      <p v-if="!filtered.length" class="text-sm">Nenhum clique encontrado.</p>
      <div v-for="item in visible" :key="item.id" class="rounded-xl border border-white/10 p-4 space-y-2 break-words">
        <div class="flex flex-wrap justify-between gap-2"><strong>{{ item.service }}</strong><span class="text-xs text-amber-300">Contato a confirmar · {{ item.clicks }} clique(s)</span></div>
        <p class="text-sm">Campanha: {{ item.campaign || (item.campaign_id ? `ID ${item.campaign_id}` : 'Não identificada') }}</p>
        <p v-if="item.campaign && item.campaign_id" class="text-xs text-slate-400">ID da campanha: {{ item.campaign_id }}</p>
        <p class="text-xs text-slate-400">{{ item.source }} · {{ date(item.created_at) }} · {{ item.page }}</p>
        <p v-if="item.keyword" class="text-xs">Palavra-chave registrada: {{ item.keyword }}</p>
        <p v-if="item.has_click_id" class="text-xs text-emerald-300">Identificador de clique do Google registrado</p>
      </div>
      <div class="flex items-center justify-between gap-2 text-sm">
        <button :disabled="page === 1" class="min-h-[44px] px-3 disabled:opacity-30" @click="page--">Anterior</button>
        <span>{{ page }} / {{ Math.max(1, Math.ceil(filtered.length / 20)) }}</span>
        <button :disabled="page * 20 >= filtered.length" class="min-h-[44px] px-3 disabled:opacity-30" @click="page++">Próxima</button>
      </div>
    </template>
    <details class="border-t border-white/10 pt-4" @toggle="showAttributions = ($event.target as HTMLDetailsElement).open">
      <summary class="cursor-pointer min-h-[44px] text-emerald-300">Vincular código do WhatsApp a um cliente</summary>
      <WhatsappAttributionSection v-if="showAttributions" />
    </details>
  </section>
</template>
