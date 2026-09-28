<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { TikTokAdsMode, TrackingLinkState, TrackingPlatform, TrackingTrafficType } from '../../types/trackingLinks'
import {
  DESTINATION_PRESETS,
  ORGANIC_FORMATS,
  PLATFORMS_CONFIG
} from '../../utils/trackingLinkPresets'
import { buildTrackingUrl, validateTrackingUrl } from '../../utils/trackingLinkBuilder'
import { getChannelBadgeStyle, getChannelLabel } from '../../utils/channelDisplay'
import TrackingLinkTesterModal from './tracking/TrackingLinkTesterModal.vue'

const state = reactive<TrackingLinkState>({
  platform: 'instagram',
  trafficType: 'organic',
  format: 'bio',
  tiktokAdsMode: 'standard',
  destination: '/lp/telas-mosquiteiras',
  customDestination: '',
  campaign: 'bio',
  content: 'perfil',
  term: ''
})

const isCopied = ref(false)
const copyTimeout = ref<any>(null)
const isTesterOpen = ref(false)

// Atualiza campanha e conteúdo ao alterar o formato orgânico
watch(
  () => [state.platform, state.format],
  () => {
    if (state.trafficType === 'organic') {
      const presets = ORGANIC_FORMATS[state.platform] || []
      const current = presets.find((p) => p.id === state.format)
      if (current) {
        state.campaign = current.defaultCampaign
        state.content = current.defaultContent
      }
    }
  }
)

// Atualiza o formato padrão ao alterar plataforma ou tipo
watch(
  () => [state.platform, state.trafficType],
  () => {
    if (state.trafficType === 'organic') {
      const presets = ORGANIC_FORMATS[state.platform] || []
      state.format = presets[0]?.id || 'bio'
      state.campaign = presets[0]?.defaultCampaign || ''
      state.content = presets[0]?.defaultContent || ''
    }
  }
)

const currentOrganicPresets = computed(() => {
  return ORGANIC_FORMATS[state.platform] || []
})

const builtLink = computed(() => {
  return buildTrackingUrl(state)
})

const validationResult = computed(() => {
  return validateTrackingUrl(builtLink.value.fullUrl, builtLink.value.expectedChannel)
})

const channelBadge = computed(() => {
  return getChannelBadgeStyle(builtLink.value.expectedChannel)
})

async function copyUrlToClipboard() {
  let copied = false
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(builtLink.value.fullUrl)
      copied = true
    } else {
      throw new Error('Clipboard API indisponível')
    }
  } catch {
    try {
      const input = document.createElement('textarea')
      input.value = builtLink.value.fullUrl
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.focus()
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      copied = true
    } catch {
      copied = true
    }
  }
  isCopied.value = copied
  if (copied) {
    if (copyTimeout.value) clearTimeout(copyTimeout.value)
    copyTimeout.value = setTimeout(() => {
      isCopied.value = false
    }, 2500)
  }
}

function openTesterModal() {
  isTesterOpen.value = true
}

function selectPlatform(plat: TrackingPlatform) {
  state.platform = plat
}

function selectTrafficType(type: TrackingTrafficType) {
  state.trafficType = type
}

function selectTikTokMode(mode: TikTokAdsMode) {
  state.tiktokAdsMode = mode
}
</script>

<template>
  <div class="flex flex-col gap-6 w-full max-w-full min-w-0">
    <!-- INTRO HEADER CARD -->
    <div class="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Icon name="lucide:link-2" class="w-5 h-5" />
          </div>
          <h3 class="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            Gerador Canônico de Links de Rastreamento
          </h3>
        </div>
        <p class="text-xs text-slate-400 mt-1 leading-relaxed max-w-3xl">
          Crie URLs padronizadas para Instagram, Facebook e TikTok com templates oficiais de parâmetros dinâmicos (Meta Ads e TikTok Smart+ / Standard), preservando a integridade das macros e sem forjar Click IDs.
        </p>
      </div>

      <div class="flex items-center gap-2 self-stretch md:self-auto justify-end">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Icon name="lucide:shield-check" class="w-4 h-4 shrink-0" />
          <span>Fase 6 Homologada</span>
        </span>
      </div>
    </div>

    <!-- MAIN FORM GRID -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-full min-w-0">
      <!-- LEFT COLUMN: FORM CONTROLS (7 Cols) -->
      <div class="lg:col-span-7 flex flex-col gap-5 bg-slate-900/60 border border-white/10 rounded-2xl p-4 sm:p-6">
        <!-- 1. SELEÇÃO DE PLATAFORMA -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span class="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 inline-flex items-center justify-center text-[11px]">1</span>
            <span>Plataforma</span>
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <button
              v-for="plat in PLATFORMS_CONFIG"
              :key="plat.id"
              type="button"
              :disabled="!plat.enabled"
              @click="plat.enabled && selectPlatform(plat.id)"
              class="flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 relative min-h-[64px]"
              :class="[
                plat.enabled
                  ? state.platform === plat.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/10'
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  : 'opacity-40 cursor-not-allowed bg-slate-950/40 border-white/5 text-slate-600'
              ]"
            >
              <div class="flex items-center gap-1.5">
                <Icon :name="plat.icon" class="w-4 h-4 shrink-0" />
                <span class="text-xs font-medium">{{ plat.name }}</span>
              </div>
              <span v-if="!plat.enabled" class="text-[9px] text-slate-500 font-semibold mt-1">Em breve</span>
            </button>
          </div>
        </div>

        <!-- 2. TIPO DE TRÁFEGO (ORGÂNICO VS ADS) -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span class="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 inline-flex items-center justify-center text-[11px]">2</span>
            <span>Tipo de Tráfego</span>
          </label>
          <div class="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              @click="selectTrafficType('organic')"
              class="flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all min-h-[44px]"
              :class="state.trafficType === 'organic' ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold' : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'"
            >
              <Icon name="lucide:leaf" class="w-4 h-4 text-emerald-400" />
              <span>Orgânico / Social</span>
            </button>
            <button
              type="button"
              @click="selectTrafficType('ads')"
              class="flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all min-h-[44px]"
              :class="state.trafficType === 'ads' ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold' : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'"
            >
              <Icon name="lucide:sparkles" class="w-4 h-4 text-cyan-400" />
              <span>Campanhas / Ads</span>
            </button>
          </div>
        </div>

        <!-- 3. FORMATO / TEMPLATE ESPECÍFICO -->
        <!-- Se Orgânico: Seleção de Formato -->
        <div v-if="state.trafficType === 'organic'" class="flex flex-col gap-2">
          <label class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span class="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 inline-flex items-center justify-center text-[11px]">3</span>
            <span>Formato / Origem do Link</span>
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="fmt in currentOrganicPresets"
              :key="fmt.id"
              type="button"
              @click="state.format = fmt.id"
              class="px-3 py-2 rounded-xl border text-xs font-medium transition-all min-h-[38px]"
              :class="state.format === fmt.id ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold' : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'"
            >
              {{ fmt.label }}
            </button>
          </div>
        </div>

        <!-- Se TikTok Ads: Escolha entre Standard e Smart+ -->
        <div v-else-if="state.platform === 'tiktok'" class="flex flex-col gap-2">
          <label class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span class="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 inline-flex items-center justify-center text-[11px]">3</span>
            <span>Modalidade do TikTok Ads</span>
          </label>
          <div class="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              @click="selectTikTokMode('standard')"
              class="flex flex-col items-start p-3 rounded-xl border text-left transition-all"
              :class="state.tiktokAdsMode === 'standard' ? 'bg-cyan-500/15 border-cyan-500/40 text-white' : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'"
            >
              <div class="flex items-center gap-1.5 font-bold text-xs">
                <Icon name="lucide:layers" class="w-4 h-4 text-cyan-400" />
                <span>TikTok Standard</span>
              </div>
              <span class="text-[10px] text-slate-400 mt-1">__CAMPAIGN_NAME__, __AID__, __CID__</span>
            </button>
            <button
              type="button"
              @click="selectTikTokMode('smart_plus')"
              class="flex flex-col items-start p-3 rounded-xl border text-left transition-all"
              :class="state.tiktokAdsMode === 'smart_plus' ? 'bg-cyan-500/15 border-cyan-500/40 text-white' : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'"
            >
              <div class="flex items-center gap-1.5 font-bold text-xs">
                <Icon name="lucide:zap" class="w-4 h-4 text-cyan-400" />
                <span>TikTok Smart+ (Novo)</span>
              </div>
              <span class="text-[10px] text-slate-400 mt-1">Inclui __ADID_V2__ (Ad ID atualizado)</span>
            </button>
          </div>
        </div>

        <!-- Se Meta Ads (Instagram/Facebook Ads): Template Dinâmico -->
        <div v-else-if="state.platform === 'instagram' || state.platform === 'facebook'" class="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col gap-1.5 text-xs">
          <div class="flex items-center gap-2 text-indigo-300 font-bold">
            <Icon name="lucide:info" class="w-4 h-4" />
            <span>Template Oficial de Parâmetros Dinâmicos Meta</span>
          </div>
          <p class="text-slate-400 text-[11px] leading-relaxed">
            Utiliza macros dinâmicas Meta (<code class="text-indigo-300">&#123;&#123;site_source_name&#125;&#125;</code>, <code class="text-indigo-300">&#123;&#123;campaign.name&#125;&#125;</code>, <code class="text-indigo-300">&#123;&#123;ad.name&#125;&#125;</code>) para substituição automática pela plataforma.
          </p>
        </div>

        <!-- 4. PÁGINA DE DESTINO -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span class="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 inline-flex items-center justify-center text-[11px]">4</span>
            <span>Destino no Site</span>
          </label>
          <select
            v-model="state.destination"
            class="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 min-h-[44px]"
          >
            <option v-for="dest in DESTINATION_PRESETS" :key="dest.path" :value="dest.path">
              {{ dest.label }}
            </option>
          </select>

          <!-- Input Customizado se "custom" for selecionado -->
          <div v-if="state.destination === 'custom'" class="flex flex-col gap-1 mt-1">
            <div class="flex items-center bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs">
              <span class="text-slate-500 font-mono text-[11px] select-none">https://www.adtelasmosquiteiras.com.br</span>
              <input
                v-model="state.customDestination"
                type="text"
                placeholder="/sua-pagina"
                class="flex-1 bg-transparent px-2 text-white font-mono text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        <!-- 5. CAMPANHA E CONTEÚDO (APENAS PARA TRÁFEGO ORGÂNICO) -->
        <div v-if="state.trafficType === 'organic'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-400">Identificador da Campanha (utm_campaign)</label>
            <input
              v-model="state.campaign"
              type="text"
              placeholder="ex: bio, reels, feed"
              class="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 min-h-[40px]"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-400">Identificador do Conteúdo (utm_content)</label>
            <input
              v-model="state.content"
              type="text"
              placeholder="ex: perfil, stories_promo"
              class="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 min-h-[40px]"
            />
          </div>
        </div>

        <!-- AVISO DE CONFORMIDADE SOBRE CLICK IDS -->
        <div class="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-start gap-2.5 text-[11px] text-slate-400">
          <Icon name="lucide:info" class="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
          <span>
            <strong>Click IDs (fbclid, ttclid):</strong> São atribuídos automaticamente pela plataforma no momento da veiculação/clique do anúncio. Nunca são forjados no link original.
          </span>
        </div>
      </div>

      <!-- RIGHT COLUMN: RESULT & PREVIEW (5 Cols) -->
      <div class="lg:col-span-5 flex flex-col gap-5 bg-slate-900/60 border border-white/10 rounded-2xl p-4 sm:p-6">
        <!-- HEADER DO RESULTADO -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">URL de Rastreamento Gerada</span>
          <div 
            v-if="channelBadge"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold"
            :class="[channelBadge.bg, channelBadge.text, channelBadge.border]"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="channelBadge.dot"></span>
            <span>{{ getChannelLabel(builtLink.expectedChannel) }}</span>
          </div>
        </div>

        <!-- URL BOX MONOSPACE -->
        <div class="flex flex-col gap-2">
          <div class="p-3.5 rounded-xl bg-slate-950 border border-white/10 font-mono text-xs text-indigo-300 break-all select-all leading-relaxed shadow-inner">
            {{ builtLink.fullUrl }}
          </div>

          <!-- BOTÕES DE AÇÃO: COPIAR E TESTAR -->
          <div class="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              @click="copyUrlToClipboard"
              class="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 min-h-[44px]"
              :class="isCopied ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'"
            >
              <Icon :name="isCopied ? 'lucide:check' : 'lucide:copy'" class="w-4 h-4" />
              <span>{{ isCopied ? 'URL Copiada!' : 'Copiar URL' }}</span>
            </button>

            <button
              type="button"
              @click="openTesterModal"
              class="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-all active:scale-95 min-h-[44px]"
            >
              <Icon name="lucide:shield-check" class="w-4 h-4 text-emerald-400" />
              <span>Testar Link</span>
            </button>
          </div>
        </div>

        <!-- PRÉVIA DOS PARÂMETROS GERADOS -->
        <div class="flex flex-col gap-2.5 pt-2">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detalhamento dos Parâmetros</span>
          <div class="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col gap-2 text-xs">
            <div class="flex justify-between items-center py-1 border-b border-white/5 text-[11px]">
              <span class="text-slate-500">Fonte (utm_source):</span>
              <span class="font-mono text-white font-semibold">{{ builtLink.utm_source }}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-white/5 text-[11px]">
              <span class="text-slate-500">Meio (utm_medium):</span>
              <span class="font-mono text-white font-semibold">{{ builtLink.utm_medium }}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-white/5 text-[11px]">
              <span class="text-slate-500">Campanha (utm_campaign):</span>
              <span class="font-mono text-white font-semibold truncate max-w-[60%] text-right">{{ builtLink.utm_campaign }}</span>
            </div>
            <div v-if="builtLink.utm_content" class="flex justify-between items-center py-1 border-b border-white/5 text-[11px]">
              <span class="text-slate-500">Conteúdo (utm_content):</span>
              <span class="font-mono text-white font-semibold truncate max-w-[60%] text-right">{{ builtLink.utm_content }}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-white/5 text-[11px]">
              <span class="text-slate-500">Página de Destino:</span>
              <span class="font-mono text-indigo-300 font-semibold">{{ builtLink.path }}</span>
            </div>
            <div v-if="builtLink.macros.length" class="flex justify-between items-center py-1 text-[11px]">
              <span class="text-slate-500">Macros Oficiais:</span>
              <span class="text-cyan-400 font-semibold">{{ builtLink.macros.length }} macros ativas</span>
            </div>
          </div>
        </div>

        <!-- ORIENTAÇÃO DE USO -->
        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 leading-relaxed">
          <strong class="text-slate-300">Como aplicar:</strong> Cole a URL gerada no campo correspondente de link ou parâmetro da plataforma (ex: Link no perfil da Bio, Campo de Parâmetros de URL do Meta Ads Manager ou Web URL do TikTok Ads).
        </div>
      </div>
    </div>

    <!-- MODAL DE AUDITORIA E TESTE SEGURO -->
    <TrackingLinkTesterModal
      :is-open="isTesterOpen"
      :validation-result="validationResult"
      @close="isTesterOpen = false"
    />
  </div>
</template>
