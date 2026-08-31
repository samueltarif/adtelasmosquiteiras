<script setup lang="ts">
defineProps<{
  duplicates: Array<{
    id: string
    nome: string
    telefone_principal: string
    email?: string | null
    cpf_cnpj?: string | null
    tipo_cliente?: string
    created_at?: string
  }>
  showOpenExisting?: boolean
  confirmLabel?: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'open-client', id: string): void
}>()

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR')
}
</script>

<template>
  <div class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
    <div class="flex items-start gap-3">
      <div class="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
        <Icon name="lucide:alert-triangle" class="w-5 h-5" />
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-bold text-amber-300">
          Possível cliente duplicado encontrado
        </h4>
        <p class="text-xs text-amber-200/80 mt-1 leading-relaxed">
          Encontramos registros no sistema com telefone, e-mail ou documento parecidos:
        </p>

        <div class="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
          <div 
            v-for="dup in duplicates" 
            :key="dup.id"
            class="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-amber-500/20 text-xs gap-2 flex-wrap"
          >
            <div class="min-w-0">
              <p class="font-semibold text-white truncate">{{ dup.nome }}</p>
              <p class="text-[11px] text-slate-400">
                Tel: {{ dup.telefone_principal }}
                <span v-if="dup.email"> | {{ dup.email }}</span>
                <span v-if="dup.created_at"> | Cadastrado em {{ formatDate(dup.created_at) }}</span>
              </p>
            </div>
            
            <button
              v-if="showOpenExisting !== false"
              type="button"
              @click="emit('open-client', dup.id)"
              class="px-3 py-2 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium transition-colors cursor-pointer shrink-0 min-h-[44px] flex items-center gap-1"
            >
              <Icon name="lucide:external-link" class="w-3.5 h-3.5" />
              <span>Abrir existente</span>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 mt-4 pt-2 border-t border-amber-500/20">
          <button
            type="button"
            @click="emit('confirm')"
            class="px-3.5 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors text-xs cursor-pointer min-h-[44px]"
          >
            {{ confirmLabel || 'Criar mesmo assim' }}
          </button>
          <button
            type="button"
            @click="emit('cancel')"
            class="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs cursor-pointer min-h-[44px]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
