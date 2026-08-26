<script setup lang="ts">
import { ref, computed } from 'vue'
import ServicePublicLightbox, { type PublicMediaItem } from './ServicePublicLightbox.vue'

const props = defineProps<{
  serviceKey: string
}>()

// Fetch de mídias ativas do serviço (SSR-Safe com resolução assíncrona)
const { data, error } = await useFetch<{
  success: boolean
  count: number
  media: PublicMediaItem[]
}>(() => `/api/services/${encodeURIComponent(props.serviceKey)}/media`, {
  key: `public-gallery-${props.serviceKey}`,
  default: () => ({ success: true, count: 0, media: [] }),
  lazy: false
})

// Mídias ativas sanitizadas
const mediaList = computed<PublicMediaItem[]>(() => {
  if (error.value || !data.value?.success || !Array.isArray(data.value?.media)) {
    return []
  }
  return data.value.media
})

// Rastreamento de falhas de carregamento em imagens individuais (404/broken)
const brokenMap = ref<Record<string, boolean>>({})
function onImageError(id: string) {
  brokenMap.value[id] = true
}

const visibleMediaList = computed(() => {
  return mediaList.value.filter((m) => !brokenMap.value[m.id])
})

// Estado do Lightbox
const isLightboxOpen = ref(false)
const selectedMediaIndex = ref(0)

function openLightbox(index: number) {
  selectedMediaIndex.value = index
  isLightboxOpen.value = true
}

function closeLightbox() {
  isLightboxOpen.value = false
}

// Layout de 5+ mídias: Exibe as primeiras 4 e um indicador no 4º item
const MAX_PREVIEW_ITEMS = 4
const previewItems = computed(() => {
  return visibleMediaList.value.slice(0, MAX_PREVIEW_ITEMS)
})

const remainingCount = computed(() => {
  return Math.max(0, visibleMediaList.value.length - MAX_PREVIEW_ITEMS)
})
</script>

<template>
  <!-- Comportamento com 0 mídias: Seção Oculta (ZERO layout shift) -->
  <section
    v-if="visibleMediaList.length > 0"
    class="py-12 sm:py-16 bg-[#F9FAFB] border-b border-[#E5EDF8]"
    aria-labelledby="gallery-section-title"
  >
    <div class="max-w-7xl mx-auto px-4 md:px-6">
      
      <!-- CABEÇALHO DA SEÇÃO (Linguagem natural para clientes) -->
      <div class="max-w-3xl mb-8 sm:mb-10">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#22345F]/10 text-[#22345F] mb-3">
          <Icon name="lucide:camera" class="w-3.5 h-3.5 text-[#F49A1A]" />
          <span>Galeria de Fotos Reais</span>
        </div>
        <h2
          id="gallery-section-title"
          class="text-2xl sm:text-3xl font-bold text-[#22345F] tracking-tight mb-2"
        >
          Instalações realizadas
        </h2>
        <p class="text-gray-600 text-sm sm:text-base leading-relaxed">
          Veja alguns exemplos dos nossos serviços executados com acabamento de alto padrão e materiais certificados.
        </p>
      </div>

      <!-- ---------------------------------------------------- -->
      <!-- CASO 1: EXATAMENTE 1 MÍDIA CADASTRADA -->
      <!-- ---------------------------------------------------- -->
      <div v-if="visibleMediaList.length === 1" class="max-w-3xl mx-auto">
        <div
          role="button"
          tabindex="0"
          :aria-label="`Ver foto ampliada: ${visibleMediaList[0].alt_text}`"
          @click="openLightbox(0)"
          @keydown.enter="openLightbox(0)"
          @keydown.space.prevent="openLightbox(0)"
          class="group relative rounded-2xl overflow-hidden shadow-xl border-2 border-[#E5EDF8] bg-white cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-[#22345F]/30 focus:outline-hidden focus:ring-3 focus:ring-[#22345F]/40"
        >
          <div class="relative aspect-video sm:aspect-16/10 bg-slate-900 overflow-hidden">
            <!-- Foto -->
            <img
              v-if="visibleMediaList[0].media_type === 'photo'"
              :src="visibleMediaList[0].publicUrl"
              :alt="visibleMediaList[0].alt_text || 'Instalação realizada'"
              :width="visibleMediaList[0].width || 1280"
              :height="visibleMediaList[0].height || 720"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              @error="onImageError(visibleMediaList[0].id)"
            />

            <!-- Vídeo Preview -->
            <div v-else class="relative w-full h-full">
              <video
                :src="visibleMediaList[0].publicUrl"
                preload="metadata"
                muted
                playsinline
                class="w-full h-full object-cover pointer-events-none"
              ></video>
              <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div class="w-14 h-14 rounded-full bg-[#22345F]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Icon name="lucide:play" class="w-6 h-6 ml-1 fill-white" />
                </div>
              </div>
            </div>

            <!-- Overlay com Botão de Zoom -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4 text-white">
              <span class="text-xs font-semibold flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20">
                <Icon name="lucide:maximize-2" class="w-3.5 h-3.5" />
                Clique para ampliar
              </span>
            </div>
          </div>

          <!-- Legenda e Título sob a imagem -->
          <div
            v-if="visibleMediaList[0].title || visibleMediaList[0].caption || visibleMediaList[0].alt_text"
            class="p-4 sm:p-5 bg-white border-t border-[#E5EDF8]"
          >
            <h3 v-if="visibleMediaList[0].title" class="text-base font-bold text-[#22345F] mb-1">
              {{ visibleMediaList[0].title }}
            </h3>
            <p v-if="visibleMediaList[0].caption" class="text-sm text-gray-600 leading-relaxed">
              {{ visibleMediaList[0].caption }}
            </p>
            <p v-else class="text-xs text-gray-500">
              {{ visibleMediaList[0].alt_text }}
            </p>
          </div>
        </div>
      </div>

      <!-- ---------------------------------------------------- -->
      <!-- CASO 2: 2 MÍDIAS CADASTRADAS (50 / 50) -->
      <!-- ---------------------------------------------------- -->
      <div v-else-if="visibleMediaList.length === 2" class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div
          v-for="(media, idx) in visibleMediaList"
          :key="media.id"
          role="button"
          tabindex="0"
          :aria-label="`Ver foto ${idx + 1}: ${media.alt_text}`"
          @click="openLightbox(idx)"
          @keydown.enter="openLightbox(idx)"
          @keydown.space.prevent="openLightbox(idx)"
          class="group relative rounded-2xl overflow-hidden shadow-md border-2 border-[#E5EDF8] bg-white cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-[#22345F]/30 focus:outline-hidden focus:ring-3 focus:ring-[#22345F]/40"
        >
          <div class="relative aspect-4/3 sm:aspect-16/10 bg-slate-900 overflow-hidden">
            <img
              v-if="media.media_type === 'photo'"
              :src="media.publicUrl"
              :alt="media.alt_text || 'Instalação realizada'"
              :width="media.width || 1280"
              :height="media.height || 720"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              @error="onImageError(media.id)"
            />
            <div v-else class="relative w-full h-full">
              <video
                :src="media.publicUrl"
                preload="metadata"
                muted
                playsinline
                class="w-full h-full object-cover pointer-events-none"
              ></video>
              <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-[#22345F]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Icon name="lucide:play" class="w-5 h-5 ml-0.5 fill-white" />
                </div>
              </div>
            </div>

            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3.5 text-white">
              <span class="text-xs font-semibold flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                <Icon name="lucide:maximize-2" class="w-3 h-3" /> Ampliar
              </span>
            </div>
          </div>

          <div v-if="media.title || media.caption" class="p-3.5 bg-white border-t border-[#E5EDF8]">
            <p v-if="media.title" class="text-sm font-bold text-[#22345F] truncate">{{ media.title }}</p>
            <p v-if="media.caption" class="text-xs text-gray-600 line-clamp-1 mt-0.5">{{ media.caption }}</p>
          </div>
        </div>
      </div>

      <!-- ---------------------------------------------------- -->
      <!-- CASO 3: 3 OU 4 MÍDIAS CADASTRADAS -->
      <!-- ---------------------------------------------------- -->
      <div
        v-else-if="visibleMediaList.length === 3 || visibleMediaList.length === 4"
        class="grid grid-cols-1 sm:grid-cols-2"
        :class="visibleMediaList.length === 3 ? 'lg:grid-cols-3 gap-4 sm:gap-6' : 'lg:grid-cols-4 gap-4 sm:gap-6'"
      >
        <div
          v-for="(media, idx) in visibleMediaList"
          :key="media.id"
          role="button"
          tabindex="0"
          :aria-label="`Ver foto ${idx + 1}: ${media.alt_text}`"
          @click="openLightbox(idx)"
          @keydown.enter="openLightbox(idx)"
          @keydown.space.prevent="openLightbox(idx)"
          class="group relative rounded-2xl overflow-hidden shadow-md border-2 border-[#E5EDF8] bg-white cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-[#22345F]/30 focus:outline-hidden focus:ring-3 focus:ring-[#22345F]/40"
        >
          <div class="relative aspect-4/3 bg-slate-900 overflow-hidden">
            <img
              v-if="media.media_type === 'photo'"
              :src="media.publicUrl"
              :alt="media.alt_text || 'Instalação realizada'"
              :width="media.width || 1280"
              :height="media.height || 720"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              @error="onImageError(media.id)"
            />
            <div v-else class="relative w-full h-full">
              <video
                :src="media.publicUrl"
                preload="metadata"
                muted
                playsinline
                class="w-full h-full object-cover pointer-events-none"
              ></video>
              <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-[#22345F]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Icon name="lucide:play" class="w-5 h-5 ml-0.5 fill-white" />
                </div>
              </div>
            </div>

            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 text-white">
              <span class="text-xs font-semibold flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                <Icon name="lucide:maximize-2" class="w-3 h-3" /> Ampliar
              </span>
            </div>
          </div>

          <div v-if="media.title || media.caption" class="p-3 bg-white border-t border-[#E5EDF8]">
            <p v-if="media.title" class="text-xs font-bold text-[#22345F] truncate">{{ media.title }}</p>
            <p v-if="media.caption" class="text-[11px] text-gray-600 line-clamp-1 mt-0.5">{{ media.caption }}</p>
          </div>
        </div>
      </div>

      <!-- ---------------------------------------------------- -->
      <!-- CASO 4: 5+ MÍDIAS CADASTRADAS (PREVIEW LIMITADO) -->
      <!-- ---------------------------------------------------- -->
      <div v-else class="flex flex-col gap-6">
        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div
            v-for="(media, idx) in previewItems"
            :key="media.id"
            role="button"
            tabindex="0"
            :aria-label="`Ver foto ${idx + 1}: ${media.alt_text}`"
            @click="openLightbox(idx)"
            @keydown.enter="openLightbox(idx)"
            @keydown.space.prevent="openLightbox(idx)"
            class="group relative rounded-2xl overflow-hidden shadow-md border-2 border-[#E5EDF8] bg-white cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-[#22345F]/30 focus:outline-hidden focus:ring-3 focus:ring-[#22345F]/40"
          >
            <div class="relative aspect-4/3 bg-slate-900 overflow-hidden">
              <img
                v-if="media.media_type === 'photo'"
                :src="media.publicUrl"
                :alt="media.alt_text || 'Instalação realizada'"
                :width="media.width || 1280"
                :height="media.height || 720"
                loading="lazy"
                decoding="async"
                class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                @error="onImageError(media.id)"
              />
              <div v-else class="relative w-full h-full">
                <video
                  :src="media.publicUrl"
                  preload="metadata"
                  muted
                  playsinline
                  class="w-full h-full object-cover pointer-events-none"
                ></video>
                <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div class="w-10 h-10 rounded-full bg-[#22345F]/90 text-white flex items-center justify-center shadow-lg">
                    <Icon name="lucide:play" class="w-4 h-4 ml-0.5 fill-white" />
                  </div>
                </div>
              </div>

              <!-- Overlay no 4º item indicando fotos adicionais -->
              <div
                v-if="idx === MAX_PREVIEW_ITEMS - 1 && remainingCount > 0"
                class="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2 text-center transition-all group-hover:bg-black/85"
              >
                <span class="text-xl sm:text-2xl font-extrabold tracking-tight mb-1">+{{ remainingCount }}</span>
                <span class="text-xs sm:text-sm font-semibold">Ver mais fotos</span>
              </div>

              <!-- Overlay padrão nos demais itens -->
              <div
                v-else
                class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 text-white"
              >
                <span class="text-xs font-semibold flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/20">
                  <Icon name="lucide:maximize-2" class="w-3 h-3" /> Ampliar
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Botão CTA para abrir a galeria completa -->
        <div v-if="remainingCount > 0" class="flex justify-center pt-2">
          <button
            @click="openLightbox(0)"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-[#22345F] text-[#22345F] hover:text-white font-bold text-sm border-2 border-[#22345F]/20 hover:border-[#22345F] shadow-sm transition-all duration-200 cursor-pointer min-h-[44px]"
          >
            <Icon name="lucide:images" class="w-4 h-4" />
            <span>Ver todas as {{ visibleMediaList.length }} fotos da galeria</span>
          </button>
        </div>
      </div>

    </div>

    <!-- LIGHTBOX RESPONSIVO E ACESSÍVEL -->
    <ServicePublicLightbox
      :is-open="isLightboxOpen"
      :media-list="visibleMediaList"
      :initial-index="selectedMediaIndex"
      @close="closeLightbox"
    />
  </section>
</template>
