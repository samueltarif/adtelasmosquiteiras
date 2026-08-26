<script setup lang="ts">
defineProps<{
  clients: Array<{
    id: string
    nome: string
    telefone_principal: string
    email?: string | null
    tipo_cliente: string
    cidade_principal: string
    status: string
    is_archived: boolean
    created_at: string
    total_work_orders: number
  }>
}>()

const emit = defineEmits<{
  (e: 'open', id: string): void
}>()

function formatPhone(phone: string) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

function formatWhatsAppLink(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const full = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${full}`
}

function getTipoLabel(tipo: string) {
  const map: Record<string, string> = {
    pessoa_fisica: 'Pessoa Física',
    empresa: 'Empresa',
    condominio: 'Condomínio'
  }
  return map[tipo] || tipo
}
</script>

<template>
  <div class="flex flex-col gap-3 w-full max-w-full">
    <div 
      v-for="c in clients" 
      :key="c.id"
      class="rounded-xl border border-white/10 bg-slate-900/80 p-4 shadow-sm flex flex-col gap-3 hover:border-indigo-500/30 transition-all"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <h3 class="font-bold text-white text-base truncate">{{ c.nome }}</h3>
          <p v-if="c.email" class="text-xs text-slate-400 truncate mt-0.5">{{ c.email }}</p>
        </div>

        <span 
          v-if="c.is_archived" 
          class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700 shrink-0"
        >
          Arquivado
        </span>
        <span 
          v-else-if="c.status === 'ativo'" 
          class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0"
        >
          Ativo
        </span>
        <span 
          v-else 
          class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0"
        >
          {{ c.status }}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-white/5">
        <div>
          <span class="text-slate-500 block text-[10px] uppercase font-semibold">Tipo</span>
          <span>{{ getTipoLabel(c.tipo_cliente) }}</span>
        </div>
        <div>
          <span class="text-slate-500 block text-[10px] uppercase font-semibold">Cidade</span>
          <span class="truncate block">{{ c.cidade_principal }}</span>
        </div>
        <div>
          <span class="text-slate-500 block text-[10px] uppercase font-semibold">Telefone</span>
          <span class="font-mono text-slate-200">{{ formatPhone(c.telefone_principal) }}</span>
        </div>
        <div>
          <span class="text-slate-500 block text-[10px] uppercase font-semibold">Ordens de Serviço</span>
          <span class="font-bold text-indigo-400">{{ c.total_work_orders }} OS</span>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 pt-3 border-t border-white/5 mt-1">
        <div class="flex items-center gap-2">
          <a 
            :href="formatWhatsAppLink(c.telefone_principal)" 
            target="_blank"
            rel="noopener noreferrer"
            class="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-xs font-semibold flex items-center gap-1.5 min-h-[44px] min-w-[44px]"
            title="WhatsApp"
            aria-label="Conversar no WhatsApp"
          >
            <Icon name="lucide:message-circle" class="w-4 h-4" />
            <span>WhatsApp</span>
          </a>

          <a 
            :href="`tel:${c.telefone_principal.replace(/\D/g, '')}`" 
            class="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 border border-white/10 hover:text-white hover:bg-slate-700 transition-colors text-xs font-semibold flex items-center gap-1.5 min-h-[44px] min-w-[44px]"
            title="Ligar"
            aria-label="Ligar para o cliente"
          >
            <Icon name="lucide:phone" class="w-4 h-4" />
            <span>Ligar</span>
          </a>
        </div>

        <button 
          type="button"
          @click="emit('open', c.id)" 
          class="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors text-xs font-bold flex items-center gap-1 min-h-[44px] cursor-pointer"
        >
          <span>Abrir Ficha</span>
          <Icon name="lucide:chevron-right" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
