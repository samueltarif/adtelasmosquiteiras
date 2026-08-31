<script setup lang="ts">
import Card from '~/components/ui/card/Card.vue'
import Badge from '~/components/ui/badge/Badge.vue'
import Switch from '~/components/ui/switch/Switch.vue'
import type { SiteMedia } from '~/types/siteMedia'

const props = defineProps<{
  media: SiteMedia
  index: number
  totalCount: number
  isBroken: boolean
}>()

const emit = defineEmits<{
  (e: 'setFeatured', id: string): void
  (e: 'toggleActive', id: string, active: boolean): void
  (e: 'reorder', id: string, dir: 'up' | 'down'): void
  (e: 'edit', media: SiteMedia): void
  (e: 'delete', media: SiteMedia): void
  (e: 'imageError', id: string): void
}>()

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<template>
  <Card class="overflow-hidden flex flex-col justify-between border border-white/10 hover:border-indigo-500/40 transition-all duration-200 group bg-slate-900/70">
    <div>
      <div class="relative w-full aspect-video bg-slate-950 overflow-hidden border-b border-white/10 flex items-center justify-center">
        <img
          v-if="media.media_type === 'photo' && !isBroken"
          :src="media.publicUrl"
          :alt="media.alt_text || 'Foto do serviço'"
          loading="lazy"
          class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          @error="emit('imageError', media.id)"
        />

        <video
          v-else-if="media.media_type === 'video' && !isBroken"
          :src="media.publicUrl"
          controls
          class="w-full h-full object-contain bg-black"
          @error="emit('imageError', media.id)"
        ></video>

        <div v-else class="flex flex-col items-center justify-center p-3 text-center text-slate-500">
          <Icon name="lucide:image-off" class="w-8 h-8 text-amber-500/70 mb-1" />
          <span class="text-[11px] font-semibold text-slate-300">Mídia indisponível</span>
        </div>

        <div class="absolute top-2 left-2 flex flex-wrap gap-1">
          <Badge v-if="media.is_featured" class="bg-amber-500 text-slate-950 font-extrabold text-[10px] shadow-md flex items-center gap-1">
            <Icon name="lucide:star" class="w-3 h-3 fill-slate-950" />
            <span>Destaque</span>
          </Badge>
          <Badge variant="secondary" class="text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white border border-white/10">
            {{ media.media_type === 'photo' ? 'Foto' : 'Vídeo' }}
          </Badge>
        </div>

        <div class="absolute bottom-2 right-2 bg-slate-950/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-md border border-white/10">
          #{{ index + 1 }}
        </div>
      </div>

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

        <div class="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-1 border-t border-white/5">
          <span v-if="media.width && media.height">{{ media.width }}x{{ media.height }}</span>
          <span>•</span>
          <span>{{ formatBytes(media.file_size_bytes) }}</span>
        </div>
      </div>
    </div>

    <div class="p-3.5 pt-0 flex flex-col gap-2.5">
      <div class="flex items-center justify-between bg-slate-950/50 px-2.5 py-2 rounded-xl border border-white/5">
        <span class="text-[11px] font-semibold text-slate-300">Visível no site</span>
        <Switch
          :checked="media.is_active"
          @update:checked="emit('toggleActive', media.id, media.is_active)"
          :aria-label="`Alternar visibilidade da mídia ${media.id}`"
        />
      </div>

      <div class="flex items-center justify-between gap-1 pt-1">
        <button
          v-if="media.media_type === 'photo' && !media.is_featured"
          @click="emit('setFeatured', media.id)"
          class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors min-h-[44px] cursor-pointer"
          title="Definir como imagem principal"
        >
          <Icon name="lucide:star" class="w-4 h-4" />
          <span>Destaque</span>
        </button>
        <div v-else-if="media.is_featured" class="flex-1 text-xs text-amber-400 font-bold flex items-center justify-center gap-1.5 py-2 min-h-[44px]">
          <Icon name="lucide:star" class="w-4 h-4 fill-amber-400" />
          <span>Principal</span>
        </div>
        <div v-else class="flex-1 min-h-[44px]"></div>

        <div class="flex items-center gap-1.5">
          <button
            @click="emit('reorder', media.id, 'up')"
            :disabled="index === 0"
            class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            title="Mover para cima"
          >
            <Icon name="lucide:arrow-up" class="w-4 h-4" />
          </button>
          <button
            @click="emit('reorder', media.id, 'down')"
            :disabled="index === totalCount - 1"
            class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            title="Mover para baixo"
          >
            <Icon name="lucide:arrow-down" class="w-4 h-4" />
          </button>
        </div>

        <button
          @click="emit('edit', media)"
          class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          title="Editar informações"
        >
          <Icon name="lucide:edit-3" class="w-4 h-4" />
        </button>

        <button
          @click="emit('delete', media)"
          class="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          title="Excluir mídia"
        >
          <Icon name="lucide:trash-2" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Card>
</template>
