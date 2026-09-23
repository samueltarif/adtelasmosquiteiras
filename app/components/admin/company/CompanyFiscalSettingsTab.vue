<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(true)
const saving = ref(false)
const successMsg = ref<string | null>(null)
const errorMsg = ref<string | null>(null)

const fiscalSettings = ref<any>({
  regime_tributario: null,
  inscricao_municipal: '',
  inscricao_estadual: '',
  cnae_principal: '',
  codigo_municipio_ibge: '',
  ambiente_padrao: 'homologacao',
  provedor_ativo: 'mock_sandbox',
  nfe_serie: '1',
  nfe_proximo_numero: null,
  nfse_serie: '1',
  nfse_proximo_numero: null,
  serverReadiness: {
    provider: 'mock_sandbox',
    environment: 'homologacao',
    tokenConfigured: false,
    r2StorageConfigured: false,
    isSandbox: true
  }
})

const fetchSettings = async () => {
  loading.value = true
  errorMsg.value = null
  try {
    const res = await $fetch<any>('/api/admin/configuracoes/empresa/fiscal')
    if (res?.settings) {
      fiscalSettings.value = {
        ...fiscalSettings.value,
        ...res.settings
      }
    }
  } catch (err: any) {
    errorMsg.value = 'Erro ao carregar configurações fiscais.'
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  successMsg.value = null
  errorMsg.value = null

  try {
    await $fetch('/api/admin/configuracoes/empresa/fiscal', {
      method: 'PATCH',
      body: {
        regime_tributario: fiscalSettings.value.regime_tributario || null,
        inscricao_municipal: fiscalSettings.value.inscricao_municipal || null,
        inscricao_estadual: fiscalSettings.value.inscricao_estadual || null,
        cnae_principal: fiscalSettings.value.cnae_principal || null,
        codigo_municipio_ibge: fiscalSettings.value.codigo_municipio_ibge || null,
        ambiente_padrao: fiscalSettings.value.ambiente_padrao,
        nfe_serie: fiscalSettings.value.nfe_serie || null,
        nfe_proximo_numero: fiscalSettings.value.nfe_proximo_numero || null,
        nfse_serie: fiscalSettings.value.nfse_serie || null,
        nfse_proximo_numero: fiscalSettings.value.nfse_proximo_numero || null
      }
    })
    successMsg.value = 'Configurações fiscais atualizadas com sucesso!'
  } catch (err: any) {
    errorMsg.value = err.data?.message || err.message || 'Falha ao salvar configurações fiscais.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
      <div>
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Icon name="lucide:receipt" class="w-4 h-4 text-indigo-400" />
          <span>Configurações do Motor Fiscal (NF-e / NFS-e)</span>
        </h3>
        <p class="text-xs text-slate-400 mt-0.5">
          Parâmetros tributários da empresa e status das credenciais protegidas no servidor.
        </p>
      </div>

      <button
        type="button"
        @click="handleSave"
        :disabled="saving || loading"
        class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 min-h-[44px] cursor-pointer"
      >
        <Icon v-if="saving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
        <Icon v-else name="lucide:save" class="w-4 h-4" />
        <span>{{ saving ? 'Salvando...' : 'Salvar Dados Fiscais' }}</span>
      </button>
    </div>

    <!-- Feedback -->
    <div v-if="successMsg" class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
      <Icon name="lucide:check-circle" class="w-4 h-4 text-emerald-400" />
      <span>{{ successMsg }}</span>
    </div>

    <div v-if="errorMsg" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
      <Icon name="lucide:alert-circle" class="w-4 h-4 text-rose-400" />
      <span>{{ errorMsg }}</span>
    </div>

    <!-- Status do Servidor (Somente Leitura — Zero Segredos no Navegador) -->
    <div class="p-4 rounded-xl bg-slate-950/80 border border-white/5 space-y-3">
      <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
        <Icon name="lucide:shield-check" class="w-4 h-4 text-emerald-400" />
        <span>Status de Prontidão do Servidor (Nitro Backend)</span>
      </h4>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div class="p-2.5 rounded-lg bg-slate-900 border border-white/5">
          <span class="text-slate-400 block text-[10px]">Provedor Ativo</span>
          <strong class="text-white font-mono text-xs">{{ fiscalSettings.serverReadiness?.provider || 'mock_sandbox' }}</strong>
        </div>

        <div class="p-2.5 rounded-lg bg-slate-900 border border-white/5">
          <span class="text-slate-400 block text-[10px]">Ambiente Ativo</span>
          <strong class="text-amber-400 font-mono text-xs uppercase">{{ fiscalSettings.serverReadiness?.environment || 'homologacao' }}</strong>
        </div>

        <div class="p-2.5 rounded-lg bg-slate-900 border border-white/5">
          <span class="text-slate-400 block text-[10px]">Token de API</span>
          <span
            class="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold"
            :class="fiscalSettings.serverReadiness?.tokenConfigured ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'"
          >
            {{ fiscalSettings.serverReadiness?.tokenConfigured ? 'Configurado' : 'Pendente' }}
          </span>
        </div>

        <div class="p-2.5 rounded-lg bg-slate-900 border border-white/5">
          <span class="text-slate-400 block text-[10px]">R2 Bucket Fiscal</span>
          <span
            class="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold"
            :class="fiscalSettings.serverReadiness?.r2StorageConfigured ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'"
          >
            {{ fiscalSettings.serverReadiness?.r2StorageConfigured ? 'Conectado' : 'Avisos' }}
          </span>
        </div>
      </div>
      <p class="text-[11px] text-slate-500 italic">
        * As credenciais sensíveis (chaves privadas de API, certificados digitais e tokens de webhook) são mantidas estritamente no servidor privado Nitro e jamais trafegam para o navegador.
      </p>
    </div>

    <!-- Campos de Configuração Fiscal da Empresa -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
      <div>
        <label class="block font-semibold text-slate-300 mb-1">Regime Tributário</label>
        <select
          v-model="fiscalSettings.regime_tributario"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white min-h-[44px] focus:border-indigo-500"
        >
          <option :value="null">Selecione o regime da empresa...</option>
          <option value="simples_nacional">Simples Nacional (CRT 1)</option>
          <option value="simples_nacional_excesso">Simples Nacional - Excesso de Sublimite (CRT 2)</option>
          <option value="regime_normal">Regime Normal - Lucro Presumido / Real (CRT 3)</option>
          <option value="mei">MEI - Microempreendedor Individual (CRT 4)</option>
        </select>
      </div>

      <div>
        <label class="block font-semibold text-slate-300 mb-1">Inscrição Estadual (IE)</label>
        <input
          v-model="fiscalSettings.inscricao_estadual"
          type="text"
          placeholder="Ex: 110.042.490.114"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white min-h-[44px] focus:border-indigo-500"
        />
      </div>

      <div>
        <label class="block font-semibold text-slate-300 mb-1">Inscrição Municipal (IM)</label>
        <input
          v-model="fiscalSettings.inscricao_municipal"
          type="text"
          placeholder="Ex: 3.456.789-0"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white min-h-[44px] focus:border-indigo-500"
        />
      </div>

      <div>
        <label class="block font-semibold text-slate-300 mb-1">CNAE Principal</label>
        <input
          v-model="fiscalSettings.cnae_principal"
          type="text"
          placeholder="Ex: 4330-4/99"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white min-h-[44px] focus:border-indigo-500"
        />
      </div>

      <div>
        <label class="block font-semibold text-slate-300 mb-1">Código Município IBGE (7 dígitos)</label>
        <input
          v-model="fiscalSettings.codigo_municipio_ibge"
          type="text"
          maxlength="7"
          placeholder="Ex: 3550308 (São Paulo)"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white min-h-[44px] focus:border-indigo-500 font-mono"
        />
      </div>

      <div>
        <label class="block font-semibold text-slate-300 mb-1">Ambiente Fiscal Padrão</label>
        <select
          v-model="fiscalSettings.ambiente_padrao"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white min-h-[44px] focus:border-indigo-500"
        >
          <option value="homologacao">Homologação (Ambiente de Testes)</option>
          <option value="producao">Produção Real</option>
        </select>
      </div>

      <div>
        <label class="block font-semibold text-slate-300 mb-1">NF-e: Série / Próximo Nº</label>
        <div class="grid grid-cols-2 gap-2">
          <input
            v-model="fiscalSettings.nfe_serie"
            type="text"
            placeholder="Série"
            class="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white min-h-[44px] text-center"
          />
          <input
            v-model="fiscalSettings.nfe_proximo_numero"
            type="number"
            placeholder="Próx. Nº"
            class="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white min-h-[44px] text-center"
          />
        </div>
      </div>

      <div>
        <label class="block font-semibold text-slate-300 mb-1">NFS-e: Série / Próximo Nº</label>
        <div class="grid grid-cols-2 gap-2">
          <input
            v-model="fiscalSettings.nfse_serie"
            type="text"
            placeholder="Série"
            class="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white min-h-[44px] text-center"
          />
          <input
            v-model="fiscalSettings.nfse_proximo_numero"
            type="number"
            placeholder="Próx. Nº"
            class="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white min-h-[44px] text-center"
          />
        </div>
      </div>
    </div>
  </div>
</template>
