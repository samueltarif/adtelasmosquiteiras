<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  logoUrl: string
  logoSource: string
}>()

const emit = defineEmits<{
  (e: 'updated', newLogoUrl: string): void
}>()

const isUploading = ref(false)
const isRestoring = ref(false)
const errorMessage = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function triggerFileInput() {
  errorMessage.value = null
  fileInput.value?.click()
}

async function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Valida tamanho máximo de 5MB
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'O arquivo excede o limite de 5 MB.'
    return
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    errorMessage.value = 'Formato inválido. Use JPEG, PNG ou WebP.'
    return
  }

  isUploading.value = true
  errorMessage.value = null

  try {
    // 1. Authorize: Obtém URL pré-assinada no backend
    const authRes = await $fetch<any>('/api/admin/configuracoes/empresa/logo/authorize', {
      method: 'POST',
      body: {
        mime_type: file.type,
        file_size_bytes: file.size
      }
    })

    if (!authRes?.uploadUrl || !authRes?.storageKey) {
      throw new Error('Falha ao autorizar upload no servidor.')
    }

    // 2. Upload direto do navegador para o R2 com a URL pré-assinada
    const uploadRes = await fetch(authRes.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    })

    if (!uploadRes.ok) {
      throw new Error('Falha no upload direto para o R2.')
    }

    // 3. Finalize: Valida magic bytes no backend e atualiza company_profile
    const finRes = await $fetch<any>('/api/admin/configuracoes/empresa/logo/finalize', {
      method: 'POST',
      body: {
        storage_key: authRes.storageKey,
        mime_type: file.type
      }
    })

    if (finRes?.success && finRes.profile?.logo_url) {
      emit('updated', finRes.profile.logo_url)
    }
  } catch (err: any) {
    console.error('[CompanyLogoUploader] Erro no upload')
    errorMessage.value = err?.data?.message || err?.message || 'Erro ao enviar a nova logo.'
  } finally {
    isUploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function handleRestoreDefault() {
  if (!confirm('Deseja restaurar a logo oficial padrão da AD Telas?')) return
  isRestoring.value = true
  errorMessage.value = null

  try {
    const res = await $fetch<any>('/api/admin/configuracoes/empresa/logo/restore-default', {
      method: 'POST'
    })

    if (res?.success && res.profile?.logo_url) {
      emit('updated', res.profile.logo_url)
    }
  } catch (err: any) {
    console.error('[CompanyLogoUploader] Erro ao restaurar padrão')
    errorMessage.value = err?.data?.message || err?.message || 'Erro ao restaurar logo padrão.'
  } finally {
    isRestoring.value = false
  }
}
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-sm space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-bold text-white uppercase tracking-wider">Logotipo Oficial da Empresa</h3>
        <p class="text-xs text-slate-400">Exibido nos cabeçalhos de orçamentos, recibos e documentos PDF</p>
      </div>

      <span 
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
        :class="logoSource === 'r2' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-300 border border-white/10'"
      >
        {{ logoSource === 'r2' ? 'Logo Personalizada (R2)' : 'Logo Padrão Estática' }}
      </span>
    </div>

    <div v-if="errorMessage" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
      {{ errorMessage }}
    </div>

    <div class="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-950/60 border border-white/5">
      <!-- Container da Logo Preview -->
      <div class="w-44 h-24 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center p-3 overflow-hidden shrink-0 shadow-inner">
        <img 
          :src="logoUrl" 
          alt="Logotipo da Empresa" 
          class="max-w-full max-h-full object-contain"
        />
      </div>

      <div class="flex-1 text-center sm:text-left space-y-2">
        <p class="text-xs text-slate-300">
          Recomendado: imagem com fundo transparente nos formatos <strong>PNG</strong> ou <strong>WebP</strong> (máx. 5 MB).
        </p>

        <div class="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/jpeg,image/png,image/webp" 
            class="hidden" 
            @change="handleFileSelected" 
          />

          <button
            type="button"
            :disabled="isUploading || isRestoring"
            @click="triggerFileInput"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5 min-h-[44px] cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Icon v-if="isUploading" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <Icon v-else name="lucide:upload-cloud" class="w-4 h-4" />
            <span>{{ isUploading ? 'Enviando ao R2...' : 'Trocar Logotipo' }}</span>
          </button>

          <button
            v-if="logoSource === 'r2'"
            type="button"
            :disabled="isUploading || isRestoring"
            @click="handleRestoreDefault"
            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 min-h-[44px] cursor-pointer"
          >
            <Icon v-if="isRestoring" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <Icon v-else name="lucide:rotate-ccw" class="w-4 h-4" />
            <span>Restaurar Padrão</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
