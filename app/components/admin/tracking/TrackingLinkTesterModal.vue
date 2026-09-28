<script setup lang="ts">
import { computed } from 'vue'
import type { LinkValidationResult } from '../../../types/trackingLinks'
import { getChannelBadgeStyle, getChannelLabel } from '../../../utils/channelDisplay'

const props = defineProps<{
  isOpen: boolean
  validationResult: LinkValidationResult | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const badgeStyle = computed(() => {
  if (!props.validationResult) return null
  return getChannelBadgeStyle(props.validationResult.expectedChannel)
})

const isMetaDynamic = computed(() => {
  return props.validationResult?.params?.utm_source === '{{site_source_name}}'
})

const isTikTokAds = computed(() => {
  return props.validationResult?.params?.utm_source === 'tiktok' && props.validationResult?.params?.utm_medium === 'paid_social'
})

function getParamCategory(key: string): string {
  if (key.startsWith('utm_')) return 'Parâmetro UTM Padrão'
  if (key.startsWith('meta_')) return 'Metadados Meta Ads'
  if (key.startsWith('tiktok_')) return 'Metadados TikTok Ads'
  return 'Parâmetro de Consulta'
}
</script>

<template>
  <div 
    v-if="isOpen && validationResult" 
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    @click.self="emit('close')"
  >
    <div 
      class="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col gap-5 text-slate-100 max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <!-- HEADER -->
      <div class="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Icon name="lucide:shield-check" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Auditoria e Pré-Visualização Segura</span>
            </h3>
            <p class="text-xs text-slate-400">Verificação estática de sintaxe e classificação sem poluir analytics</p>
          </div>
        </div>

        <button 
          @click="emit('close')" 
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Fechar"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- SAFETY NOTICE -->
      <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
        <Icon name="lucide:check-circle-2" class="w-4 h-4 shrink-0 text-emerald-400" />
        <span><strong>100% Seguro:</strong> Nenhum registro gravado no banco de dados (zero pageviews, zero lead_clicks).</span>
      </div>

      <!-- URL EXAMINADA -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">URL do Link Auditado</label>
        <div class="p-3 rounded-xl bg-slate-950 border border-white/10 font-mono text-xs text-indigo-300 break-all select-all">
          {{ validationResult.url }}
        </div>
      </div>

      <!-- CANAL ESPERADO / CLASSIFICAÇÃO -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col gap-2">
          <span class="text-[11px] font-bold text-slate-400 uppercase">Canal Canônico Destinado</span>
          <div 
            v-if="badgeStyle"
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold w-fit"
            :class="[badgeStyle.bg, badgeStyle.text, badgeStyle.border]"
          >
            <span class="w-2 h-2 rounded-full" :class="badgeStyle.dot"></span>
            <Icon :name="badgeStyle.icon" class="w-4 h-4" />
            <span>{{ getChannelLabel(validationResult.expectedChannel) }}</span>
          </div>
        </div>

        <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col gap-2">
          <span class="text-[11px] font-bold text-slate-400 uppercase">Status da Validação</span>
          <div class="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Icon name="lucide:check" class="w-4 h-4" />
            <span>Sintaxe e Parâmetros Válidos</span>
          </div>
          <span class="text-[11px] text-slate-400">Destino: <strong class="text-white">{{ validationResult.path }}</strong></span>
        </div>
      </div>

      <!-- EXPLICAÇÃO DE RESOLUÇÃO DE MACROS META ADS -->
      <div v-if="isMetaDynamic" class="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col gap-2 text-xs text-slate-300">
        <div class="flex items-center gap-2 text-indigo-300 font-bold">
          <Icon name="lucide:sparkles" class="w-4 h-4 text-indigo-400" />
          <span>Resolução Dinâmica da Plataforma Meta Ads</span>
        </div>
        <p class="text-slate-400 leading-relaxed text-[11px]">
          No Gerador de Anúncios do Meta, as macros são preservadas literalmente. No momento do clique do usuário real:
        </p>
        <ul class="list-disc list-inside space-y-1 text-[11px] text-slate-300 pl-1">
          <li>Se o usuário clicar no <strong>Instagram</strong>, <code class="text-pink-300">&#123;&#123;site_source_name&#125;&#125;</code> vira <code class="text-pink-300">ig</code> ➔ classificado como <strong class="text-pink-300">Instagram Ads (instagram_ads)</strong>.</li>
          <li>Se o usuário clicar no <strong>Facebook</strong>, <code class="text-blue-300">&#123;&#123;site_source_name&#125;&#125;</code> vira <code class="text-blue-300">fb</code> ➔ classificado como <strong class="text-blue-300">Facebook Ads (facebook_ads)</strong>.</li>
          <li>O parâmetro <code class="text-indigo-300">fbclid</code> será adicionado automaticamente pelo Meta no redirecionamento.</li>
        </ul>
      </div>

      <!-- EXPLICAÇÃO DE RESOLUÇÃO DE MACROS TIKTOK ADS -->
      <div v-if="isTikTokAds" class="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col gap-2 text-xs text-slate-300">
        <div class="flex items-center gap-2 text-cyan-300 font-bold">
          <Icon name="lucide:video" class="w-4 h-4 text-cyan-400" />
          <span>Resolução de Macros do TikTok Ads Manager</span>
        </div>
        <p class="text-slate-400 leading-relaxed text-[11px]">
          No TikTok Ads Manager, as macros são injetadas em tempo real pela plataforma ao veicular o anúncio:
        </p>
        <ul class="list-disc list-inside space-y-1 text-[11px] text-slate-300 pl-1">
          <li><code class="text-cyan-300">__CAMPAIGN_NAME__</code> e <code class="text-cyan-300">__CAMPAIGN_ID__</code> preenchem a campanha.</li>
          <li><code class="text-cyan-300">__AID_NAME__</code> e <code class="text-cyan-300">__AID__</code> identificam o Grupo de Anúncios (Ad Group).</li>
          <li v-if="validationResult.params?.tiktok_ad_id"><code class="text-cyan-300">__ADID_V2__</code> injeta o ID oficial de Ad da experiência Smart+.</li>
          <li><code class="text-cyan-300">__CID__</code> e <code class="text-cyan-300">__CID_NAME__</code> identificam o Criativo.</li>
          <li>O parâmetro <code class="text-cyan-300">ttclid</code> será anexado automaticamente pelo TikTok na navegação.</li>
        </ul>
      </div>

      <!-- TABELA DE PARÂMETROS -->
      <div class="flex flex-col gap-2">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Parâmetros Mapeados ({{ Object.keys(validationResult.params).length }})</span>
        <div class="border border-white/10 rounded-xl overflow-hidden text-xs">
          <div class="max-h-48 overflow-y-auto divide-y divide-white/5 bg-slate-950/60">
            <div 
              v-for="(val, key) in validationResult.params" 
              :key="key"
              class="flex items-center justify-between p-2.5 hover:bg-white/[0.02]"
            >
              <div class="flex flex-col min-w-0 pr-3">
                <span class="font-mono font-bold text-slate-200">{{ key }}</span>
                <span class="text-[10px] text-slate-500">{{ getParamCategory(String(key)) }}</span>
              </div>
              <div class="font-mono text-indigo-300 text-[11px] truncate max-w-[60%] text-right select-all">
                {{ val }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CHECKLIST DE CONFORMIDADE -->
      <div class="flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs">
        <span class="text-[11px] font-bold text-slate-400 uppercase">Checklist de Conformidade Técnica</span>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-[11px] mt-1">
          <div class="flex items-center gap-2">
            <Icon name="lucide:check" class="w-3.5 h-3.5 text-emerald-400" />
            <span>Domínio canônico verificado</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:check" class="w-3.5 h-3.5 text-emerald-400" />
            <span>Nenhum Click ID forjado</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:check" class="w-3.5 h-3.5 text-emerald-400" />
            <span>Macros preservadas literalmente</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:check" class="w-3.5 h-3.5 text-emerald-400" />
            <span>Compatível com Classificador Canônico</span>
          </div>
        </div>
      </div>

      <!-- ACTIONS -->
      <div class="flex justify-end pt-2">
        <button 
          @click="emit('close')"
          class="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-all active:scale-95"
        >
          Concluir Visualização
        </button>
      </div>
    </div>
  </div>
</template>
