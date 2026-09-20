<script setup lang="ts">
import type { GoogleAdsOverviewResponse, LandingComparisonData } from '../../types/adminGoogleAds'
import Card from '../ui/card/Card.vue'
import Table from '../ui/table/Table.vue'
import TableHeader from '../ui/table/TableHeader.vue'
import TableBody from '../ui/table/TableBody.vue'
import TableRow from '../ui/table/TableRow.vue'
import TableHead from '../ui/table/TableHead.vue'
import TableCell from '../ui/table/TableCell.vue'
import Badge from '../ui/badge/Badge.vue'
import AdminKpiCard from './AdminKpiCard.vue'
import LandingComparisonCard from './LandingComparisonCard.vue'

const props = defineProps<{
  data: GoogleAdsOverviewResponse | null
  landingComparisonData?: LandingComparisonData | null
  landingComparisonChannel?: 'google_ads' | 'all'
  loading?: boolean
  loadingComparison?: boolean
}>()

const emit = defineEmits<{
  (e: 'change-comparison-channel', channel: 'google_ads' | 'all'): void
}>()
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- BANNER DE CONTEXTO DA CAMPANHA GOOGLE ADS -->
    <div class="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/50 to-indigo-950/30 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <Icon name="lucide:target" class="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-sm sm:text-base font-bold text-white">AD Telas | Pesquisa | Leads | SP</h3>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              VALUETRACK ATIVO
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>Landing Oficial:</span>
            <code class="text-indigo-300 font-mono text-[11px] bg-white/5 px-1.5 py-0.5 rounded">/lp/telas-mosquiteiras</code>
            <span class="text-slate-600">•</span>
            <span>Conta:</span>
            <code class="text-slate-300 font-mono text-[11px]">AW-473885322</code>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 self-stretch md:self-auto justify-end">
        <div class="text-right hidden sm:block">
          <span class="text-[10px] text-slate-500 uppercase tracking-wider block">Filtro de Tráfego</span>
          <span class="text-xs font-semibold text-slate-300">Humanos (is_bot = false)</span>
        </div>
      </div>
    </div>

    <!-- 8 CARDS DE KPIS DO GOOGLE ADS -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
      <AdminKpiCard
        title="Visitantes Únicos"
        :value="data?.kpis.unique_visitors ?? '-'"
        icon="lucide:users"
        theme="cyan"
        badge="ADS"
        formula-tooltip="Visitantes humanos únicos identificados via channel=google_ads ou Click ID"
        :loading="loading"
      />

      <AdminKpiCard
        title="Sessões Ads"
        :value="data?.kpis.sessions ?? '-'"
        icon="lucide:globe"
        theme="violet"
        formula-tooltip="Sessões distintas com origem no Google Ads no período selecionado"
        :loading="loading"
      />

      <AdminKpiCard
        title="Pageviews"
        :value="data?.kpis.pageviews ?? '-'"
        icon="lucide:eye"
        theme="indigo"
        formula-tooltip="Total de páginas visualizadas pelo tráfego de Google Ads"
        :loading="loading"
      />

      <AdminKpiCard
        title="WhatsApp Ads"
        :value="data?.kpis.whatsapp_clicks ?? '-'"
        :sublabel="`${data?.kpis.whatsapp_unique_visitors ?? 0} pessoas únicas`"
        icon="lucide:message-circle"
        theme="emerald"
        formula-tooltip="Cliques em botões de WhatsApp de sessões originadas no Google Ads"
        :loading="loading"
      />

      <AdminKpiCard
        title="Início Formulário"
        :value="data?.kpis.form_starts ?? '-'"
        :sublabel="`${data?.kpis.form_starts_unique_visitors ?? 0} pessoas únicas`"
        icon="lucide:edit-3"
        theme="amber"
        formula-tooltip="Visitantes que focaram/interagiram com os campos do formulário da landing"
        :loading="loading"
      />

      <AdminKpiCard
        title="Leads Reais"
        :value="data?.kpis.real_leads ?? '-'"
        :sublabel="`${data?.kpis.real_lead_unique_visitors ?? 0} pessoas únicas`"
        icon="lucide:user-check"
        theme="emerald"
        badge="QUALIFICADOS"
        formula-tooltip="Leads comerciais reais de clientes (exclui sintéticos e testes)"
        :loading="loading"
      />

      <AdminKpiCard
        title="Taxa de Intenção"
        :value="data?.kpis.contact_intent_rate ?? '0.0%'"
        icon="lucide:zap"
        theme="amber"
        formula-tooltip="União desduplicada de visitantes com intenção (CTA/WhatsApp/Form) / Visitantes Únicos"
        :loading="loading"
      />

      <AdminKpiCard
        title="Taxa de Lead"
        :value="data?.kpis.lead_conversion_rate ?? '0.0%'"
        icon="lucide:target"
        theme="emerald"
        formula-tooltip="Visitantes únicos que viraram lead real / Visitantes Únicos"
        :loading="loading"
      />
    </div>

    <!-- FUNIL VISUAL DA LANDING PAGE (CAMINHOS BIFURCADOS: WHATSAPP VS FORMULÁRIO) -->
    <Card class="p-5 sm:p-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <Icon name="lucide:git-fork" class="w-4 h-4 text-violet-400" />
            Funil da Landing Page: Bifurcação de Contato
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Caminhos reais de conversão: WhatsApp direto vs Formulário comercial (sem exigência prévia de CTA)
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" class="bg-violet-500/10 text-violet-300 border-violet-500/20 text-[10px]">
            União Desduplicada de Visitantes
          </Badge>
        </div>
      </div>

      <!-- Estrutura do Funil -->
      <div v-if="loading" class="flex flex-col gap-4 animate-pulse">
        <div v-for="i in 3" :key="i" class="h-20 bg-white/[0.03] rounded-xl"></div>
      </div>

      <div v-else-if="data?.funnel" class="flex flex-col gap-5">
        <!-- NÍVEL 1: TOPO (Visitantes Landing) -->
        <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <span class="text-xs font-bold text-white">Visitantes na Landing Page</span>
              <p class="text-[11px] text-slate-400">Acessos humanos em /lp/telas-mosquiteiras</p>
            </div>
          </div>
          <div class="flex items-center gap-4 text-right">
            <div>
              <span class="text-base font-extrabold text-cyan-300 font-mono">{{ data.funnel.landing_visitors.toLocaleString('pt-BR') }}</span>
              <span class="text-[10px] text-slate-500 block">visitantes únicos</span>
            </div>
            <div class="border-l border-white/10 pl-3">
              <span class="text-xs font-semibold text-slate-300 font-mono">{{ data.funnel.landing_sessions.toLocaleString('pt-BR') }}</span>
              <span class="text-[10px] text-slate-500 block">sessões</span>
            </div>
          </div>
        </div>

        <!-- CONECTOR VISUAL -->
        <div class="flex items-center justify-center -my-2 text-slate-600">
          <Icon name="lucide:arrow-down" class="w-4 h-4" />
        </div>

        <!-- NÍVEL 2: INTENÇÃO GLOBAL (União desduplicada) -->
        <div class="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-amber-200">Intenção de Contato (União)</span>
                <span class="text-[10px] text-amber-400/90 font-mono">Taxa: {{ data.funnel.taxa_intencao }}</span>
              </div>
              <p class="text-[11px] text-slate-400">
                Pessoas que clicaram em CTA de orçamento ({{ data.funnel.quote_cta_visitors }}), WhatsApp ({{ data.funnel.whatsapp_unique_visitors }}), iniciaram form ({{ data.funnel.form_start_unique_visitors }}) ou enviaram lead ({{ data.funnel.real_lead_unique_visitors }})
              </p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-base font-extrabold text-amber-300 font-mono">{{ data.funnel.contact_intent_unique_visitors.toLocaleString('pt-BR') }}</span>
            <span class="text-[10px] text-slate-500 block">visitantes com intenção</span>
          </div>
        </div>

        <!-- BIFURCAÇÃO VISUAL EM 2 CAMINHOS -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">

          <!-- RAMIFICAÇÃO A: WHATSAPP DIRETO -->
          <div class="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col justify-between gap-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Icon name="lucide:message-circle" class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-xs font-bold text-emerald-300 block">Caminho A: Conversão via WhatsApp</span>
                  <span class="text-[10px] text-slate-400">Contato direto e imediato com atendente</span>
                </div>
              </div>
              <Badge variant="outline" class="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                {{ data.funnel.taxa_whatsapp }} do topo
              </Badge>
            </div>

            <div class="pt-2 border-t border-emerald-500/10 flex items-center justify-between text-xs">
              <div>
                <span class="text-slate-400 text-[11px]">Visitantes Únicos:</span>
                <span class="font-bold text-white font-mono ml-1.5">{{ data.funnel.whatsapp_unique_visitors }}</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px]">Cliques Totais:</span>
                <span class="font-bold text-emerald-400 font-mono ml-1.5">{{ data.funnel.whatsapp_clicks }}</span>
              </div>
            </div>
          </div>

          <!-- RAMIFICAÇÃO B: FORMULÁRIO COMERCIAL -->
          <div class="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col justify-between gap-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Icon name="lucide:file-text" class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-xs font-bold text-indigo-300 block">Caminho B: Formulário da Landing</span>
                  <span class="text-[10px] text-slate-400">Preenchimento de dados e fotos</span>
                </div>
              </div>
              <Badge variant="outline" class="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px]">
                {{ data.funnel.taxa_form_success }} de sucesso
              </Badge>
            </div>

            <div class="pt-2 border-t border-indigo-500/10 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="text-slate-400 text-[11px] block">Início do Form:</span>
                <span class="font-bold text-white font-mono">{{ data.funnel.form_start_unique_visitors }} pessoas</span>
                <span class="text-[10px] text-indigo-400 block">({{ data.funnel.taxa_form_start }})</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">Leads Concluídos:</span>
                <span class="font-bold text-emerald-400 font-mono">{{ data.funnel.real_lead_unique_visitors }} leads</span>
                <span class="text-[10px] text-emerald-400 block">({{ data.funnel.taxa_form_success }})</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Card>

    <!-- DATA QUALITY CARD: INTEGRIDADE DAS SESSÕES GOOGLE ADS -->
    <Card class="p-5">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <Icon name="lucide:shield-check" class="w-4 h-4 text-cyan-400" />
            Qualidade e Integridade dos Dados Google Ads
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Denominador: {{ data?.data_quality.total_google_ads_sessions ?? 0 }} sessões únicas Google Ads no período
          </p>
        </div>
        <span class="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full">
          DENOMINADOR: SESSÕES ADS
        </span>
      </div>

      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
        <div v-for="i in 4" :key="i" class="h-20 bg-white/[0.03] rounded-xl"></div>
      </div>

      <div v-else-if="data?.data_quality" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <!-- Click ID Válido -->
        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col">
          <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Click ID Válido</span>
          <div class="flex items-baseline gap-1.5 mt-1">
            <span class="text-lg font-bold text-white font-mono">{{ data.data_quality.sessions_with_click_id }}</span>
            <span class="text-xs font-semibold text-emerald-400 font-mono">({{ data.data_quality.pct_with_click_id }})</span>
          </div>
          <span class="text-[10px] text-slate-500 mt-0.5">gclid, gbraid ou wbraid</span>
        </div>

        <!-- Palavra-chave capturada -->
        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col">
          <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Palavra-chave</span>
          <div class="flex items-baseline gap-1.5 mt-1">
            <span class="text-lg font-bold text-white font-mono">{{ data.data_quality.sessions_with_keyword }}</span>
            <span class="text-xs font-semibold text-cyan-400 font-mono">({{ data.data_quality.pct_with_keyword }})</span>
          </div>
          <span class="text-[10px] text-slate-500 mt-0.5">{keyword} via utm_term</span>
        </div>

        <!-- ID da Campanha -->
        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col">
          <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Campaign ID</span>
          <div class="flex items-baseline gap-1.5 mt-1">
            <span class="text-lg font-bold text-white font-mono">{{ data.data_quality.sessions_with_campaign_id }}</span>
            <span class="text-xs font-semibold text-violet-400 font-mono">({{ data.data_quality.pct_with_campaign_id }})</span>
          </div>
          <span class="text-[10px] text-slate-500 mt-0.5">{campaignid} capturado</span>
        </div>

        <!-- Leads com Atribuição -->
        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col">
          <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Atribuição de Leads</span>
          <div class="flex items-baseline gap-1.5 mt-1">
            <span class="text-lg font-bold text-white font-mono">{{ data.data_quality.leads_with_attribution }}</span>
            <span class="text-xs font-semibold text-emerald-400 font-mono">({{ data.data_quality.pct_leads_with_attribution }})</span>
          </div>
          <span class="text-[10px] text-slate-500 mt-0.5">Leads com origem rastreada</span>
        </div>
      </div>
    </Card>

    <!-- COMPARADOR ANTES X DEPOIS DA NOVA LANDING PAGE -->
    <LandingComparisonCard
      :data="landingComparisonData || null"
      :loading="loadingComparison"
      :selected-channel="landingComparisonChannel || 'google_ads'"
      @change-channel="(ch) => emit('change-comparison-channel', ch)"
    />

    <!-- TABELA DE CAMPANHAS GOOGLE ADS -->
    <Card class="p-5">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <Icon name="lucide:layers" class="w-4 h-4 text-indigo-400" />
            Campanhas Google Ads
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">Desempenho por utm_campaign e ID numérico oficial</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campanha</TableHead>
              <TableHead>ID Google Ads</TableHead>
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
            <TableRow v-if="loading" v-for="i in 3" :key="i" class="animate-pulse">
              <TableCell colspan="9"><div class="h-4 bg-white/[0.04] rounded"></div></TableCell>
            </TableRow>
            <TableRow
              v-else-if="data && data.campaigns.length > 0"
              v-for="cmp in data.campaigns"
              :key="`${cmp.utm_campaign}:::${cmp.google_campaign_id}`"
            >
              <TableCell class="font-medium text-white max-w-[200px] truncate">
                {{ cmp.utm_campaign }}
              </TableCell>
              <TableCell class="font-mono text-xs text-slate-400">
                <span v-if="cmp.google_campaign_id" class="text-indigo-300">{{ cmp.google_campaign_id }}</span>
                <span v-else class="text-slate-600 italic">Pendente URL</span>
              </TableCell>
              <TableCell class="text-right font-mono font-semibold text-slate-200">{{ cmp.unique_visitors }}</TableCell>
              <TableCell class="text-right font-mono text-slate-400">{{ cmp.sessions }}</TableCell>
              <TableCell class="text-right font-mono text-emerald-400 font-semibold">{{ cmp.whatsapp_clicks }}</TableCell>
              <TableCell class="text-right font-mono text-amber-400">{{ cmp.form_starts }}</TableCell>
              <TableCell class="text-right font-mono font-bold text-emerald-400">{{ cmp.leads_count }}</TableCell>
              <TableCell class="text-right font-mono text-amber-300 font-semibold">{{ cmp.contact_intent_rate }}</TableCell>
              <TableCell class="text-right font-mono font-bold text-emerald-300">{{ cmp.lead_conversion_rate }}</TableCell>
            </TableRow>
            <TableRow v-else>
              <TableCell colspan="9" class="text-center py-6 text-xs text-slate-500">
                Nenhum dado de campanha encontrado para o período selecionado.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>

    <!-- TABELA DE PALAVRAS-CHAVE GOOGLE ADS -->
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
              v-else-if="data && data.keywords.length > 0"
              v-for="kw in data.keywords"
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

    <!-- TABELA DE DESEMPENHO DOS CTAs DA LANDING PAGE -->
    <Card class="p-5">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <Icon name="lucide:mouse-pointer-click" class="w-4 h-4 text-cyan-400" />
            Desempenho dos CTAs da Landing Page
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Interações com botões declarativos (<code class="text-cyan-300 font-mono text-[10px]">data-track-type="quote_cta"</code>) e WhatsApp
          </p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Elemento / Posição</TableHead>
              <TableHead>Tipo de Ação</TableHead>
              <TableHead class="text-right">Cliques Totais</TableHead>
              <TableHead class="text-right">Visitantes Únicos</TableHead>
              <TableHead class="text-right">% de Cliques</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="loading" v-for="i in 3" :key="i" class="animate-pulse">
              <TableCell colspan="5"><div class="h-4 bg-white/[0.04] rounded"></div></TableCell>
            </TableRow>
            <TableRow
              v-else-if="data && data.ctas.length > 0"
              v-for="cta in data.ctas"
              :key="`${cta.cta_location}:::${cta.tipo}`"
            >
              <TableCell class="font-medium text-white">
                <div class="flex items-center gap-2">
                  <Badge variant="outline" class="font-mono text-[10px] bg-white/5 text-slate-300 border-white/10">
                    {{ cta.cta_location }}
                  </Badge>
                  <span class="text-xs text-slate-300">{{ cta.label }}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  class="text-[10px]"
                  :class="[
                    cta.tipo === 'whatsapp' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    cta.tipo === 'quote_cta' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    cta.tipo === 'form_start' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  ]"
                >
                  {{ cta.tipo }}
                </Badge>
              </TableCell>
              <TableCell class="text-right font-mono font-bold text-white">{{ cta.clicks }}</TableCell>
              <TableCell class="text-right font-mono text-slate-300">{{ cta.unique_visitors }}</TableCell>
              <TableCell class="text-right font-mono text-cyan-300 font-semibold">{{ cta.pct_of_total_clicks }}</TableCell>
            </TableRow>
            <TableRow v-else>
              <TableCell colspan="5" class="text-center py-6 text-xs text-slate-500">
                Nenhum clique de CTA registrado na landing para este período.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>

  </div>
</template>
