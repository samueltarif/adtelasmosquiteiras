<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminAnalytics } from '../../composables/useAdminAnalytics'
import Tabs from '../../components/ui/tabs/Tabs.vue'
import TabsList from '../../components/ui/tabs/TabsList.vue'
import TabsTrigger from '../../components/ui/tabs/TabsTrigger.vue'
import TabsContent from '../../components/ui/tabs/TabsContent.vue'
import Separator from '../../components/ui/separator/Separator.vue'
import AdminDateFilter from '../../components/admin/AdminDateFilter.vue'
import AdminKpiCard from '../../components/admin/AdminKpiCard.vue'
import TrafficChart from '../../components/admin/TrafficChart.vue'
import NewVsReturningDonut from '../../components/admin/NewVsReturningDonut.vue'
import DeviceBreakdownDonut from '../../components/admin/DeviceBreakdownDonut.vue'
import RecentActivityFeed from '../../components/admin/RecentActivityFeed.vue'
import DataQualityCard from '../../components/admin/DataQualityCard.vue'
import AcquisitionSection from '../../components/admin/AcquisitionSection.vue'
import ServicesSection from '../../components/admin/ServicesSection.vue'
import CommercialFunnel from '../../components/admin/CommercialFunnel.vue'

definePageMeta({ layout: 'admin' })

useHead({
  title: 'Dashboard Analytics V2 - AD Telas e Redes',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const activeTab = ref('overview')

const {
  overview,
  acquisition,
  pages,
  services,
  funnel,
  recentActivity,
  isLoadingOverview,
  isLoadingAcquisition,
  isLoadingPages,
  isLoadingServices,
  isLoadingFunnel,
  isLoadingActivity,
  fetchAll
} = useAdminAnalytics()

onMounted(() => {
  fetchAll()
})
</script>

<template>
  <div class="min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-3 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto w-full flex flex-col gap-6">

      <!-- TOP BAR: Header & Global Date Filter -->
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Dashboard Analytics V2
            </h2>
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Sistema Online"></span>
          </div>
          <p class="text-xs text-slate-400 mt-1">Inteligência comercial, atribuição e telemetria humana em tempo real</p>
        </div>

        <div class="flex items-center gap-2 sm:gap-3 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          <!-- Global Date Filter -->
          <AdminDateFilter />

          <!-- Refresh Button -->
          <button 
            @click="fetchAll" 
            class="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 text-slate-300 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:text-white transition-all active:scale-95 shrink-0"
          >
            <Icon 
              name="lucide:refresh-cw" 
              class="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" 
              :class="isLoadingOverview ? 'animate-spin' : ''" 
            />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      <Separator />

      <!-- LEGACY DATA WARNING BANNER (Se o intervalo cruzar com período anterior à Fase B) -->
      <div 
        v-if="overview?.meta?.is_legacy_overlap" 
        class="w-full max-w-full min-w-0 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5 break-words"
      >
        <Icon name="lucide:info" class="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <div class="min-w-0 flex-1 leading-relaxed">
          <strong class="font-bold text-amber-200">Período Misto:</strong> O intervalo selecionado inclui registros anteriores à Fase B (24/08/2026). Métricas de identidade avançada consideram apenas eventos a partir desta data.
        </div>
      </div>

      <!-- RADIX/SHADCN TABS NAVIGATION (2x2 Grid on Mobile, Flex on Desktop) -->
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="grid grid-cols-2 sm:flex sm:w-auto h-auto p-1.5 gap-1.5 w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <TabsTrigger value="overview" class="gap-2 justify-center py-2 text-xs">
            <Icon name="lucide:layout-grid" class="w-4 h-4 shrink-0" />
            <span>Visão Geral</span>
          </TabsTrigger>

          <TabsTrigger value="acquisition" class="gap-2 justify-center py-2 text-xs">
            <Icon name="lucide:share-2" class="w-4 h-4 shrink-0" />
            <span>Aquisição & Canais</span>
          </TabsTrigger>

          <TabsTrigger value="services" class="gap-2 justify-center py-2 text-xs">
            <Icon name="lucide:layers" class="w-4 h-4 shrink-0" />
            <span>Serviços & CTAs</span>
          </TabsTrigger>

          <TabsTrigger value="funnel" class="gap-2 justify-center py-2 text-xs">
            <Icon name="lucide:filter" class="w-4 h-4 shrink-0" />
            <span>Funil Comercial</span>
          </TabsTrigger>
        </TabsList>

        <!-- TAB 1: VISÃO GERAL -->
        <TabsContent value="overview" class="flex flex-col gap-6 mt-4">
          <!-- KPI Cards Row 1 -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            <AdminKpiCard 
              title="Visitantes Únicos" 
              :value="overview?.kpis.unique_visitors !== undefined ? overview.kpis.unique_visitors : '-'" 
              icon="lucide:fingerprint" 
              theme="cyan" 
              badge="HUMAN"
              formula-tooltip="COUNT(DISTINCT visitor_id) onde is_bot != true e created_at >= identityStartUtc"
              :loading="isLoadingOverview"
            />

            <AdminKpiCard 
              title="Sessões" 
              :value="overview?.kpis.sessions !== undefined ? overview.kpis.sessions : '-'" 
              icon="lucide:globe" 
              theme="violet" 
              formula-tooltip="COUNT(DISTINCT session_id) onde is_bot != true e created_at >= identityStartUtc"
              :loading="isLoadingOverview"
            />

            <AdminKpiCard 
              title="Pageviews" 
              :value="overview?.kpis.pageviews !== undefined ? overview.kpis.pageviews : '-'" 
              icon="lucide:eye" 
              theme="cyan" 
              formula-tooltip="Visualizações totais de páginas sem bots"
              :loading="isLoadingOverview"
            />

            <AdminKpiCard 
              title="Leads Reais" 
              :value="overview?.kpis.real_leads !== undefined ? overview.kpis.real_leads : '-'" 
              icon="lucide:user-check" 
              theme="emerald" 
              badge="REAL"
              formula-tooltip="Leads comerciais reais de clientes (exclui sintéticos e testes)"
              :loading="isLoadingOverview"
            />

            <AdminKpiCard 
              title="WhatsApp" 
              :value="overview?.kpis.whatsapp_clicks !== undefined ? overview.kpis.whatsapp_clicks : '-'" 
              sublabel="Cliques no botão"
              icon="lucide:message-circle" 
              theme="emerald" 
              formula-tooltip="Cliques registrados na tabela lead_clicks para tipo=whatsapp"
              :loading="isLoadingOverview"
            />

            <AdminKpiCard 
              title="Telefone" 
              :value="overview?.kpis.phone_clicks !== undefined ? overview.kpis.phone_clicks : '-'" 
              sublabel="Cliques de ligação"
              icon="lucide:phone-call" 
              theme="rose" 
              formula-tooltip="Cliques registrados para ligações"
              :loading="isLoadingOverview"
            />
          </div>

          <!-- KPI Rates Row 2 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            <AdminKpiCard 
              title="Taxa de Lead" 
              :value="overview?.kpis.rates?.lead_conversion_rate || '0.0%'" 
              icon="lucide:target" 
              theme="emerald" 
              formula-tooltip="Pessoas únicas que enviaram formulário / Visitantes únicos * 100"
              :loading="isLoadingOverview"
            />

            <AdminKpiCard 
              title="Taxa de Intenção" 
              :value="overview?.kpis.rates?.contact_intent_rate || '0.0%'" 
              icon="lucide:zap" 
              theme="amber" 
              formula-tooltip="Pessoas únicas com clique em WhatsApp/Telefone / Visitantes únicos * 100"
              :loading="isLoadingOverview"
            />

            <AdminKpiCard 
              title="Taxa WhatsApp" 
              :value="overview?.kpis.rates?.whatsapp_rate || '0.0%'" 
              icon="lucide:message-square" 
              theme="emerald" 
              formula-tooltip="Pessoas únicas com clique em WhatsApp / Visitantes únicos * 100"
              :loading="isLoadingOverview"
            />

            <AdminKpiCard 
              title="Páginas / Sessão" 
              :value="overview?.kpis.rates?.avg_pages_per_session !== undefined ? overview.kpis.rates.avg_pages_per_session : 0" 
              icon="lucide:file-text" 
              theme="indigo" 
              formula-tooltip="Média de pageviews por sessão humana"
              :loading="isLoadingOverview"
            />
          </div>

          <!-- Traffic Evolution Chart -->
          <TrafficChart 
            :series="overview?.daily_series || []" 
            :loading="isLoadingOverview" 
          />

          <!-- Secondary Charts Grid (Retention, Devices, Health) -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NewVsReturningDonut 
              :new-visitors="overview?.retention.new_visitors || 0"
              :returning-visitors="overview?.retention.returning_visitors || 0"
              :new-percentage="overview?.retention.new_percentage || 0"
              :returning-percentage="overview?.retention.returning_percentage || 0"
              :loading="isLoadingOverview"
            />

            <DeviceBreakdownDonut 
              :devices="overview?.devices || []" 
              :loading="isLoadingOverview"
            />

            <DataQualityCard 
              :quality="overview?.data_quality || null"
              :loading="isLoadingOverview"
            />
          </div>

          <!-- Realtime Feed -->
          <RecentActivityFeed 
            :events="recentActivity?.events || []" 
            :loading="isLoadingActivity"
          />
        </TabsContent>

        <!-- TAB 2: AQUISIÇÃO -->
        <TabsContent value="acquisition" class="mt-4">
          <AcquisitionSection 
            :acquisition-data="acquisition" 
            :pages-data="pages"
            :loading="isLoadingAcquisition || isLoadingPages"
          />
        </TabsContent>

        <!-- TAB 3: SERVIÇOS & CTAS -->
        <TabsContent value="services" class="mt-4">
          <ServicesSection 
            :services-data="services" 
            :loading="isLoadingServices"
          />
        </TabsContent>

        <!-- TAB 4: FUNIL COMERCIAL -->
        <TabsContent value="funnel" class="mt-4">
          <CommercialFunnel 
            :funnel-data="funnel" 
            :loading="isLoadingFunnel"
          />
        </TabsContent>
      </Tabs>

    </div>
  </div>
</template>
