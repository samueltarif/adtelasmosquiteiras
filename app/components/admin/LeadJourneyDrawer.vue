<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  leadId: string | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

const isLoading = ref(false)
const isSaving = ref(false)
const drawerError = ref<string | null>(null)
const drawerErrorCode = ref<number | null>(null)
const journeyData = ref<any>(null)

// Form fields de edição comercial
const editStatus = ref('Novo')
const editValor = ref('')
const editObs = ref('')

// Estado de visualização de mídia & Lightbox
const isMediaLoading = ref(false)
const selectedPreviewUrl = ref<string | null>(null)
const selectedPreviewName = ref<string | null>(null)
const selectedPreviewType = ref<'photo' | 'video'>('photo')

// Cache em memória de signed URLs por mediaId com TTL
interface ThumbnailCacheItem {
  url: string
  loading: boolean
  error: boolean
  expiresAt: number
}
const thumbnailCache = ref<Record<string, ThumbnailCacheItem>>({})

async function fetchJourney(id: string) {
  if (!id) return
  isLoading.value = true
  drawerError.value = null
  drawerErrorCode.value = null

  try {
    const data = await $fetch<any>(`/api/admin/analytics/lead-journey?lead_id=${encodeURIComponent(id)}`)
    if (data?.success === false) {
      throw new Error(data.error || 'Erro ao carregar jornada')
    }
    journeyData.value = data
    if (data?.lead) {
      editStatus.value = data.lead.status || data.lead.status_comercial || 'Novo'
      editValor.value = data.lead.valor_orcamento != null ? String(data.lead.valor_orcamento) : ''
      editObs.value = data.lead.observacoes || data.lead.observacoes_internas || ''
    }

    // Carrega thumbnails automaticamente para todas as fotos da galeria com isolamento
    if (data?.media && Array.isArray(data.media)) {
      loadPhotoThumbnails(data.media)
    }
  } catch (err: any) {
    console.error('[LeadJourneyDrawer] Erro ao buscar jornada do lead:', err)
    drawerErrorCode.value = err?.statusCode || (err?.response?.status) || 500
    if (drawerErrorCode.value === 403) {
      drawerError.value = 'Sua conta não possui permissão para visualizar este lead.'
    } else if (drawerErrorCode.value === 404) {
      drawerError.value = 'Lead não encontrado no banco de dados.'
    } else {
      drawerError.value = 'Não foi possível carregar os dados deste lead. Verifique a conexão e tente novamente.'
    }
  } finally {
    isLoading.value = false
  }
}

watch(() => props.leadId, (newId) => {
  if (newId && props.isOpen) {
    fetchJourney(newId)
  }
})

watch(() => props.isOpen, (open) => {
  if (open && props.leadId) {
    fetchJourney(props.leadId)
  }
})

async function saveChanges() {
  if (!props.leadId) return
  isSaving.value = true
  try {
    const res = await $fetch<any>('/api/admin/update-lead', {
      method: 'POST',
      body: {
        id: props.leadId,
        status: editStatus.value,
        valor_orcamento: parseFloat(editValor.value) || 0,
        observacoes: editObs.value
      }
    })
    if (res?.success) {
      emit('updated')
      emit('close')
    }
  } catch (err) {
    console.error('Erro ao salvar lead:', err)
  } finally {
    isSaving.value = false
  }
}

function startWhatsapp() {
  if (!journeyData.value?.lead) return
  const rawPhone = (journeyData.value.lead.telefone || '').replace(/\D/g, '')
  const fullPhone = rawPhone.startsWith('55') ? rawPhone : '55' + rawPhone
  const msg = `Olá ${journeyData.value.lead.nome || ''}, tudo bem? Sou da AD Telas e Redes, referente ao seu pedido de orçamento no site.`
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank')
}

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Obtém signed URL com cache em memória e renovação segura antes de expirar.
 */
async function requestSignedUrl(mediaId: string): Promise<string | null> {
  const cached = thumbnailCache.value[mediaId]
  const now = Date.now()

  // Retorna do cache se ainda for válido por pelo menos 20 segundos
  if (cached && cached.url && cached.expiresAt > now + 20000) {
    return cached.url
  }

  try {
    const data = await $fetch<{ success: boolean; signedUrl: string; expiresInSeconds?: number }>(
      `/api/admin/media/signed-url?media_id=${encodeURIComponent(mediaId)}&lead_id=${encodeURIComponent(props.leadId || '')}`
    )
    if (data?.success && data.signedUrl) {
      const ttlMs = (data.expiresInSeconds || 300) * 1000
      thumbnailCache.value[mediaId] = {
        url: data.signedUrl,
        loading: false,
        error: false,
        expiresAt: now + ttlMs
      }
      return data.signedUrl
    }
  } catch (err: any) {
    console.warn('[LeadJourneyDrawer] Erro ao obter signed URL:', err?.message || err)
    if (thumbnailCache.value[mediaId]) {
      thumbnailCache.value[mediaId].error = true
      thumbnailCache.value[mediaId].loading = false
    }
  }
  return null
}

/**
 * Carrega thumbnails de fotos em paralelo com Promise.allSettled (isolamento total de falhas).
 */
async function loadPhotoThumbnails(mediaList: any[]) {
  const photos = mediaList.filter(m => m.media_type === 'photo' && m.upload_status === 'uploaded')
  
  for (const photo of photos) {
    const cached = thumbnailCache.value[photo.id]
    if (!cached || cached.expiresAt <= Date.now() + 20000) {
      thumbnailCache.value[photo.id] = {
        url: '',
        loading: true,
        error: false,
        expiresAt: 0
      }
    }
  }

  // Promise.allSettled garante que o erro de uma mídia NUNCA derruba o resto da galeria
  await Promise.allSettled(
    photos.map(async (photo) => {
      const url = await requestSignedUrl(photo.id)
      if (url && thumbnailCache.value[photo.id]) {
        thumbnailCache.value[photo.id].url = url
        thumbnailCache.value[photo.id].loading = false
        thumbnailCache.value[photo.id].error = false
      }
    })
  )
}

async function retryPhotoThumbnail(photoId: string) {
  if (thumbnailCache.value[photoId]) {
    thumbnailCache.value[photoId].loading = true
    thumbnailCache.value[photoId].error = false
  }
  const url = await requestSignedUrl(photoId)
  if (url && thumbnailCache.value[photoId]) {
    thumbnailCache.value[photoId].url = url
    thumbnailCache.value[photoId].loading = false
    thumbnailCache.value[photoId].error = false
  }
}

async function openMediaPreview(media: any) {
  isMediaLoading.value = true
  const url = await requestSignedUrl(media.id)
  isMediaLoading.value = false
  if (url) {
    selectedPreviewUrl.value = url
    selectedPreviewName.value = media.safe_filename || (media.media_type === 'video' ? 'Vídeo do Cliente' : 'Foto do Cliente')
    selectedPreviewType.value = media.media_type === 'video' ? 'video' : 'photo'
  }
}

function closeLightbox() {
  selectedPreviewUrl.value = null
  selectedPreviewName.value = null
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-all duration-300">
    <!-- Backdrop dismiss -->
    <div class="fixed inset-0" @click="$emit('close')"></div>

    <div class="relative z-10 bg-slate-900 border-l border-white/10 w-full sm:max-w-xl h-full h-[100dvh] flex flex-col shadow-2xl overflow-hidden">
      
      <!-- Header Sticky com Safe Area Top -->
      <div class="p-4 sm:p-5 pt-[calc(1rem+env(safe-area-inset-top,0px))] border-b border-white/10 flex items-center justify-between bg-slate-950/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div class="min-w-0 flex-1 pr-2">
          <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Jornada do Visitante & Lead</span>
          <h2 class="text-base sm:text-lg font-bold text-white mt-0.5 truncate">
            {{ journeyData?.lead?.nome || 'Detalhes do Lead' }}
          </h2>
        </div>
        <button 
          @click="$emit('close')" 
          class="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          aria-label="Fechar gaveta"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State Geral -->
      <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 p-6">
        <Icon name="lucide:loader-2" class="w-8 h-8 text-indigo-400 animate-spin" />
        <span class="text-xs">Carregando jornada do lead...</span>
      </div>

      <!-- Error State Geral com Botão de Retry -->
      <div v-else-if="drawerError" class="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <Icon name="lucide:alert-circle" class="w-6 h-6" />
        </div>
        <div class="max-w-sm space-y-1">
          <h3 class="text-sm font-bold text-white">Falha ao carregar informações</h3>
          <p class="text-xs text-slate-400">{{ drawerError }}</p>
        </div>
        <button
          v-if="leadId"
          type="button"
          @click="fetchJourney(leadId)"
          class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 min-h-[44px]"
        >
          <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5" /> Tentar novamente
        </button>
      </div>

      <!-- Content Scroll Único com Safe Area Bottom -->
      <div v-else-if="journeyData && journeyData.lead" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
        
        <!-- Lead Contact Summary Card -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="flex flex-col gap-0.5 min-w-0">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contato Principal</span>
            <span class="text-sm font-bold text-white font-mono truncate">{{ journeyData.lead.telefone || 'Telefone não informado' }}</span>
            <span v-if="journeyData.lead.email" class="text-xs text-slate-400 truncate">{{ journeyData.lead.email }}</span>
          </div>
          <button 
            @click="startWhatsapp"
            class="px-4 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px] shrink-0"
          >
            <Icon name="lucide:message-circle" class="w-4 h-4" /> Abrir WhatsApp
          </button>
        </div>

        <!-- Origem & Atribuição -->
        <div class="grid grid-cols-2 gap-2.5 sm:gap-3">
          <div class="p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Origem / Canal</span>
            <span class="text-xs font-semibold text-slate-200 block truncate">{{ journeyData.attribution?.channel || journeyData.attribution?.first_touch?.channel || 'Direto' }}</span>
            <span class="text-[10px] text-slate-400 truncate block mt-0.5">{{ journeyData.attribution?.landingPath || journeyData.lead.landing_path || '/' }}</span>
          </div>
          <div class="p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Serviço Solicitado</span>
            <span class="text-xs font-semibold text-indigo-400 block truncate">{{ journeyData.lead.servico || 'Não especificado' }}</span>
            <span class="text-[10px] text-slate-400 truncate block mt-0.5">{{ [journeyData.lead.bairro, journeyData.lead.cidade].filter(Boolean).join(', ') || 'SP' }}</span>
          </div>
        </div>

        <!-- Mensagem do Lead -->
        <div v-if="journeyData.lead.mensagem" class="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Mensagem do Cliente</span>
          <p class="text-xs text-slate-300 leading-relaxed italic bg-black/30 p-3 rounded-xl border border-white/[0.02] break-words">
            "{{ journeyData.lead.mensagem }}"
          </p>
        </div>

        <!-- ====================================================================== -->
        <!-- GALERIA DE MÍDIAS PRIVADAS (FOTOS COM THUMBNAILS REAIS & VÍDEOS)        -->
        <!-- ====================================================================== -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Arquivos Enviados pelo Cliente
            </span>
            <span v-if="journeyData.media" class="text-[10px] text-slate-500 font-mono">
              {{ journeyData.media.length }} arquivo(s)
            </span>
          </div>

          <!-- Galeria com Mídias -->
          <div v-if="journeyData.media && journeyData.media.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
            <div
              v-for="m in journeyData.media"
              :key="m.id"
              class="relative group rounded-xl border border-white/10 bg-slate-950/60 p-2 flex flex-col justify-between overflow-hidden"
            >
              <!-- Card Foto com Thumbnail Real -->
              <div v-if="m.media_type === 'photo'" class="flex flex-col gap-1.5 cursor-pointer" @click="openMediaPreview(m)">
                <div class="w-full aspect-square rounded-lg bg-slate-800/80 relative overflow-hidden flex items-center justify-center">
                  <!-- Skeleton Loading -->
                  <div v-if="thumbnailCache[m.id]?.loading" class="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center text-slate-500">
                    <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
                  </div>
                  
                  <!-- Thumbnail Imagem Real -->
                  <img
                    v-else-if="thumbnailCache[m.id]?.url"
                    :src="thumbnailCache[m.id].url"
                    :alt="m.safe_filename || 'Foto do Lead'"
                    loading="lazy"
                    decoding="async"
                    referrerpolicy="no-referrer"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
                  />
                  
                  <!-- Fallback se não carregou / erro isolado -->
                  <div v-else class="flex flex-col items-center justify-center p-2 text-slate-400 text-center gap-1">
                    <Icon name="lucide:image-off" class="w-5 h-5 text-slate-500" />
                    <button
                      type="button"
                      @click.stop="retryPhotoThumbnail(m.id)"
                      class="text-[9px] text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer min-h-[30px]"
                    >
                      <Icon name="lucide:refresh-cw" class="w-2.5 h-2.5" /> Recarregar
                    </button>
                  </div>
                </div>

                <p class="text-[11px] font-semibold text-slate-200 truncate mt-0.5" :title="m.safe_filename">{{ m.safe_filename }}</p>
                <div class="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{{ formatBytes(m.file_size_bytes) }}</span>
                  <span class="text-indigo-400 font-bold group-hover:underline flex items-center gap-0.5">
                    <Icon name="lucide:maximize-2" class="w-3 h-3" /> Ver
                  </span>
                </div>
              </div>

              <!-- Card Vídeo -->
              <div v-else class="flex flex-col gap-1.5">
                <div 
                  class="w-full aspect-square rounded-lg bg-slate-900 border border-purple-500/20 flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:bg-slate-800/80 transition-colors"
                  @click="openMediaPreview(m)"
                >
                  <Icon name="lucide:play-circle" class="w-7 h-7 sm:w-8 sm:h-8 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                  <p class="text-[10px] text-slate-300 font-bold truncate max-w-full px-1">{{ m.safe_filename }}</p>
                </div>
                <div class="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{{ formatBytes(m.file_size_bytes) }}</span>
                  <button
                    type="button"
                    @click="openMediaPreview(m)"
                    class="text-purple-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5 min-h-[30px]"
                  >
                    <Icon name="lucide:play" class="w-3 h-3" /> Ver Vídeo
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Sem Mídia -->
          <div v-else class="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] text-center text-slate-400">
            <Icon name="lucide:folder-open" class="w-5 h-5 mx-auto mb-1 text-slate-500" />
            <p class="text-[11px] font-medium text-slate-400">Nenhum arquivo enviado pelo cliente.</p>
          </div>
        </div>

        <!-- Gestão Comercial & Edição -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-3">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestão Comercial</span>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-300 text-xs font-semibold mb-1">Status</label>
              <select v-model="editStatus" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-base sm:text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]">
                <option value="Novo">Novo</option>
                <option value="Em Atendimento">Em Atendimento</option>
                <option value="Orçado">Orçado</option>
                <option value="Fechado">Fechado</option>
                <option value="Perdido">Perdido</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-300 text-xs font-semibold mb-1">Valor Orçado (R$)</label>
              <input v-model="editValor" type="number" step="0.01" placeholder="0,00" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-base sm:text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]" />
            </div>
          </div>

          <div>
            <label class="block text-slate-300 text-xs font-semibold mb-1">Observações Internas</label>
            <textarea v-model="editObs" rows="2" placeholder="Anotações comerciais..." class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-base sm:text-xs focus:outline-none focus:border-indigo-500 resize-y"></textarea>
          </div>

          <button 
            @click="saveChanges" 
            :disabled="isSaving"
            class="w-full sm:w-auto self-end px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors disabled:opacity-50 cursor-pointer min-h-[44px]"
          >
            {{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
          </button>
        </div>

        <!-- Linha do Tempo de Acessos -->
        <div class="flex flex-col gap-3">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Linha do Tempo de Acessos</span>
          <div v-if="journeyData.timeline && journeyData.timeline.length > 0" class="relative pl-5 sm:pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
            <div 
              v-for="(ev, idx) in journeyData.timeline" 
              :key="idx"
              class="relative flex flex-col gap-1 text-xs"
            >
              <div 
                class="absolute -left-5 sm:-left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900"
                :class="[
                  ev.type === 'form_submission' || ev.type === 'conversion' ? 'bg-indigo-400 ring-2 ring-indigo-400/20' :
                  ev.type === 'whatsapp_click' || ev.type === 'phone_click' || ev.type === 'interaction' ? 'bg-emerald-400 ring-2 ring-emerald-400/20' :
                  ev.type === 'first_touch' ? 'bg-amber-400 ring-2 ring-amber-400/20' :
                  'bg-slate-500'
                ]"
              ></div>
              <div class="flex items-center justify-between text-slate-400">
                <span class="font-bold text-white truncate mr-2">{{ ev.type === 'form_submission' ? 'Envio de Formulário' : ev.type === 'pageview' ? 'Visualização de Página' : ev.type === 'whatsapp_click' ? 'Clique no WhatsApp' : ev.type }}</span>
                <span class="text-[10px] font-mono shrink-0">{{ formatDate(ev.created_at || ev.timestamp) }}</span>
              </div>
              <p class="text-slate-400 text-[11px] break-words">{{ ev.path || ev.description }}</p>
              <div v-if="ev.channel || ev.cta_location" class="flex flex-wrap gap-2 text-[10px] text-slate-500">
                <span v-if="ev.channel" class="text-indigo-400/80">Canal: {{ ev.channel }}</span>
                <span v-if="ev.cta_location" class="text-slate-500">CTA: {{ ev.cta_location }}</span>
              </div>
            </div>
          </div>
          <div v-else class="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] text-center text-slate-500 text-xs">
            Nenhum evento registrado nesta jornada.
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox Modal para Visualização de Fotos e Vídeos Privados -->
    <div v-if="selectedPreviewUrl" class="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-3 sm:p-4 backdrop-blur-md">
      <div class="w-full max-w-3xl flex items-center justify-between mb-3 text-white">
        <h4 class="text-xs sm:text-sm font-bold truncate pr-2">{{ selectedPreviewName }}</h4>
        <div class="flex items-center gap-2">
          <a :href="selectedPreviewUrl" target="_blank" download referrerpolicy="no-referrer" class="text-xs px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-1 min-h-[40px]">
            <Icon name="lucide:download" class="w-3.5 h-3.5" /> <span>Baixar</span>
          </a>
          <button @click="closeLightbox" class="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>
      </div>
      <div class="w-full max-w-3xl max-h-[80vh] max-h-[80dvh] flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black">
        <img v-if="selectedPreviewType === 'photo'" :src="selectedPreviewUrl" :alt="selectedPreviewName || ''" referrerpolicy="no-referrer" class="max-w-full max-h-[75vh] max-h-[75dvh] object-contain rounded-xl" />
        <video v-else controls preload="metadata" :src="selectedPreviewUrl" class="max-w-full max-h-[75vh] max-h-[75dvh] rounded-xl"></video>
      </div>
    </div>
  </div>
</template>
