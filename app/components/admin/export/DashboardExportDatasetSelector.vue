<script setup lang="ts">
import { computed } from 'vue'
import type { ExportDatasetKey } from '../../../types/dashboardExport'

const props = defineProps<{
  modelValue: ExportDatasetKey[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ExportDatasetKey[]): void
}>()

interface DatasetOption {
  key: ExportDatasetKey
  label: string
  category: string
  description: string
}

const DATASET_OPTIONS: DatasetOption[] = [
  // Visão Geral & Aquisição
  { key: 'overview', label: 'Resumo Geral', category: 'Visão Geral & Canais', description: 'Visitantes, sessões, taxas de conversão e intenções consolidadas' },
  { key: 'acquisition', label: 'Aquisição por Canal', category: 'Visão Geral & Canais', description: 'Métricas dos 13 canais canônicos do sistema' },
  { key: 'google_ads', label: 'Google Ads (Geral)', category: 'Google Ads', description: 'Sessões, cliques e conversões observadas com gclid/utm' },
  { key: 'google_ads_campaigns', label: 'Google Ads — Campanhas', category: 'Google Ads', description: 'Desempenho agregado por campanha UTM e Google ID' },
  { key: 'google_ads_keywords', label: 'Google Ads — Palavras-chave', category: 'Google Ads', description: 'Termos e palavras-chave de busca observadas' },
  
  // Tráfego e Telemetria
  { key: 'page_views', label: 'Pageviews Detalhados', category: 'Tráfego & Telemetria', description: 'Registros cronológicos de visualizações de página' },
  
  // Contatos & Conversões
  { key: 'whatsapp', label: 'WhatsApp & Atribuições', category: 'Conversões & Leads', description: 'Cliques com códigos curtos, atribuições e status' },
  { key: 'leads', label: 'Leads Comerciais', category: 'Conversões & Leads', description: 'Leads gerados via formulário e canais de entrada' },
  
  // Gestão de Campanhas (Fase 7)
  { key: 'campaign_kpis', label: 'KPIs de Campanhas (Fase 7)', category: 'Gestão de Campanhas', description: 'Metas, orçamento, gasto, ROAS e CPL cadastrados' }
]

const allKeys = DATASET_OPTIONS.map(o => o.key)

const isAllSelected = computed(() => {
  return allKeys.every(k => props.modelValue.includes(k))
})

const isIndeterminate = computed(() => {
  const count = props.modelValue.length
  return count > 0 && count < allKeys.length
})

function toggleAll() {
  if (isAllSelected.value) {
    emit('update:modelValue', [])
  } else {
    emit('update:modelValue', [...allKeys])
  }
}

function toggleItem(key: ExportDatasetKey) {
  const current = [...props.modelValue]
  const idx = current.indexOf(key)
  if (idx > -1) {
    current.splice(idx, 1)
  } else {
    current.push(key)
  }
  emit('update:modelValue', current)
}

const categories = computed(() => {
  const map = new Map<string, DatasetOption[]>()
  for (const opt of DATASET_OPTIONS) {
    if (!map.has(opt.category)) map.set(opt.category, [])
    map.get(opt.category)!.push(opt)
  }
  return Array.from(map.entries())
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Selecionar Tudo -->
    <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
      <label class="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          :checked="isAllSelected"
          :indeterminate="isIndeterminate"
          @change="toggleAll"
          class="w-4 h-4 rounded text-indigo-500 bg-slate-900 border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-900"
        />
        <span class="text-sm font-semibold text-white">Selecionar todos os conjuntos de dados</span>
      </label>
      <span class="text-xs text-slate-400 font-medium">
        {{ modelValue.length }} de {{ allKeys.length }} selecionados
      </span>
    </div>

    <!-- Grupos de Datasets -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div 
        v-for="[categoryName, items] in categories" 
        :key="categoryName"
        class="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-900/60 border border-white/5"
      >
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
          {{ categoryName }}
        </span>

        <label
          v-for="item in items"
          :key="item.key"
          class="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            :checked="modelValue.includes(item.key)"
            @change="toggleItem(item.key)"
            class="w-4 h-4 mt-0.5 rounded text-indigo-500 bg-slate-800 border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-900"
          />
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-semibold text-slate-200">{{ item.label }}</span>
            <span class="text-[11px] text-slate-400 leading-tight">{{ item.description }}</span>
          </div>
        </label>
      </div>
    </div>
  </div>
</template>
