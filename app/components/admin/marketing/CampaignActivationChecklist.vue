<script setup lang="ts">
import { ref } from 'vue'

interface ChecklistItem {
  id: string
  title: string
  platform: string
  channel: string
  utmCampaign: string
  urlTemplate: string
  instruction: string
  status: 'nao_configurado' | 'pronto' | 'aplicado' | 'validado'
  validationResult?: {
    checked: boolean
    first_seen: string | null
    last_seen: string | null
    sessions: number
    whatsapp_clicks: number
    leads: number
  }
}

const items = ref<ChecklistItem[]>([
  {
    id: 'ig_bio',
    title: 'Instagram Bio',
    platform: 'Instagram',
    channel: 'instagram',
    utmCampaign: 'bio',
    urlTemplate: 'https://www.adtelasmosquiteiras.com.br/?utm_source=instagram&utm_medium=social&utm_campaign=bio',
    instruction: 'Inserir no campo "Link" / "Site" da biografia do perfil oficial no Instagram.',
    status: 'pronto'
  },
  {
    id: 'fb_page',
    title: 'Facebook Page / Botão',
    platform: 'Facebook',
    channel: 'facebook',
    utmCampaign: 'page',
    urlTemplate: 'https://www.adtelasmosquiteiras.com.br/?utm_source=facebook&utm_medium=social&utm_campaign=page',
    instruction: 'Utilizar no botão de ação da Página do Facebook ou em postagens institucionais.',
    status: 'pronto'
  },
  {
    id: 'ig_ads',
    title: 'Instagram Ads',
    platform: 'Instagram Ads',
    channel: 'meta_ads',
    utmCampaign: '{{campaign.name}}',
    urlTemplate: 'https://www.adtelasmosquiteiras.com.br/?utm_source=instagram&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}',
    instruction: 'Inserir como URL de destino nos anúncios configurados para veiculação no Instagram.',
    status: 'pronto'
  },
  {
    id: 'fb_ads',
    title: 'Facebook Ads',
    platform: 'Facebook Ads',
    channel: 'meta_ads',
    utmCampaign: '{{campaign.name}}',
    urlTemplate: 'https://www.adtelasmosquiteiras.com.br/?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}',
    instruction: 'Inserir como URL de destino nos anúncios configurados no Gerenciador do Meta.',
    status: 'pronto'
  },
  {
    id: 'tt_bio',
    title: 'TikTok Bio',
    platform: 'TikTok',
    channel: 'tiktok',
    utmCampaign: 'bio',
    urlTemplate: 'https://www.adtelasmosquiteiras.com.br/?utm_source=tiktok&utm_medium=social&utm_campaign=bio',
    instruction: 'Inserir na biografia da conta comercial oficial no TikTok.',
    status: 'pronto'
  },
  {
    id: 'tt_ads_std',
    title: 'TikTok Ads Standard',
    platform: 'TikTok Ads',
    channel: 'tiktok_ads',
    utmCampaign: '__CAMPAIGN_NAME__',
    urlTemplate: 'https://www.adtelasmosquiteiras.com.br/?utm_source=tiktok&utm_medium=cpc&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__',
    instruction: 'Utilizar na URL de destino das campanhas convencionais do TikTok Ads.',
    status: 'pronto'
  },
  {
    id: 'tt_ads_smart',
    title: 'TikTok Ads Smart+',
    platform: 'TikTok Ads',
    channel: 'tiktok_ads',
    utmCampaign: 'smart_plus',
    urlTemplate: 'https://www.adtelasmosquiteiras.com.br/?utm_source=tiktok&utm_medium=cpc&utm_campaign=smart_plus&utm_content=__CID_NAME__',
    instruction: 'Utilizar na URL de destino das campanhas automáticas Smart+ do TikTok Ads.',
    status: 'pronto'
  }
])

const copiedId = ref<string | null>(null)
const validatingId = ref<string | null>(null)

async function copyLink(item: ChecklistItem) {
  try {
    await navigator.clipboard.writeText(item.urlTemplate)
    copiedId.value = item.id
    setTimeout(() => { copiedId.value = null }, 2000)
  } catch {
    // fallback
  }
}

function setStatus(item: ChecklistItem, newStatus: ChecklistItem['status']) {
  item.status = newStatus
}

async function validateTraffic(item: ChecklistItem) {
  validatingId.value = item.id
  const now = new Date()
  const to = now.toISOString().slice(0, 10)
  const past = new Date(now.getTime() - 60 * 24 * 3600 * 1000)
  const from = past.toISOString().slice(0, 10)

  try {
    const res = await $fetch<{ data: any }>(
      `/api/admin/marketing/campaign-kpis/tracking-data?channel=${encodeURIComponent(item.channel)}&from=${from}&to=${to}`
    )
    const d = res.data || {}
    item.validationResult = {
      checked: true,
      first_seen: d.first_seen,
      last_seen: d.last_seen,
      sessions: d.sessions || 0,
      whatsapp_clicks: d.whatsapp_clicks || 0,
      leads: d.leads || 0
    }
    if (d.sessions > 0) {
      item.status = 'validado'
    }
  } catch {
    item.validationResult = {
      checked: true,
      first_seen: null,
      last_seen: null,
      sessions: 0,
      whatsapp_clicks: 0,
      leads: 0
    }
  } finally {
    validatingId.value = null
  }
}

const STATUS_LABELS: Record<ChecklistItem['status'], { label: string; badgeClass: string }> = {
  nao_configurado: { label: 'Não configurado', badgeClass: 'bg-slate-700 text-slate-300' },
  pronto: { label: 'Pronto para aplicar', badgeClass: 'bg-sky-500/20 text-sky-300 border border-sky-500/30' },
  aplicado: { label: 'Aplicado', badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
  validado: { label: 'Validado', badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
}
</script>

<template>
  <div class="flex flex-col gap-4 w-full max-w-full min-w-0">
    <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
      <div class="flex items-center gap-2 mb-1">
        <Icon name="lucide:check-circle" class="w-4 h-4 text-cyan-400" />
        <h3 class="text-sm font-bold text-white">Checklist de Ativação de Links Reais (Fase 7A)</h3>
      </div>
      <p class="text-xs text-slate-400 leading-relaxed">
        Gerencie a ativação manual dos links rastreados nas plataformas externas. A validação consulta exclusivamente o tráfego real observado no banco de dados e nunca fabrica eventos sintéticos.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-3">
      <div
        v-for="item in items"
        :key="item.id"
        class="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 transition-all"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-white">{{ item.title }}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold" :class="STATUS_LABELS[item.status].badgeClass">
              {{ STATUS_LABELS[item.status].label }}
            </span>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              v-if="item.status !== 'aplicado' && item.status !== 'validado'"
              @click="setStatus(item, 'aplicado')"
              type="button"
              class="px-2.5 py-1 text-[11px] rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
            >
              Marcar como Aplicado
            </button>
            <button
              v-else-if="item.status === 'aplicado'"
              @click="setStatus(item, 'pronto')"
              type="button"
              class="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              Reverter para Pronto
            </button>
            <button
              @click="validateTraffic(item)"
              :disabled="validatingId === item.id"
              type="button"
              class="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all disabled:opacity-50"
            >
              <Icon :name="validatingId === item.id ? 'lucide:loader' : 'lucide:search'" class="w-3 h-3" :class="validatingId === item.id ? 'animate-spin' : ''" />
              <span>Validar Tráfego</span>
            </button>
          </div>
        </div>

        <p class="text-xs text-slate-400">{{ item.instruction }}</p>

        <div class="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-white/5">
          <code class="text-[11px] font-mono text-cyan-300 break-all flex-1 select-all">{{ item.urlTemplate }}</code>
          <button
            @click="copyLink(item)"
            type="button"
            class="px-3 py-1 text-[11px] font-bold rounded-lg shrink-0 transition-all flex items-center gap-1"
            :class="copiedId === item.id ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'"
          >
            <Icon :name="copiedId === item.id ? 'lucide:check' : 'lucide:copy'" class="w-3 h-3" />
            <span>{{ copiedId === item.id ? 'Copiado!' : 'Copiar' }}</span>
          </button>
        </div>

        <!-- Validation Details Box -->
        <div v-if="item.validationResult?.checked" class="mt-1 p-3 rounded-xl bg-slate-900/80 border border-white/5 text-xs flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <span class="text-slate-400 font-semibold">Telemetria Real de Tráfego:</span>
            <span :class="item.validationResult.sessions > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'">
              {{ item.validationResult.sessions > 0 ? 'Tráfego Confirmado no Site' : 'Nenhum acesso registrado ainda' }}
            </span>
          </div>
          <div v-if="item.validationResult.sessions > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-300">
            <div>Sessões: <strong class="text-white">{{ item.validationResult.sessions }}</strong></div>
            <div>WhatsApp: <strong class="text-emerald-400">{{ item.validationResult.whatsapp_clicks }}</strong></div>
            <div>Leads: <strong class="text-amber-400">{{ item.validationResult.leads }}</strong></div>
            <div class="truncate" :title="item.validationResult.first_seen || ''">
              Primeiro: <strong class="text-slate-400">{{ item.validationResult.first_seen ? item.validationResult.first_seen.slice(0, 10) : '—' }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
