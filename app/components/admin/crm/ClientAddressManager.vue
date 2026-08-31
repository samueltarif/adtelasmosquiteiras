<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  clientId: string
  addresses: Array<{
    id: string
    rotulo: string
    tipo_imovel: string
    cep?: string | null
    logradouro?: string | null
    numero?: string | null
    complemento?: string | null
    bairro?: string | null
    cidade: string
    uf: string
    referencia?: string | null
    observacoes_acesso?: string | null
    is_principal: boolean
    is_archived: boolean
  }>
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const isModalOpen = ref(false)
const editingAddress = ref<any | null>(null)
const isSaving = ref(false)
const isDeleting = ref(false)
const formError = ref<string | null>(null)
const conflictHistoryModal = ref<{ isOpen: boolean, addressId: string | null, message: string }>({
  isOpen: false,
  addressId: null,
  message: ''
})

const form = ref({
  rotulo: 'Principal',
  tipo_imovel: 'apartamento',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: 'São Paulo',
  uf: 'SP',
  referencia: '',
  observacoes_acesso: '',
  is_principal: false
})

function openNewAddressModal() {
  editingAddress.value = null
  form.value = {
    rotulo: props.addresses.length === 0 ? 'Principal' : 'Secundário',
    tipo_imovel: 'apartamento',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'São Paulo',
    uf: 'SP',
    referencia: '',
    observacoes_acesso: '',
    is_principal: props.addresses.length === 0
  }
  formError.value = null
  isModalOpen.value = true
}

function openEditAddressModal(addr: any) {
  editingAddress.value = addr
  form.value = {
    rotulo: addr.rotulo || 'Principal',
    tipo_imovel: addr.tipo_imovel || 'outro',
    cep: addr.cep || '',
    logradouro: addr.logradouro || '',
    numero: addr.numero || '',
    complemento: addr.complemento || '',
    bairro: addr.bairro || '',
    cidade: addr.cidade || 'São Paulo',
    uf: addr.uf || 'SP',
    referencia: addr.referencia || '',
    observacoes_acesso: addr.observacoes_acesso || '',
    is_principal: Boolean(addr.is_principal)
  }
  formError.value = null
  isModalOpen.value = true
}

async function handleSaveAddress() {
  isSaving.value = true
  formError.value = null

  try {
    if (editingAddress.value?.id) {
      // Edição
      await $fetch(`/api/admin/crm/clients/${props.clientId}/addresses/${editingAddress.value.id}`, {
        method: 'PATCH',
        body: form.value
      })
    } else {
      // Criação
      await $fetch(`/api/admin/crm/clients/${props.clientId}/addresses`, {
        method: 'POST',
        body: form.value
      })
    }

    isModalOpen.value = false
    emit('refresh')
  } catch (err: any) {
    console.error('[ClientAddressManager] Erro ao salvar endereço')
    formError.value = err?.data?.message || err?.message || 'Erro ao salvar endereço.'
  } finally {
    isSaving.value = false
  }
}

async function handleDeleteAddress(addrId: string) {
  if (!confirm('Deseja realmente excluir este endereço?')) return

  isDeleting.value = true
  try {
    await $fetch(`/api/admin/crm/clients/${props.clientId}/addresses/${addrId}`, {
      method: 'DELETE'
    })
    emit('refresh')
  } catch (err: any) {
    console.error('[ClientAddressManager] Erro ao excluir endereço')
    const errData = err?.data?.data || err?.data || {}
    if (err?.statusCode === 409 || errData.code === 'ADDRESS_HAS_HISTORY') {
      conflictHistoryModal.value = {
        isOpen: true,
        addressId: addrId,
        message: errData.message || 'Este endereço possui histórico de atendimento e não pode ser excluído fisicamente.'
      }
    } else {
      alert(err?.data?.message || 'Erro ao excluir endereço.')
    }
  } finally {
    isDeleting.value = false
  }
}

async function handleArchiveAddress(addrId: string) {
  try {
    await $fetch(`/api/admin/crm/clients/${props.clientId}/addresses/${addrId}`, {
      method: 'PATCH',
      body: { is_archived: true }
    })
    conflictHistoryModal.value.isOpen = false
    emit('refresh')
  } catch (err: any) {
    alert(err?.data?.message || 'Erro ao arquivar endereço.')
  }
}

async function handleReactivateAddress(addrId: string) {
  try {
    await $fetch(`/api/admin/crm/clients/${props.clientId}/addresses/${addrId}`, {
      method: 'PATCH',
      body: { is_archived: false }
    })
    emit('refresh')
  } catch (err: any) {
    alert(err?.data?.message || 'Erro ao reativar endereço.')
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-bold text-white uppercase tracking-wider">Endereços & Locais de Atendimento</h3>
        <p class="text-xs text-slate-400">Cadastre imóveis para instalação de telas e redes</p>
      </div>

      <button
        type="button"
        @click="openNewAddressModal"
        class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 min-h-[44px] cursor-pointer shadow-md shadow-indigo-600/20"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        <span>Novo Endereço</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="addresses.length === 0" class="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-center">
      <div class="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3">
        <Icon name="lucide:map-pin" class="w-6 h-6" />
      </div>
      <h4 class="text-sm font-bold text-white">Nenhum endereço cadastrado</h4>
      <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
        Cadastre o primeiro imóvel do cliente para viabilizar orçamentos, vistorias e ordens de serviço.
      </p>
      <button
        type="button"
        @click="openNewAddressModal"
        class="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 min-h-[44px] cursor-pointer"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        <span>Adicionar Endereço</span>
      </button>
    </div>

    <!-- Lista de Endereços -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div
        v-for="addr in addresses"
        :key="addr.id"
        class="rounded-xl border p-4 shadow-sm flex flex-col justify-between gap-3 transition-all"
        :class="addr.is_archived ? 'bg-slate-950/60 border-white/5 opacity-60' : (addr.is_principal ? 'bg-slate-900/90 border-indigo-500/40 shadow-indigo-500/5' : 'bg-slate-900/60 border-white/10')"
      >
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">{{ addr.rotulo || 'Endereço' }}</span>
              <span 
                v-if="addr.is_principal" 
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
              >
                Principal
              </span>
              <span 
                v-if="addr.is_archived" 
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700"
              >
                Arquivado
              </span>
            </div>

            <span class="text-[11px] text-slate-400 capitalize bg-slate-800/80 px-2 py-0.5 rounded-md">
              {{ addr.tipo_imovel }}
            </span>
          </div>

          <p class="text-xs text-slate-200 leading-relaxed font-medium">
            <span v-if="addr.logradouro">{{ addr.logradouro }}</span>
            <span v-if="addr.numero">, {{ addr.numero }}</span>
            <span v-if="addr.complemento"> - {{ addr.complemento }}</span>
          </p>

          <p class="text-xs text-slate-400 mt-0.5">
            <span v-if="addr.bairro">{{ addr.bairro }}, </span>
            <span>{{ addr.cidade || 'São Paulo' }} - {{ addr.uf || 'SP' }}</span>
            <span v-if="addr.cep"> | CEP {{ addr.cep }}</span>
          </p>

          <p v-if="addr.referencia" class="text-[11px] text-slate-400 mt-2 bg-slate-950/60 p-2 rounded-lg border border-white/5">
            <strong class="text-slate-300">Ref:</strong> {{ addr.referencia }}
          </p>

          <p v-if="addr.observacoes_acesso" class="text-[11px] text-amber-300/80 mt-1.5 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
            <strong class="text-amber-300">Acesso:</strong> {{ addr.observacoes_acesso }}
          </p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
          <button
            v-if="addr.is_archived"
            type="button"
            @click="handleReactivateAddress(addr.id)"
            class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium transition-colors min-h-[44px] flex items-center gap-1 cursor-pointer"
          >
            <Icon name="lucide:archive-restore" class="w-3.5 h-3.5" />
            <span>Reativar</span>
          </button>

          <button
            v-else
            type="button"
            @click="openEditAddressModal(addr)"
            class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors min-h-[44px] flex items-center gap-1 cursor-pointer"
          >
            <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>

          <button
            type="button"
            @click="handleDeleteAddress(addr.id)"
            class="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors min-h-[44px] flex items-center gap-1 cursor-pointer"
            title="Excluir"
          >
            <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Criação / Edição de Endereço -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/70 backdrop-blur-sm" @click="isModalOpen = false"></div>
      <div class="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 class="text-base font-bold text-white">
            {{ editingAddress ? 'Editar Endereço' : 'Novo Endereço' }}
          </h3>
          <button
            type="button"
            @click="isModalOpen = false"
            class="p-2 text-slate-400 hover:text-white min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center cursor-pointer"
            aria-label="Fechar modal de endereço"
            title="Fechar (Esc)"
          >
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>

        <div v-if="formError" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {{ formError }}
        </div>

        <form @submit.prevent="handleSaveAddress" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Rótulo / Identificação</label>
              <input v-model="form.rotulo" type="text" required class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs min-h-[44px]" placeholder="Ex: Casa, Apto Praia" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Tipo de Imóvel</label>
              <select v-model="form.tipo_imovel" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs min-h-[44px]">
                <option value="apartamento">Apartamento</option>
                <option value="casa">Casa</option>
                <option value="condominio">Condomínio</option>
                <option value="comercial">Comercial</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">CEP</label>
              <input v-model="form.cep" type="text" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs min-h-[44px]" placeholder="00000-000" />
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Logradouro / Rua</label>
              <input v-model="form.logradouro" type="text" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs min-h-[44px]" placeholder="Av. Paulista" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Número</label>
              <input v-model="form.numero" type="text" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs min-h-[44px]" placeholder="1000" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Complemento / Bloco</label>
              <input v-model="form.complemento" type="text" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs min-h-[44px]" placeholder="Apto 42" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Bairro</label>
              <input v-model="form.bairro" type="text" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs min-h-[44px]" placeholder="Bela Vista" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="col-span-2">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Cidade</label>
              <input v-model="form.cidade" type="text" required class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs min-h-[44px]" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">UF</label>
              <input v-model="form.uf" type="text" maxlength="2" required class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs min-h-[44px] uppercase font-bold text-center" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Ponto de Referência</label>
            <input v-model="form.referencia" type="text" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs min-h-[44px]" placeholder="Próximo ao metrô" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Observações de Acesso / Portaria</label>
            <textarea v-model="form.observacoes_acesso" rows="2" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs resize-none" placeholder="Avisar portaria com antecedência"></textarea>
          </div>

          <div class="pt-2">
            <label class="flex items-center gap-2.5 cursor-pointer min-h-[44px]">
              <input v-model="form.is_principal" type="checkbox" class="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-white/20" />
              <span class="text-xs text-slate-200 font-medium">Definir como Endereço Principal de Atendimento</span>
            </label>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" @click="isModalOpen = false" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold min-h-[44px] cursor-pointer">Cancelar</button>
            <button type="submit" :disabled="isSaving" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold min-h-[44px] flex items-center gap-1.5 cursor-pointer">
              <Icon v-if="isSaving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <span>{{ isSaving ? 'Salvando...' : 'Salvar Endereço' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Tratamento de Conflito de Histórico (409) -->
    <div v-if="conflictHistoryModal.isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/70 backdrop-blur-sm" @click="conflictHistoryModal.isOpen = false"></div>
      <div class="relative w-full max-w-md rounded-2xl bg-slate-900 border border-amber-500/30 p-6 shadow-2xl z-10 flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Icon name="lucide:shield-alert" class="w-6 h-6" />
          </div>
          <div>
            <h4 class="text-base font-bold text-white">Endereço com Histórico</h4>
            <p class="text-xs text-slate-400">Proteção de integridade</p>
          </div>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">
          {{ conflictHistoryModal.message }}
        </p>

        <div class="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button 
            type="button" 
            @click="conflictHistoryModal.isOpen = false"
            class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium min-h-[44px]"
          >
            Cancelar
          </button>
          <button 
            type="button"
            v-if="conflictHistoryModal.addressId"
            @click="handleArchiveAddress(conflictHistoryModal.addressId)"
            class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold min-h-[44px] flex items-center gap-1.5"
          >
            <Icon name="lucide:archive" class="w-4 h-4" />
            <span>Arquivar Endereço</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
