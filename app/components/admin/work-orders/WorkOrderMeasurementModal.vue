<script setup lang="ts">
import { ref, watch } from 'vue'
import { ALLOWED_VAO_TIPOS } from '../../../../server/shared/crmValidation.mjs'

const props = defineProps<{
  isOpen: boolean
  workOrderId: string
  itemId: string
  measurementToEdit?: any | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'measurementSaved'): void
}>()

const ambiente = ref('')
const tipoVao = ref('janela')
const larguraMm = ref<number | ''>('')
const alturaMm = ref<number | ''>('')
const quantidade = ref(1)
const corEstrutura = ref('Branco')
const tipoMaterial = ref('')
const observacoes = ref('')

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const vaoOptions = [
  { value: 'janela', label: 'Janela' },
  { value: 'porta', label: 'Porta' },
  { value: 'sacada', label: 'Sacada / Varanda' },
  { value: 'maxim_ar', label: 'Maxim-ar' },
  { value: 'basculante', label: 'Basculante' },
  { value: 'mezanino', label: 'Mezanino' },
  { value: 'outro', label: 'Outro Vão' }
]

const coresEstrutura = ['Branco', 'Preto', 'Bronze', 'Fosco / Natural', 'Amadeirado', 'Outro']

watch(() => props.isOpen, (open) => {
  if (open) {
    errorMessage.value = null
    if (props.measurementToEdit) {
      ambiente.value = props.measurementToEdit.ambiente || ''
      tipoVao.value = props.measurementToEdit.tipo_vao || 'janela'
      larguraMm.value = props.measurementToEdit.largura_mm || ''
      alturaMm.value = props.measurementToEdit.altura_mm || ''
      quantidade.value = props.measurementToEdit.quantidade || 1
      corEstrutura.value = props.measurementToEdit.cor_estrutura || 'Branco'
      tipoMaterial.value = props.measurementToEdit.tipo_material || ''
      observacoes.value = props.measurementToEdit.observacoes || ''
    } else {
      ambiente.value = ''
      tipoVao.value = 'janela'
      larguraMm.value = ''
      alturaMm.value = ''
      quantidade.value = 1
      corEstrutura.value = 'Branco'
      tipoMaterial.value = ''
      observacoes.value = ''
    }
  }
})

async function handleSave(keepOpen = false) {
  if (!ambiente.value || ambiente.value.trim().length < 2) {
    errorMessage.value = 'Informe o ambiente (ex: Quarto Casal, Sala).'
    return
  }

  const w = parseInt(String(larguraMm.value), 10)
  const h = parseInt(String(alturaMm.value), 10)

  if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0) {
    errorMessage.value = 'Largura e Altura devem ser valores inteiros positivos em milímetros (ex: 1200 x 1400).'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  const payload: Record<string, any> = {
    ambiente: ambiente.value.trim(),
    tipo_vao: tipoVao.value,
    largura_mm: w,
    altura_mm: h,
    quantidade: Math.max(1, parseInt(String(quantidade.value), 10) || 1),
    cor_estrutura: corEstrutura.value,
    tipo_material: tipoMaterial.value ? tipoMaterial.value.trim() : null,
    observacoes: observacoes.value ? observacoes.value.trim() : null
  }

  try {
    if (props.measurementToEdit?.id) {
      // Edição
      payload.expected_updated_at = props.measurementToEdit.updated_at
      await $fetch(`/api/admin/crm/work-orders/${props.workOrderId}/items/${props.itemId}/measurements/${props.measurementToEdit.id}`, {
        method: 'PATCH',
        body: payload
      })
    } else {
      // Criação
      await $fetch(`/api/admin/crm/work-orders/${props.workOrderId}/items/${props.itemId}/measurements`, {
        method: 'POST',
        body: payload
      })
    }

    emit('measurementSaved')

    if (keepOpen) {
      // Limpa dimensões para próximo vão, mantendo ambiente e cor
      larguraMm.value = ''
      alturaMm.value = ''
      quantidade.value = 1
      observacoes.value = ''
    } else {
      emit('close')
    }
  } catch (err: any) {
    console.error('[MeasurementModal] Falha ao salvar vão')
    errorMessage.value = err?.data?.message || err?.message || 'Falha ao salvar medição técnica'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 class="text-base font-bold text-white">
            {{ measurementToEdit?.id ? 'Editar Medição do Vão' : 'Adicionar Vão Técnico' }}
          </h3>
          <p class="text-xs text-slate-400">Unidade canônica em milímetros inteiros (mm)</p>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="() => handleSave(false)" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Ambiente -->
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Ambiente *</label>
            <input
              v-model="ambiente"
              type="text"
              placeholder="Ex: Quarto 1, Sala, Cozinha"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>

          <!-- Tipo de Vão -->
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Tipo de Vão *</label>
            <select
              v-model="tipoVao"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option v-for="opt in vaoOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Dimensões em Milímetros -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Largura (mm) *</label>
            <input
              v-model.number="larguraMm"
              type="number"
              min="1"
              step="1"
              placeholder="Ex: 1200"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
            <span v-if="larguraMm" class="text-[10px] text-slate-500">
              ({{ (Number(larguraMm) / 10).toFixed(1) }} cm / {{ (Number(larguraMm) / 1000).toFixed(2) }} m)
            </span>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Altura (mm) *</label>
            <input
              v-model.number="alturaMm"
              type="number"
              min="1"
              step="1"
              placeholder="Ex: 1400"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
            <span v-if="alturaMm" class="text-[10px] text-slate-500">
              ({{ (Number(alturaMm) / 10).toFixed(1) }} cm / {{ (Number(alturaMm) / 1000).toFixed(2) }} m)
            </span>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Quantidade *</label>
            <input
              v-model.number="quantidade"
              type="number"
              min="1"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Cor da Estrutura -->
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Cor da Estrutura</label>
            <select
              v-model="corEstrutura"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option v-for="c in coresEstrutura" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <!-- Tipo de Material -->
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300 font-medium">Tipo de Material / Malha</label>
            <input
              v-model="tipoMaterial"
              type="text"
              placeholder="Ex: Fibra de Vidro Cinza, Pet Screen..."
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>
        </div>

        <!-- Observações do Vão -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Observações do Vão</label>
          <textarea
            v-model="observacoes"
            rows="2"
            placeholder="Detalhes de fixação, trava, folga necessária..."
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
          ></textarea>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
          <button
            v-if="!measurementToEdit?.id"
            type="button"
            @click="() => handleSave(true)"
            :disabled="isSubmitting"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-indigo-500/20 transition-all min-h-[44px] cursor-pointer"
          >
            Salvar e Adicionar Outro
          </button>
          <div v-else></div>

          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
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
              <span>{{ isSubmitting ? 'Salvando...' : 'Salvar Vão' }}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
