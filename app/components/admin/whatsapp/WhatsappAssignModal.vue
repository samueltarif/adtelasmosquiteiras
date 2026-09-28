<script setup lang="ts">
import { ref, watch } from 'vue'
import type { WhatsappAttributionItem } from '~/types/adminWhatsappAttribution'

const props = defineProps<{
  isOpen: boolean
  attribution: WhatsappAttributionItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'assigned'): void
}>()

const clientSearchQuery = ref('')
const isSearchingClients = ref(false)
const clientSearchResults = ref<any[]>([])
const selectedClient = ref<any | null>(null)
const assignNotes = ref('')
const isAssigning = ref(false)
const assignError = ref<string | null>(null)

watch(() => props.isOpen, (open) => {
  if (open) {
    clientSearchQuery.value = ''
    clientSearchResults.value = []
    selectedClient.value = null
    assignNotes.value = ''
    assignError.value = null
  }
})

async function searchClients() {
  if (!clientSearchQuery.value.trim() || clientSearchQuery.value.trim().length < 2) {
    clientSearchResults.value = []
    return
  }

  isSearchingClients.value = true
  try {
    const res = await $fetch<any>('/api/admin/crm/clients/search', {
      method: 'POST',
      body: {
        search: clientSearchQuery.value.trim(),
        pageSize: 10
      }
    })
    clientSearchResults.value = res?.clients || []
  } catch (err) {
    console.error('[WhatsappAssignModal] Erro ao buscar clientes:', err)
  } finally {
    isSearchingClients.value = false
  }
}

async function confirmAssignment() {
  if (!props.attribution || !selectedClient.value) return

  isAssigning.value = true
  assignError.value = null

  try {
    const res = await $fetch<any>(`/api/admin/marketing/whatsapp-attributions/${props.attribution.id}/assign`, {
      method: 'POST',
      body: {
        client_id: selectedClient.value.id,
        match_method: 'manual_selection',
        notes: assignNotes.value.trim() || undefined
      }
    })

    if (res?.success) {
      emit('assigned')
      emit('close')
    }
  } catch (err: any) {
    assignError.value = err?.data?.message || err?.message || 'Erro ao associar cliente à atribuição.'
  } finally {
    isAssigning.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
  >
    <div class="bg-slate-900 border border-white/15 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Icon name="lucide:link" class="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-white">Vincular a Cliente Existente</h4>
            <p class="text-[11px] text-slate-400">Ref: {{ attribution?.short_code }}</p>
          </div>
        </div>
        <button type="button" @click="emit('close')" class="text-slate-400 hover:text-white cursor-pointer">
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Aviso da Regra 14 e 15 -->
      <div class="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2">
        <Icon name="lucide:info" class="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          A associação manual definirá a confiabilidade como <strong>"Atribuição provável por seleção manual"</strong> (conforme regra de auditoria).
        </span>
      </div>

      <div v-if="assignError" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
        {{ assignError }}
      </div>

      <!-- Campo de Busca de Cliente -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-slate-300">Buscar Cliente no CRM</label>
        <div class="flex items-center gap-2">
          <input
            v-model="clientSearchQuery"
            type="text"
            placeholder="Digite nome, telefone ou e-mail..."
            @keyup.enter="searchClients"
            class="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            @click="searchClients"
            :disabled="isSearchingClients"
            class="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {{ isSearchingClients ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>
      </div>

      <!-- Resultados da Busca -->
      <div v-if="clientSearchResults.length > 0" class="max-h-48 overflow-y-auto space-y-1.5 border border-white/5 rounded-xl p-2 bg-slate-950">
        <button
          v-for="c in clientSearchResults"
          :key="c.id"
          type="button"
          @click="selectedClient = c"
          class="w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer"
          :class="selectedClient?.id === c.id ? 'bg-indigo-600 text-white' : 'hover:bg-white/5 text-slate-300'"
        >
          <div>
            <span class="font-bold">{{ c.nome }}</span>
            <span class="text-[11px] block text-slate-400" :class="{ 'text-indigo-200': selectedClient?.id === c.id }">
              {{ c.telefone_principal }} · {{ c.email || 'sem e-mail' }}
            </span>
          </div>
          <Icon v-if="selectedClient?.id === c.id" name="lucide:check" class="w-4 h-4" />
        </button>
      </div>

      <!-- Observações Opcionais -->
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-slate-300">Observações da Vinculação (opcional)</label>
        <input
          v-model="assignNotes"
          type="text"
          placeholder="Ex: Cliente confirmou horário da conversa por telefone"
          class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="confirmAssignment"
          :disabled="!selectedClient || isAssigning"
          class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Icon v-if="isAssigning" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ isAssigning ? 'Vinculando...' : 'Confirmar Vinculação' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
