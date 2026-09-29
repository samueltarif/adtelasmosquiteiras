<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { ExportFormat, ExportPeriodPreset, ExportDatasetKey, ExportRequestPayload } from '../../../types/dashboardExport'
import DashboardExportDatasetSelector from './DashboardExportDatasetSelector.vue'

const props = defineProps<{
  isOpen: boolean
  currentPreset?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const form = reactive<{
  format: ExportFormat
  period: ExportPeriodPreset
  dateFrom: string
  dateTo: string
  datasets: ExportDatasetKey[]
  includeContactDetails: boolean
}>({
  format: 'xlsx',
  period: 'current_dashboard',
  dateFrom: '',
  dateTo: '',
  datasets: ['overview', 'acquisition', 'google_ads', 'whatsapp', 'leads', 'campaign_kpis'],
  includeContactDetails: false
})

const isExporting = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const FORMAT_OPTIONS: { id: ExportFormat; label: string; ext: string; icon: string; desc: string }[] = [
  { id: 'xlsx', label: 'Excel (XLSX)', ext: '.xlsx', icon: 'lucide:sheet', desc: 'Planilha consolidada com abas e formatação profissional' },
  { id: 'csv', label: 'CSV', ext: '.csv / .zip', icon: 'lucide:file-spreadsheet', desc: 'Compatível com Excel brasileiro e UTF-8 BOM' },
  { id: 'pdf', label: 'Relatório (PDF)', ext: '.pdf', icon: 'lucide:file-text', desc: 'Resumo gerencial executivo consolidado' },
  { id: 'json', label: 'JSON', ext: '.json', icon: 'lucide:code', desc: 'Estrutura técnica com metadados para auditoria' },
  { id: 'zip', label: 'Pacote Completo (ZIP)', ext: '.zip', icon: 'lucide:archive', desc: 'Inclui XLSX, PDF, JSON e CSVs individuais' }
]

const PERIOD_OPTIONS: { id: ExportPeriodPreset; label: string }[] = [
  { id: 'current_dashboard', label: 'Usar período atual do Dashboard' },
  { id: 'today', label: 'Hoje' },
  { id: 'last7days', label: 'Últimos 7 dias' },
  { id: 'last30days', label: 'Últimos 30 dias' },
  { id: 'last90days', label: 'Últimos 90 dias' },
  { id: 'all', label: 'Todo o período' },
  { id: 'custom', label: 'Personalizado' }
]

async function handleExport() {
  if (form.datasets.length === 0) {
    errorMessage.value = 'Selecione pelo menos um conjunto de dados para exportar.'
    return
  }

  isExporting.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const payload: ExportRequestPayload = {
      format: form.format,
      period: form.period === 'current_dashboard' ? ((props.currentPreset as any) || 'today') : form.period,
      dateFrom: form.period === 'custom' ? form.dateFrom : undefined,
      dateTo: form.period === 'custom' ? form.dateTo : undefined,
      datasets: form.datasets,
      includeContactDetails: form.includeContactDetails
    }

    const res = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => null)
      throw new Error(errJson?.message || `Erro no servidor (${res.status})`)
    }

    // Obter nome sugerido do header Content-Disposition
    let filename = `AD_Telas_Export.${form.format === 'zip' ? 'zip' : form.format}`
    const disposition = res.headers.get('content-disposition')
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/)
      if (match && match[1]) filename = match[1]
    }

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    successMessage.value = 'Download iniciado com sucesso!'
    setTimeout(() => {
      if (props.isOpen) emit('close')
    }, 1800)
  } catch (err: any) {
    errorMessage.value = err?.message || 'Falha ao gerar arquivo de exportação'
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
    <div class="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
      
      <!-- Topo Modal -->
      <div class="flex items-center justify-between p-5 border-b border-white/10 bg-slate-950/50">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Icon name="lucide:download" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-white tracking-tight">Central de Exportação de Dados</h3>
            <p class="text-xs text-slate-400">Exporte telemetria, tráfego, Google Ads e KPIs em formatos estruturados</p>
          </div>
        </div>

        <button 
          @click="emit('close')" 
          class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title="Fechar"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Corpo com Scroll -->
      <div class="flex-1 overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar">
        
        <!-- Alerta de Feedback -->
        <div v-if="errorMessage" class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0 text-rose-400" />
          <span>{{ errorMessage }}</span>
        </div>

        <div v-if="successMessage" class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <Icon name="lucide:check-circle" class="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- SEÇÃO 1: Formato de Exportação -->
        <div>
          <label class="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
            1. Formato do Arquivo
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <button
              v-for="opt in FORMAT_OPTIONS"
              :key="opt.id"
              type="button"
              @click="form.format = opt.id"
              class="flex flex-col text-left p-3 rounded-xl border transition-all"
              :class="form.format === opt.id 
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' 
                : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'"
            >
              <div class="flex items-center justify-between mb-1.5">
                <Icon :name="opt.icon" class="w-4 h-4" :class="form.format === opt.id ? 'text-indigo-400' : 'text-slate-400'" />
                <span class="text-[10px] font-mono opacity-60">{{ opt.ext }}</span>
              </div>
              <span class="text-xs font-bold text-white">{{ opt.label }}</span>
              <span class="text-[10px] leading-tight text-slate-400 mt-1 line-clamp-2">{{ opt.desc }}</span>
            </button>
          </div>
        </div>

        <!-- SEÇÃO 2: Período -->
        <div>
          <label class="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
            2. Período dos Dados
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="p in PERIOD_OPTIONS"
              :key="p.id"
              type="button"
              @click="form.period = p.id"
              class="px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all"
              :class="form.period === p.id 
                ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold' 
                : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'"
            >
              {{ p.label }}
            </button>
          </div>

          <!-- Datas personalizadas -->
          <div v-if="form.period === 'custom'" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 p-3 rounded-xl bg-slate-950/40 border border-white/5">
            <div>
              <label class="text-[11px] text-slate-400 block mb-1">Data Inicial (AAAA-MM-DD)</label>
              <input 
                type="date" 
                v-model="form.dateFrom" 
                class="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-indigo-500" 
              />
            </div>
            <div>
              <label class="text-[11px] text-slate-400 block mb-1">Data Final (AAAA-MM-DD)</label>
              <input 
                type="date" 
                v-model="form.dateTo" 
                class="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-indigo-500" 
              />
            </div>
          </div>
        </div>

        <!-- SEÇÃO 3: Conjuntos de Dados -->
        <div>
          <label class="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
            3. Conjuntos de Dados (Datasets)
          </label>
          <DashboardExportDatasetSelector v-model="form.datasets" />
        </div>

        <!-- SEÇÃO 4: Privacidade e Segurança -->
        <div class="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <Icon name="lucide:shield-check" class="w-4 h-4 text-amber-400" />
            <span class="text-xs font-bold text-amber-200">Privacidade de Dados & LGPD</span>
          </div>
          <label class="flex items-center gap-2.5 cursor-pointer mt-1">
            <input 
              type="checkbox" 
              v-model="form.includeContactDetails" 
              class="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500" 
            />
            <span class="text-xs text-slate-300">
              Incluir dados pessoais de contato dos leads (Nome, Telefone e E-mail)
            </span>
          </label>
          <span class="text-[11px] text-slate-400 leading-tight">
            * Por padrão, dados de contato são mascarados para manter o relatório puramente analítico e em conformidade com as boas práticas de segurança.
          </span>
        </div>

      </div>

      <!-- Rodapé com Ações -->
      <div class="flex items-center justify-between p-4 border-t border-white/10 bg-slate-950/70">
        <button
          type="button"
          @click="emit('close')"
          :disabled="isExporting"
          class="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          @click="handleExport"
          :disabled="isExporting || form.datasets.length === 0"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/25 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Icon 
            v-if="isExporting" 
            name="lucide:loader-2" 
            class="w-4 h-4 animate-spin" 
          />
          <Icon 
            v-else 
            name="lucide:download" 
            class="w-4 h-4" 
          />
          <span>{{ isExporting ? 'Preparando arquivo...' : 'Exportar Dados' }}</span>
        </button>
      </div>

    </div>
  </div>
</template>
