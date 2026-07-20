<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: 'Gestão de Leads - AD Telas e Redes'
})

// Estado de carregamento e dados
const isLoading = ref(false)
const searchQuery = ref('')
const selectedStatusFilter = ref('')
const selectedLead = ref(null)
const isDrawerOpen = ref(false)

// Leads de backup (mock) caso o banco de dados esteja vazio
const mockLeads = ref([
  {
    id: '4091',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2h atrás
    nome: 'Carlos Almeida',
    cidade: 'São Paulo',
    bairro: 'Pinheiros',
    servico: 'Redes de Proteção para Janelas e Sacada',
    telefone: '+55 11 98765-4321',
    email: 'carlos.almeida@gmail.com',
    mensagem: 'Olá, gostaria de solicitar orçamento para instalação de redes de proteção em 3 janelas e na sacada do meu apartamento. Tenho gatos.',
    origem: 'whatsapp_floating',
    status: 'Novo',
    valor_orcamento: 850.00,
    observacoes: 'Cliente prefere instalação aos sábados.'
  },
  {
    id: '4092',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 dia atrás
    nome: 'Mariana Costa',
    cidade: 'São Paulo',
    bairro: 'Moema',
    servico: 'Redes de Proteção para Piscina',
    telefone: '+55 11 99999-8888',
    email: 'mariana.costa@hotmail.com',
    mensagem: 'Olá, preciso de um orçamento para colocar rede na minha piscina. Tenho duas crianças pequenas e um cachorro. A piscina tem cerca de 8 por 4 metros. Aguardo.',
    origem: 'formulario_home',
    status: 'Em Atendimento',
    valor_orcamento: 1250.00,
    observacoes: 'Cliente solicitou pressa devido às férias escolares.'
  },
  {
    id: '4093',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 dias atrás
    nome: 'Roberto Silveira',
    cidade: 'Guarulhos',
    bairro: 'Centro',
    servico: 'Telas Mosquiteiras de Correr',
    telefone: '+55 11 97777-6666',
    email: 'roberto.silveira@outlook.com',
    mensagem: 'Gostaria de saber o valor para instalar telas mosquiteiras em duas portas de correr.',
    origem: 'formulario_servico',
    status: 'Orçado',
    valor_orcamento: 620.00,
    observacoes: 'Orçamento enviado no dia 22/07.'
  }
])

const leads = ref([])

// Carregar leads da API
const fetchLeads = async () => {
  isLoading.value = true
  try {
    const data = await $fetch('/api/admin/leads')
    if (data && data.success) {
      leads.value = data.leads || []
    } else {
      leads.value = [...mockLeads.value]
    }
  } catch (error) {
    console.error('Erro ao buscar leads da API, usando dados mockados:', error)
    leads.value = [...mockLeads.value]
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchLeads()
})

// Filtragem computada
const filteredLeads = computed(() => {
  return leads.value.filter(lead => {
    const matchesSearch = 
      lead.nome?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      lead.bairro?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      lead.cidade?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      lead.servico?.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = selectedStatusFilter.value === '' || lead.status === selectedStatusFilter.value
    
    return matchesSearch && matchesStatus
  })
})

// Detalhes do Lead
const selectLead = (lead) => {
  selectedLead.value = { ...lead }
  isDrawerOpen.value = true
}

const closeDrawer = () => {
  isDrawerOpen.value = false
}

// Salvar Edição do Lead (Status, Valor, Observações)
const isSaving = ref(false)
const saveLeadChanges = async () => {
  if (!selectedLead.value) return
  isSaving.value = true
  
  try {
    const res = await $fetch('/api/admin/update-lead', {
      method: 'POST',
      body: {
        id: selectedLead.value.id,
        status: selectedLead.value.status,
        valor_orcamento: parseFloat(selectedLead.value.valor_orcamento) || 0,
        observacoes: selectedLead.value.observacoes
      }
    })
    
    if (res.success) {
      // Atualizar lista local
      const idx = leads.value.findIndex(l => l.id === selectedLead.value.id)
      if (idx !== -1) {
        leads.value[idx] = { ...selectedLead.value }
      }
      alert('Alterações salvas com sucesso!')
    }
  } catch (e) {
    console.error('Falha ao salvar no banco. Atualizando apenas em memória local.', e)
    // Atualização em fallback de memória
    const idx = leads.value.findIndex(l => l.id === selectedLead.value.id)
    if (idx !== -1) {
      leads.value[idx] = { ...selectedLead.value }
    }
    alert('Alterações salvas localmente (Modo Offline/Sem Banco)!')
  } finally {
    isSaving.value = false
  }
}

// Iniciar Chat no WhatsApp
const startWhatsappChat = () => {
  if (!selectedLead.value) return
  let rawPhone = selectedLead.value.telefone.replace(/\D/g, '')
  if (!rawPhone.startsWith('55')) {
    rawPhone = '55' + rawPhone
  }
  const msg = `Olá ${selectedLead.value.nome}, tudo bem? Sou da AD Telas e Redes, estou entrando em contato a respeito do seu pedido de orçamento feito em nosso site.`
  window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`, '_blank')
}

// Helper para formatar data
const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Formatar moeda
const formatCurrency = (val) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}
</script>

<template>
  <div class="px-6 py-6 flex gap-6 relative overflow-hidden min-h-[calc(100vh-64px)]">
    <!-- Listagem Area -->
    <div class="flex-1 flex flex-col w-full max-w-7xl mx-auto transition-all duration-300">
      <!-- Top Actions -->
      <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 class="text-xl md:text-2xl font-bold text-admin-primary tracking-tight">Gestão de Leads</h2>
        
        <div class="flex flex-wrap gap-3 items-center w-full sm:w-auto">
          <!-- Busca -->
          <div class="relative w-full sm:w-64">
            <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 text-admin-outline w-5 h-5" />
            <input 
              v-model="searchQuery"
              class="w-full h-11 pl-10 pr-4 rounded-lg bg-admin-surface-container-lowest border border-admin-outline-variant focus:border-admin-primary outline-none transition-all text-sm shadow-sm" 
              placeholder="Buscar lead por nome, bairro..." 
              type="text"
            />
          </div>
          <!-- Filtro Status -->
          <select 
            v-model="selectedStatusFilter"
            class="h-11 px-4 bg-admin-surface-container-lowest border border-admin-outline-variant rounded-lg text-sm text-admin-on-surface-variant outline-none shadow-sm focus:border-admin-primary"
          >
            <option value="">Todos os Status</option>
            <option value="Novo">Novo</option>
            <option value="Em Atendimento">Em Atendimento</option>
            <option value="Orçado">Orçado</option>
            <option value="Fechado">Fechado</option>
            <option value="Perdido">Perdido</option>
          </select>
        </div>
      </div>

      <!-- Tabela Card -->
      <div class="bg-admin-surface-container-lowest rounded-lg border border-admin-outline-variant/30 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-admin-surface-container-low border-b border-admin-outline-variant/50 text-xs font-semibold uppercase tracking-wider text-admin-on-surface-variant">
                <th class="py-3 px-4">Data</th>
                <th class="py-3 px-4">Nome</th>
                <th class="py-3 px-4">Localização</th>
                <th class="py-3 px-4">Serviço Solicitado</th>
                <th class="py-3 px-4">Origem</th>
                <th class="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              <tr 
                v-for="lead in filteredLeads" 
                :key="lead.id"
                @click="selectLead(lead)"
                class="border-b border-admin-outline-variant/30 hover:bg-admin-surface-container-low transition-colors cursor-pointer group"
                :class="selectedLead && selectedLead.id === lead.id ? 'bg-admin-surface-container' : ''"
              >
                <td class="py-4 px-4 text-admin-on-surface-variant whitespace-nowrap">{{ formatDate(lead.created_at) }}</td>
                <td class="py-4 px-4 font-semibold text-admin-primary">{{ lead.nome }}</td>
                <td class="py-4 px-4 text-admin-on-surface-variant">{{ lead.bairro ? `${lead.bairro}, ${lead.cidade}` : lead.cidade }}</td>
                <td class="py-4 px-4 text-admin-on-surface-variant max-w-xs truncate">{{ lead.servico }}</td>
                <td class="py-4 px-4 whitespace-nowrap">
                  <div class="flex items-center gap-1.5 text-xs text-admin-on-surface-variant">
                    <Icon v-if="lead.origem.includes('whatsapp')" name="lucide:message-square" class="w-4 h-4 text-green-600" />
                    <Icon v-else name="lucide:file-text" class="w-4 h-4 text-admin-primary" />
                    {{ lead.origem.includes('whatsapp') ? 'WhatsApp' : 'Formulário' }}
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span 
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    :class="{
                      'bg-emerald-100 text-emerald-800': lead.status === 'Novo',
                      'bg-yellow-100 text-yellow-800': lead.status === 'Em Atendimento',
                      'bg-blue-100 text-blue-800': lead.status === 'Orçado',
                      'bg-green-100 text-green-800 border border-green-300': lead.status === 'Fechado',
                      'bg-red-100 text-red-800': lead.status === 'Perdido'
                    }"
                  >
                    {{ lead.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredLeads.length === 0">
                <td colspan="6" class="py-8 px-4 text-center text-admin-on-surface-variant">Nenhum lead encontrado com os filtros selecionados.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Gaveta Lateral Drawer (Detalhes do Lead) -->
    <aside 
      class="fixed inset-y-0 right-0 w-full max-w-md bg-admin-surface-container-lowest shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col border-l border-admin-outline-variant/30"
      :class="isDrawerOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <!-- Header do Drawer -->
      <div v-if="selectedLead" class="px-6 py-4 border-b border-admin-outline-variant/30 flex justify-between items-center bg-admin-surface">
        <div>
          <h3 class="text-lg font-bold text-admin-primary">{{ selectedLead.nome }}</h3>
          <p class="text-xs text-admin-on-surface-variant mt-1">Lead ID: #{{ selectedLead.id }}</p>
        </div>
        <button @click="closeDrawer" class="w-8 h-8 rounded-full hover:bg-admin-surface-container-highest flex items-center justify-center text-admin-on-surface-variant transition-colors">
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Conteúdo do Drawer -->
      <div v-if="selectedLead" class="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <!-- Status -->
        <div class="flex justify-between items-center">
          <div>
            <span class="text-xs font-semibold text-admin-on-surface-variant block mb-1">Status de Negociação</span>
            <select 
              v-model="selectedLead.status"
              class="bg-admin-surface border border-admin-outline-variant rounded px-2.5 py-1 text-sm font-semibold uppercase tracking-wider outline-none focus:border-admin-primary"
              :class="{
                'text-emerald-800 bg-emerald-50': selectedLead.status === 'Novo',
                'text-yellow-800 bg-yellow-50': selectedLead.status === 'Em Atendimento',
                'text-blue-800 bg-blue-50': selectedLead.status === 'Orçado',
                'text-green-800 bg-green-50': selectedLead.status === 'Fechado',
                'text-red-800 bg-red-50': selectedLead.status === 'Perdido'
              }"
            >
              <option value="Novo">Novo</option>
              <option value="Em Atendimento">Em Atendimento</option>
              <option value="Orçado">Orçado</option>
              <option value="Fechado">Fechado</option>
              <option value="Perdido">Perdido</option>
            </select>
          </div>
        </div>

        <!-- Ficha de Contatos -->
        <div class="grid grid-cols-2 gap-4 bg-admin-surface-container-low p-4 rounded-lg border border-admin-outline-variant/30">
          <div>
            <p class="text-xs text-admin-outline font-semibold uppercase tracking-wider">Telefone</p>
            <p class="text-sm font-medium text-admin-on-surface mt-1">{{ selectedLead.telefone }}</p>
          </div>
          <div>
            <p class="text-xs text-admin-outline font-semibold uppercase tracking-wider">Localidade</p>
            <p class="text-sm font-medium text-admin-on-surface mt-1">{{ selectedLead.bairro ? `${selectedLead.bairro}, ${selectedLead.cidade}` : selectedLead.cidade }}</p>
          </div>
          <div class="col-span-2">
            <p class="text-xs text-admin-outline font-semibold uppercase tracking-wider">Serviço</p>
            <p class="text-sm font-medium text-admin-on-surface mt-1">{{ selectedLead.servico }}</p>
          </div>
        </div>

        <!-- Mensagem de Solicitação -->
        <div>
          <h4 class="text-xs text-admin-outline font-semibold uppercase tracking-wider mb-2">Mensagem do Cliente</h4>
          <div class="bg-admin-surface-container p-4 rounded-lg text-sm text-admin-on-surface italic leading-relaxed">
            "{{ selectedLead.mensagem || 'Nenhuma mensagem preenchida.' }}"
          </div>
        </div>

        <div class="border-t border-admin-outline-variant/20 my-2"></div>

        <!-- Painel de Ações de Negócio -->
        <div class="flex flex-col gap-4">
          <h4 class="text-base font-bold text-admin-primary">Ações de Venda</h4>
          <!-- Valor de Orçamento -->
          <div>
            <label class="text-xs text-admin-on-surface-variant font-semibold block mb-1">Valor do Orçamento (R$)</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-admin-outline font-bold text-sm">R$</span>
              <input 
                v-model="selectedLead.valor_orcamento"
                class="w-full h-11 pl-10 pr-4 rounded-lg bg-admin-surface-container-lowest border border-admin-outline-variant focus:border-admin-primary outline-none transition-all text-base font-semibold text-admin-primary" 
                placeholder="0.00" 
                type="number"
                step="0.01"
              />
            </div>
          </div>
          <!-- Observações Internas -->
          <div>
            <label class="text-xs text-admin-on-surface-variant font-semibold block mb-1">Observações / Negociação</label>
            <textarea 
              v-model="selectedLead.observacoes"
              class="w-full p-3 rounded-lg bg-admin-surface-container-lowest border border-admin-outline-variant focus:border-admin-primary outline-none transition-all text-sm resize-none" 
              placeholder="Adicione observações de acompanhamento da venda..." 
              rows="4"
            ></textarea>
          </div>
          
          <button 
            @click="saveLeadChanges"
            class="bg-admin-primary hover:bg-admin-primary-container text-white h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all w-full"
            :disabled="isSaving"
          >
            <Icon v-if="isSaving" name="lucide:loader" class="w-4 h-4 animate-spin" />
            <Icon v-else name="lucide:save" class="w-4 h-4" />
            {{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
          </button>
        </div>
      </div>

      <!-- Rodapé do Drawer -->
      <div v-if="selectedLead" class="p-4 border-t border-admin-outline-variant/30 bg-admin-surface-container-lowest">
        <button 
          @click="startWhatsappChat"
          class="w-full h-12 rounded-lg bg-[#25D366] hover:bg-[#1fa952] text-white flex items-center justify-center gap-2 transition-all font-bold shadow-sm"
        >
          <Icon name="lucide:message-square" class="w-5 h-5" />
          Iniciar Conversa no WhatsApp
        </button>
      </div>
    </aside>

    <!-- Overlay de Fundo para mobile -->
    <div 
      v-if="isDrawerOpen" 
      @click="closeDrawer" 
      class="fixed inset-0 bg-admin-on-background/10 backdrop-blur-sm z-40 md:hidden"
    ></div>
  </div>
</template>
