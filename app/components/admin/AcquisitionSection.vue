<script setup lang="ts">
import Card from '../ui/card/Card.vue'
import Table from '../ui/table/Table.vue'
import TableHeader from '../ui/table/TableHeader.vue'
import TableBody from '../ui/table/TableBody.vue'
import TableRow from '../ui/table/TableRow.vue'
import TableHead from '../ui/table/TableHead.vue'
import TableCell from '../ui/table/TableCell.vue'
import Badge from '../ui/badge/Badge.vue'

const props = defineProps<{
  acquisitionData: {
    channels: Array<{
      channel: string
      label: string
      unique_visitors: number
      sessions: number
      whatsapp_clicks: number
      phone_clicks: number
      total_intents: number
      leads_count: number
      contact_intent_rate: string
      lead_conversion_rate: string
    }>
    campaigns: Array<{
      source: string
      medium: string
      campaign: string
      unique_visitors: number
      sessions: number
      contact_intent_rate: string
      leads_count: number
    }>
    first_touch_insights: Array<{
      lead_id: string
      nome: string
      first_touch_channel: string
      first_touch_campaign: string | null
      session_channel: string
      conversion_campaign: string | null
      is_multi_channel: boolean
    }>
  } | null
  pagesData: {
    top_pages: Array<{
      path: string
      pageviews: number
      unique_visitors: number
      percentage: number
    }>
    landing_pages: Array<{
      landing_path: string
      unique_visitors: number
      sessions: number
      whatsapp_clicks: number
      phone_clicks: number
      leads_count: number
      contact_intent_rate: string
      lead_conversion_rate: string
    }>
  } | null
  loading?: boolean
}>()
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Channel Bar Chart & Summary -->
    <Card class="p-5">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <Icon name="lucide:share-2" class="w-4 h-4 text-cyan-400" />
            Canais de Aquisição de Tráfego
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">Origem dos visitantes e eficácia de conversão</p>
        </div>
      </div>

      <!-- Channels Table -->
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Canal</TableHead>
            <TableHead class="text-right">Visitantes</TableHead>
            <TableHead class="text-right">Sessões</TableHead>
            <TableHead class="text-right">WhatsApp</TableHead>
            <TableHead class="text-right">Leads</TableHead>
            <TableHead class="text-right">Taxa Intenção</TableHead>
            <TableHead class="text-right">Taxa Lead</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading" v-for="i in 4" :key="i" class="animate-pulse">
            <TableCell colspan="7"><div class="h-4 bg-white/[0.04] rounded"></div></TableCell>
          </TableRow>
          <TableRow 
            v-else-if="acquisitionData && acquisitionData.channels.length > 0"
            v-for="ch in acquisitionData.channels" 
            :key="ch.channel"
          >
            <TableCell class="font-medium text-white flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
              {{ ch.label }}
            </TableCell>
            <TableCell class="text-right font-semibold text-slate-200 tabular-nums">{{ ch.unique_visitors }}</TableCell>
            <TableCell class="text-right text-slate-400 tabular-nums">{{ ch.sessions }}</TableCell>
            <TableCell class="text-right text-emerald-400 font-semibold tabular-nums">{{ ch.whatsapp_clicks }}</TableCell>
            <TableCell class="text-right text-indigo-400 font-bold tabular-nums">{{ ch.leads_count }}</TableCell>
            <TableCell class="text-right text-slate-300 font-medium tabular-nums">{{ ch.contact_intent_rate }}</TableCell>
            <TableCell class="text-right text-emerald-400 font-bold tabular-nums">{{ ch.lead_conversion_rate }}</TableCell>
          </TableRow>
          <TableRow v-else>
            <TableCell colspan="7" class="py-8 text-center text-slate-500">Nenhum canal com tráfego no período.</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <!-- Landing Pages Performance & Top Pages Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Landing Pages -->
      <Card class="p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <Icon name="lucide:log-in" class="w-4 h-4 text-emerald-400" />
              Performance por Landing Page
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">Qual página de entrada gera mais conversões</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Landing Path</TableHead>
              <TableHead class="text-right">Visitantes</TableHead>
              <TableHead class="text-right">WhatsApp</TableHead>
              <TableHead class="text-right">Leads</TableHead>
              <TableHead class="text-right">Taxa Lead</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="lp in (pagesData?.landing_pages || []).slice(0, 6)" 
              :key="lp.landing_path"
            >
              <TableCell class="text-slate-200 font-medium truncate max-w-[180px]">{{ lp.landing_path }}</TableCell>
              <TableCell class="text-right text-slate-300 tabular-nums">{{ lp.unique_visitors }}</TableCell>
              <TableCell class="text-right text-emerald-400 tabular-nums">{{ lp.whatsapp_clicks }}</TableCell>
              <TableCell class="text-right text-indigo-400 font-bold tabular-nums">{{ lp.leads_count }}</TableCell>
              <TableCell class="text-right text-emerald-400 font-semibold tabular-nums">{{ lp.lead_conversion_rate }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      <!-- Top Pages -->
      <Card class="p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <Icon name="lucide:layout" class="w-4 h-4 text-violet-400" />
              Páginas Mais Acessadas
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">Ranking de visualizações e visitantes únicos</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Página</TableHead>
              <TableHead class="text-right">Pageviews</TableHead>
              <TableHead class="text-right">Únicos</TableHead>
              <TableHead class="text-right">% Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="tp in (pagesData?.top_pages || []).slice(0, 6)" 
              :key="tp.path"
            >
              <TableCell class="text-slate-200 font-medium truncate max-w-[200px]">{{ tp.path }}</TableCell>
              <TableCell class="text-right text-cyan-400 font-semibold tabular-nums">{{ tp.pageviews }}</TableCell>
              <TableCell class="text-right text-slate-300 tabular-nums">{{ tp.unique_visitors }}</TableCell>
              <TableCell class="text-right text-slate-400 tabular-nums">{{ tp.percentage }}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>

    <!-- UTM Campaigns Table -->
    <Card class="p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <Icon name="lucide:tag" class="w-4 h-4 text-amber-400" />
            Campanhas UTM
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">Rastreio detalhado de campanhas de tráfego pago e orgânico</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Origem (Source)</TableHead>
            <TableHead>Mídia (Medium)</TableHead>
            <TableHead>Campanha</TableHead>
            <TableHead class="text-right">Visitantes</TableHead>
            <TableHead class="text-right">Sessões</TableHead>
            <TableHead class="text-right">Leads</TableHead>
            <TableHead class="text-right">Taxa Intenção</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow 
            v-if="acquisitionData && acquisitionData.campaigns.length > 0"
            v-for="(cmp, i) in acquisitionData.campaigns" 
            :key="i"
          >
            <TableCell class="text-slate-200 font-medium">{{ cmp.source }}</TableCell>
            <TableCell class="text-slate-400">{{ cmp.medium }}</TableCell>
            <TableCell class="text-indigo-300 font-semibold">{{ cmp.campaign }}</TableCell>
            <TableCell class="text-right text-slate-200 tabular-nums">{{ cmp.unique_visitors }}</TableCell>
            <TableCell class="text-right text-slate-400 tabular-nums">{{ cmp.sessions }}</TableCell>
            <TableCell class="text-right text-emerald-400 font-bold tabular-nums">{{ cmp.leads_count }}</TableCell>
            <TableCell class="text-right text-slate-300 tabular-nums">{{ cmp.contact_intent_rate }}</TableCell>
          </TableRow>
          <TableRow v-else>
            <TableCell colspan="7" class="py-6 text-center text-slate-500">Nenhum parâmetro UTM capturado no período selecionado.</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  </div>
</template>
