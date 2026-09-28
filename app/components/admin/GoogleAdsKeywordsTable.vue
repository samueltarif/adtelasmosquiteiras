<script setup lang="ts">
import type { GoogleAdsOverviewResponse } from '../../types/adminGoogleAds'
import Card from '../ui/card/Card.vue'
import Table from '../ui/table/Table.vue'
import TableHeader from '../ui/table/TableHeader.vue'
import TableBody from '../ui/table/TableBody.vue'
import TableRow from '../ui/table/TableRow.vue'
import TableHead from '../ui/table/TableHead.vue'
import TableCell from '../ui/table/TableCell.vue'

defineProps<{
  keywords?: GoogleAdsOverviewResponse['keywords']
  loading?: boolean
}>()
</script>

<template>
  <Card class="p-5">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
      <div>
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <Icon name="lucide:key" class="w-4 h-4 text-amber-400" />
          Palavra-chave Google Ads
        </h3>
        <p class="text-xs text-slate-400 mt-0.5">
          Termos cadastrados no Google Ads capturados via ValueTrack <code class="text-amber-300 font-mono text-[10px]">{keyword}</code>
        </p>
      </div>
    </div>

    <div class="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Palavra-chave Google Ads</TableHead>
            <TableHead>Campanha</TableHead>
            <TableHead class="text-right">Visitantes</TableHead>
            <TableHead class="text-right">Sessões</TableHead>
            <TableHead class="text-right">WhatsApp</TableHead>
            <TableHead class="text-right">Início Form</TableHead>
            <TableHead class="text-right">Leads</TableHead>
            <TableHead class="text-right">Taxa Intenção</TableHead>
            <TableHead class="text-right">Taxa Lead</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading" v-for="i in 4" :key="i" class="animate-pulse">
            <TableCell colspan="9"><div class="h-4 bg-white/[0.04] rounded"></div></TableCell>
          </TableRow>
          <TableRow
            v-else-if="keywords && keywords.length > 0"
            v-for="kw in keywords"
            :key="kw.keyword"
          >
            <TableCell class="font-medium text-white max-w-[220px] truncate">
              <span class="text-amber-300 font-mono text-xs">{{ kw.keyword }}</span>
            </TableCell>
            <TableCell class="text-xs text-slate-400 max-w-[150px] truncate">
              {{ kw.utm_campaign || '-' }}
            </TableCell>
            <TableCell class="text-right font-mono font-semibold text-slate-200">{{ kw.unique_visitors }}</TableCell>
            <TableCell class="text-right font-mono text-slate-400">{{ kw.sessions }}</TableCell>
            <TableCell class="text-right font-mono text-emerald-400 font-semibold">{{ kw.whatsapp_clicks }}</TableCell>
            <TableCell class="text-right font-mono text-amber-400">{{ kw.form_starts }}</TableCell>
            <TableCell class="text-right font-mono font-bold text-emerald-400">{{ kw.leads_count }}</TableCell>
            <TableCell class="text-right font-mono text-amber-300 font-semibold">{{ kw.contact_intent_rate }}</TableCell>
            <TableCell class="text-right font-mono font-bold text-emerald-300">{{ kw.lead_conversion_rate }}</TableCell>
          </TableRow>
          <TableRow v-else>
            <TableCell colspan="9" class="text-center py-6 text-xs text-slate-500">
              Nenhum dado de palavra-chave capturado no período.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </Card>
</template>
