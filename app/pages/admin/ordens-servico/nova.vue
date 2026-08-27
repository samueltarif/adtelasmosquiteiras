<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()

const queryClientId = typeof route.query.clientId === 'string' ? route.query.clientId.trim() : ''

// Estado do Cliente Selecionado
const selectedClient = ref<any | null>(null)
const clientSearchTerm = ref('')
const clientSearchResults = ref<any[]>([])
const isSearchingClients = ref(false)

// Dados Auxiliares
const clientAddresses = ref<any[]>([])
const activeStaff = ref<any[]>([])
const isLoadingAddresses = ref(false)
const isLoadingStaff = ref(false)

// Campos do Formulário
const selectedAddressId = ref<string>('')
const selectedStaffId = ref<string>('')
const dataPrevista = ref<string>('')
const proposalValidUntil = ref<string>('')
const observacoesGerais = ref<string>('')
const valorDesconto = ref<number>(0)

// Item Inicial Obrigatório
const itemDescricao = ref('')
const itemCategoria = ref('tela_mosquiteira')
const itemQuantidade = ref(1)
const itemPrecoUnitario = ref(0)
const itemObservacoes = ref('')

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const categoriasOperacionais = [
  { value: 'tela_mosquiteira', label: 'Tela Mosquiteira' },
  { value: 'rede_protecao', label: 'Rede de Proteção' },
  { value: 'vidracaria', label: 'Vidraçaria' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'outro', label: 'Outro Serviço' }
]

async function loadClientById(clientId: string) {
  if (!clientId) return
  isLoadingAddresses.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<any>(`/api/admin/crm/clients/${clientId}`)
    if (res?.client) {
      selectedClient.value = res.client
      clientAddresses.value = res.addresses || []
      const principal = clientAddresses.value.find((a: any) => a.is_principal || a.is_padrao)
      if (principal) {
        selectedAddressId.value = principal.id
      } else if (clientAddresses.value.length > 0) {
        selectedAddressId.value = clientAddresses.value[0].id
      } else {
        selectedAddressId.value = ''
      }
    } else {
      selectedClient.value = null
      clientAddresses.value = []
      selectedAddressId.value = ''
      errorMessage.value = 'Cliente não encontrado.'
    }
  } catch (err: any) {
    console.error('[NovaOS] Erro ao carregar cliente:', err)
    selectedClient.value = null
    clientAddresses.value = []
    selectedAddressId.value = ''
    if (err?.statusCode === 404) {
      errorMessage.value = 'Cliente não encontrado.'
    } else if (err?.statusCode === 401 || err?.statusCode === 403) {
      errorMessage.value = 'Sessão inválida ou sem permissão para acessar este cliente.'
    } else {
      errorMessage.value = err?.data?.message || err?.message || 'Erro ao carregar dados do cliente.'
    }
  } finally {
    isLoadingAddresses.value = false
  }
}

async function searchClients() {
  if (!clientSearchTerm.value || clientSearchTerm.value.trim().length < 2) {
    clientSearchResults.value = []
    return
  }

  isSearchingClients.value = true
  try {
    const res = await $fetch<any>('/api/admin/crm/clients/search', {
      method: 'POST',
      body: {
        search: clientSearchTerm.value.trim(),
        limit: 5
      }
    })
    clientSearchResults.value = res?.clients || []
  } catch (err) {
    console.error('[NovaOS] Erro na busca de clientes:', err)
  } finally {
    isSearchingClients.value = false
  }
}

async function selectClient(client: any) {
  // Limpar endereços e seleção anterior antes de carregar novo cliente
  selectedAddressId.value = ''
  clientAddresses.value = []
  clientSearchResults.value = []
  clientSearchTerm.value = ''
  selectedClient.value = client
  errorMessage.value = null

  if (!client?.id) return
  await loadAddressesForClient(client.id)
}

function clearSelectedClient() {
  selectedClient.value = null
  selectedAddressId.value = ''
  clientAddresses.value = []
  clientSearchTerm.value = ''
  clientSearchResults.value = []
  errorMessage.value = null
}

async function loadAddressesForClient(clientId: string) {
  isLoadingAddresses.value = true
  try {
    const res = await $fetch<any>(`/api/admin/crm/clients/${clientId}`)
    if (res?.client) {
      selectedClient.value = res.client
    }
    clientAddresses.value = res?.addresses || []
    const principal = clientAddresses.value.find((a: any) => a.is_principal || a.is_padrao)
    if (principal) {
      selectedAddressId.value = principal.id
    } else if (clientAddresses.value.length > 0) {
      selectedAddressId.value = clientAddresses.value[0].id
    } else {
      selectedAddressId.value = ''
    }
  } catch (err: any) {
    console.error('[NovaOS] Erro ao carregar dados e endereços do cliente:', err)
    selectedAddressId.value = ''
    clientAddresses.value = []
    if (err?.statusCode === 404) {
      errorMessage.value = 'Cliente selecionado não foi encontrado no sistema.'
      selectedClient.value = null
    } else if (err?.statusCode === 401 || err?.statusCode === 403) {
      errorMessage.value = 'Sessão inválida ou sem permissão.'
    } else {
      errorMessage.value = err?.data?.message || err?.message || 'Erro ao carregar endereços do cliente.'
    }
  } finally {
    isLoadingAddresses.value = false
  }
}

async function loadActiveStaff() {
  isLoadingStaff.value = true
  try {
    const res = await $fetch<any>('/api/admin/crm/staff')
    activeStaff.value = res?.staff || []
  } catch (err) {
    console.error('[NovaOS] Erro ao carregar equipe técnica:', err)
  } finally {
    isLoadingStaff.value = false
  }
}

async function handleSubmit() {
  if (!selectedClient.value?.id) {
    errorMessage.value = 'Selecione um cliente para abrir a Ordem de Serviço.'
    return
  }

  if (!itemDescricao.value || itemDescricao.value.trim().length < 2) {
    errorMessage.value = 'Informe a descrição do item inicial (mínimo 2 caracteres).'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  const payload: Record<string, any> = {
    clientId: selectedClient.value.id,
    addressId: selectedAddressId.value || null,
    responsibleStaffId: selectedStaffId.value || null,
    dataPrevista: dataPrevista.value || null,
    proposalValidUntil: proposalValidUntil.value || null,
    observacoesGerais: observacoesGerais.value || null,
    valorDesconto: valorDesconto.value || 0,
    initialItem: {
      categoria_operacional: itemCategoria.value,
      descricao: itemDescricao.value.trim(),
      quantidade: Math.max(1, parseInt(String(itemQuantidade.value), 10) || 1),
      preco_unitario: Math.max(0, Number(itemPrecoUnitario.value) || 0),
      observacoes: itemObservacoes.value ? itemObservacoes.value.trim() : null
    }
  }

  try {
    const res = await $fetch<any>('/api/admin/crm/work-orders', {
      method: 'POST',
      body: payload
    })

    if (res?.workOrder?.id) {
      router.push(`/admin/ordens-servico/${res.workOrder.id}`)
    } else {
      errorMessage.value = 'Ordem de serviço criada, mas resposta inválida do servidor.'
    }
  } catch (err: any) {
    console.error('[NovaOS] Erro ao salvar OS:', err)
    errorMessage.value = err?.data?.message || err?.message || 'Falha ao criar ordem de serviço.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadActiveStaff()
  if (queryClientId) {
    loadClientById(queryClientId)
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Cabeçalho -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/admin/ordens-servico"
          class="p-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          title="Voltar para Ordens de Serviço"
        >
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
        </NuxtLink>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">Nova Ordem de Serviço</h1>
          <p class="text-xs sm:text-sm text-slate-400">Abertura de orçamento ou ordem de serviço operacional</p>
        </div>
      </div>
    </div>

    <!-- Mensagem de Erro -->
    <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- 1. Seleção do Cliente -->
      <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg space-y-4">
        <h2 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Icon name="lucide:user" class="w-4 h-4 text-indigo-400" />
          <span>Cliente Solicitante *</span>
        </h2>

        <!-- Cliente Selecionado -->
        <div v-if="selectedClient" class="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-white">{{ selectedClient.nome }}</h3>
            <p class="text-xs text-slate-300">
              Tel: {{ selectedClient.telefone_principal }}
              <span v-if="selectedClient.email"> | Email: {{ selectedClient.email }}</span>
            </p>
            <span class="inline-block text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {{ selectedClient.tipo_cliente === 'empresa' ? 'Empresa' : selectedClient.tipo_cliente === 'condominio' ? 'Condomínio' : 'Pessoa Física' }}
            </span>
          </div>

          <button
            type="button"
            @click="clearSelectedClient"
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer min-h-[38px] self-start sm:self-center"
          >
            Trocar Cliente
          </button>
        </div>

        <!-- Busca de Cliente -->
        <div v-else class="space-y-2 relative">
          <div class="relative">
            <Icon name="lucide:search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="clientSearchTerm"
              @input="searchClients"
              type="text"
              placeholder="Digite o nome, telefone ou CPF/CNPJ do cliente..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>

          <!-- Resultados da Busca -->
          <div
            v-if="clientSearchResults.length > 0"
            class="absolute left-0 right-0 top-full mt-1 rounded-xl border border-white/10 bg-slate-900 shadow-2xl z-20 overflow-hidden divide-y divide-white/5"
          >
            <div
              v-for="c in clientSearchResults"
              :key="c.id"
              @click="selectClient(c)"
              class="p-3 hover:bg-indigo-600/10 cursor-pointer transition-colors flex items-center justify-between gap-3"
            >
              <div>
                <span class="text-xs font-bold text-white block">{{ c.nome }}</span>
                <span class="text-[11px] text-slate-400">{{ c.telefone_principal }} <span v-if="c.cpf_cnpj">| Doc: {{ c.cpf_cnpj }}</span></span>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">Selecionar</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Endereço e Responsável -->
      <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg space-y-4">
        <h2 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Icon name="lucide:map-pin" class="w-4 h-4 text-indigo-400" />
          <span>Local e Atribuição Técnica</span>
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Endereço -->
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Endereço da Instalação</label>
            <select
              v-model="selectedAddressId"
              :disabled="!selectedClient || clientAddresses.length === 0"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer disabled:opacity-50"
            >
              <option value="">Nenhum endereço vinculado</option>
              <option v-for="addr in clientAddresses" :key="addr.id" :value="addr.id">
                {{ addr.rotulo || 'Endereço' }}: {{ addr.logradouro }}, {{ addr.numero }} - {{ addr.bairro }} ({{ addr.cidade }})
              </option>
            </select>
            <span v-if="selectedClient && clientAddresses.length === 0" class="text-[11px] text-amber-400">
              Nenhum endereço cadastrado para este cliente.
            </span>
          </div>

          <!-- Responsável Técnico -->
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Responsável Técnico</label>
            <select
              v-model="selectedStaffId"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option value="">Sem responsável atribuído</option>
              <option v-for="st in activeStaff" :key="st.id" :value="st.id">
                {{ st.nome }} ({{ st.funcao }})
              </option>
            </select>
          </div>

          <!-- Data Prevista -->
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Data Prevista para Instalação</label>
            <input
              v-model="dataPrevista"
              type="date"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>

          <!-- Validade da Proposta -->
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Validade da Proposta</label>
            <input
              v-model="proposalValidUntil"
              type="date"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>
        </div>

        <!-- Observações Gerais -->
        <div class="space-y-1.5 pt-2">
          <label class="text-xs text-slate-300 font-medium">Observações Gerais</label>
          <textarea
            v-model="observacoesGerais"
            rows="2"
            placeholder="Instruções de acesso, condomínio, horários de barulho, etc..."
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
          ></textarea>
        </div>
      </div>

      <!-- 3. Item Inicial Obrigatório da OS -->
      <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Icon name="lucide:package" class="w-4 h-4 text-indigo-400" />
            <span>Item Inicial de Serviço *</span>
          </h2>
          <span class="text-xs text-indigo-400 font-medium">Obrigatório</span>
        </div>

        <div class="space-y-4 pt-2">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Categoria Operacional -->
            <div class="space-y-1.5">
              <label class="text-xs text-slate-300 font-medium">Categoria</label>
              <select
                v-model="itemCategoria"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
              >
                <option v-for="cat in categoriasOperacionais" :key="cat.value" :value="cat.value">
                  {{ cat.label }}
                </option>
              </select>
            </div>

            <!-- Descrição -->
            <div class="space-y-1.5 sm:col-span-2">
              <label class="text-xs text-slate-300 font-medium">Descrição do Serviço *</label>
              <input
                v-model="itemDescricao"
                type="text"
                placeholder="Ex: Instalação de telas mosquiteiras em 3 janelas..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Quantidade -->
            <div class="space-y-1.5">
              <label class="text-xs text-slate-300 font-medium">Quantidade</label>
              <input
                v-model.number="itemQuantidade"
                type="number"
                min="1"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
              />
            </div>

            <!-- Preço Unitário -->
            <div class="space-y-1.5">
              <label class="text-xs text-slate-300 font-medium">Preço Unitário (R$)</label>
              <input
                v-model.number="itemPrecoUnitario"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Botões de Ação -->
      <div class="flex items-center justify-end gap-3 pt-4">
        <NuxtLink
          to="/admin/ordens-servico"
          class="px-5 py-2.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all min-h-[44px] flex items-center justify-center cursor-pointer"
        >
          Cancelar
        </NuxtLink>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          <span>{{ isSubmitting ? 'Criando Ordem de Serviço...' : 'Criar Ordem de Serviço' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
