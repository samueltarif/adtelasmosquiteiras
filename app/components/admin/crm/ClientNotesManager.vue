<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  clientId: string
}>()

const notes = ref<any[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const errorMessage = ref<string | null>(null)

const newNoteContent = ref('')
const newNoteCategory = ref('geral')

const categories = [
  { value: 'geral', label: 'Geral', color: 'bg-slate-800 text-slate-300' },
  { value: 'atendimento', label: 'Atendimento', color: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
  { value: 'tecnico', label: 'Técnico', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  { value: 'financeiro', label: 'Financeiro', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  { value: 'cobranca', label: 'Cobrança', color: 'bg-red-500/10 text-red-400 border border-red-500/20' }
]

async function fetchNotes() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<any>(`/api/admin/crm/clients/${props.clientId}/notes?page=${page.value}&pageSize=${pageSize.value}`)
    if (res?.success) {
      notes.value = res.notes || []
      total.value = res.total || 0
    }
  } catch (err: any) {
    console.error('[ClientNotesManager] Erro ao carregar notas:', err)
    errorMessage.value = 'Erro ao buscar anotações.'
  } finally {
    isLoading.value = false
  }
}

async function handleAddNote() {
  const content = newNoteContent.value.trim()
  if (!content || content.length < 2) return

  isSaving.value = true
  errorMessage.value = null

  try {
    const res = await $fetch<any>(`/api/admin/crm/clients/${props.clientId}/notes`, {
      method: 'POST',
      body: {
        conteudo: content,
        categoria: newNoteCategory.value
      }
    })

    if (res?.success) {
      newNoteContent.value = ''
      page.value = 1
      await fetchNotes()
    }
  } catch (err: any) {
    console.error('[ClientNotesManager] Erro ao salvar nota:', err)
    errorMessage.value = err?.data?.message || err?.message || 'Erro ao adicionar anotação.'
  } finally {
    isSaving.value = false
  }
}

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getCategoryBadge(cat: string) {
  return categories.find(c => c.value === cat) || categories[0]
}

onMounted(() => {
  fetchNotes()
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <h3 class="text-sm font-bold text-white uppercase tracking-wider">Anotações Internas de Atendimento</h3>
      <p class="text-xs text-slate-400">Histórico de observações e alinhamentos com o cliente</p>
    </div>

    <!-- Formulário de Nova Anotação -->
    <div class="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-sm space-y-3">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <label class="text-xs font-semibold text-slate-300">Nova Anotação</label>
        
        <div class="flex items-center gap-1.5 flex-wrap">
          <button
            v-for="cat in categories"
            :key="cat.value"
            type="button"
            @click="newNoteCategory = cat.value"
            class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer min-h-[32px]"
            :class="newNoteCategory === cat.value ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
          >
            {{ cat.label }}
          </button>
        </div>
      </div>

      <textarea
        v-model="newNoteContent"
        rows="2"
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors resize-none"
        placeholder="Digite detalhes da ligação, preferência de material ou observação financeira..."
      ></textarea>

      <div class="flex items-center justify-between pt-1">
        <span v-if="errorMessage" class="text-xs text-red-400 font-medium">{{ errorMessage }}</span>
        <span v-else></span>

        <button
          type="button"
          :disabled="isSaving || !newNoteContent.trim() || newNoteContent.trim().length < 2"
          @click="handleAddNote"
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5 min-h-[40px] cursor-pointer shadow-md"
        >
          <Icon v-if="isSaving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          <span>{{ isSaving ? 'Salvando...' : 'Adicionar Nota' }}</span>
        </button>
      </div>
    </div>

    <!-- Lista de Anotações -->
    <div v-if="isLoading" class="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-indigo-400" />
      <span>Carregando anotações...</span>
    </div>

    <div v-else-if="notes.length === 0" class="rounded-xl border border-white/5 bg-slate-900/30 p-6 text-center text-xs text-slate-400">
      Nenhuma anotação registrada ainda para este cliente.
    </div>

    <div v-else class="space-y-2.5">
      <div
        v-for="note in notes"
        :key="note.id"
        class="rounded-xl border border-white/10 bg-slate-900/40 p-3.5 shadow-xs flex flex-col gap-2"
      >
        <div class="flex items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2">
            <span 
              class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold"
              :class="getCategoryBadge(note.categoria).color"
            >
              {{ getCategoryBadge(note.categoria).label }}
            </span>
          </div>

          <span class="text-[11px] text-slate-500">{{ formatDate(note.created_at) }}</span>
        </div>

        <p class="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
          {{ note.conteudo }}
        </p>
      </div>

      <!-- Paginação simples -->
      <div v-if="total > pageSize" class="flex items-center justify-between pt-2 text-xs text-slate-400">
        <span>Total: {{ total }} anotações</span>
        <div class="flex items-center gap-2">
          <button 
            :disabled="page <= 1" 
            @click="page--; fetchNotes()"
            class="px-2.5 py-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-white min-h-[32px]"
          >
            Anterior
          </button>
          <span>Página {{ page }}</span>
          <button 
            :disabled="page * pageSize >= total" 
            @click="page++; fetchNotes()"
            class="px-2.5 py-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-white min-h-[32px]"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
