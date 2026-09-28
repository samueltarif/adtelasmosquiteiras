<script setup lang="ts">
import type { AdminWhatsappAttribution } from '~/types/adminWhatsappAttribution'
import { getChannelLabel, getChannelBadgeStyle } from '~/utils/channelDisplay'

const props = defineProps<{
  item: AdminWhatsappAttribution
  copiedCode: string | null
}>()

const emit = defineEmits<{
  (e: 'copy-code', code: string): void
  (e: 'view-journey', item: AdminWhatsappAttribution): void
  (e: 'create-client', item: AdminWhatsappAttribution): void
  (e: 'open-assign', item: AdminWhatsappAttribution): void
  (e: 'open-dismiss', item: AdminWhatsappAttribution): void
}>()

function formatDatetime(iso?: string | null): string {
  if (!iso) return '—'
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
  <div class="p-4 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div class="space-y-2 flex-1 min-w-0">
      <!-- Cabeçalho do Card: Ref + Canal Canônico + Status + Click ID -->
      <div class="flex items-center gap-2.5 flex-wrap">
        <div class="flex items-center gap-1 font-mono text-sm font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-white/5">
          <span class="text-slate-400 text-xs">REF:</span>
          <span class="text-emerald-400 tracking-wider">{{ item.short_code }}</span>
          <button
            type="button"
            @click="emit('copy-code', item.short_code)"
            class="text-slate-400 hover:text-white transition-colors ml-0.5 cursor-pointer"
            title="Copiar código"
          >
            <Icon v-if="copiedCode === item.short_code" name="lucide:check" class="w-3.5 h-3.5 text-emerald-400" />
            <Icon v-else name="lucide:copy" class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Badge do Canal Canônico (Etapa 5) -->
        <span
          class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5"
          :class="[getChannelBadgeStyle(item.channel).bg, getChannelBadgeStyle(item.channel).text, getChannelBadgeStyle(item.channel).border]"
        >
          <span class="w-2 h-2 rounded-full" :class="getChannelBadgeStyle(item.channel).dot"></span>
          <span>{{ getChannelLabel(item.channel) }}</span>
        </span>

        <!-- Click ID Badge Multicanal -->
        <span
          class="text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1"
          :class="item.has_click_id 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-slate-800 text-slate-400 border-white/5'"
        >
          <Icon :name="item.has_click_id ? 'lucide:check-circle' : 'lucide:help-circle'" class="w-3 h-3" />
          <span>{{ item.has_click_id ? `${item.click_id_type?.toUpperCase()}: capturado` : 'Sem Click ID' }}</span>
        </span>

        <!-- Status Badge -->
        <span
          v-if="item.attribution_status === 'unassigned'"
          class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"
        >
          Aguardando Contato
        </span>
        <span
          v-else-if="item.attribution_status === 'assigned'"
          class="text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1"
          :class="item.confidence_level === 'confirmed'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'"
        >
          <Icon name="lucide:check" class="w-3 h-3" />
          <span>{{ item.confidence_level === 'confirmed' ? 'Confirmada por Ref' : 'Provável (Manual)' }}</span>
        </span>
        <span
          v-else-if="item.attribution_status === 'dismissed'"
          class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/10"
        >
          Dispensado
        </span>
      </div>

      <!-- Dados Principais (Etapa 6) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 text-xs text-slate-400">
        <div class="flex items-center gap-1.5 truncate">
          <Icon name="lucide:target" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span class="text-slate-500">Campanha:</span>
          <span class="text-slate-200 font-medium truncate">{{ item.campaign_name || item.utm_campaign || '—' }}</span>
        </div>

        <div class="flex items-center gap-1.5 truncate">
          <Icon name="lucide:compass" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span class="text-slate-500">Landing:</span>
          <span class="font-mono text-slate-300 truncate">{{ item.landing_path || '/' }}</span>
        </div>

        <div class="flex items-center gap-1.5">
          <Icon name="lucide:clock" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span class="text-slate-500">Clique:</span>
          <span class="text-slate-300 font-mono text-[11px]">{{ formatDatetime(item.clicked_at) }}</span>
        </div>

        <div v-if="item.cta_location" class="flex items-center gap-1.5 truncate">
          <Icon name="lucide:mouse-pointer" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span class="text-slate-500">CTA:</span>
          <span class="text-slate-300 font-mono text-[11px]">{{ item.cta_location }}</span>
        </div>

        <div v-if="item.utm_term" class="flex items-center gap-1.5 truncate">
          <Icon name="lucide:key" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span class="text-slate-500">Termo:</span>
          <span class="text-slate-200 truncate">{{ item.utm_term }}</span>
        </div>
      </div>

      <!-- Dados Secundários Específicos por Canal (Meta / Google / Microsoft / TikTok) -->
      <div
        v-if="item.meta_campaign_id || item.meta_adset_id || item.meta_ad_id || item.meta_placement || item.fbclid || item.google_campaign_id || item.google_adgroup_id || item.google_creative_id || item.gclid || item.msclkid || item.ttclid || item.tiktok_campaign_id || item.tiktok_adgroup_id || item.tiktok_ad_id || item.tiktok_creative_id || item.tiktok_placement"
        class="pt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-mono border-t border-white/5"
      >
        <span v-if="item.meta_campaign_id" class="text-slate-300">CmpID: {{ item.meta_campaign_id }}</span>
        <span v-if="item.meta_adset_id" class="text-slate-300">AdSet: {{ item.meta_adset_id }}</span>
        <span v-if="item.meta_ad_id" class="text-slate-300">Ad: {{ item.meta_ad_id }}</span>
        <span v-if="item.meta_placement" class="text-slate-300">Placement: {{ item.meta_placement }}</span>
        <button
          v-if="item.fbclid"
          type="button"
          @click="emit('copy-code', item.fbclid)"
          class="text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 cursor-pointer"
          title="Copiar FBCLID completo"
        >
          <Icon name="lucide:copy" class="w-3 h-3" />
          <span>FBCLID capturado</span>
        </button>

        <span v-if="item.google_campaign_id" class="text-slate-300">GoogleCmp: {{ item.google_campaign_id }}</span>
        <span v-if="item.google_adgroup_id" class="text-slate-300">AdGroup: {{ item.google_adgroup_id }}</span>
        <span v-if="item.google_creative_id" class="text-slate-300">Creative: {{ item.google_creative_id }}</span>
        <button
          v-if="item.gclid"
          type="button"
          @click="emit('copy-code', item.gclid)"
          class="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          title="Copiar GCLID completo"
        >
          <Icon name="lucide:copy" class="w-3 h-3" />
          <span>GCLID capturado</span>
        </button>

        <button
          v-if="item.msclkid"
          type="button"
          @click="emit('copy-code', item.msclkid)"
          class="text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
          title="Copiar MSCLKID completo"
        >
          <Icon name="lucide:copy" class="w-3 h-3" />
          <span>MSCLKID capturado</span>
        </button>

        <span v-if="item.tiktok_campaign_id" class="text-slate-300">TTCmp: {{ item.tiktok_campaign_id }}</span>
        <span v-if="item.tiktok_adgroup_id" class="text-slate-300">TTGroup: {{ item.tiktok_adgroup_id }}</span>
        <span v-if="item.tiktok_ad_id" class="text-slate-300">TTAd: {{ item.tiktok_ad_id }}</span>
        <span v-if="item.tiktok_creative_id" class="text-slate-300">TTCreative: {{ item.tiktok_creative_id }}</span>
        <span v-if="item.tiktok_placement" class="text-slate-300">TTPlacement: {{ item.tiktok_placement }}</span>
        <button
          v-if="item.ttclid"
          type="button"
          @click="emit('copy-code', item.ttclid)"
          class="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          title="Copiar TTCLID completo"
        >
          <Icon name="lucide:copy" class="w-3 h-3" />
          <span>TTCLID capturado</span>
        </button>
      </div>

      <!-- Se Atribuído: Informações do Cliente CRM Vinculado -->
      <div v-if="item.attribution_status === 'assigned' && item.client" class="pt-2 mt-1 border-t border-white/5 flex items-center gap-3 text-xs flex-wrap">
        <div class="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <Icon name="lucide:user-check" class="w-4 h-4" />
          <span>Cliente:</span>
          <span>{{ item.client.nome }}</span>
        </div>
        <span v-if="item.client.whatsapp" class="text-slate-400 font-mono">{{ item.client.whatsapp }}</span>
        <span v-if="item.client.cidade" class="text-slate-500">{{ item.client.cidade }}/{{ item.client.bairro }}</span>
      </div>

      <!-- Se Dispensado: Motivo/Admin -->
      <div v-if="item.attribution_status === 'dismissed'" class="pt-2 mt-1 border-t border-white/5 text-xs text-slate-500 flex items-center gap-2">
        <Icon name="lucide:ban" class="w-3.5 h-3.5 text-slate-500" />
        <span>Dispensado {{ item.dismissed_at ? `em ${formatDatetime(item.dismissed_at)}` : '' }}</span>
        <span v-if="item.notes" class="italic text-slate-400">({{ item.notes }})</span>
      </div>
    </div>

    <!-- Ações do Card -->
    <div class="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
      <!-- Botão Ver Jornada (Etapa 8) -->
      <button
        type="button"
        @click="emit('view-journey', item)"
        class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        title="Auditar jornada ponta a ponta da sessão"
      >
        <Icon name="lucide:route" class="w-3.5 h-3.5 text-indigo-400" />
        <span>Ver jornada</span>
      </button>

      <template v-if="item.attribution_status === 'unassigned'">
        <!-- Botão: Criar Cliente com Ref pré-preenchida -->
        <button
          type="button"
          @click="emit('create-client', item)"
          class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          title="Criar novo cliente e vincular este clique"
        >
          <Icon name="lucide:user-plus" class="w-3.5 h-3.5" />
          <span>+ Criar Cliente</span>
        </button>

        <!-- Botão: Vincular a Cliente Existente -->
        <button
          type="button"
          @click="emit('open-assign', item)"
          class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Vincular a cliente já cadastrado"
        >
          <Icon name="lucide:link" class="w-3.5 h-3.5 text-slate-400" />
          <span>Vincular</span>
        </button>

        <!-- Botão: Dispensar -->
        <button
          type="button"
          @click="emit('open-dismiss', item)"
          class="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-white/5 text-xs transition-colors cursor-pointer"
          title="Dispensar clique"
        >
          <Icon name="lucide:x" class="w-3.5 h-3.5" />
        </button>
      </template>

      <template v-else-if="item.attribution_status === 'assigned' && item.client">
        <NuxtLink
          :to="`/admin/clientes/${item.client.id}`"
          class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Icon name="lucide:external-link" class="w-3.5 h-3.5" />
          <span>Ver Cliente</span>
        </NuxtLink>
      </template>
    </div>
  </div>
</template>
