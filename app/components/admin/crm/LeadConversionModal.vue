<script setup lang="ts">
import { ref, watch, toRef } from 'vue'
import { useRouter } from 'vue-router'
import ClientDuplicateAlert from './ClientDuplicateAlert.vue'
import { useModalA11y } from '~/composables/useModalA11y'

const props = defineProps<{
  isOpen: boolean
  lead: {
    id: string
    nome: string
    telefone: string
    email?: string | null
    servico?: string | null
    valor_orcamento?: number | string | null
    cidade?: string | null
    bairro?: string | null
  } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'converted', result: any): void
}>()

useModalA11y(toRef(props, 'isOpen'), () => emit('close'))

const router = useRouter()
const isConverting = ref(false)
const errorMessage = ref<string | null>(null)
const duplicateCandidates = ref<any[]>([])

const form = ref({
  nome: '',
  tipo_cliente: 'pessoa_fisica',
  telefone_principal: '',
  email: '',
  cpf_cnpj: '',
  criar_endereco: false,
  endereco_data: {
    rotulo: 'Principal',
    tipo_imovel: 'apartamento',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'São Paulo',
    uf: 'SP'
  },
  criar_os: true,
  os_data: {
    categoria_operacional: 'tela_mosquiteira',
    descricao: '',
    valor_orcamento: 0
  },
  confirmPossibleDuplicate: false
})

watch(() => props.lead, (l) => {
  if (l) {
    duplicateCandidates.value = []
    errorMessage.value = null
    
    // Mapeia categoria operacional a partir do serviço do Lead
    let catOp = 'tela_mosquiteira'
    if (l.servico?.toLowerCase().includes('rede')) catOp = 'rede_protecao'
    else if (l.servico?.toLowerCase().includes('vidro') || l.servico?.toLowerCase().includes('vidra')) catOp = 'vidracaria'

    const val = typeof l.valor_orcamento === 'number' ? l.valor_orcamento : parseFloat(String(l.valor_orcamento || 0))

    form.value = {
      nome: l.nome || '',
      tipo_cliente: 'pessoa_fisica',
      telefone_principal: l.telefone || '',
      email: l.email || '',
      cpf_cnpj: '',
      criar_endereco: false,
      endereco_data: {
        rotulo: 'Principal',
        tipo_imovel: 'apartamento',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: l.bairro || '',
        cidade: l.cidade || 'São Paulo',
        uf: 'SP'
      },
      criar_os: true,
      os_data: {
        categoria_operacional: catOp,
        descricao: l.servico ? `Instalação de ${l.servico}` : 'Atendimento inicial',
        valor_orcamento: isNaN(val) ? 0 : val
      },
      confirmPossibleDuplicate: false
    }
  }
}, { immediate: true })

async function handleConvert(overrideDuplicate = false) {
  if (!props.lead?.id) return
  if (!form.value.nome.trim() || form.value.nome.trim().length < 2) {
    errorMessage.value = 'O nome deve ter pelo menos 2 caracteres.'
    return
  }
  if (!form.value.telefone_principal.replace(/\D/g, '') || form.value.telefone_principal.replace(/\D/g, '').length < 10) {
    errorMessage.value = 'Informe um telefone válido com DDD.'
    return
  }

  isConverting.value = true
  errorMessage.value = null

  if (overrideDuplicate) {
    form.value.confirmPossibleDuplicate = true
  }

  try {
    const res = await $fetch<any>(`/api/admin/crm/leads/${props.lead.id}/convert`, {
      method: 'POST',
      body: form.value
    })

    if (res?.success) {
      emit('converted', res.result)
      emit('close')
      if (res.result?.client_id) {
        router.push(`/admin/clientes/${res.result.client_id}`)
      }
    }
  } catch (err: any) {
    const errData = err?.data?.data || err?.data || {}
    if (err?.statusCode === 409 && errData.code === 'POSSIBLE_DUPLICATE') {
      duplicateCandidates.value = errData.duplicates || []
    } else {
      errorMessage.value = err?.data?.message || err?.message || 'Erro ao converter lead em cliente.'
    }
  } finally {
    isConverting.value = false
  }
}

function openExistingClient(clientId: string) {
  emit('close')
  router.push(`/admin/clientes/${clientId}`)
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')"></div>

    <!-- Modal Container -->
    <div
      class="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto flex flex-col gap-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-conversion-modal-title"
    >
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Icon name="lucide:sparkles" class="w-5 h-5" />
          </div>
          <div>
            <h3 id="lead-conversion-modal-title" class="text-base font-bold text-white leading-tight">Converter Lead em Cliente</h3>
            <p class="text-xs text-slate-400">Criar cadastro oficial e iniciar atendimento CRM</p>
          </div>
        </div>

        <button 
          type="button" 
          @click="emit('close')"
          aria-label="Fechar modal"
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <div v-if="errorMessage" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
        <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Alerta de Duplicata Server-Side -->
      <ClientDuplicateAlert
        v-if="duplicateCandidates.length > 0"
        :duplicates="duplicateCandidates"
        confirm-label="Criar novo cliente mesmo assim"
        @confirm="handleConvert(true)"
        @cancel="duplicateCandidates = []"
        @open-client="openExistingClient"
      />

      <form v-else @submit.prevent="() => handleConvert(false)" class="space-y-4">
        <!-- 1. Identificação do Cliente -->
        <div class="rounded-xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
          <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Icon name="lucide:user" class="w-3.5 h-3.5 text-indigo-400" />
            <span>Dados do Cliente</span>
          </h4>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">
              Nome Completo <span class="text-red-400">*</span>
            </label>
            <input 
              v-model="form.nome" 
              type="text" 
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs min-h-[44px]"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">
                Tipo de Cliente <span class="text-red-400">*</span>
              </label>
              <select 
                v-model="form.tipo_cliente"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs min-h-[44px]"
              >
                <option value="pessoa_fisica">Pessoa Física</option>
                <option value="empresa">Empresa</option>
                <option value="condominio">Condomínio</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">
                Telefone Principal <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="form.telefone_principal" 
                type="tel" 
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono min-h-[44px]"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">E-mail</label>
              <input 
                v-model="form.email" 
                type="email" 
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs min-h-[44px]"
                placeholder="opcional"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">CPF / CNPJ</label>
              <input 
                v-model="form.cpf_cnpj" 
                type="text" 
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono min-h-[44px]"
                placeholder="opcional"
              />
            </div>
          </div>
        </div>

        <!-- 2. Endereço Inicial Opcional (Com confirmação explícita) -->
        <div class="rounded-xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
          <label class="flex items-center gap-2 cursor-pointer select-none min-h-[44px] py-1">
            <input 
              v-model="form.criar_endereco" 
              type="checkbox" 
              class="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-white/20"
            />
            <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="lucide:map-pin" class="w-3.5 h-3.5 text-indigo-400" />
              <span>Cadastrar Endereço Inicial do Imóvel</span>
            </span>
          </label>

          <div v-if="form.criar_endereco" class="space-y-3 pt-2 border-t border-white/10">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">CEP</label>
                <input v-model="form.endereco_data.cep" type="text" class="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs min-h-[44px]" placeholder="00000-000" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[11px] text-slate-400 mb-1">Logradouro / Rua</label>
                <input v-model="form.endereco_data.logradouro" type="text" class="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs min-h-[44px]" placeholder="Rua / Av" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">Número</label>
                <input v-model="form.endereco_data.numero" type="text" class="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs min-h-[44px]" placeholder="123" />
              </div>
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">Complemento</label>
                <input v-model="form.endereco_data.complemento" type="text" class="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs min-h-[44px]" placeholder="Apto 10" />
              </div>
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">Bairro</label>
                <input v-model="form.endereco_data.bairro" type="text" class="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs min-h-[44px]" placeholder="Bairro" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="sm:col-span-2">
                <label class="block text-[11px] text-slate-400 mb-1">Cidade</label>
                <input v-model="form.endereco_data.cidade" type="text" required class="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs min-h-[44px]" />
              </div>
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">UF</label>
                <input v-model="form.endereco_data.uf" type="text" maxlength="2" required class="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs uppercase font-bold text-center min-h-[44px]" />
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Primeira Ordem de Serviço (Opcional) -->
        <div class="rounded-xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
          <label class="flex items-center gap-2 cursor-pointer select-none min-h-[44px] py-1">
            <input 
              v-model="form.criar_os" 
              type="checkbox" 
              class="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-white/20"
            />
            <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="lucide:file-text" class="w-3.5 h-3.5 text-indigo-400" />
              <span>Gerar Primeira Ordem de Serviço (OS)</span>
            </span>
          </label>

          <div v-if="form.criar_os" class="space-y-3 pt-2 border-t border-white/10">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">Categoria Operacional</label>
                <select v-model="form.os_data.categoria_operacional" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs min-h-[44px]">
                  <option value="tela_mosquiteira">Tela Mosquiteira</option>
                  <option value="rede_protecao">Rede de Proteção</option>
                  <option value="vidracaria">Vidraçaria</option>
                  <option value="manutencao">Manutenção</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] text-slate-400 mb-1">Valor Estimado (R$)</label>
                <input 
                  v-model.number="form.os_data.valor_orcamento" 
                  type="number" 
                  step="0.01" 
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono min-h-[44px]" 
                />
              </div>
            </div>

            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Descrição do Serviço</label>
              <input 
                v-model="form.os_data.descricao" 
                type="text" 
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs min-h-[44px]" 
                placeholder="Ex: Instalação de telas em 3 janelas" 
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button 
            type="button" 
            @click="emit('close')"
            class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-semibold min-h-[44px]"
          >
            Cancelar
          </button>

          <button 
            type="submit"
            :disabled="isConverting"
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors text-xs font-bold flex items-center gap-2 min-h-[44px] cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Icon v-if="isConverting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>{{ isConverting ? 'Convertendo...' : 'Confirmar Conversão' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
