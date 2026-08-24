<script setup lang="ts">
const props = defineProps<{
  events: Array<{
    tipo: string
    label: string
    sublabel: string
    created_at: string
    service_name?: string | null
    service_key?: string | null
    cta_location?: string | null
    channel?: string | null
    device_type?: string | null
  }>
  loading?: boolean
}>()

const eventConfig = (tipo: string) => {
  const cfg: Record<string, { icon: string; bg: string; border: string; color: string }> = {
    visita:            { icon: 'lucide:eye',            bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    color: 'text-cyan-400' },
    whatsapp:          { icon: 'lucide:message-circle', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', color: 'text-emerald-400' },
    telefone:          { icon: 'lucide:phone-call',     bg: 'bg-rose-500/10',   border: 'border-rose-500/20',   color: 'text-rose-400' },
    lead:              { icon: 'lucide:user-plus',      bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', color: 'text-indigo-400' },
    formulario_submit: { icon: 'lucide:file-text',     bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  color: 'text-amber-400' },
    internal_cta:      { icon: 'lucide:arrow-right',   bg: 'bg-violet-500/10', border: 'border-violet-500/20', color: 'text-violet-400' }
  }
  return cfg[tipo] || cfg['visita']
}

const timeAgo = (dateStr: string) => {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return Math.floor(diff / 60) + ' min'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h'
  return Math.floor(diff / 86400) + 'd'
}
</script>

<template>
  <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <Icon name="lucide:activity" class="w-4 h-4 text-indigo-400" />
          Atividade Recente em Tempo Real
        </h3>
        <p class="text-xs text-slate-500 mt-0.5">Últimos eventos reais registrados no banco</p>
      </div>
      <NuxtLink to="/admin/leads" class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1">
        Ver leads <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-10">
      <Icon name="lucide:loader" class="w-6 h-6 text-indigo-400 animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="!events || events.length === 0" class="flex flex-col items-center justify-center py-10 text-slate-500 text-xs gap-2">
      <Icon name="lucide:inbox" class="w-8 h-8 text-slate-700" />
      Nenhuma atividade recente registrada.
    </div>

    <!-- Feed list -->
    <div v-else class="flex flex-col gap-2 overflow-y-auto max-h-[380px] pr-1">
      <div 
        v-for="(ev, idx) in events" 
        :key="idx"
        class="flex items-start gap-3 p-3 rounded-xl bg-white/[0.015] border border-white/[0.03] hover:bg-white/[0.04] transition-colors"
      >
        <div 
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border"
          :class="[eventConfig(ev.tipo).bg, eventConfig(ev.tipo).border]"
        >
          <Icon :name="eventConfig(ev.tipo).icon" class="w-4 h-4" :class="eventConfig(ev.tipo).color" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-xs font-bold text-slate-200 truncate">{{ ev.label }}</p>
            <span v-if="ev.channel" class="text-[9px] font-semibold text-slate-400 bg-white/[0.04] px-1.5 py-0.2 rounded">
              {{ ev.channel }}
            </span>
          </div>

          <p class="text-xs text-slate-400 mt-0.5 truncate">{{ ev.sublabel }}</p>

          <!-- Context tags -->
          <div v-if="ev.service_name || ev.cta_location" class="flex items-center gap-2 mt-1 flex-wrap">
            <span v-if="ev.service_name" class="text-[10px] text-indigo-300 font-medium bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded">
              {{ ev.service_name }}
            </span>
            <span v-if="ev.cta_location" class="text-[10px] text-emerald-300 font-medium bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
              {{ ev.cta_location }}
            </span>
          </div>
        </div>

        <span class="text-[10px] text-slate-500 whitespace-nowrap mt-1 font-medium">{{ timeAgo(ev.created_at) }}</span>
      </div>
    </div>
  </div>
</template>
