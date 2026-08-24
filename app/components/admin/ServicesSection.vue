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
  servicesData: {
    service_interest: Array<{
      service_key: string
      service_name: string
      whatsapp_clicks: number
      phone_clicks: number
      total_interactions: number
      unique_visitors: number
      dominant_channel: string
    }>
    cta_performance: Array<{
      cta_location: string
      cta_label: string
      whatsapp_clicks: number
      phone_clicks: number
      total_intents: number
      unique_visitors: number
      pct_of_intents: number
    }>
  } | null
  loading?: boolean
}>()
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Service Interest Table -->
    <Card class="p-5">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <Icon name="lucide:layers" class="w-4 h-4 text-indigo-400" />
            Interesse por Serviço & Cards Comerciais
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">Volume de contatos iniciados em cada linha de serviço (Fase C.0)</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serviço</TableHead>
            <TableHead>Chave Canônica</TableHead>
            <TableHead class="text-right">WhatsApp</TableHead>
            <TableHead class="text-right">Telefone</TableHead>
            <TableHead class="text-right">Total Interações</TableHead>
            <TableHead class="text-right">Pessoas Únicas</TableHead>
            <TableHead class="text-right">Canal Dominante</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading" v-for="i in 4" :key="i" class="animate-pulse">
            <TableCell colspan="7"><div class="h-4 bg-white/[0.04] rounded"></div></TableCell>
          </TableRow>
          <TableRow 
            v-else-if="servicesData && servicesData.service_interest.length > 0"
            v-for="s in servicesData.service_interest" 
            :key="s.service_key"
          >
            <TableCell class="font-semibold text-white flex items-center gap-2">
              <Icon name="lucide:check-circle-2" class="w-3.5 h-3.5 text-indigo-400" />
              {{ s.service_name }}
            </TableCell>
            <TableCell class="text-slate-500 font-mono text-[11px]">{{ s.service_key }}</TableCell>
            <TableCell class="text-right text-emerald-400 font-bold tabular-nums">{{ s.whatsapp_clicks }}</TableCell>
            <TableCell class="text-right text-rose-400 font-medium tabular-nums">{{ s.phone_clicks }}</TableCell>
            <TableCell class="text-right text-slate-200 font-extrabold tabular-nums">{{ s.total_interactions }}</TableCell>
            <TableCell class="text-right text-cyan-400 font-semibold tabular-nums">{{ s.unique_visitors }}</TableCell>
            <TableCell class="text-right">
              <Badge variant="outline" class="text-[10px] font-semibold text-slate-300">
                {{ s.dominant_channel }}
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow v-else>
            <TableCell colspan="7" class="py-8 text-center text-slate-500">Nenhum evento com serviço registrado no período.</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <!-- CTA Performance Breakdown -->
    <Card class="p-5">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <Icon name="lucide:mouse-pointer-click" class="w-4 h-4 text-emerald-400" />
            Performance por Localização de CTA
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">Quais botões e pontos de contato convertem mais visitantes</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Localização do CTA</TableHead>
            <TableHead>Identificador</TableHead>
            <TableHead class="text-right">WhatsApp</TableHead>
            <TableHead class="text-right">Telefone</TableHead>
            <TableHead class="text-right">Pessoas Únicas</TableHead>
            <TableHead class="text-right">Total Contatos</TableHead>
            <TableHead class="text-right">% do Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow 
            v-if="servicesData && servicesData.cta_performance.length > 0"
            v-for="cta in servicesData.cta_performance" 
            :key="cta.cta_location"
          >
            <TableCell class="font-semibold text-white flex items-center gap-2">
              <Icon name="lucide:target" class="w-3.5 h-3.5 text-emerald-400" />
              {{ cta.cta_label }}
            </TableCell>
            <TableCell class="text-slate-500 font-mono text-[11px]">{{ cta.cta_location }}</TableCell>
            <TableCell class="text-right text-emerald-400 font-bold tabular-nums">{{ cta.whatsapp_clicks }}</TableCell>
            <TableCell class="text-right text-rose-400 tabular-nums">{{ cta.phone_clicks }}</TableCell>
            <TableCell class="text-right text-cyan-400 font-semibold tabular-nums">{{ cta.unique_visitors }}</TableCell>
            <TableCell class="text-right text-white font-extrabold tabular-nums">{{ cta.total_intents }}</TableCell>
            <TableCell class="text-right text-slate-300 font-bold tabular-nums">{{ cta.pct_of_intents }}%</TableCell>
          </TableRow>
          <TableRow v-else>
            <TableCell colspan="7" class="py-8 text-center text-slate-500">Nenhum clique em CTA registrado no período.</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  </div>
</template>
