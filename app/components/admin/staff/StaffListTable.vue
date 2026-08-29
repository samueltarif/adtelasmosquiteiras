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
  <div class="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-xl">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="border-b border-white/10 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            <th class="py-3.5 px-4">Membro</th>
            <th class="py-3.5 px-4">Função</th>
            <th class="py-3.5 px-4">Telefone</th>
            <th class="py-3.5 px-4">E-mail</th>
            <th class="py-3.5 px-4 text-center">Status</th>
            <th class="py-3.5 px-4 text-right">Ações</th>
          </tr>
        </thead>

        <tbody v-if="isLoading">
          <tr>
            <td colspan="6" class="p-12 text-center text-slate-400">
              <div class="flex items-center justify-center gap-2">
                <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
                <span>Carregando membros da equipe...</span>
              </div>
            </td>
          </tr>
        </tbody>

        <tbody v-else-if="staffList.length === 0">
          <tr>
            <td colspan="6" class="p-12 text-center text-slate-500">
              Nenhum membro encontrado com os filtros selecionados.
            </td>
          </tr>
        </tbody>

        <tbody v-else class="divide-y divide-white/5">
          <tr
            v-for="st in staffList"
            :key="st.id"
            class="hover:bg-white/[0.02] transition-colors"
          >
            <td class="py-3.5 px-4 font-bold text-white">
              {{ st.nome }}
            </td>

            <td class="py-3.5 px-4">
              <span
                class="text-[11px] font-semibold px-2.5 py-0.5 rounded-md border"
                :class="funcaoColors[st.funcao] || 'bg-slate-800 text-slate-300 border-white/10'"
              >
                {{ funcaoLabels[st.funcao] || st.funcao }}
              </span>
            </td>

            <td class="py-3.5 px-4 text-slate-300">
              {{ st.telefone || '-' }}
            </td>

            <td class="py-3.5 px-4 text-slate-300">
              {{ st.email || '-' }}
            </td>

            <td class="py-3.5 px-4 text-center">
              <span
                class="text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block"
                :class="st.is_active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-white/10'"
              >
                {{ st.is_active ? 'Ativo' : 'Inativo' }}
              </span>
            </td>

            <td class="py-3.5 px-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="emit('edit', st)"
                  class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  title="Editar membro"
                >
                  <Icon name="lucide:pencil" class="w-4 h-4" />
                </button>

                <button
                  @click="emit('toggleStatus', st)"
                  class="p-2 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  :class="st.is_active ? 'text-amber-400 hover:bg-amber-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'"
                  :title="st.is_active ? 'Desativar membro' : 'Ativar membro'"
                >
                  <Icon :name="st.is_active ? 'lucide:user-x' : 'lucide:user-check'" class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
