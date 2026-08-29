<script setup lang="ts">
import type { CrmStaffMember } from '~/composables/useCrmStaff'

defineProps<{
  staffList: CrmStaffMember[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', member: CrmStaffMember): void
  (e: 'toggleStatus', member: CrmStaffMember): void
}>()

const funcaoLabels: Record<string, string> = {
  instalador: 'Instalador',
  vistoriador: 'Vistoriador',
  atendente: 'Atendente',
  gestor: 'Gestor'
}

const funcaoColors: Record<string, string> = {
  instalador: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  vistoriador: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  atendente: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  gestor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="isLoading" class="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60">
      <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
      <span>Carregando equipe...</span>
    </div>

    <div v-else-if="staffList.length === 0" class="p-12 text-center text-xs text-slate-500 rounded-2xl border border-dashed border-white/10 bg-slate-900/40">
      Nenhum membro encontrado.
    </div>

    <div
      v-else
      v-for="st in staffList"
      :key="st.id"
      class="rounded-2xl border border-white/10 bg-slate-900/80 p-4 space-y-3 shadow-md"
    >
      <div class="flex items-start justify-between gap-2">
        <div>
          <h3 class="text-sm font-bold text-white">{{ st.nome }}</h3>
          <span
            class="text-[10px] font-semibold px-2 py-0.5 rounded-md border mt-1 inline-block"
            :class="funcaoColors[st.funcao] || 'bg-slate-800 text-slate-300 border-white/10'"
          >
            {{ funcaoLabels[st.funcao] || st.funcao }}
          </span>
        </div>

        <span
          class="text-[10px] font-bold px-2 py-0.5 rounded-full"
          :class="st.is_active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-white/10'"
        >
          {{ st.is_active ? 'Ativo' : 'Inativo' }}
        </span>
      </div>

      <div class="space-y-1 text-xs text-slate-300 pt-1 border-t border-white/5">
        <div v-if="st.telefone" class="flex items-center gap-2">
          <Icon name="lucide:phone" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <a :href="`tel:${st.telefone}`" class="hover:text-indigo-400 transition-colors">{{ st.telefone }}</a>
        </div>
        <div v-if="st.email" class="flex items-center gap-2">
          <Icon name="lucide:mail" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <a :href="`mailto:${st.email}`" class="hover:text-indigo-400 transition-colors truncate">{{ st.email }}</a>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
        <button
          @click="emit('edit', st)"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[44px] cursor-pointer"
        >
          <Icon name="lucide:pencil" class="w-4 h-4 text-indigo-400" />
          <span>Editar</span>
        </button>

        <button
          @click="emit('toggleStatus', st)"
          class="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[44px] cursor-pointer"
          :class="st.is_active ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'"
        >
          <Icon :name="st.is_active ? 'lucide:user-x' : 'lucide:user-check'" class="w-4 h-4" />
          <span>{{ st.is_active ? 'Desativar' : 'Ativar' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
