<script setup lang="ts">
import { ref } from 'vue'
import {
  ALLOWED_MEDIA_ETAPAS,
  WORK_ORDER_PHOTO_MAX_BYTES,
  WORK_ORDER_VIDEO_MAX_BYTES,
  WORK_ORDER_ALLOWED_PHOTO_MIMES,
  WORK_ORDER_ALLOWED_VIDEO_MIMES
} from '../../../../server/shared/crmValidation.mjs'

const props = defineProps<{
  workOrderId: string
  items: any[]
}>()

const emit = defineEmits<{
  (e: 'uploadComplete'): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const etapa = ref('antes')
const descricao = ref('')
const selectedItemId = ref('')

const isUploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const etapaOptions = [
  { value: 'antes', label: 'Antes da Instalação / Vistoria' },
  { value: 'durante', label: 'Durante a Execução' },
  { value: 'depois', label: 'Depois / Entrega Final' },
  { value: 'laudo', label: 'Laudo Técnico / Diagnóstico' }
]

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    validateAndSetFile(file)
  }
}

function handleDrop(e: DragEvent) {
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0]
    validateAndSetFile(file)
  }
}

function validateAndSetFile(file: File) {
  errorMessage.value = null
  successMessage.value = null

  const mime = file.type.toLowerCase()
  const isPhoto = WORK_ORDER_ALLOWED_PHOTO_MIMES.includes(mime)
  const isVideo = WORK_ORDER_ALLOWED_VIDEO_MIMES.includes(mime)

  if (!isPhoto && !isVideo) {
    errorMessage.value = 'Formato não suportado. Formatos aceitos: JPG, PNG, WEBP, MP4, WEBM, MOV.'
    selectedFile.value = null
    return
  }

  const maxBytes = isPhoto ? WORK_ORDER_PHOTO_MAX_BYTES : WORK_ORDER_VIDEO_MAX_BYTES
  if (file.size > maxBytes) {
    const maxMb = maxBytes / (1024 * 1024)
    errorMessage.value = `Arquivo excede o limite máximo permitido de ${maxMb} MB.`
    selectedFile.value = null
    return
  }

  selectedFile.value = file
}

function clearFile() {
  selectedFile.value = null
  descricao.value = ''
  selectedItemId.value = ''
  uploadProgress.value = 0
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

async function startUpload() {
  if (!selectedFile.value) return

  isUploading.value = true
  uploadProgress.value = 5
  errorMessage.value = null
  successMessage.value = null

  try {
    // Passo 1: Solicita presigned PUT URL ao BFF Nitro
    const authRes = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}/media/authorize`, {
      method: 'POST',
      body: {
        filename: selectedFile.value.name,
        mimeType: selectedFile.value.type,
        fileSizeBytes: selectedFile.value.size
      }
    })

    if (!authRes?.uploadUrl || !authRes?.storageKey) {
      throw new Error('Falha ao autorizar upload no armazenamento privado.')
    }

    uploadProgress.value = 20

    // Passo 2: Upload direto do Browser para o Cloudflare R2 com XHR para progresso
    await uploadDirectToR2(authRes.uploadUrl, selectedFile.value)
    uploadProgress.value = 80

    // Passo 3: Finalização no backend com validação de magic bytes e registro no banco
    const finalizeRes = await $fetch<any>(`/api/admin/crm/work-orders/${props.workOrderId}/media/finalize`, {
      method: 'POST',
      body: {
        storageKey: authRes.storageKey,
        mimeType: selectedFile.value.type,
        safeFilename: authRes.safeFilename,
        etapa: etapa.value,
        descricao: descricao.value.trim() || undefined,
        workOrderItemId: selectedItemId.value || undefined
      }
    })

    uploadProgress.value = 100
    successMessage.value = 'Mídia enviada e validada com sucesso!'
    clearFile()
    emit('uploadComplete')
  } catch (err: any) {
    console.error('[WorkOrderMediaUploader] Erro no upload:', err)
    errorMessage.value = err?.data?.message || err?.message || 'Falha ao realizar upload da mídia técnica'
  } finally {
    isUploading.value = false
  }
}

function uploadDirectToR2(uploadUrl: string, file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = 20 + Math.round((e.loaded / e.total) * 60)
        uploadProgress.value = Math.min(80, percent)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Falha no upload para o R2 (HTTP ${xhr.status})`))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Erro de conexão durante o upload para o R2'))
    }

    xhr.send(file)
  })
}
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Icon name="lucide:upload-cloud" class="w-4 h-4 text-indigo-400" />
          <span>Upload de Fotos e Vídeos Técnicos</span>
        </h3>
        <p class="text-xs text-slate-400">Armazenamento privado e seguro no Cloudflare R2</p>
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
      {{ successMessage }}
    </div>

    <!-- Drag & Drop Zone -->
    <div
      v-if="!selectedFile"
      @dragover.prevent
      @drop.prevent="handleDrop"
      @click="fileInputRef?.click()"
      class="border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-2xl p-8 text-center bg-slate-950/40 hover:bg-slate-950/60 transition-all cursor-pointer space-y-2 group"
    >
      <input
        ref="fileInputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        class="hidden"
        @change="handleFileSelect"
      />
      <div class="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
        <Icon name="lucide:image-plus" class="w-6 h-6" />
      </div>
      <p class="text-xs font-semibold text-white">Clique para selecionar ou arraste o arquivo aqui</p>
      <p class="text-[11px] text-slate-500">
        Fotos (JPG, PNG, WEBP até 5 MB) | Vídeos (MP4, WEBM, MOV até 25 MB)
      </p>
    </div>

    <!-- Arquivo Selecionado e Metadados -->
    <div v-else class="space-y-4 rounded-xl border border-white/10 bg-slate-950/60 p-4">
      <div class="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div class="flex items-center gap-3 truncate">
          <div class="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Icon :name="selectedFile.type.startsWith('video/') ? 'lucide:video' : 'lucide:image'" class="w-5 h-5" />
          </div>
          <div class="truncate">
            <span class="text-xs font-bold text-white block truncate">{{ selectedFile.name }}</span>
            <span class="text-[10px] text-slate-400">{{ (selectedFile.size / (1024 * 1024)).toFixed(2) }} MB</span>
          </div>
        </div>

        <button
          type="button"
          :disabled="isUploading"
          @click="clearFile"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Etapa -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Etapa da Instalação *</label>
          <select
            v-model="etapa"
            :disabled="isUploading"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer disabled:opacity-50"
          >
            <option v-for="opt in etapaOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Vínculo com Item Opcional -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-medium">Vincular ao Item (Opcional)</label>
          <select
            v-model="selectedItemId"
            :disabled="isUploading"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer disabled:opacity-50"
          >
            <option value="">Geral da Ordem de Serviço</option>
            <option v-for="it in items" :key="it.id" :value="it.id">
              Item: {{ it.descricao }}
            </option>
          </select>
        </div>
      </div>

      <!-- Descrição / Comentário Técnico -->
      <div class="space-y-1.5">
        <label class="text-xs text-slate-300 font-medium">Descrição / Observação Técnica</label>
        <input
          v-model="descricao"
          :disabled="isUploading"
          type="text"
          placeholder="Ex: Foto do vão antes da remoção da tela antiga..."
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px] disabled:opacity-50"
        />
      </div>

      <!-- Barra de Progresso -->
      <div v-if="isUploading" class="space-y-1 pt-1">
        <div class="flex justify-between text-[11px] text-slate-400">
          <span>Enviando arquivo com segurança...</span>
          <span>{{ uploadProgress }}%</span>
        </div>
        <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div class="h-full bg-indigo-500 transition-all duration-200" :style="{ width: `${uploadProgress}%` }"></div>
        </div>
      </div>

      <!-- Botão de Upload -->
      <div class="flex justify-end pt-2">
        <button
          type="button"
          :disabled="isUploading"
          @click="startUpload"
          class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg transition-all flex items-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Icon v-if="isUploading" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          <span>{{ isUploading ? 'Transmitindo...' : 'Fazer Upload Seguro' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
