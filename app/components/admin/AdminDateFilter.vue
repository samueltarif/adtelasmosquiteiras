<script setup lang="ts">
import { ref } from 'vue'
import { useAdminDateFilter } from '../../composables/useAdminDateFilter'

const { preset, customFrom, customTo, activeLabel, setPreset, setCustomRange, presets } = useAdminDateFilter()
const isCustomModalOpen = ref(false)
const inputFrom = ref(customFrom.value || '')
const inputTo = ref(customTo.value || '')

function handleSelect(e: Event) {
  const target = e.target as HTMLSelectElement
  const val = target.value
  if (val === 'custom') {
    isCustomModalOpen.value = true
  } else {
    setPreset(val)
  }
}

function applyCustom() {
  if (inputFrom.value && inputTo.value) {
    setCustomRange(inputFrom.value, inputTo.value)
    isCustomModalOpen.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap">
    <!-- Preset Select -->
    <div class="flex items-center bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md shadow-sm">
      <Icon name="lucide:calendar" class="w-4 h-4 text-indigo-400 mr-2 shrink-0" />
      <span class="text-xs font-bold text-slate-300 mr-2">Período:</span>
      
      <select 
        :value="preset" 
        @change="handleSelect"
        class="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer pr-1 py-0.5"
      >
        <option 
          v-for="p in presets" 
          :key="p.value" 
          :value="p.value"
          class="bg-slate-900 text-white font-medium"
        >
          {{ p.label }}
        </option>
      </select>
    </div>

    <!-- Active Custom Range Badge (Shown only if custom range is selected) -->
    <span 
      v-if="preset === 'custom'" 
      class="text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5"
    >
      <Icon name="lucide:calendar-range" class="w-3.5 h-3.5 text-indigo-400" />
      {{ activeLabel }}
    </span>

    <!-- Custom Date Modal -->
    <div v-if="isCustomModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-sm font-bold text-white flex items-center gap-2">
            <Icon name="lucide:calendar-range" class="w-4 h-4 text-indigo-400" />
            Selecionar Período Personalizado
          </h4>
          <button @click="isCustomModalOpen = false" class="text-slate-400 hover:text-white">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>

        <div class="flex flex-col gap-4 text-xs">
          <div>
            <label class="block text-slate-400 font-medium mb-1">Data Inicial</label>
            <input 
              v-model="inputFrom" 
              type="date" 
              class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label class="block text-slate-400 font-medium mb-1">Data Final</label>
            <input 
              v-model="inputTo" 
              type="date" 
              class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div class="flex justify-end gap-2 mt-2">
            <button 
              @click="isCustomModalOpen = false" 
              class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button 
              @click="applyCustom" 
              :disabled="!inputFrom || !inputTo"
              class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
