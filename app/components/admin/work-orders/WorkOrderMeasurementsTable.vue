<script setup lang="ts">
import { ref } from 'vue'
import WorkOrderMeasurementModal from './WorkOrderMeasurementModal.vue'

const props = defineProps<{
  workOrderId: string
  itemId: string
  measurements: any[]
  isLocked: boolean
}>()

const emit = defineEmits<{
  (e: 'measurementsChanged'): void
}>()

const isModalOpen = ref(false)
const measurementToEdit = ref<any | null>(null)
const isDeletingId = ref<string | null>(null)

const vaoLabels: Record<string, string> = {
  janela: 'Janela',
  porta: 'Porta',
  sacada: 'Sacada / Varanda',
  maxim_ar: 'Maxim-ar',
  basculante: 'Basculante',
  mezanino: 'Mezanino',
  outro: 'Outro'
}

function openCreateModal() {
  measurementToEdit.value = null
  isModalOpen.value = true
}

function openEditModal(m: any) {
  measurementToEdit.value = m
  isModalOpen.value = true
}

function duplicateMeasurement(m: any) {
  // Clona os dados do vão existente como um novo cadastro
  measurementToEdit.value = {
    ambiente: `${m.ambiente} (Cópia)`,
    tipo_vao: m.tipo_vao,
    largura_mm: m.largura_mm,
    altura_mm: m.altura_mm,
    quantidade: m.quantidade,
    cor_estrutura: m.cor_estrutura,
    tipo_material: m.tipo_material,
    observacoes: m.observacoes
  }
  isModalOpen.value = true
}

async function handleDelete(mId: string) {
  if (!confirm('Deseja realmente excluir este vão técnico?')) return

  isDeletingId.value = mId
  try {
    await $fetch(`/api/admin/crm/work-orders/${props.workOrderId}/items/${props.itemId}/measurements/${mId}`, {
      method: 'DELETE'
    })
    emit('measurementsChanged')
  } catch (err: any) {
    console.error('[MeasurementsTable] Falha ao deletar vão')
    alert(err?.data?.message || 'Falha ao excluir medição')
  } finally {
    isDeletingId.value = null
  }
}
</script>

<template>
  <div class="mt-3 space-y-3 pt-3 border-t border-white/5">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon name="lucide:ruler" class="w-4 h-4 text-indigo-400" />
        <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Vãos Técnicos & Medições ({{ measurements.length }})
        </span>
      </div>

      <button
        v-if="!isLocked"
        type="button"
        @click="openCreateModal"
        class="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer min-h-[44px]"
      >
        <Icon name="lucide:plus" class="w-3.5 h-3.5" />
        <span>Adicionar Vão</span>
      </button>
    </div>

    <!-- Tabela de Vãos -->
    <div v-if="measurements.length > 0" class="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/40">
      <table class="w-full text-left text-xs border-collapse min-w-[550px]">
        <thead>
          <tr class="border-b border-white/5 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
            <th class="py-2.5 px-3">Ambiente</th>
            <th class="py-2.5 px-3">Tipo</th>
            <th class="py-2.5 px-3">Largura × Altura</th>
            <th class="py-2.5 px-3">Qtd</th>
            <th class="py-2.5 px-3">Cor</th>
            <th v-if="!isLocked" class="py-2.5 px-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr v-for="m in measurements" :key="m.id" class="hover:bg-white/[0.02]">
            <td class="py-2.5 px-3 font-medium text-white">
              {{ m.ambiente }}
              <span v-if="m.observacoes" class="block text-[10px] text-slate-400 truncate max-w-xs">
                Obs: {{ m.observacoes }}
              </span>
            </td>

            <td class="py-2.5 px-3 text-slate-300">
              {{ vaoLabels[m.tipo_vao] || m.tipo_vao }}
            </td>

            <td class="py-2.5 px-3 font-mono text-indigo-300">
              {{ m.largura_mm }} × {{ m.altura_mm }} mm
              <span class="text-[10px] text-slate-500 block font-sans">
                ({{ (m.largura_mm / 10).toFixed(0) }} × {{ (m.altura_mm / 10).toFixed(0) }} cm)
              </span>
            </td>

            <td class="py-2.5 px-3 text-white font-bold">
              {{ m.quantidade }}
            </td>

            <td class="py-2.5 px-3 text-slate-300">
              {{ m.cor_estrutura || 'Branco' }}
            </td>

            <td v-if="!isLocked" class="py-2.5 px-3 text-right space-x-1">
              <button
                type="button"
                @click="duplicateMeasurement(m)"
                class="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/5 transition-all cursor-pointer min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                title="Duplicar Vão"
              >
                <Icon name="lucide:copy" class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                @click="openEditModal(m)"
                class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                title="Editar Vão"
              >
                <Icon name="lucide:edit" class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                :disabled="isDeletingId === m.id"
                @click="handleDelete(m.id)"
                class="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                title="Excluir Vão"
              >
                <Icon v-if="isDeletingId === m.id" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
                <Icon v-else name="lucide:trash-2" class="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="rounded-xl border border-white/5 bg-slate-950/20 p-4 text-center text-xs text-slate-400">
      Nenhum vão técnico medido para este serviço ainda.
    </div>

    <!-- Modal de Vão -->
    <WorkOrderMeasurementModal
      :is-open="isModalOpen"
      :work-order-id="workOrderId"
      :item-id="itemId"
      :measurement-to-edit="measurementToEdit"
      @close="isModalOpen = false"
      @measurement-saved="emit('measurementsChanged')"
    />
  </div>
</template>
