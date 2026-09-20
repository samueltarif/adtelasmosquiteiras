<script setup lang="ts">
import type { LandingComparisonData } from '../../types/adminGoogleAds'
import Card from '../ui/card/Card.vue'
import Badge from '../ui/badge/Badge.vue'
import Table from '../ui/table/Table.vue'
import TableHeader from '../ui/table/TableHeader.vue'
import TableBody from '../ui/table/TableBody.vue'
import TableRow from '../ui/table/TableRow.vue'
import TableHead from '../ui/table/TableHead.vue'
import TableCell from '../ui/table/TableCell.vue'

const props = defineProps<{
  data: LandingComparisonData | null
  loading?: boolean
  selectedChannel?: 'google_ads' | 'all'
}>()

const emit = defineEmits<{
  (e: 'change-channel', channel: 'google_ads' | 'all'): void
}>()

function formatIsoToSp(isoStr?: string) {
  if (!isoStr) return '-'
  try {
    const d = new Date(isoStr)
    return d.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return isoStr
  }
}

const sampleBadgeClass = computed(() => {
  const level = props.data?.sampleQuality?.level
  if (level === 'large') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (level === 'moderate') return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
  if (level === 'small') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
})
</script>

<template>
  <Card class="p-5 sm:p-6 flex flex-col gap-6 border border-indigo-500/20 bg-gradient-to-br from-slate-900/90 via-indigo-950/20 to-slate-900/90 shadow-xl">
    
    <!-- HEADER DO COMPARADOR -->
    <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/5">
      <div>
        <div class="flex items-center gap-2.5 flex-wrap">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Icon name="lucide:git-compare" class="w-4 h-4" />
          </div>
          <h3 class="text-sm sm:text-base font-bold text-white tracking-tight">
            ANTES x DEPOIS — Nova Landing Page
          </h3>
          <Badge variant="outline" class="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 text-[10px] uppercase font-mono">
            {{ data?.label || 'Telas Mosquiteiras' }}
          </Badge>
        </div>

        <p class="text-xs text-slate-400 mt-1.5 flex items-center gap-2 flex-wrap">
          <span>Destino Anterior:</span>
          <code class="text-slate-300 font-mono text-[11px] bg-white/5 px-1.5 py-0.5 rounded">/servicos/telas/*</code>
          <Icon name="lucide:arrow-right" class="w-3 h-3 text-slate-600" />
          <span>Nova Landing:</span>
          <code class="text-indigo-300 font-mono text-[11px] bg-indigo-500/10 px-1.5 py-0.5 rounded">/lp/telas-mosquiteiras</code>
          <span class="text-slate-600">•</span>
          <span>Cutoff:</span>
          <span class="text-slate-300 font-mono">{{ formatIsoToSp(data?.cutoffAt) }}</span>
        </p>
        <p v-if="data?.cutoffExplanation" class="text-[11px] text-indigo-300/90 mt-1 flex items-center gap-1.5">
          <Icon name="lucide:info" class="w-3 h-3 text-indigo-400 shrink-0" />
          <span>{{ data.cutoffExplanation }}</span>
        </p>
      </div>

      <!-- SELETOR DE CANAL (TOGGLE) -->
      <div class="flex items-center gap-2 bg-slate-950/60 p-1 rounded-xl border border-white/10 self-stretch sm:self-auto justify-between sm:justify-start">
        <button
          type="button"
          @click="emit('change-channel', 'google_ads')"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
          :class="selectedChannel !== 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'"
        >
          <Icon name="lucide:target" class="w-3.5 h-3.5" />
          <span>Google Ads</span>
        </button>

        <button
          type="button"
          @click="emit('change-channel', 'all')"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
          :class="selectedChannel === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'"
        >
          <Icon name="lucide:users" class="w-3.5 h-3.5" />
          <span>Todos os Canais</span>
        </button>
      </div>
    </div>

    <!-- METADADOS DA JANELA E CONFIABILIDADE DA AMOSTRA -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <!-- Card Janela Comparada -->
      <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Período Comparado</span>
          <Badge variant="outline" class="text-[9px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            Janela Simétrica
          </Badge>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-base font-extrabold text-white font-mono">
            {{ data?.window?.durationFormatted || '0h' }} antes
          </span>
          <span class="text-slate-500 text-xs">↔</span>
          <span class="text-base font-extrabold text-indigo-300 font-mono">
            {{ data?.window?.durationFormatted || '0h' }} depois
          </span>
        </div>
        <div class="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
          <Icon name="lucide:clock" class="w-3 h-3 text-slate-400 shrink-0" />
          <span>Dados dos últimos 30 min aguardam maturação</span>
        </div>
      </div>

      <!-- Card Confiabilidade da Amostra -->
      <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tamanho da Amostra</span>
          <Badge variant="outline" :class="sampleBadgeClass" class="text-[10px] font-bold">
            {{ data?.sampleQuality?.label || 'Muito pequena' }}
          </Badge>
        </div>
        <div class="mt-2 text-xs text-slate-300 leading-snug">
          {{ data?.sampleQuality?.description || 'Volume inicial em consolidação.' }}
        </div>
        <span class="text-[10px] text-slate-500 mt-1">
          Base mínima: {{ data?.sampleQuality?.minSampleSize ?? 0 }} visitantes na coorte
        </span>
      </div>

      <!-- Card Resumo de Tendência Observada -->
      <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
        <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Taxa de Intenção Observada</span>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-base font-extrabold text-slate-400 font-mono">{{ data?.before?.taxa_intencao || '0.0%' }}</span>
          <Icon name="lucide:arrow-right" class="w-3 h-3 text-slate-600" />
          <span class="text-base font-extrabold text-emerald-400 font-mono">{{ data?.after?.taxa_intencao || '0.0%' }}</span>
          <span
            v-if="data?.delta?.taxa_intencao"
            class="text-xs font-bold font-mono px-1.5 py-0.5 rounded"
            :class="data.delta.taxa_intencao.diff_pp > 0 ? 'bg-emerald-500/10 text-emerald-400' : data.delta.taxa_intencao.diff_pp < 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'"
          >
            {{ data.delta.taxa_intencao.formatted }}
          </span>
        </div>
        <span class="text-[10px] text-slate-500 mt-1">
          União desduplicada de CTA, WhatsApp, Form e Leads
        </span>
      </div>
    </div>

    <!-- TABELA PRINCIPAL DE COMPARAÇÃO DE MÉTRICAS -->
    <div class="overflow-x-auto rounded-xl border border-white/[0.06]">
      <Table>
        <TableHeader>
          <TableRow class="bg-white/[0.02] border-b border-white/[0.06]">
            <TableHead class="text-white text-xs font-bold">Métrica Analisada</TableHead>
            <TableHead class="text-right text-xs font-bold text-slate-400">Antes (Landing Anterior)</TableHead>
            <TableHead class="text-right text-xs font-bold text-indigo-300">Depois (/lp/telas-mosquiteiras)</TableHead>
            <TableHead class="text-right text-xs font-bold text-white">Variação Observada</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <!-- Skeleton Loading -->
          <TableRow v-if="loading" v-for="i in 7" :key="i" class="animate-pulse">
            <TableCell colspan="4"><div class="h-5 bg-white/[0.03] rounded"></div></TableCell>
          </TableRow>

          <template v-else-if="data">
            <!-- 1. Visitantes Únicos da Landing -->
            <TableRow class="border-b border-white/[0.04]">
              <TableCell class="font-medium text-white text-xs flex items-center gap-2">
                <Icon name="lucide:users" class="w-3.5 h-3.5 text-cyan-400" />
                <span>Visitantes Únicos na Landing</span>
              </TableCell>
              <TableCell class="text-right font-mono text-slate-300 text-xs">{{ data.before.landing_unique_visitors }}</TableCell>
              <TableCell class="text-right font-mono text-indigo-300 font-bold text-xs">{{ data.after.landing_unique_visitors }}</TableCell>
              <TableCell class="text-right font-mono text-xs font-bold" :class="data.delta.landing_unique_visitors.diff > 0 ? 'text-emerald-400' : data.delta.landing_unique_visitors.diff < 0 ? 'text-rose-400' : 'text-slate-400'">
                {{ data.delta.landing_unique_visitors.formatted }}
              </TableCell>
            </TableRow>

            <!-- 2. Sessões da Coorte -->
            <TableRow class="border-b border-white/[0.04]">
              <TableCell class="font-medium text-slate-300 text-xs flex items-center gap-2">
                <Icon name="lucide:globe" class="w-3.5 h-3.5 text-violet-400" />
                <span>Sessões da Coorte</span>
              </TableCell>
              <TableCell class="text-right font-mono text-slate-400 text-xs">{{ data.before.sessions }}</TableCell>
              <TableCell class="text-right font-mono text-slate-200 text-xs">{{ data.after.sessions }}</TableCell>
              <TableCell class="text-right font-mono text-xs" :class="data.delta.sessions.diff > 0 ? 'text-emerald-400' : data.delta.sessions.diff < 0 ? 'text-rose-400' : 'text-slate-400'">
                {{ data.delta.sessions.formatted }}
              </TableCell>
            </TableRow>

            <!-- 3. Visitantes com Intenção de Contato -->
            <TableRow class="border-b border-white/[0.04] bg-amber-500/[0.02]">
              <TableCell class="font-semibold text-amber-200 text-xs flex items-center gap-2">
                <Icon name="lucide:zap" class="w-3.5 h-3.5 text-amber-400" />
                <span>Intenção de Contato (União)</span>
              </TableCell>
              <TableCell class="text-right font-mono text-slate-300 text-xs">{{ data.before.contact_intent_unique_visitors }}</TableCell>
              <TableCell class="text-right font-mono text-amber-300 font-bold text-xs">{{ data.after.contact_intent_unique_visitors }}</TableCell>
              <TableCell class="text-right font-mono text-xs font-bold" :class="data.delta.contact_intent_unique_visitors.diff > 0 ? 'text-emerald-400' : data.delta.contact_intent_unique_visitors.diff < 0 ? 'text-rose-400' : 'text-slate-400'">
                {{ data.delta.contact_intent_unique_visitors.formatted }}
              </TableCell>
            </TableRow>

            <!-- 4. Visitantes WhatsApp -->
            <TableRow class="border-b border-white/[0.04]">
              <TableCell class="font-medium text-slate-300 text-xs flex items-center gap-2">
                <Icon name="lucide:message-circle" class="w-3.5 h-3.5 text-emerald-400" />
                <span>Visitantes Únicos WhatsApp</span>
              </TableCell>
              <TableCell class="text-right font-mono text-slate-400 text-xs">{{ data.before.whatsapp_unique_visitors }}</TableCell>
              <TableCell class="text-right font-mono text-emerald-300 font-semibold text-xs">{{ data.after.whatsapp_unique_visitors }}</TableCell>
              <TableCell class="text-right font-mono text-xs" :class="data.delta.whatsapp_unique_visitors.diff > 0 ? 'text-emerald-400' : data.delta.whatsapp_unique_visitors.diff < 0 ? 'text-rose-400' : 'text-slate-400'">
                {{ data.delta.whatsapp_unique_visitors.formatted }}
              </TableCell>
            </TableRow>

            <!-- 5. Visitantes Início de Form -->
            <TableRow class="border-b border-white/[0.04]">
              <TableCell class="font-medium text-slate-300 text-xs flex items-center gap-2">
                <Icon name="lucide:edit-3" class="w-3.5 h-3.5 text-indigo-400" />
                <span>Início de Formulário (Form Start)</span>
              </TableCell>
              <TableCell class="text-right font-mono text-slate-400 text-xs">{{ data.before.form_start_unique_visitors }}</TableCell>
              <TableCell class="text-right font-mono text-indigo-300 font-semibold text-xs">{{ data.after.form_start_unique_visitors }}</TableCell>
              <TableCell class="text-right font-mono text-xs" :class="data.delta.form_start_unique_visitors.diff > 0 ? 'text-emerald-400' : data.delta.form_start_unique_visitors.diff < 0 ? 'text-rose-400' : 'text-slate-400'">
                {{ data.delta.form_start_unique_visitors.formatted }}
              </TableCell>
            </TableRow>

            <!-- 6. Leads Reais (Formulário Concluído) -->
            <TableRow class="border-b border-white/[0.04] bg-emerald-500/[0.02]">
              <TableCell class="font-semibold text-emerald-300 text-xs flex items-center gap-2">
                <Icon name="lucide:user-check" class="w-3.5 h-3.5 text-emerald-400" />
                <span>Leads Reais Concluídos</span>
              </TableCell>
              <TableCell class="text-right font-mono text-slate-400 text-xs">{{ data.before.real_lead_unique_visitors }}</TableCell>
              <TableCell class="text-right font-mono text-emerald-400 font-bold text-xs">{{ data.after.real_lead_unique_visitors }}</TableCell>
              <TableCell class="text-right font-mono text-xs font-bold" :class="data.delta.real_lead_unique_visitors.diff > 0 ? 'text-emerald-400' : data.delta.real_lead_unique_visitors.diff < 0 ? 'text-rose-400' : 'text-slate-400'">
                {{ data.delta.real_lead_unique_visitors.formatted }}
              </TableCell>
            </TableRow>

            <!-- 7. TAXA DE INTENÇÃO (Destaque em p.p.) -->
            <TableRow class="border-b border-white/[0.06] bg-amber-500/[0.04]">
              <TableCell class="font-bold text-amber-300 text-xs">Taxa de Intenção (Intenção / Visitantes)</TableCell>
              <TableCell class="text-right font-mono text-slate-300 text-xs font-bold">{{ data.before.taxa_intencao }}</TableCell>
              <TableCell class="text-right font-mono text-amber-300 text-xs font-extrabold">{{ data.after.taxa_intencao }}</TableCell>
              <TableCell class="text-right font-mono text-xs font-extrabold" :class="data.delta.taxa_intencao.diff_pp > 0 ? 'text-emerald-400' : data.delta.taxa_intencao.diff_pp < 0 ? 'text-rose-400' : 'text-slate-400'">
                {{ data.delta.taxa_intencao.formatted }}
              </TableCell>
            </TableRow>

            <!-- 8. TAXA DE LEAD (Destaque em p.p.) -->
            <TableRow class="border-b border-white/[0.06] bg-emerald-500/[0.04]">
              <TableCell class="font-bold text-emerald-300 text-xs">Taxa de Lead (Leads / Visitantes)</TableCell>
              <TableCell class="text-right font-mono text-slate-300 text-xs font-bold">{{ data.before.taxa_lead }}</TableCell>
              <TableCell class="text-right font-mono text-emerald-400 text-xs font-extrabold">{{ data.after.taxa_lead }}</TableCell>
              <TableCell class="text-right font-mono text-xs font-extrabold" :class="data.delta.taxa_lead.diff_pp > 0 ? 'text-emerald-400' : data.delta.taxa_lead.diff_pp < 0 ? 'text-rose-400' : 'text-slate-400'">
                {{ data.delta.taxa_lead.formatted }}
              </TableCell>
            </TableRow>
          </template>

          <TableRow v-else>
            <TableCell colspan="4" class="text-center py-6 text-xs text-slate-500">
              Nenhum dado disponível para a comparação no período selecionado.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- COMPARATIVO POR DISPOSITIVO (MOBILE VS DESKTOP VS TABLET) -->
    <div v-if="data?.deviceBreakdown" class="flex flex-col gap-3 pt-2">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-bold text-white flex items-center gap-2">
          <Icon name="lucide:smartphone" class="w-3.5 h-3.5 text-indigo-400" />
          <span>Comportamento por Dispositivo (device_type)</span>
        </h4>
        <span class="text-[10px] text-slate-500">Classificação via User-Agent da sessão</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          v-for="(dev, key) in data.deviceBreakdown"
          :key="key"
          class="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col gap-2.5"
        >
          <div class="flex items-center justify-between pb-2 border-b border-white/5">
            <span class="text-xs font-bold text-white flex items-center gap-1.5">
              <Icon :name="key === 'mobile' ? 'lucide:smartphone' : key === 'desktop' ? 'lucide:monitor' : 'lucide:tablet'" class="w-3.5 h-3.5 text-indigo-400" />
              {{ dev.label }}
            </span>
            <span class="text-[10px] font-mono text-slate-400">
              {{ dev.delta.visitors.formatted }} visitas
            </span>
          </div>

          <div class="grid grid-cols-3 gap-2 text-[11px] font-mono">
            <div>
              <span class="text-[9px] text-slate-500 uppercase tracking-wider block">Visitantes</span>
              <span class="text-slate-400">{{ dev.before.visitors }}</span>
              <span class="text-slate-600 mx-1">→</span>
              <span class="text-white font-bold">{{ dev.after.visitors }}</span>
            </div>

            <div>
              <span class="text-[9px] text-slate-500 uppercase tracking-wider block">Taxa Intenção</span>
              <span class="text-slate-400">{{ dev.before.taxa_intencao }}</span>
              <span class="text-slate-600 mx-1">→</span>
              <span class="text-amber-300 font-bold">{{ dev.after.taxa_intencao }}</span>
            </div>

            <div>
              <span class="text-[9px] text-slate-500 uppercase tracking-wider block">Taxa Lead</span>
              <span class="text-slate-400">{{ dev.before.taxa_lead }}</span>
              <span class="text-slate-600 mx-1">→</span>
              <span class="text-emerald-400 font-bold">{{ dev.after.taxa_lead }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </Card>
</template>
