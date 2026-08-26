<script setup lang="ts">
const props = defineProps<{
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
  sortBy: string
  sortDirection: string
}>()

const emit = defineEmits<{
  (e: 'sort', field: string): void
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

function formatDate(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR')
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
  <div class="w-full overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 shadow-md">
    <table class="w-full text-left text-sm text-slate-300">
      <thead class="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-white/10 select-none">
        <tr>
          <th scope="col" class="py-3.5 px-4 font-semibold cursor-pointer hover:text-white transition-colors" @click="emit('sort', 'nome')">
            <div class="flex items-center gap-1.5">
              <span>Nome / Cliente</span>
              <Icon 
                v-if="sortBy === 'nome'" 
                :name="sortDirection === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down'" 
                class="w-3.5 h-3.5 text-indigo-400" 
              />
            </div>
          </th>
          <th scope="col" class="py-3.5 px-4 font-semibold">Telefone / Contato</th>
          <th scope="col" class="py-3.5 px-4 font-semibold cursor-pointer hover:text-white transition-colors" @click="emit('sort', 'tipo_cliente')">
            <div class="flex items-center gap-1.5">
              <span>Tipo</span>
              <Icon 
                v-if="sortBy === 'tipo_cliente'" 
                :name="sortDirection === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down'" 
                class="w-3.5 h-3.5 text-indigo-400" 
              />
            </div>
          </th>
          <th scope="col" class="py-3.5 px-4 font-semibold">Cidade Principal</th>
          <th scope="col" class="py-3.5 px-4 font-semibold text-center">OSs</th>
          <th scope="col" class="py-3.5 px-4 font-semibold cursor-pointer hover:text-white transition-colors" @click="emit('sort', 'created_at')">
            <div class="flex items-center gap-1.5">
              <span>Cliente Desde</span>
              <Icon 
                v-if="sortBy === 'created_at'" 
                :name="sortDirection === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down'" 
                class="w-3.5 h-3.5 text-indigo-400" 
              />
            </div>
          </th>
          <th scope="col" class="py-3.5 px-4 font-semibold text-center">Status</th>
          <th scope="col" class="py-3.5 px-4 font-semibold text-right">Ações</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        <tr 
          v-for="c in clients" 
          :key="c.id" 
          class="hover:bg-white/[0.03] transition-colors cursor-pointer group"
          @click="emit('open', c.id)"
        >
          <td class="py-3.5 px-4">
            <div class="font-bold text-white group-hover:text-indigo-400 transition-colors">
              {{ c.nome }}
            </div>
            <div v-if="c.email" class="text-xs text-slate-400 truncate max-w-[200px]">
              {{ c.email }}
            </div>
          </td>

          <td class="py-3.5 px-4 whitespace-nowrap">
            <span class="font-mono text-xs text-slate-200">{{ formatPhone(c.telefone_principal) }}</span>
          </td>

          <td class="py-3.5 px-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-white/10">
              {{ getTipoLabel(c.tipo_cliente) }}
            </span>
          </td>

          <td class="py-3.5 px-4 text-xs text-slate-300 whitespace-nowrap">
            {{ c.cidade_principal }}
          </td>

          <td class="py-3.5 px-4 text-center whitespace-nowrap">
            <span 
              class="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-bold"
              :class="c.total_work_orders > 0 ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-500'"
            >
              {{ c.total_work_orders }}
            </span>
          </td>

          <td class="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
            {{ formatDate(c.created_at) }}
          </td>

          <td class="py-3.5 px-4 text-center whitespace-nowrap">
            <span 
              v-if="c.is_archived" 
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700"
            >
              Arquivado
            </span>
            <span 
              v-else-if="c.status === 'ativo'" 
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              Ativo
            </span>
            <span 
              v-else 
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
            >
              {{ c.status }}
            </span>
          </td>

          <td class="py-3.5 px-4 text-right whitespace-nowrap" @click.stop>
            <div class="flex items-center justify-end gap-1.5">
              <a 
                :href="formatWhatsAppLink(c.telefone_principal)" 
                target="_blank"
                rel="noopener noreferrer"
                class="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Conversar no WhatsApp"
                aria-label="Conversar no WhatsApp"
              >
                <Icon name="lucide:message-circle" class="w-4 h-4" />
              </a>

              <a 
                :href="`tel:${c.telefone_principal.replace(/\D/g, '')}`" 
                class="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Ligar para o cliente"
                aria-label="Ligar para o cliente"
              >
                <Icon name="lucide:phone" class="w-4 h-4" />
              </a>

              <button 
                type="button"
                @click="emit('open', c.id)" 
                class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Abrir ficha"
                aria-label="Abrir ficha do cliente"
              >
                <Icon name="lucide:chevron-right" class="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
