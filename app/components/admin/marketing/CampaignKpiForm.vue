<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CampaignKpiEntry, CampaignKpiPayload, CampaignPlatform } from '../../../types/campaignKpi'
import { CAMPAIGN_PLATFORMS, PLATFORM_LABELS } from '../../../types/campaignKpi'

const props = defineProps<{
  entry?: CampaignKpiEntry | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: CampaignKpiPayload]
  cancel: []
}>()

const isEdit = computed(() => !!props.entry)

// ── Form state ──
const platform = ref<CampaignPlatform>(props.entry?.platform ?? 'google_ads')
const campaignName = ref(props.entry?.campaign_name ?? '')
const utmCampaign = ref(props.entry?.utm_campaign ?? '')
const periodStart = ref(props.entry?.period_start ?? '')
const periodEnd = ref(props.entry?.period_end ?? '')
const plannedBudget = ref(props.entry?.planned_budget?.toString() ?? '')
const spend = ref(props.entry?.spend?.toString() ?? '')
const impressions = ref(props.entry?.impressions?.toString() ?? '')
const clicks = ref(props.entry?.clicks?.toString() ?? '')
const whatsappContacts = ref(props.entry?.whatsapp_contacts?.toString() ?? '')
const leads = ref(props.entry?.leads?.toString() ?? '')
const sales = ref(props.entry?.sales?.toString() ?? '')
const revenue = ref(props.entry?.revenue?.toString() ?? '')
const notes = ref(props.entry?.notes ?? '')
const targetCtr = ref(props.entry?.target_ctr?.toString() ?? '')
const targetCpc = ref(props.entry?.target_cpc?.toString() ?? '')
const targetCpl = ref(props.entry?.target_cpl?.toString() ?? '')
const targetCpa = ref(props.entry?.target_cpa?.toString() ?? '')
const targetRoas = ref(props.entry?.target_roas?.toString() ?? '')
const targetLeads = ref(props.entry?.target_leads?.toString() ?? '')
const targetSales = ref(props.entry?.target_sales?.toString() ?? '')
const targetLeadToSaleRate = ref(props.entry?.target_lead_to_sale_rate?.toString() ?? '')
const targetBudget = ref(props.entry?.target_budget?.toString() ?? '')

const formError = ref('')

function parseNum(val: string): number | null {
  if (!val.trim()) return null
  const n = parseFloat(val.replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

function validate(): string {
  if (!campaignName.value.trim()) return 'Nome da campanha é obrigatório.'
  if (!periodStart.value || !/^\d{4}-\d{2}-\d{2}$/.test(periodStart.value)) return 'Data inicial inválida.'
  if (!periodEnd.value || !/^\d{4}-\d{2}-\d{2}$/.test(periodEnd.value)) return 'Data final inválida.'
  if (periodEnd.value < periodStart.value) return 'Data final não pode ser anterior à inicial.'

  const numFields = [
    { val: plannedBudget.value, name: 'Orçamento planejado' },
    { val: spend.value, name: 'Valor gasto' },
    { val: impressions.value, name: 'Impressões' },
    { val: clicks.value, name: 'Cliques' },
    { val: whatsappContacts.value, name: 'Contatos WhatsApp' },
    { val: leads.value, name: 'Leads' },
    { val: sales.value, name: 'Vendas' },
    { val: revenue.value, name: 'Receita' },
  ]
  for (const f of numFields) {
    if (f.val.trim() === '') continue
    const n = parseFloat(f.val.replace(',', '.'))
    if (!Number.isFinite(n) || n < 0) return `${f.name}: valor inválido.`
  }
  return ''
}

function handleSubmit() {
  formError.value = ''
  const err = validate()
  if (err) { formError.value = err; return }

  const payload: CampaignKpiPayload = {
    platform: platform.value,
    campaign_name: campaignName.value.trim(),
    utm_campaign: utmCampaign.value.trim() || null,
    period_start: periodStart.value,
    period_end: periodEnd.value,
    planned_budget: parseNum(plannedBudget.value),
    spend: parseNum(spend.value),
    impressions: parseNum(impressions.value),
    clicks: parseNum(clicks.value),
    whatsapp_contacts: parseNum(whatsappContacts.value),
    leads: parseNum(leads.value),
    sales: parseNum(sales.value),
    revenue: parseNum(revenue.value),
    notes: notes.value.trim() || null,
    target_ctr: parseNum(targetCtr.value),
    target_cpc: parseNum(targetCpc.value),
    target_cpl: parseNum(targetCpl.value),
    target_cpa: parseNum(targetCpa.value),
    target_roas: parseNum(targetRoas.value),
    target_leads: parseNum(targetLeads.value),
    target_sales: parseNum(targetSales.value),
    target_lead_to_sale_rate: parseNum(targetLeadToSaleRate.value),
    target_budget: parseNum(targetBudget.value),
  }
  emit('submit', payload)
}
</script>

<template>
  <div class="w-full max-w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col gap-5">
    <h3 class="text-base font-bold text-white">{{ isEdit ? 'Editar Campanha' : 'Cadastrar Campanha' }}</h3>

    <!-- Plataforma -->
    <div class="flex flex-col gap-1.5">
      <label class="text-xs font-semibold text-slate-300">Plataforma</label>
      <select v-model="platform" id="kpi-platform"
        class="bg-slate-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <option v-for="p in CAMPAIGN_PLATFORMS" :key="p" :value="p">{{ PLATFORM_LABELS[p] }}</option>
      </select>
    </div>

    <!-- Nome da campanha + UTM -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">Nome da campanha *</label>
        <input v-model="campaignName" id="kpi-campaign-name" type="text" maxlength="300" placeholder="Ex: Verão 2026"
          class="bg-slate-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">UTM Campaign <span class="text-slate-500">(opcional)</span></label>
        <input v-model="utmCampaign" id="kpi-utm-campaign" type="text" maxlength="200" placeholder="Ex: verao-2026-meta"
          class="bg-slate-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full" />
      </div>
    </div>

    <!-- Período -->
    <div class="grid grid-cols-2 gap-3">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">Período inicial *</label>
        <input v-model="periodStart" id="kpi-period-start" type="date"
          class="bg-slate-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">Período final *</label>
        <input v-model="periodEnd" id="kpi-period-end" type="date"
          class="bg-slate-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full" />
      </div>
    </div>

    <!-- Dados da plataforma -->
    <div>
      <p class="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">📊 Dados informados pela plataforma</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div v-for="f in [
          { id:'kpi-budget', model: 'plannedBudget', label:'Orçamento (R$)' },
          { id:'kpi-spend', model: 'spend', label:'Valor gasto (R$)' },
          { id:'kpi-impressions', model: 'impressions', label:'Impressões' },
          { id:'kpi-clicks', model: 'clicks', label:'Cliques' },
          { id:'kpi-whatsapp', model: 'whatsappContacts', label:'WhatsApp contatos' },
          { id:'kpi-leads', model: 'leads', label:'Leads' },
          { id:'kpi-sales', model: 'sales', label:'Vendas' },
          { id:'kpi-revenue', model: 'revenue', label:'Receita (R$)' },
        ]" :key="f.id" class="flex flex-col gap-1.5">
          <label :for="f.id" class="text-xs text-slate-400">{{ f.label }}</label>
          <input
            :id="f.id" type="number" min="0" step="any"
            :value="f.model === 'plannedBudget' ? plannedBudget : f.model === 'spend' ? spend : f.model === 'impressions' ? impressions : f.model === 'clicks' ? clicks : f.model === 'whatsappContacts' ? whatsappContacts : f.model === 'leads' ? leads : f.model === 'sales' ? sales : revenue"
            @input="e => { const v = (e.target as HTMLInputElement).value; if(f.model==='plannedBudget') plannedBudget=v; else if(f.model==='spend') spend=v; else if(f.model==='impressions') impressions=v; else if(f.model==='clicks') clicks=v; else if(f.model==='whatsappContacts') whatsappContacts=v; else if(f.model==='leads') leads=v; else if(f.model==='sales') sales=v; else revenue=v }"
            placeholder="Deixe vazio"
            class="bg-slate-800/80 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
      </div>
    </div>

    <!-- Metas opcionais -->
    <div>
      <p class="text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">🎯 Metas opcionais (definidas por você)</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div v-for="f in [
          { id:'kpi-t-ctr', model:'targetCtr', label:'CTR desejado (%)' },
          { id:'kpi-t-cpc', model:'targetCpc', label:'CPC máximo (R$)' },
          { id:'kpi-t-cpl', model:'targetCpl', label:'CPL máximo (R$)' },
          { id:'kpi-t-cpa', model:'targetCpa', label:'CPA máximo (R$)' },
          { id:'kpi-t-roas', model:'targetRoas', label:'ROAS mínimo' },
          { id:'kpi-t-leads', model:'targetLeads', label:'Leads desejados' },
          { id:'kpi-t-sales', model:'targetSales', label:'Vendas desejadas' },
          { id:'kpi-t-lsr', model:'targetLeadToSaleRate', label:'Taxa Lead→Venda (%)' },
          { id:'kpi-t-budget', model:'targetBudget', label:'Orçamento máx (R$)' },
        ]" :key="f.id" class="flex flex-col gap-1.5">
          <label :for="f.id" class="text-xs text-slate-400">{{ f.label }}</label>
          <input
            :id="f.id" type="number" min="0" step="any"
            :value="f.model==='targetCtr'?targetCtr:f.model==='targetCpc'?targetCpc:f.model==='targetCpl'?targetCpl:f.model==='targetCpa'?targetCpa:f.model==='targetRoas'?targetRoas:f.model==='targetLeads'?targetLeads:f.model==='targetSales'?targetSales:f.model==='targetLeadToSaleRate'?targetLeadToSaleRate:targetBudget"
            @input="e=>{const v=(e.target as HTMLInputElement).value;if(f.model==='targetCtr')targetCtr=v;else if(f.model==='targetCpc')targetCpc=v;else if(f.model==='targetCpl')targetCpl=v;else if(f.model==='targetCpa')targetCpa=v;else if(f.model==='targetRoas')targetRoas=v;else if(f.model==='targetLeads')targetLeads=v;else if(f.model==='targetSales')targetSales=v;else if(f.model==='targetLeadToSaleRate')targetLeadToSaleRate=v;else targetBudget=v}"
            placeholder="Sem meta"
            class="bg-slate-800/80 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
      </div>
    </div>

    <!-- Observações -->
    <div class="flex flex-col gap-1.5">
      <label for="kpi-notes" class="text-xs font-semibold text-slate-300">Observações <span class="text-slate-500">(opcional)</span></label>
      <textarea v-model="notes" id="kpi-notes" rows="2" maxlength="2000" placeholder="Contexto, hipóteses, anotações..."
        class="bg-slate-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full resize-none" />
    </div>

    <!-- Erro -->
    <div v-if="formError" class="text-rose-400 text-xs font-medium bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
      {{ formError }}
    </div>

    <!-- Ações -->
    <div class="flex gap-3 justify-end">
      <button @click="emit('cancel')" type="button" id="kpi-form-cancel"
        class="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95">
        Cancelar
      </button>
      <button @click="handleSubmit" type="button" id="kpi-form-submit" :disabled="loading"
        class="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
        {{ loading ? 'Salvando...' : (isEdit ? 'Salvar alterações' : 'Cadastrar campanha') }}
      </button>
    </div>
  </div>
</template>
