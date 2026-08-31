<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminSiteMedia, SERVICE_FAMILIES } from '~/composables/useAdminSiteMedia'
import type { SiteMedia } from '~/types/siteMedia'
import Card from '~/components/ui/card/Card.vue'
import Skeleton from '~/components/ui/skeleton/Skeleton.vue'
import GalleryUploadQueue from '~/components/admin/gallery/GalleryUploadQueue.vue'
import GalleryMediaCard from '~/components/admin/gallery/GalleryMediaCard.vue'
import GalleryEditModal from '~/components/admin/gallery/GalleryEditModal.vue'
import GalleryDeleteModal from '~/components/admin/gallery/GalleryDeleteModal.vue'

definePageMeta({ layout: 'admin' })

useHead({
  title: 'Galeria de Serviços - Administração AD Telas e Redes',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const {
  selectedFamilyId,
  selectedServiceKey,
  currentService,
  currentFamilyServices,
  mediaList,
  isLoading,
  loadError,
  uploadQueue,
  isUploading,
  setFamily,
  fetchMediaList,
  setFeatured,
  toggleActive,
  updateMetadata,
  reorderMedia,
  deleteMedia,
  enqueueFiles,
  processUploadQueue,
  retryQueueItem,
  removeQueueItem,
  clearCompletedQueue
} = useAdminSiteMedia()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDraggingOver = ref(false)

const isEditDialogOpen = ref(false)
const editingMedia = ref<SiteMedia | null>(null)
const isSavingEdit = ref(false)
const editError = ref<string | null>(null)

const isDeleteDialogOpen = ref(false)
const deletingMedia = ref<SiteMedia | null>(null)
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)

const brokenImageMap = ref<Record<string, boolean>>({})

function triggerFilePicker() {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
    fileInputRef.value.click()
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files?.length) enqueueFiles(target.files)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDraggingOver.value = false
  if (e.dataTransfer?.files?.length) enqueueFiles(e.dataTransfer.files)
}

function openEditModal(media: SiteMedia) {
  editingMedia.value = media
  editError.value = null
  isEditDialogOpen.value = true
}

async function handleSaveEdit(data: { alt_text: string; title: string; caption: string }) {
  if (!editingMedia.value) return
  if (data.alt_text.length < 3) {
    editError.value = 'O texto alternativo deve conter no mínimo 3 caracteres.'
    return
  }
  isSavingEdit.value = true
  editError.value = null
  const result = await updateMetadata(editingMedia.value.id, {
    alt_text: data.alt_text,
    title: data.title || null,
    caption: data.caption || null
  })
  isSavingEdit.value = false
  if (result.success) {
    isEditDialogOpen.value = false
    editingMedia.value = null
  } else {
    editError.value = result.error || 'Falha ao atualizar dados da mídia.'
  }
}

function openDeleteModal(media: SiteMedia) {
  deletingMedia.value = media
  deleteError.value = null
  isDeleteDialogOpen.value = true
}

async function handleConfirmDelete() {
  if (!deletingMedia.value) return
  isDeleting.value = true
  deleteError.value = null
  const result = await deleteMedia(deletingMedia.value.id)
  isDeleting.value = false
  if (result.success) {
    isDeleteDialogOpen.value = false
    deletingMedia.value = null
  } else {
    deleteError.value = result.error || 'Falha ao excluir a mídia.'
  }
}

onMounted(() => {
  fetchMediaList()
})
</script>

<template>
  <div class="min-h-screen w-full max-w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-3 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto w-full flex flex-col gap-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <div class="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Icon name="lucide:images" class="w-4 h-4" />
            </div>
            <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">Galeria de Mídias de Serviços</h1>
          </div>
          <p class="text-xs sm:text-sm text-slate-400">Gerencie fotos e vídeos das páginas de serviços exibidos no site.</p>
        </div>

        <button @click="triggerFilePicker" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 min-h-[44px] cursor-pointer">
          <Icon name="lucide:plus" class="w-4 h-4" />
          <span>Adicionar Mídias</span>
        </button>
        <input ref="fileInputRef" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" class="hidden" @change="handleFileSelect" />
      </div>

      <!-- Famílias -->
      <div class="flex flex-wrap gap-2 p-1.5 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-md">
        <button
          v-for="family in SERVICE_FAMILIES"
          :key="family.id"
          @click="setFamily(family.id)"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] cursor-pointer"
          :class="selectedFamilyId === family.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon :name="family.icon" class="w-4 h-4 shrink-0" />
          <span>{{ family.name }}</span>
        </button>
      </div>

      <!-- Serviços -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Serviço Selecionado:</label>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            v-for="serv in currentFamilyServices"
            :key="serv.key"
            @click="selectedServiceKey = serv.key"
            class="flex flex-col items-start justify-center p-3 rounded-xl border text-left transition-all min-h-[56px] cursor-pointer"
            :class="selectedServiceKey === serv.key ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500/50' : 'bg-slate-900/50 border-white/5 text-slate-300 hover:bg-slate-900 hover:border-white/15'"
          >
            <span class="text-xs font-bold leading-tight line-clamp-2">{{ serv.name }}</span>
            <span class="text-[10px] text-slate-400 mt-1">{{ mediaList.filter(m => m.service_key === serv.key).length }} mídia(s)</span>
          </button>
        </div>
      </div>

      <!-- Dropzone -->
      <div
        @dragover.prevent="isDraggingOver = true"
        @dragleave.prevent="isDraggingOver = false"
        @drop="onDrop"
        @click="triggerFilePicker"
        class="border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[140px]"
        :class="isDraggingOver ? 'border-indigo-400 bg-indigo-950/40' : 'border-white/15 bg-slate-900/30 hover:bg-slate-900/60 hover:border-indigo-500/50'"
      >
        <div class="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Icon name="lucide:upload-cloud" class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-semibold text-white">Clique ou arraste imagens e vídeos para enviar</p>
          <p class="text-xs text-slate-400 mt-1">Destino: <strong class="text-indigo-300">{{ currentService.name }}</strong> • JPG, PNG, WebP (10MB) • MP4, WebM (50MB)</p>
        </div>
      </div>

      <!-- Fila de Upload -->
      <GalleryUploadQueue
        :upload-queue="uploadQueue"
        :current-service-name="currentService.name"
        :is-uploading="isUploading"
        @process="processUploadQueue"
        @clear-completed="clearCompletedQueue"
        @retry="retryQueueItem"
        @remove="removeQueueItem"
      />

      <!-- Lista de Mídias -->
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 class="text-base sm:text-lg font-bold text-white">Mídias: <span class="text-indigo-400">{{ currentService.name }}</span></h2>
            <p class="text-xs text-slate-400">Total: {{ mediaList.length }} mídia(s)</p>
          </div>
        </div>

        <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Card v-for="n in 4" :key="n" class="p-3 flex flex-col gap-3">
            <Skeleton class="w-full aspect-video rounded-xl" />
            <Skeleton class="w-3/4 h-4 rounded-md" />
            <Skeleton class="w-1/2 h-3 rounded-md" />
          </Card>
        </div>

        <div v-else-if="loadError" class="p-6 bg-red-950/30 border border-red-800/40 rounded-2xl text-center flex flex-col items-center gap-3">
          <Icon name="lucide:alert-triangle" class="w-8 h-8 text-red-400" />
          <p class="text-sm font-semibold text-white">{{ loadError }}</p>
          <button @click="fetchMediaList()" class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold min-h-[44px] cursor-pointer">Recarregar</button>
        </div>

        <div v-else-if="mediaList.length === 0" class="p-10 bg-slate-900/40 border border-white/5 rounded-2xl text-center flex flex-col items-center justify-center gap-3 min-h-[220px]">
          <div class="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Icon name="lucide:image-off" class="w-7 h-7" />
          </div>
          <h3 class="text-sm font-bold text-white">Nenhuma mídia cadastrada neste serviço</h3>
          <button @click="triggerFilePicker" class="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold min-h-[44px] cursor-pointer">
            <Icon name="lucide:plus" class="w-4 h-4" />
            <span>Adicionar Fotos ou Vídeos</span>
          </button>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <GalleryMediaCard
            v-for="(media, idx) in mediaList"
            :key="media.id"
            :media="media"
            :index="idx"
            :total-count="mediaList.length"
            :is-broken="!!brokenImageMap[media.id]"
            @set-featured="setFeatured"
            @toggle-active="toggleActive"
            @reorder="reorderMedia"
            @edit="openEditModal"
            @delete="openDeleteModal"
            @image-error="(id) => (brokenImageMap[id] = true)"
          />
        </div>
      </div>
    </div>

    <!-- Modais -->
    <GalleryEditModal :is-open="isEditDialogOpen" :media="editingMedia" :is-saving="isSavingEdit" :error="editError" @close="isEditDialogOpen = false" @save="handleSaveEdit" />
    <GalleryDeleteModal :is-open="isDeleteDialogOpen" :media="deletingMedia" :is-deleting="isDeleting" :error="deleteError" @close="isDeleteDialogOpen = false" @confirm="handleConfirmDelete" />
  </div>
</template>
