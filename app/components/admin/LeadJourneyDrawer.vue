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
const journeyData = ref<any>(null)
const isSaving = ref(false)

const editStatus = ref('')
const editValor = ref('')
const editObs = ref('')

async function fetchJourney(id: string) {
  isLoading.value = true
  try {
    const data = await $fetch(`/api/admin/analytics/lead-journey?leadId=${id}`)
    if (data?.success) {
      journeyData.value = data
      editStatus.value = data.lead.status || 'Novo'
      editValor.value = data.lead.valor_orcamento ? String(data.lead.valor_orcamento) : ''
      editObs.value = data.lead.observacoes || ''
    }
  } catch (err) {
    console.error('Erro ao carregar jornada do lead:', err)
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
    const res = await $fetch('/api/admin/update-lead', {
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
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
    <div class="bg-slate-900 border-l border-white/10 w-full max-w-xl h-full flex flex-col shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
        <div>
          <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Jornada do Visitante & Lead</span>
          <h3 class="text-lg font-bold text-white mt-0.5">
            {{ journeyData?.lead.nome || 'Detalhes do Lead' }}
          </h3>
        </div>
        <button @click="$emit('close')" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05]">
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex-1 flex items-center justify-center">
        <Icon name="lucide:loader" class="w-8 h-8 text-indigo-400 animate-spin" />
      </div>

      <!-- Content -->
      <div v-else-if="journeyData" class="flex-1 overflow-y-auto p-5 flex flex-col gap-6 text-xs">
        <!-- Quick Actions & Contact -->
        <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
          <div>
            <p class="text-slate-300 font-semibold text-sm">{{ journeyData.lead.telefone || 'Telefone não informado' }}</p>
            <p class="text-slate-500 text-[11px]">{{ journeyData.lead.email || 'Email não informado' }} · {{ [journeyData.lead.bairro, journeyData.lead.cidade].filter(Boolean).join(', ') }}</p>
          </div>
          <button 
            @click="startWhatsapp" 
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#1EBE5D] transition-colors shadow-lg"
          >
            <Icon name="lucide:message-circle" class="w-4 h-4" />
            WhatsApp
          </button>
        </div>

        <!-- Attribution Box -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- First Touch -->
          <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span class="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">1º Toque (Aquisição)</span>
            <p class="text-slate-200 font-semibold mt-1">Canal: {{ journeyData.attribution.first_touch.channel }}</p>
            <p class="text-slate-400 text-[11px] truncate">Landing: {{ journeyData.attribution.first_touch.landing_path || '/' }}</p>
            <p v-if="journeyData.attribution.first_touch.utm_campaign" class="text-indigo-300 text-[11px]">
              Campanha: {{ journeyData.attribution.first_touch.utm_campaign }}
            </p>
          </div>

          <!-- Session Touch -->
          <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Toque da Conversão</span>
            <p class="text-slate-200 font-semibold mt-1">Canal: {{ journeyData.attribution.session_touch.channel }}</p>
            <p class="text-slate-400 text-[11px] truncate">Conversão: {{ journeyData.lead.conversion_path || '/' }}</p>
            <p v-if="journeyData.attribution.session_touch.utm_campaign" class="text-indigo-300 text-[11px]">
              Campanha: {{ journeyData.attribution.session_touch.utm_campaign }}
            </p>
          </div>
        </div>

        <!-- Commercial Status & Edit -->
        <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-3">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestão Comercial</span>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 font-medium mb-1">Status</label>
              <select v-model="editStatus" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
                <option value="Novo">Novo</option>
                <option value="Em Atendimento">Em Atendimento</option>
                <option value="Orçado">Orçado</option>
                <option value="Fechado">Fechado</option>
                <option value="Perdido">Perdido</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-400 font-medium mb-1">Valor Orçado (R$)</label>
              <input v-model="editValor" type="number" step="0.01" placeholder="0,00" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 font-medium mb-1">Observações Internas</label>
            <textarea v-model="editObs" rows="2" placeholder="Anotações comerciais..." class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"></textarea>
          </div>

          <button 
            @click="saveChanges" 
            :disabled="isSaving"
            class="self-end px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
          </button>
        </div>

        <!-- Timeline of Events -->
        <div class="flex flex-col gap-3">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Linha do Tempo de Acessos</span>

          <div class="flex flex-col border-l-2 border-white/10 ml-2 pl-4 gap-4">
            <div 
              v-for="(ev, idx) in journeyData.timeline" 
              :key="idx"
              class="relative flex flex-col gap-0.5"
            >
              <!-- Timeline node dot -->
              <div 
                class="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full border-2 border-slate-900"
                :class="ev.type === 'form_submission' ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : ev.type.includes('click') ? 'bg-amber-400' : 'bg-cyan-400'"
              ></div>

              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-200">
                  {{ ev.type === 'form_submission' ? 'Envio de Formulário (Lead)' : ev.type === 'whatsapp_click' ? 'Clique no WhatsApp' : ev.type === 'phone_click' ? 'Clique em Telefone' : 'Visualização de Página' }}
                </span>
                <span class="text-slate-500 text-[10px] tabular-nums">{{ formatDate(ev.created_at) }}</span>
              </div>

              <p class="text-slate-400 text-[11px] font-mono">{{ ev.path }}</p>

              <div v-if="ev.service_name || ev.cta_location" class="flex gap-2 mt-0.5 text-[10px]">
                <span v-if="ev.service_name" class="text-indigo-300">{{ ev.service_name }}</span>
                <span v-if="ev.cta_location" class="text-slate-500">CTA: {{ ev.cta_location }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
