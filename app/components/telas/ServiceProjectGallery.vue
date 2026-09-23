<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import type { TelasService } from '~/data/telas/types'
import ServicePublicLightbox, { type PublicMediaItem } from '~/components/services/ServicePublicLightbox.vue'
const props = defineProps<{ service: TelasService }>()
const { data, error } = await useFetch<{ success: boolean; media: PublicMediaItem[] }>(
  () => `/api/services/${encodeURIComponent(props.service.key)}/media`,
  { key: `telas-projects-${props.service.key}`, default: () => ({ success: true, media: [] }) }
)
const broken = ref<string[]>([])
const registered = computed(() => !error.value && data.value?.success && Array.isArray(data.value.media) ? data.value.media : [])
const local = computed<PublicMediaItem[]>(() => props.service.gallery.map((image,index) => ({
  id: `local-${index}`, service_key: props.service.key, storage_key: image.src, media_type: 'photo', mime_type: 'image/webp',
  title: image.alt, alt_text: image.alt, caption: null, sort_order: index, is_featured: index === 0,
  width: image.width, height: image.height, file_size_bytes: 0, created_at: '', publicUrl: image.src
})))
const media = computed(() => (registered.value.length ? registered.value : local.value).filter(item => !broken.value.includes(item.id)))
const preview = computed(() => media.value.slice(0,5))
const expanded = ref(false)
const selected = ref(0)
let opener: HTMLElement | null = null
function open(index: number, event: MouseEvent) {
  opener = event.currentTarget as HTMLElement
  selected.value = index
  expanded.value = true
}
async function close() {
  expanded.value = false
  await nextTick()
  opener?.focus()
}
</script>
<template>
  <section v-if="media.length" id="projetos" class="td-section td-tint">
    <div class="td-wrap">
      <div class="td-section-heading"><div><p class="td-eyebrow">{{ registered.length ? 'Galeria de instalações' : 'Galeria de modelos e aplicações' }}</p><h2>{{ service.name }}</h2><p>{{ registered.length ? 'Veja trabalhos cadastrados pela nossa equipe.' : 'Veja detalhes e exemplos de aplicação deste serviço.' }}</p></div><button class="td-button td-outline" @click="open(0,$event)">Ampliar fotos <Icon name="lucide:expand" /></button></div>
      <div class="td-mosaic" :data-count="preview.length" :class="{ 'td-mosaic-single': preview.length === 1 }">
        <button v-for="(item,index) in preview" :key="item.id" class="td-project" :aria-label="`Ampliar: ${item.alt_text}`" @click="open(index,$event)">
          <img v-if="item.media_type === 'photo'" :src="item.publicUrl" :alt="item.alt_text" :width="item.width || 800" :height="item.height || 600" loading="lazy" decoding="async" @error="broken.push(item.id)" />
          <span v-else class="td-video-placeholder"><Icon name="lucide:play" /> Ver vídeo da instalação</span>
          <span class="td-project-caption"><strong>{{ item.title || item.alt_text }}</strong><small v-if="item.caption">{{ item.caption }}</small></span>
        </button>
      </div>
    </div>
    <ServicePublicLightbox :is-open="expanded" :media-list="media" :initial-index="selected" @close="close" />
  </section>
</template>
