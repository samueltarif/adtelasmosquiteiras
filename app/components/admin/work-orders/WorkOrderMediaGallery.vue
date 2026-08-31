<script setup lang="ts">
import { ref, computed } from 'vue'
import WorkOrderMediaEditModal from './WorkOrderMediaEditModal.vue'

const props = defineProps<{
  workOrderId: string
  media: any[]
  items: any[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'mediaChanged'): void
}>()

const activeTab = ref<'todas' | 'antes' | 'durante' | 'depois' | 'laudo'>('todas')
const isEditModalOpen = ref(false)
const mediaToEdit = ref<any | null>(null)
const isDeletingId = ref<string | null>(null)

// Estado do Lightbox
const isLightboxOpen = ref(false)
const activeLightboxUrl = ref<string | null>(null)
const activeLightboxType = ref<'photo' | 'video'>('photo')
const activeLightboxTitle = ref('')
const isLoadingPreview = ref(false)

const etapaLabels: Record<string, { label: string, color: string }> = {
  antes: { label: 'Antes / Vistoria', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  durante: { label: 'Durante a Obra', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  depois: { label: 'Depois / Concluído', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  laudo: { label: 'Laudo Técnico', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
}

const filteredMedia = computed(() => {
  if (activeTab.value === 'todas') return props.media
  return props.media.filter(m => m.etapa === activeTab.value)
})

const tabCounts = computed(() => {
  const counts: Record<string, number> = {
    todas: props.media.length,
    antes: 0,
    durante: 0,
    depois: 0,
    laudo: 0
  }
  for (const m of props.media) {
    if (counts[m.etapa] !== undefined) {
      counts[m.etapa]++
    }
  }
  return counts
})

async function openLightbox(m: any) {
  isLoadingPreview.value = true
  activeLightboxTitle.value = m.safe_filename
  activeLightboxType.value = m.media_type === 'video' ? 'video' : 'photo'
  isLightboxOpen.value = true

  try {
    const res = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}/media/${m.id}/signed-url`)
    if (res?.signedUrl) {
      activeLightboxUrl.value = res.signedUrl
    }
  } catch (err: any) {
    console.error('[WorkOrderMediaGallery] Falha ao obter signed URL')
    alert('Falha ao obter URL de visualização da mídia')
    isLightboxOpen.value = false
  } finally {
    isLoadingPreview.value = false
  }
}

function closeLightbox() {
  isLightboxOpen.value = false
  activeLightboxUrl.value = null
}

function openEdit(m: any) {
  mediaToEdit.value = m
  isEditModalOpen.value = true
}

async function handleDelete(m: any) {
  if (!confirm(`Deseja realmente excluir a mídia "${m.safe_filename}"?`)) return

  isDeletingId.value = m.id
  try {
    await $fetch(`/api/admin/crm/work-orders/${props.workOrderId}/media/${m.id}`, {
      method: 'DELETE'
    })
    emit('mediaChanged')
  } catch (err: any) {
    console.error('[WorkOrderMediaGallery] Falha ao excluir mídia')
    alert(err?.data?.message || 'Falha ao excluir mídia')
  } finally {
    isDeletingId.value = null
  }
}

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Abas de Filtro por Etapa -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10">
      <button
        v-for="t in ['todas', 'antes', 'durante', 'depois', 'laudo'] as const"
        :key="t"
        type="button"
        @click="activeTab = t"
        class="px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
        :class="activeTab === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'"
      >
        <span>{{ t === 'todas' ? 'Todas as Mídias' : etapaLabels[t]?.label || t }}</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/60 font-mono">
          {{ tabCounts[t] }}
        </span>
      </button>
    </div>

    <!-- Lista / Grade de Mídias -->
    <div v-if="isLoading" class="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-indigo-400" />
      <span>Carregando galeria...</span>
    </div>

    <div v-else-if="filteredMedia.length === 0" class="rounded-2xl border border-white/5 bg-slate-900/40 p-8 text-center">
      <div class="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
        <Icon name="lucide:image" class="w-5 h-5" />
      </div>
      <p class="text-xs text-slate-400">Nenhuma foto ou vídeo cadastrado nesta etapa.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="m in filteredMedia"
        :key="m.id"
        class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-lg flex flex-col justify-between gap-3 group hover:border-indigo-500/40 transition-all"
      >
        <div class="space-y-2">
          <!-- Cabeçalho do Card: Tipo + Etapa -->
          <div class="flex items-center justify-between gap-2">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
              :class="etapaLabels[m.etapa]?.color || 'bg-slate-800 text-slate-300'"
            >
              {{ etapaLabels[m.etapa]?.label || m.etapa }}
            </span>

            <span class="text-[10px] text-slate-500">
              {{ (m.file_size_bytes / (1024 * 1024)).toFixed(2) }} MB
            </span>
          </div>

          <!-- Preview / Ícone Clicável para Abrir Lightbox -->
          <div
            @click="openLightbox(m)"
            class="h-32 rounded-xl bg-slate-950/80 border border-white/5 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden group/item"
          >
            <Icon :name="m.media_type === 'video' ? 'lucide:video' : 'lucide:image'" class="w-8 h-8 group-hover/item:scale-110 transition-transform" />
            <span class="text-[11px] font-medium mt-1">Clique para visualizar</span>
          </div>

          <!-- Informações de Nome e Item -->
          <div class="space-y-0.5">
            <h4 class="text-xs font-bold text-white truncate" :title="m.safe_filename">
              {{ m.safe_filename }}
            </h4>
            <p v-if="m.item?.descricao" class="text-[11px] text-indigo-400 truncate">
              Item: {{ m.item.descricao }}
            </p>
            <p v-if="m.descricao" class="text-xs text-slate-300 line-clamp-2">
              {{ m.descricao }}
            </p>
          </div>
        </div>

        <!-- Rodapé do Card: Data e Ações -->
        <div class="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-500">
          <span>{{ formatDate(m.created_at) }}</span>

          <div class="flex items-center gap-1">
            <button
              type="button"
              @click="openLightbox(m)"
              class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Visualizar / Download"
            >
              <Icon name="lucide:eye" class="w-4 h-4" />
            </button>

            <button
              type="button"
              @click="openEdit(m)"
              class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Editar Metadados"
            >
              <Icon name="lucide:edit" class="w-4 h-4" />
            </button>

            <button
              type="button"
              :disabled="isDeletingId === m.id"
              @click="handleDelete(m)"
              class="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Excluir Mídia"
            >
              <Icon v-if="isDeletingId === m.id" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <Icon v-else name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edição de Metadados -->
    <WorkOrderMediaEditModal
      :is-open="isEditModalOpen"
      :work-order-id="workOrderId"
      :media="mediaToEdit"
      :items="items"
      @close="isEditModalOpen = false"
      @media-updated="emit('mediaChanged')"
    />

    <!-- Lightbox Modal -->
    <div
      v-if="isLightboxOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
      @click.self="closeLightbox"
    >
      <div class="relative max-w-4xl w-full bg-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl p-4 space-y-3">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="truncate">
            <h3 class="text-sm font-bold text-white truncate">{{ activeLightboxTitle }}</h3>
            <p class="text-[11px] text-slate-400">Link pré-assinado válido por 300 segundos</p>
          </div>
          <div class="flex items-center gap-2">
            <a
              v-if="activeLightboxUrl"
              :href="activeLightboxUrl"
              target="_blank"
              download
              class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-semibold border border-indigo-500/20 flex items-center gap-1.5 transition-all min-h-[44px]"
            >
              <Icon name="lucide:download" class="w-4 h-4" />
              <span>Baixar</span>
            </a>
            <button
              @click="closeLightbox"
              class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Conteúdo do Lightbox -->
        <div class="flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-hidden rounded-xl bg-black">
          <div v-if="isLoadingPreview" class="text-slate-400 flex items-center gap-2 text-xs">
            <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
            <span>Gerando acesso seguro à mídia...</span>
          </div>

          <template v-else-if="activeLightboxUrl">
            <video
              v-if="activeLightboxType === 'video'"
              :src="activeLightboxUrl"
              controls
              autoplay
              class="max-h-[65vh] max-w-full rounded-lg"
            ></video>

            <img
              v-else
              :src="activeLightboxUrl"
              :alt="activeLightboxTitle"
              class="max-h-[65vh] max-w-full object-contain rounded-lg"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
