<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ALLOWED_NOTE_CATEGORIAS } from '../../../../server/shared/crmValidation.mjs'

const props = defineProps<{
  workOrderId: string
}>()

const notes = ref<any[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const newContent = ref('')
const newCategoria = ref('geral')
const errorMessage = ref<string | null>(null)

const categoryLabels: Record<string, { label: string, color: string }> = {
  geral: { label: 'Geral', color: 'bg-slate-800 text-slate-300 border-white/10' },
  atendimento: { label: 'Atendimento', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  financeiro: { label: 'Financeiro', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  tecnico: { label: 'Técnico', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  cobranca: { label: 'Cobrança', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
}

async function fetchNotes() {
  isLoading.value = true
  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}/notes`)
    notes.value = res?.notes || []
  } catch (err) {
    console.error('[WorkOrderNotesManager] Falha ao carregar notas')
  } finally {
    isLoading.value = false
  }
}

async function handleAddNote() {
  if (!newContent.value || newContent.value.trim().length < 2) {
    errorMessage.value = 'A anotação deve ter no mínimo 2 caracteres.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}/notes`, {
      method: 'POST',
      body: {
        conteudo: newContent.value.trim(),
        categoria: newCategoria.value
      }
    })

    if (res?.success) {
      newContent.value = ''
      newCategoria.value = 'geral'
      await fetchNotes()
    }
  } catch (err: any) {
    console.error('[WorkOrderNotesManager] Falha ao criar nota')
    errorMessage.value = err?.data?.message || err?.message || 'Falha ao salvar anotação'
  } finally {
    isSubmitting.value = false
  }
}

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchNotes()
})
</script>

<template>
  <div class="space-y-5">
    <div>
      <h3 class="text-sm font-bold text-white uppercase tracking-wider">Anotações Internas da OS</h3>
      <p class="text-xs text-slate-400">Observações de atendimento, equipe técnica e acompanhamento</p>
    </div>

    <!-- Formulário de Nova Anotação -->
    <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-5 shadow-lg space-y-3">
      <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
        {{ errorMessage }}
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <label class="text-xs text-slate-300 font-medium">Categoria:</label>
          <select
            v-model="newCategoria"
            class="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer min-h-[44px]"
          >
            <option v-for="cat in ALLOWED_NOTE_CATEGORIAS" :key="cat" :value="cat">
              {{ categoryLabels[cat]?.label || cat }}
            </option>
          </select>
        </div>
      </div>

      <textarea
        v-model="newContent"
        rows="2"
        placeholder="Escreva uma observação interna para esta ordem de serviço..."
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
      ></textarea>

      <div class="flex justify-end">
        <button
          type="button"
          :disabled="isSubmitting || !newContent.trim()"
          @click="handleAddNote"
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          <span>Adicionar Nota</span>
        </button>
      </div>
    </div>

    <!-- Lista de Anotações -->
    <div v-if="isLoading" class="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-indigo-400" />
      <span>Carregando notas...</span>
    </div>

    <div v-else-if="notes.length === 0" class="rounded-2xl border border-white/5 bg-slate-900/40 p-8 text-center">
      <div class="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
        <Icon name="lucide:sticky-note" class="w-5 h-5" />
      </div>
      <p class="text-xs text-slate-400">Nenhuma anotação registrada nesta ordem de serviço ainda.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="n in notes"
        :key="n.id"
        class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-md space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
            :class="categoryLabels[n.categoria]?.color || 'bg-slate-800 text-slate-300'"
          >
            {{ categoryLabels[n.categoria]?.label || n.categoria }}
          </span>

          <span class="text-[11px] text-slate-500">{{ formatDate(n.created_at) }}</span>
        </div>

        <p class="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">{{ n.conteudo }}</p>
      </div>
    </div>
  </div>
</template>
