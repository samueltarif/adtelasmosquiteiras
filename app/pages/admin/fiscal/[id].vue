<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const route = useRoute()
const router = useRouter()
const docId = computed(() => String(route.params.id || ''))

useHead({
  title: 'Detalhes da Nota Fiscal — Painel Admin'
})

const loading = ref(true)
const transmitting = ref(false)
const consulting = ref(false)
const syncingFiles = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const doc = ref<any>(null)
const diagnostics = ref<any>(null)
const activeTab = ref<'geral' | 'itens' | 'tentativas' | 'arquivos'>('geral')

const fetchDocument = async () => {
  loading.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<any>(`/api/admin/crm/fiscal/${docId.value}`)
    doc.value = res.document
    diagnostics.value = res.diagnostics
  } catch (err: any) {
    errorMessage.value = err.data?.message || err.message || 'Erro ao carregar nota fiscal.'
  } finally {
    loading.value = false
  }
}

const handleTransmit = async () => {
  if (!confirm('Deseja iniciar a transmissão desta nota fiscal? Uma vez transmitida, os itens e valores serão congelados.')) return
  transmitting.value = true
  errorMessage.value = null
  successMessage.value = null
  try {
    const res = await $fetch<any>(`/api/admin/crm/fiscal/${docId.value}/transmit`, { method: 'POST' })
    successMessage.value = 'Transmissão solicitada com sucesso!'
    await fetchDocument()
  } catch (err: any) {
    errorMessage.value = err.data?.message || err.message || 'Falha na transmissão da nota fiscal.'
  } finally {
    transmitting.value = false
  }
}

const handleConsult = async () => {
  consulting.value = true
  errorMessage.value = null
  successMessage.value = null
  try {
    const res = await $fetch<any>(`/api/admin/crm/fiscal/${docId.value}/consult`, { method: 'POST' })
    successMessage.value = 'Status consultado com sucesso no provedor!'
    await fetchDocument()
  } catch (err: any) {
    errorMessage.value = err.data?.message || err.message || 'Falha ao consultar provedor.'
  } finally {
    consulting.value = false
  }
}

const handleSyncFiles = async () => {
  syncingFiles.value = true
  errorMessage.value = null
  try {
    await $fetch<any>(`/api/admin/crm/fiscal/${docId.value}/sync-files`, { method: 'POST' })
    successMessage.value = 'Arquivos sincronizados e salvos com sucesso no R2!'
    await fetchDocument()
  } catch (err: any) {
    errorMessage.value = err.data?.message || err.message || 'Falha ao sincronizar arquivos.'
  } finally {
    syncingFiles.value = false
  }
}

const handleDownload = async (type: 'xml' | 'pdf') => {
  try {
    const res = await $fetch<any>(`/api/admin/crm/fiscal/${docId.value}/download?type=${type}`)
    if (res.downloadUrl) {
      window.open(res.downloadUrl, '_blank')
    }
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Arquivo indisponível para download.')
  }
}

const formatMoney = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

const formatDate = (iso: string) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const isEditable = computed(() => {
  return doc.value && ['rascunho', 'rejeitado'].includes(doc.value.status)
})

onMounted(() => {
  fetchDocument()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Breadcrumb e Voltar -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2 text-sm text-slate-400">
        <NuxtLink to="/admin/fiscal" class="hover:text-white transition flex items-center gap-1">
          <Icon name="lucide:receipt" class="w-4 h-4" />
          Notas Fiscais
        </NuxtLink>
        <span>/</span>
        <span class="text-slate-200 font-medium">Nota Fiscal</span>
      </div>

      <NuxtLink
        to="/admin/fiscal"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold min-h-[44px] transition"
      >
        <Icon name="lucide:chevron-left" class="w-4 h-4" />
        Voltar à Lista
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !doc" class="py-16 text-center text-slate-400">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
      Carregando detalhes do documento fiscal...
    </div>

    <div v-else-if="doc" class="space-y-6">
      <!-- Header do Documento -->
      <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span class="px-2.5 py-0.5 rounded text-xs font-bold uppercase"
                :class="doc.tipo_documento === 'nfe' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'">
                {{ doc.tipo_documento.toUpperCase() }}
              </span>

              <span class="text-xs px-2.5 py-0.5 rounded-full font-bold"
                :class="doc.ambiente === 'producao' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-amber-950 text-amber-400 border border-amber-800/50'">
                {{ doc.ambiente === 'producao' ? 'Produção' : 'Homologação' }}
              </span>

              <span v-if="doc.is_simulated" class="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-400 border border-slate-700">
                Sandbox Local
              </span>

              <span v-if="doc.storage_pending" class="px-2 py-0.5 rounded text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Icon name="lucide:alert-circle" class="w-3.5 h-3.5" />
                Storage R2 Pendente
              </span>
            </div>

            <h1 class="text-2xl font-bold text-white tracking-tight">
              {{ doc.numero_documento ? `Documento Nº ${doc.numero_documento} (Série ${doc.serie || '1'})` : 'Rascunho de Emissão Fiscal' }}
            </h1>

            <p class="text-sm text-slate-400 mt-1">
              Vinculada à Ordem de Serviço:
              <NuxtLink :to="`/admin/ordens-servico/${doc.work_order_id}`" class="text-indigo-400 hover:text-indigo-300 font-semibold underline">
                Ver OS
              </NuxtLink>
            </p>
          </div>

          <!-- Ações Principais -->
          <div class="flex flex-wrap items-center gap-2.5">
            <button
              v-if="['rascunho', 'rejeitado'].includes(doc.status)"
              @click="handleTransmit"
              :disabled="transmitting || (diagnostics && !diagnostics.isValid)"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition min-h-[44px] cursor-pointer"
            >
              <Icon name="lucide:send" class="w-4 h-4" :class="{ 'animate-spin': transmitting }" />
              <span>Transmitir Nota Fiscal</span>
            </button>

            <button
              v-if="['processando', 'falha_processamento'].includes(doc.status)"
              @click="handleConsult"
              :disabled="consulting"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm disabled:opacity-50 transition min-h-[44px] cursor-pointer"
            >
              <Icon name="lucide:refresh-cw" class="w-4 h-4" :class="{ 'animate-spin': consulting }" />
              <span>Consultar Provedor</span>
            </button>

            <button
              v-if="doc.storage_pending"
              @click="handleSyncFiles"
              :disabled="syncingFiles"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-sm font-semibold transition min-h-[44px] cursor-pointer"
            >
              <Icon name="lucide:cloud-upload" class="w-4 h-4" />
              <span>Sincronizar R2</span>
            </button>

            <template v-if="doc.status === 'autorizado'">
              <button
                @click="handleDownload('xml')"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition min-h-[44px] cursor-pointer"
              >
                <Icon name="lucide:file-code" class="w-4 h-4 text-emerald-400" />
                <span>Baixar XML</span>
              </button>

              <button
                @click="handleDownload('pdf')"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition min-h-[44px] cursor-pointer"
              >
                <Icon name="lucide:file-text" class="w-4 h-4 text-rose-400" />
                <span>Baixar DANFE</span>
              </button>
            </template>
          </div>
        </div>

        <!-- Alertas de Feedback -->
        <div v-if="errorMessage" class="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
          <Icon name="lucide:alert-triangle" class="w-5 h-5 shrink-0 text-rose-400" />
          <span>{{ errorMessage }}</span>
        </div>

        <div v-if="successMessage" class="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <Icon name="lucide:check-circle" class="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- Painel de Bloqueios Diagnósticos -->
        <div v-if="diagnostics && !diagnostics.isValid && ['rascunho', 'rejeitado'].includes(doc.status)" class="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
          <div class="flex items-center gap-2 font-bold mb-2 text-amber-200">
            <Icon name="lucide:shield-alert" class="w-5 h-5" />
            Pendências para autorização fiscal:
          </div>
          <ul class="list-disc list-inside space-y-1 text-xs text-amber-300/90">
            <li v-for="(err, idx) in diagnostics.errors" :key="idx">
              {{ err.message }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Abas de Navegação -->
      <div class="flex border-b border-white/10 gap-2">
        <button
          @click="activeTab = 'geral'"
          class="px-4 py-3 text-sm font-semibold border-b-2 transition min-h-[44px] cursor-pointer"
          :class="activeTab === 'geral' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'"
        >
          Resumo Geral & Totais
        </button>

        <button
          @click="activeTab = 'itens'"
          class="px-4 py-3 text-sm font-semibold border-b-2 transition min-h-[44px] cursor-pointer"
          :class="activeTab === 'itens' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'"
        >
          Itens & Parâmetros Fiscais
        </button>

        <button
          @click="activeTab = 'tentativas'"
          class="px-4 py-3 text-sm font-semibold border-b-2 transition min-h-[44px] cursor-pointer"
          :class="activeTab === 'tentativas' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'"
        >
          Histórico de Tentativas (Append-Only)
        </button>

        <button
          @click="activeTab = 'arquivos'"
          class="px-4 py-3 text-sm font-semibold border-b-2 transition min-h-[44px] cursor-pointer"
          :class="activeTab === 'arquivos' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'"
        >
          Arquivos & Eventos
        </button>
      </div>

      <!-- Conteúdo da Aba 1: Resumo Geral -->
      <div v-if="activeTab === 'geral'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <!-- Totais Financeiros -->
          <div class="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-4">Totais da Operação</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                <p class="text-xs text-slate-400">Total Bruto</p>
                <p class="text-base font-bold text-white mt-1">{{ formatMoney(doc.valor_total) }}</p>
              </div>
              <div class="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                <p class="text-xs text-slate-400">Descontos</p>
                <p class="text-base font-bold text-rose-400 mt-1">{{ formatMoney(doc.valor_desconto) }}</p>
              </div>
              <div class="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                <p class="text-xs text-slate-400">Serviços</p>
                <p class="text-base font-bold text-purple-400 mt-1">{{ formatMoney(doc.valor_servicos) }}</p>
              </div>
              <div class="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                <p class="text-xs text-slate-400">Produtos</p>
                <p class="text-base font-bold text-blue-400 mt-1">{{ formatMoney(doc.valor_produtos) }}</p>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
              <span class="text-sm font-semibold text-slate-300">Valor Líquido Faturado:</span>
              <span class="text-xl font-black text-emerald-400">{{ formatMoney(doc.valor_liquido) }}</span>
            </div>
          </div>

          <!-- Protocolo Oficial -->
          <div v-if="doc.chave_acesso || doc.numero_protocolo" class="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-3">Protocolos e Identificadores</h3>
            <div class="space-y-2 text-xs">
              <div v-if="doc.chave_acesso">
                <span class="text-slate-400 block font-mono">Chave de Acesso:</span>
                <span class="text-indigo-300 font-mono select-all text-sm font-bold">{{ doc.chave_acesso }}</span>
              </div>
              <div v-if="doc.numero_protocolo">
                <span class="text-slate-400 block font-mono">Protocolo de Autorização:</span>
                <span class="text-slate-200 font-mono">{{ doc.numero_protocolo }}</span>
              </div>
              <div v-if="doc.data_autorizacao">
                <span class="text-slate-400 block">Data de Autorização:</span>
                <span class="text-slate-200">{{ formatDate(doc.data_autorizacao) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Dados do Destinatário & Emitente -->
        <div class="space-y-6">
          <div class="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-3">Destinatário</h3>
            <div class="space-y-1.5 text-xs text-slate-300">
              <p class="font-bold text-white text-sm">{{ doc.snapshot_destinatario?.nome || 'Nome não gravado' }}</p>
              <p>Doc: {{ doc.snapshot_destinatario?.documento || '-' }}</p>
              <p>Email: {{ doc.snapshot_destinatario?.email || '-' }}</p>
              <p>Indicador IE: {{ doc.snapshot_destinatario?.indicador_ie || 'Não contribuinte' }}</p>
            </div>
          </div>

          <div class="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-3">Emitente</h3>
            <div class="space-y-1.5 text-xs text-slate-300">
              <p class="font-bold text-white text-sm">{{ doc.snapshot_emitente?.razao_social || 'AD Telas e Redes' }}</p>
              <p>CNPJ: {{ doc.snapshot_emitente?.cnpj || '-' }}</p>
              <p>Regime: {{ doc.snapshot_emitente?.regime_tributario || 'Não configurado' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Conteúdo da Aba 2: Itens Fiscais -->
      <div v-if="activeTab === 'itens'" class="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-4">Itens Integrantes da Emissão</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-white/10 text-slate-400 uppercase">
                <th class="py-2.5 px-3">Item / Descrição</th>
                <th class="py-2.5 px-3">Tipo</th>
                <th class="py-2.5 px-3">Qtd</th>
                <th class="py-2.5 px-3">Valor Unit.</th>
                <th class="py-2.5 px-3">Desconto</th>
                <th class="py-2.5 px-3">Líquido</th>
                <th class="py-2.5 px-3">Classificação (NCM / CFOP / LC116)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-for="item in doc.items || []" :key="item.id">
                <td class="py-3 px-3 font-medium text-white">{{ item.descricao }}</td>
                <td class="py-3 px-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                    :class="item.tipo_item === 'servico' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'">
                    {{ item.tipo_item }}
                  </span>
                </td>
                <td class="py-3 px-3">{{ item.quantidade }}</td>
                <td class="py-3 px-3">{{ formatMoney(item.valor_unitario) }}</td>
                <td class="py-3 px-3 text-rose-400">{{ formatMoney(item.valor_desconto) }}</td>
                <td class="py-3 px-3 font-bold text-white">{{ formatMoney(item.valor_liquido) }}</td>
                <td class="py-3 px-3 text-slate-400">
                  <span v-if="item.tipo_item === 'mercadoria'">NCM: {{ item.ncm || '-' }} | CFOP: {{ item.cfop || '-' }}</span>
                  <span v-else>Serviço LC116: {{ item.codigo_servico_lc116 || '-' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Conteúdo da Aba 3: Histórico Append-Only -->
      <div v-if="activeTab === 'tentativas'" class="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-4">Linha do Tempo de Tentativas</h3>
        <div v-if="!doc.attempts || doc.attempts.length === 0" class="text-slate-400 text-sm py-4 text-center">
          Nenhuma tentativa de transmissão registrada até o momento.
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="att in doc.attempts"
            :key="att.id"
            class="p-3.5 bg-slate-950/60 border border-white/5 rounded-xl text-xs space-y-1"
          >
            <div class="flex items-center justify-between">
              <span class="font-bold text-white">Tentativa #{{ att.attempt_number }} — Fase: {{ att.transmission_phase }}</span>
              <span class="text-slate-400">{{ formatDate(att.created_at) }}</span>
            </div>
            <p class="text-slate-300">
              Resultado: <strong :class="att.status_result === 'autorizado' ? 'text-emerald-400' : 'text-amber-400'">{{ att.status_result }}</strong>
              <span v-if="att.duration_ms" class="ml-2 text-slate-500">({{ att.duration_ms }}ms)</span>
            </p>
            <p v-if="att.error_message" class="text-rose-400">{{ att.error_message }}</p>
          </div>
        </div>
      </div>

      <!-- Conteúdo da Aba 4: Arquivos & Eventos -->
      <div v-if="activeTab === 'arquivos'" class="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-4">Arquivos Fiscais Armazenados no R2</h3>
        <div v-if="!doc.files || doc.files.length === 0" class="text-slate-400 text-sm py-4 text-center">
          Nenhum arquivo gravado no armazenamento seguro.
        </div>
        <div v-else class="space-y-2">
          <div v-for="f in doc.files" :key="f.id" class="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-center justify-between text-xs">
            <div>
              <span class="font-bold text-white uppercase">{{ f.tipo_arquivo }}</span>
              <p class="text-slate-400 font-mono text-[11px] mt-0.5">{{ f.storage_key }}</p>
              <p class="text-slate-500 font-mono text-[10px]">SHA256: {{ f.sha256 }}</p>
            </div>
            <button
              @click="handleDownload(f.tipo_arquivo.includes('pdf') ? 'pdf' : 'xml')"
              class="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold min-h-[36px] cursor-pointer"
            >
              Baixar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
