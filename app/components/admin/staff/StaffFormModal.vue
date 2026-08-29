<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { CrmStaffMember } from '~/composables/useCrmStaff'

const props = defineProps<{
  isOpen: boolean
  member: CrmStaffMember | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', member: CrmStaffMember): void
}>()

const isEdit = computed(() => Boolean(props.member?.id))

const nome = ref('')
const funcao = ref('instalador')
const telefone = ref('')
const email = ref('')

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

watch(() => props.isOpen, (open) => {
  if (open) {
    errorMessage.value = null
    if (props.member) {
      nome.value = props.member.nome || ''
      funcao.value = props.member.funcao || 'instalador'
      telefone.value = props.member.telefone || ''
      email.value = props.member.email || ''
    } else {
      nome.value = ''
      funcao.value = 'instalador'
      telefone.value = ''
      email.value = ''
    }
  }
})

async function handleSubmit() {
  const nomeVal = nome.value.trim()
  if (!nomeVal || nomeVal.length < 2) {
    errorMessage.value = 'O nome deve ter pelo menos 2 caracteres.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  const payload = {
    nome: nomeVal,
    funcao: funcao.value,
    telefone: telefone.value ? telefone.value.trim() : null,
    email: email.value ? email.value.trim() : null
  }

  try {
    let res: any
    if (isEdit.value && props.member) {
      res = await $fetch<any>(`/api/admin/crm/staff/${props.member.id}`, {
        method: 'PATCH',
        body: payload
      })
    } else {
      res = await $fetch<any>('/api/admin/crm/staff', {
        method: 'POST',
        body: payload
      })
    }

    if (res?.success && res.staff) {
      emit('saved', res.staff)
      emit('close')
    }
  } catch (err: any) {
    console.error('[StaffFormModal] Erro ao salvar membro:', err)
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Falha ao salvar dados do membro.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div
      class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 space-y-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-modal-title"
    >
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 id="staff-modal-title" class="text-base font-bold text-white">
            {{ isEdit ? 'Editar Membro da Equipe' : 'Adicionar Membro da Equipe' }}
          </h3>
          <p class="text-xs text-slate-400">
            {{ isEdit ? 'Atualize os dados de contato e função operacional.' : 'Cadastre um novo técnico ou atendente.' }}
          </p>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Fechar modal"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Nome Completo *</label>
          <input
            v-model="nome"
            type="text"
            placeholder="Ex: Carlos Oliveira"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Função Operacional *</label>
          <select
            v-model="funcao"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
          >
            <option value="instalador">Instalador</option>
            <option value="vistoriador">Vistoriador</option>
            <option value="atendente">Atendente</option>
            <option value="gestor">Gestor</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Telefone / WhatsApp</label>
          <input
            v-model="telefone"
            type="tel"
            placeholder="Ex: (11) 99999-8888"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">E-mail</label>
          <input
            v-model="email"
            type="email"
            placeholder="Ex: carlos@adt.local"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all min-h-[44px] cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg transition-all flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>{{ isSubmitting ? 'Salvando...' : 'Salvar Membro' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
