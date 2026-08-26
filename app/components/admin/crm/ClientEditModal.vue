<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  client: {
    id: string
    nome: string
    tipo_cliente: string
    telefone_principal: string
    telefone_secundario?: string | null
    email?: string | null
    cpf_cnpj?: string | null
    nome_fantasia?: string | null
    razao_social?: string | null
    observacoes?: string | null
    status: string
  } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated', client: any): void
}>()

const isSaving = ref(false)
const errorMessage = ref<string | null>(null)

const form = ref({
  nome: '',
  tipo_cliente: 'pessoa_fisica',
  telefone_principal: '',
  telefone_secundario: '',
  email: '',
  cpf_cnpj: '',
  nome_fantasia: '',
  razao_social: '',
  observacoes: '',
  status: 'ativo'
})

watch(() => props.client, (c) => {
  if (c) {
    form.value = {
      nome: c.nome || '',
      tipo_cliente: c.tipo_cliente || 'pessoa_fisica',
      telefone_principal: c.telefone_principal || '',
      telefone_secundario: c.telefone_secundario || '',
      email: c.email || '',
      cpf_cnpj: c.cpf_cnpj || '',
      nome_fantasia: c.nome_fantasia || '',
      razao_social: c.razao_social || '',
      observacoes: c.observacoes || '',
      status: c.status || 'ativo'
    }
  }
}, { immediate: true })

async function handleSave() {
  if (!props.client?.id) return
  if (!form.value.nome.trim() || form.value.nome.trim().length < 2) {
    errorMessage.value = 'O nome deve ter pelo menos 2 caracteres.'
    return
  }
  if (!form.value.telefone_principal.replace(/\D/g, '') || form.value.telefone_principal.replace(/\D/g, '').length < 10) {
    errorMessage.value = 'Informe um telefone válido com DDD.'
    return
  }

  isSaving.value = true
  errorMessage.value = null

  try {
    const res = await $fetch<any>(`/api/admin/crm/clients/${props.client.id}`, {
      method: 'PATCH',
      body: {
        nome: form.value.nome.trim(),
        tipo_cliente: form.value.tipo_cliente,
        telefone_principal: form.value.telefone_principal.trim(),
        telefone_secundario: form.value.telefone_secundario?.trim() || null,
        email: form.value.email?.trim() || null,
        cpf_cnpj: form.value.cpf_cnpj?.trim() || null,
        nome_fantasia: form.value.nome_fantasia?.trim() || null,
        razao_social: form.value.razao_social?.trim() || null,
        observacoes: form.value.observacoes?.trim() || null,
        status: form.value.status
      }
    })

    if (res?.success) {
      emit('updated', res.client)
      emit('close')
    } else {
      errorMessage.value = res?.message || 'Erro ao salvar alterações.'
    }
  } catch (err: any) {
    console.error('[ClientEditModal] Erro ao salvar:', err)
    errorMessage.value = err?.data?.message || err?.message || 'Erro ao salvar dados do cliente.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')"></div>

    <!-- Modal Container -->
    <div class="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto flex flex-col gap-4">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Icon name="lucide:user-cog" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white leading-tight">Editar Cliente</h3>
            <p class="text-xs text-slate-400">Atualize os dados cadastrais</p>
          </div>
        </div>

        <button 
          type="button" 
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Fechar"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <div v-if="errorMessage" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
        <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleSave" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">
            Nome Completo / Identificação <span class="text-red-400">*</span>
          </label>
          <input 
            v-model="form.nome" 
            type="text" 
            required
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
            placeholder="Ex: João da Silva"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Tipo de Cliente <span class="text-red-400">*</span>
            </label>
            <select 
              v-model="form.tipo_cliente"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
            >
              <option value="pessoa_fisica">Pessoa Física</option>
              <option value="empresa">Empresa</option>
              <option value="condominio">Condomínio</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Status Cadastral
            </label>
            <select 
              v-model="form.status"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Telefone Principal <span class="text-red-400">*</span>
            </label>
            <input 
              v-model="form.telefone_principal" 
              type="tel" 
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              placeholder="(11) 98765-4321"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Telefone Secundário
            </label>
            <input 
              v-model="form.telefone_secundario" 
              type="tel" 
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              placeholder="(11) 3456-7890"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              E-mail
            </label>
            <input 
              v-model="form.email" 
              type="email" 
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              placeholder="cliente@email.com"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              CPF / CNPJ
            </label>
            <input 
              v-model="form.cpf_cnpj" 
              type="text" 
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              placeholder="000.000.000-00"
            />
          </div>
        </div>

        <div v-if="form.tipo_cliente !== 'pessoa_fisica'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Razão Social
            </label>
            <input 
              v-model="form.razao_social" 
              type="text" 
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              placeholder="Razão Social Ltda"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome Fantasia
            </label>
            <input 
              v-model="form.nome_fantasia" 
              type="text" 
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              placeholder="Nome Fantasia"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">
            Observações Gerais Internas
          </label>
          <textarea 
            v-model="form.observacoes" 
            rows="3"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            placeholder="Preferências de horário, detalhes de atendimento, etc."
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button 
            type="button" 
            @click="emit('close')"
            class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-sm font-medium min-h-[44px] cursor-pointer"
          >
            Cancelar
          </button>

          <button 
            type="submit"
            :disabled="isSaving"
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors text-sm font-bold flex items-center gap-2 min-h-[44px] cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Icon v-if="isSaving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>{{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
