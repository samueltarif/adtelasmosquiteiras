<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminSiteMedia, SERVICE_FAMILIES, type SiteMedia, type UploadQueueItem } from '../../composables/useAdminSiteMedia'
import Card from '../../components/ui/card/Card.vue'
import Badge from '../../components/ui/badge/Badge.vue'
import Skeleton from '../../components/ui/skeleton/Skeleton.vue'
import Switch from '../../components/ui/switch/Switch.vue'

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

// Referência do input de arquivo oculto
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDraggingOver = ref(false)

// Estados para Modais de Edição e Exclusão
const isEditDialogOpen = ref(false)
const editingMedia = ref<SiteMedia | null>(null)
const editForm = ref({
  alt_text: '',
  title: '',
  caption: ''
})
const isSavingEdit = ref(false)
const editError = ref<string | null>(null)

const isDeleteDialogOpen = ref(false)
const deletingMedia = ref<SiteMedia | null>(null)
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)

// Rastreamento de imagens com erro de carregamento (404/indisponível)
const brokenImageMap = ref<Record<string, boolean>>({})

function handleImageError(mediaId: string) {
  brokenImageMap.value[mediaId] = true
}

onMounted(() => {
  fetchMediaList()
})

// Abre seletor de arquivos do sistema operacional / mobile
function triggerFilePicker() {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
    fileInputRef.value.click()
  }
}

// Manipulador de seleção de arquivos via input
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    enqueueFiles(target.files)
  }
}

// Manipuladores de Drag and Drop
function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDraggingOver.value = true
}

function onDragLeave(e: DragEvent) {
  e.preventDefault()
  isDraggingOver.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDraggingOver.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    enqueueFiles(e.dataTransfer.files)
  }
}

// Abertura do Modal de Edição
function openEditModal(media: SiteMedia) {
  editingMedia.value = media
  editForm.value = {
    alt_text: media.alt_text || '',
    title: media.title || '',
    caption: media.caption || ''
  }
  editError.value = null
  isEditDialogOpen.value = true
}

function closeEditModal() {
  isEditDialogOpen.value = false
  editingMedia.value = null
  editError.value = null
}

async function handleSaveEdit() {
  if (!editingMedia.value) return
  const cleanAlt = editForm.value.alt_text.trim()
  if (cleanAlt.length < 3) {
    editError.value = 'O texto alternativo deve conter no mínimo 3 caracteres.'
    return
  }
  if (cleanAlt.length > 255) {
    editError.value = 'O texto alternativo excede o limite de 255 caracteres.'
    return
  }

  isSavingEdit.value = true
  editError.value = null

  const result = await updateMetadata(editingMedia.value.id, {
    alt_text: cleanAlt,
    title: editForm.value.title.trim() || null,
    caption: editForm.value.caption.trim() || null
  })

  isSavingEdit.value = false
  if (result.success) {
    closeEditModal()
  } else {
    editError.value = result.error || 'Falha ao atualizar dados da mídia.'
  }
}

// Abertura do Modal de Exclusão
function openDeleteModal(media: SiteMedia) {
  deletingMedia.value = media
  deleteError.value = null
  isDeleteDialogOpen.value = true
}

function closeDeleteModal() {
  isDeleteDialogOpen.value = false
  deletingMedia.value = null
  deleteError.value = null
}

async function handleConfirmDelete() {
  if (!deletingMedia.value) return
  isDeleting.value = true
  deleteError.value = null

  const result = await deleteMedia(deletingMedia.value.id)
  isDeleting.value = false

  if (result.success) {
    closeDeleteModal()
  } else {
    deleteError.value = result.error || 'Falha ao excluir a mídia.'
  }
}

// Formatação amigável de tamanho de arquivo
function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const pendingUploadsCount = computed(() => {
  return uploadQueue.value.filter((i) => i.status !== 'completed').length
})

const completedUploadsCount = computed(() => {
  return uploadQueue.value.filter((i) => i.status === 'completed').length
})
</script>

<template>
  <div class="min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-3 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto w-full flex flex-col gap-6">

      <!-- TOP BAR: Header & CTA Adicionar Mídias -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <div class="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Icon name="lucide:images" class="w-4 h-4" />
            </div>
            <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Galeria de Mídias de Serviços
            </h1>
          </div>
          <p class="text-xs sm:text-sm text-slate-400">
            Gerencie fotos e vídeos das 12 páginas de serviços exibidos no site.
          </p>
        </div>

        <button
          @click="triggerFilePicker"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all duration-200 cursor-pointer min-h-[44px] active:scale-98"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          <span>Adicionar Mídias</span>
        </button>

        <!-- Input Oculto de Arquivos -->
        <input
          ref="fileInputRef"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          class="hidden"
          @change="handleFileSelect"
        />
      </div>

      <!-- SELETOR DE FAMÍLIA (Telas, Redes, Vidraçaria) -->
      <div class="flex flex-wrap gap-2 p-1.5 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-md">
        <button
          v-for="family in SERVICE_FAMILIES"
          :key="family.id"
          @click="setFamily(family.id)"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 min-h-[44px] cursor-pointer"
          :class="
            selectedFamilyId === family.id
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          "
        >
          <Icon :name="family.icon" class="w-4 h-4 shrink-0" />
          <span>{{ family.name }}</span>
        </button>
      </div>

      <!-- SELETOR DE SERVIÇOS ESPECÍFICOS DA FAMÍLIA -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Serviço Selecionado:
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            v-for="serv in currentFamilyServices"
            :key="serv.key"
            @click="selectedServiceKey = serv.key"
            class="flex flex-col items-start justify-center p-3 rounded-xl border text-left transition-all duration-200 min-h-[56px] cursor-pointer"
            :class="
              selectedServiceKey === serv.key
                ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-900/20 ring-1 ring-indigo-500/50'
                : 'bg-slate-900/50 border-white/5 text-slate-300 hover:bg-slate-900 hover:border-white/15'
            "
          >
            <span class="text-xs font-bold leading-tight line-clamp-2">{{ serv.name }}</span>
            <span class="text-[10px] text-slate-400 mt-1">
              {{ mediaList.filter(m => m.service_key === serv.key).length }} mídia(s)
            </span>
          </button>
        </div>
      </div>

      <!-- DROPZONE / ÁREA DE UPLOAD -->
      <div
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @click="triggerFilePicker"
        class="border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[140px]"
        :class="
          isDraggingOver
            ? 'border-indigo-400 bg-indigo-950/40 ring-4 ring-indigo-500/20'
            : 'border-white/15 bg-slate-900/30 hover:bg-slate-900/60 hover:border-indigo-500/50'
        "
      >
        <div class="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
          <Icon name="lucide:upload-cloud" class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-semibold text-white">
            Clique ou arraste imagens e vídeos para enviar
          </p>
          <p class="text-xs text-slate-400 mt-1">
            Destino: <strong class="text-indigo-300">{{ currentService.name }}</strong> • Fotos até 10MB (JPG, PNG, WebP) • Vídeos até 50MB (MP4, WebM) • Máx. 10 por lote
          </p>
        </div>
      </div>

      <!-- PAINEL DA FILA DE UPLOAD (Se houver arquivos enfileirados) -->
      <div v-if="uploadQueue.length > 0" class="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {{ uploadQueue.length }}
            </div>
            <div>
              <h3 class="text-sm font-bold text-white leading-tight">
                Fila de Envio para "{{ currentService.name }}"
              </h3>
              <p class="text-xs text-slate-400">
                {{ pendingUploadsCount }} pendente(s) • {{ completedUploadsCount }} concluído(s)
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button
              v-if="completedUploadsCount > 0"
              @click="clearCompletedQueue"
              class="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 min-h-[44px] transition-colors cursor-pointer"
            >
              Limpar Concluídos
            </button>
            <button
              @click="processUploadQueue"
              :disabled="isUploading || pendingUploadsCount === 0"
              class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/25 min-h-[44px] cursor-pointer"
            >
              <Icon v-if="isUploading" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <Icon v-else name="lucide:send" class="w-4 h-4" />
              <span>{{ isUploading ? 'Processando Fila...' : `Iniciar Envio (${pendingUploadsCount})` }}</span>
            </button>
          </div>
        </div>

        <!-- Lista de Itens na Fila -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
          <div
            v-for="item in uploadQueue"
            :key="item.id"
            class="bg-slate-950/70 border border-white/10 rounded-xl p-3.5 flex flex-col gap-2.5 transition-all"
          >
            <div class="flex items-start gap-3">
              <!-- Thumbnail Preview -->
              <div class="w-16 h-16 rounded-xl bg-slate-900 border border-white/10 overflow-hidden shrink-0 relative flex items-center justify-center">
                <img
                  v-if="item.mediaType === 'photo'"
                  :src="item.previewUrl"
                  :alt="item.altText"
                  class="w-full h-full object-cover"
                />
                <div v-else class="text-indigo-400 flex flex-col items-center justify-center gap-1">
                  <Icon name="lucide:video" class="w-6 h-6" />
                  <span class="text-[9px] font-bold uppercase">Vídeo</span>
                </div>
              </div>

              <!-- Informações e Status -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1">
                  <span class="text-xs font-bold text-white truncate" :title="item.file.name">
                    {{ item.file.name }}
                  </span>
                  <button
                    v-if="item.status !== 'uploading'"
                    @click="removeQueueItem(item.id)"
                    class="text-slate-400 hover:text-red-400 p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    title="Remover da fila"
                    aria-label="Remover da fila"
                  >
                    <Icon name="lucide:x" class="w-4 h-4" />
                  </button>
                </div>

                <p class="text-[11px] text-slate-400">
                  {{ item.mediaType === 'photo' ? 'Foto' : 'Vídeo' }} • Original: {{ formatBytes(item.originalSize) }}
                  <span v-if="item.finalSize && item.finalSize !== item.originalSize" class="text-emerald-400">
                    → {{ formatBytes(item.finalSize) }} (WebP)
                  </span>
                </p>

                <!-- Status Badge -->
                <div class="mt-1 flex items-center gap-1.5">
                  <Badge
                    :variant="
                      item.status === 'completed'
                        ? 'default'
                        : item.status === 'error'
                        ? 'destructive'
                        : 'secondary'
                    "
                    class="text-[10px] py-0.5 px-2"
                  >
                    <span v-if="item.status === 'idle'">Aguardando</span>
                    <span v-else-if="item.status === 'optimizing'">Otimizando WebP...</span>
                    <span v-else-if="item.status === 'authorizing'">Autorizando...</span>
                    <span v-else-if="item.status === 'uploading'">Enviando ({{ item.progress }}%)...</span>
                    <span v-else-if="item.status === 'validating'">Validando Magic Bytes...</span>
                    <span v-else-if="item.status === 'completed'">Concluído ✓</span>
                    <span v-else-if="item.status === 'error'">Erro no Envio</span>
                  </Badge>

                  <button
                    v-if="item.status === 'error'"
                    @click="retryQueueItem(item.id)"
                    class="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline ml-1 cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            </div>

            <!-- Campo de Alt Text Obrigatório na Fila -->
            <div v-if="item.status !== 'completed'" class="flex flex-col gap-1">
              <label class="text-[10px] font-semibold text-slate-400 flex justify-between">
                <span>Texto Alternativo (SEO / Acessibilidade)*:</span>
                <span>{{ (item.altText || '').length }}/255</span>
              </label>
              <input
                v-model="item.altText"
                type="text"
                placeholder="Ex: Tela mosquiteira instalada em janela de quarto"
                maxlength="255"
                class="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <!-- Barra de Progresso Real -->
            <div v-if="item.status !== 'idle' && item.status !== 'completed'" class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div
                class="h-full transition-all duration-200"
                :class="item.status === 'error' ? 'bg-red-500' : 'bg-indigo-500'"
                :style="{ width: `${item.progress}%` }"
              ></div>
            </div>

            <!-- Mensagem de Erro Específica -->
            <p v-if="item.error" class="text-[11px] text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-800/30">
              {{ item.error }}
            </p>
          </div>
        </div>
      </div>

      <!-- LISTA DE MÍDIAS CADASTRADAS (GALERIA) -->
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 class="text-base sm:text-lg font-bold text-white">
              Mídias Cadastradas: <span class="text-indigo-400">{{ currentService.name }}</span>
            </h2>
            <p class="text-xs text-slate-400">
              Total: {{ mediaList.length }} mídia(s) • Arraste ou use as setas ↑ ↓ para reordenar
            </p>
          </div>
        </div>

        <!-- ESTADO: Carregando (Skeletons) -->
        <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Card v-for="n in 4" :key="n" class="p-3 flex flex-col gap-3">
            <Skeleton class="w-full aspect-video rounded-xl" />
            <Skeleton class="w-3/4 h-4 rounded-md" />
            <Skeleton class="w-1/2 h-3 rounded-md" />
            <div class="flex justify-between items-center pt-2">
              <Skeleton class="w-16 h-6 rounded-full" />
              <Skeleton class="w-20 h-6 rounded-md" />
            </div>
          </Card>
        </div>

        <!-- ESTADO: Erro no Carregamento -->
        <div v-else-if="loadError" class="p-6 bg-red-950/30 border border-red-800/40 rounded-2xl text-center flex flex-col items-center gap-3">
          <Icon name="lucide:alert-triangle" class="w-8 h-8 text-red-400" />
          <p class="text-sm font-semibold text-white">{{ loadError }}</p>
          <button
            @click="fetchMediaList()"
            class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
          >
            Recarregar
          </button>
        </div>

        <!-- ESTADO: Vazio (Nenhuma mídia no serviço) -->
        <div v-else-if="mediaList.length === 0" class="p-10 bg-slate-900/40 border border-white/5 rounded-2xl text-center flex flex-col items-center justify-center gap-3 min-h-[220px]">
          <div class="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Icon name="lucide:image-off" class="w-7 h-7" />
          </div>
          <h3 class="text-sm font-bold text-white">Nenhuma mídia cadastrada neste serviço</h3>
          <p class="text-xs text-slate-400 max-w-sm">
            Adicione fotos ou vídeos reais das instalações de {{ currentService.name }} para enriquecer a página no site.
          </p>
          <button
            @click="triggerFilePicker"
            class="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
          >
            <Icon name="lucide:plus" class="w-4 h-4" />
            <span>Adicionar Fotos ou Vídeos</span>
          </button>
        </div>

        <!-- ESTADO: Grade de Cards de Mídia -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Card
            v-for="(media, index) in mediaList"
            :key="media.id"
            class="overflow-hidden flex flex-col justify-between border border-white/10 hover:border-indigo-500/40 transition-all duration-200 group bg-slate-900/70"
          >
            <div>
              <!-- Mídia Visual (Preview com Fallback em caso de 404) -->
              <div class="relative w-full aspect-video bg-slate-950 overflow-hidden border-b border-white/10 flex items-center justify-center">
                <!-- Se for foto e não estiver quebrada -->
                <img
                  v-if="media.media_type === 'photo' && !brokenImageMap[media.id]"
                  :src="media.publicUrl"
                  :alt="media.alt_text || 'Foto do serviço'"
                  loading="lazy"
                  class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  @error="handleImageError(media.id)"
                />

                <!-- Se for vídeo -->
                <video
                  v-else-if="media.media_type === 'video' && !brokenImageMap[media.id]"
                  :src="media.publicUrl"
                  controls
                  class="w-full h-full object-contain bg-black"
                  @error="handleImageError(media.id)"
                ></video>

                <!-- Fallback: Mídia Quebrada / 404 -->
                <div v-else class="flex flex-col items-center justify-center p-3 text-center text-slate-500">
                  <Icon name="lucide:image-off" class="w-8 h-8 text-amber-500/70 mb-1" />
                  <span class="text-[11px] font-semibold text-slate-300">Mídia indisponível</span>
                  <span class="text-[9px] text-slate-500">Arquivo não encontrado no CDN</span>
                </div>

                <!-- Badges sobrepostos na mídia -->
                <div class="absolute top-2 left-2 flex flex-wrap gap-1">
                  <!-- Destaque Badge -->
                  <Badge v-if="media.is_featured" class="bg-amber-500 text-slate-950 font-extrabold text-[10px] shadow-md flex items-center gap-1">
                    <Icon name="lucide:star" class="w-3 h-3 fill-slate-950" />
                    <span>Destaque</span>
                  </Badge>

                  <!-- Tipo Badge -->
                  <Badge variant="secondary" class="text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white border border-white/10">
                    {{ media.media_type === 'photo' ? 'Foto' : 'Vídeo' }}
                  </Badge>
                </div>

                <!-- Ordem Badge -->
                <div class="absolute bottom-2 right-2 bg-slate-950/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-md border border-white/10">
                  #{{ index + 1 }}
                </div>
              </div>

              <!-- Conteúdo do Card (Textos) -->
              <div class="p-3.5 flex flex-col gap-2">
                <div class="flex flex-col gap-0.5">
                  <p class="text-xs font-bold text-white line-clamp-1" :title="media.title || media.alt_text">
                    {{ media.title || media.alt_text }}
                  </p>
                  <p class="text-[11px] text-slate-400 line-clamp-2" :title="media.alt_text">
                    <span class="text-slate-500 font-semibold">Alt:</span> {{ media.alt_text }}
                  </p>
                  <p v-if="media.caption" class="text-[10px] text-slate-500 line-clamp-1 italic">
                    "{{ media.caption }}"
                  </p>
                </div>

                <!-- Detalhes Técnicos (Resolução e Tamanho) -->
                <div class="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-1 border-t border-white/5">
                  <span v-if="media.width && media.height">{{ media.width }}x{{ media.height }}</span>
                  <span>•</span>
                  <span>{{ formatBytes(media.file_size_bytes) }}</span>
                </div>
              </div>
            </div>

            <!-- Controles e Ações do Card -->
            <div class="p-3.5 pt-0 flex flex-col gap-2.5">
              <!-- Switch Ativo / Visível no Site -->
              <div class="flex items-center justify-between bg-slate-950/50 px-2.5 py-2 rounded-xl border border-white/5">
                <span class="text-[11px] font-semibold text-slate-300">Visível no site</span>
                <Switch
                  :checked="media.is_active"
                  @update:checked="toggleActive(media.id, media.is_active)"
                  :aria-label="`Alternar visibilidade da mídia ${media.id}`"
                />
              </div>

              <!-- Ações: Definir Destaque, Editar, Reordenar e Excluir -->
              <div class="flex items-center justify-between gap-1 pt-1">
                <!-- Definir Destaque (Apenas para Fotos) -->
                <button
                  v-if="media.media_type === 'photo' && !media.is_featured"
                  @click="setFeatured(media.id)"
                  class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors min-h-[44px] cursor-pointer"
                  title="Definir como imagem principal do serviço"
                  aria-label="Definir foto como destaque do serviço"
                >
                  <Icon name="lucide:star" class="w-4 h-4" />
                  <span>Destaque</span>
                </button>
                <div v-else-if="media.is_featured" class="flex-1 text-xs text-amber-400 font-bold flex items-center justify-center gap-1.5 py-2 min-h-[44px]">
                  <Icon name="lucide:star" class="w-4 h-4 fill-amber-400" />
                  <span>Principal</span>
                </div>
                <div v-else class="flex-1 min-h-[44px]"></div>

                <!-- Botões de Reordenação ↑ ↓ -->
                <div class="flex items-center gap-1.5">
                  <button
                    @click="reorderMedia(media.id, 'up')"
                    :disabled="index === 0"
                    class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    title="Mover para cima"
                    aria-label="Mover mídia para cima"
                  >
                    <Icon name="lucide:arrow-up" class="w-4 h-4" />
                  </button>
                  <button
                    @click="reorderMedia(media.id, 'down')"
                    :disabled="index === mediaList.length - 1"
                    class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    title="Mover para baixo"
                    aria-label="Mover mídia para baixo"
                  >
                    <Icon name="lucide:arrow-down" class="w-4 h-4" />
                  </button>
                </div>

                <!-- Editar Metadados -->
                <button
                  @click="openEditModal(media)"
                  class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  title="Editar informações"
                  aria-label="Editar informações da mídia"
                >
                  <Icon name="lucide:edit-3" class="w-4 h-4" />
                </button>

                <!-- Excluir Mídia -->
                <button
                  @click="openDeleteModal(media)"
                  class="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  title="Excluir mídia"
                  aria-label="Excluir mídia"
                >
                  <Icon name="lucide:trash-2" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

    </div>

    <!-- MODAL DE EDIÇÃO DE METADADOS (DIALOG / SHEET) -->
    <div
      v-if="isEditDialogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      @click.self="closeEditModal"
    >
      <div class="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <Icon name="lucide:edit-3" class="w-5 h-5 text-indigo-400" />
            <h3 class="text-base font-bold text-white">Editar Informações da Mídia</h3>
          </div>
          <button
            @click="closeEditModal"
            class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fechar modal"
          >
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSaveEdit" class="flex flex-col gap-4">
          <!-- Campo Alt Text -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-300 flex justify-between">
              <span>Texto Alternativo (Alt Text)*</span>
              <span class="text-slate-500 font-mono">{{ editForm.alt_text.length }}/255</span>
            </label>
            <input
              v-model="editForm.alt_text"
              type="text"
              required
              minlength="3"
              maxlength="255"
              placeholder="Descreva o que aparece na imagem..."
              class="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-hidden min-h-[44px]"
            />
            <p class="text-[11px] text-slate-400">
              Descreva com precisão a instalação para acessibilidade de deficientes visuais e indexação SEO no Google Imagens.
            </p>
          </div>

          <!-- Campo Título Opcional -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-300 flex justify-between">
              <span>Título da Foto/Vídeo (Opcional)</span>
              <span class="text-slate-500 font-mono">{{ editForm.title.length }}/255</span>
            </label>
            <input
              v-model="editForm.title"
              type="text"
              maxlength="255"
              placeholder="Ex: Instalação no Bairro Moema"
              class="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-hidden min-h-[44px]"
            />
          </div>

          <!-- Campo Legenda Opcional -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-300 flex justify-between">
              <span>Legenda Descritiva (Opcional)</span>
              <span class="text-slate-500 font-mono">{{ editForm.caption.length }}/1000</span>
            </label>
            <textarea
              v-model="editForm.caption"
              rows="3"
              maxlength="1000"
              placeholder="Ex: Rede de proteção em polietileno com alta resistência instalada em sacada envidraçada..."
              class="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 focus:outline-hidden resize-none"
            ></textarea>
          </div>

          <div v-if="editError" class="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-300">
            {{ editError }}
          </div>

          <!-- Botões do Modal -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              @click="closeEditModal"
              class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSavingEdit"
              class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white shadow-md min-h-[44px] cursor-pointer"
            >
              <Icon v-if="isSavingEdit" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <span>{{ isSavingEdit ? 'Salvando...' : 'Salvar Alterações' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (ALERT DIALOG) -->
    <div
      v-if="isDeleteDialogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      @click.self="closeDeleteModal"
    >
      <div class="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <Icon name="lucide:trash-2" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Excluir esta mídia?</h3>
            <p class="text-xs text-slate-400">Esta ação é irreversível.</p>
          </div>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-white/5">
          A mídia deixará de aparecer no site público e o arquivo físico será <strong>excluído definitivamente</strong> do bucket de armazenamento (Cloudflare R2).
        </p>

        <div v-if="deleteError" class="p-3 bg-red-950/50 border border-red-800/50 rounded-xl text-xs text-red-300">
          {{ deleteError }}
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            @click="closeDeleteModal"
            class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="isDeleting"
            @click="handleConfirmDelete"
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-red-600/30 min-h-[44px] cursor-pointer"
          >
            <Icon v-if="isDeleting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>{{ isDeleting ? 'Excluindo...' : 'Excluir Definitivamente' }}</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
