<script setup lang="ts">
import { ref } from 'vue'
import DashboardExportDialog from './DashboardExportDialog.vue'

const props = defineProps<{
  currentPreset?: string
}>()

const isDialogOpen = ref(false)
</script>

<template>
  <div class="inline-flex">
    <!-- Botão de Destaque -->
    <button
      id="dashboard-export-button"
      type="button"
      @click="isDialogOpen = true"
      class="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-sm hover:bg-indigo-600/30 hover:text-white hover:border-indigo-500/50 transition-all active:scale-95 shadow-sm shadow-indigo-500/10 shrink-0"
      title="Abrir Central de Exportação de Dados"
    >
      <Icon 
        name="lucide:download" 
        class="w-3.5 h-3.5 text-indigo-400 group-hover:translate-y-0.5 transition-transform" 
      />
      <span>Exportar dados</span>
    </button>

    <!-- Modal Dialog da Central de Exportação -->
    <DashboardExportDialog
      :is-open="isDialogOpen"
      :current-preset="currentPreset"
      @close="isDialogOpen = false"
    />
  </div>
</template>
