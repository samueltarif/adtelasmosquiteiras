<script setup lang="ts">
import { computed } from 'vue'
import { useServicos } from '~/composables/useServicos'

const props = defineProps<{
  leadId: string | null
  nome: string
  telefone: string
  hasPhotos: boolean
  needType: string | null
}>()

const emit = defineEmits<{
  (e: 'whatsappClick'): void
}>()

const { WHATSAPP_NUMBER } = useServicos()

const whatsappUrl = computed(() => {
  const baseNumber = WHATSAPP_NUMBER || '5511983586611'
  const greeting = props.nome ? `Olá! Sou ${props.nome.trim()}.` : 'Olá!'
  const msg = `${greeting} Acabei de solicitar um orçamento de telas mosquiteiras pelo site. Vou enviar as fotos das janelas/portas para agilizar o orçamento.`
  return `https://wa.me/${baseNumber}?text=${encodeURIComponent(msg)}`
})

function onWhatsAppClick() {
  emit('whatsappClick')
}
</script>

<template>
  <div class="text-center py-4 space-y-4">
    <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
      <Icon name="lucide:check-circle-2" class="w-10 h-10" />
    </div>

    <div>
      <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-2">
        Solicitação Confirmada
      </span>
      <h3 class="text-2xl sm:text-3xl font-extrabold text-[#22345F]">
        Recebemos sua solicitação! ✅
      </h3>
      <p class="text-sm sm:text-base text-gray-600 max-w-md mx-auto mt-2">
        Nossa equipe técnica já está com seus dados. Para receber o valor exato mais rápido, nos envie as fotos pelo WhatsApp.
      </p>
    </div>

    <!-- Card de Ação WhatsApp -->
    <div class="p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-200 max-w-md mx-auto text-left space-y-3">
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <Icon name="lucide:camera" class="w-5 h-5" />
        </div>
        <div>
          <h4 class="font-bold text-[#22345F] text-sm sm:text-base">
            Envie fotos das janelas ou portas
          </h4>
          <p class="text-xs text-gray-600 mt-0.5">
            Não precisa saber as medidas exatas agora. Pela foto, nossos especialistas conseguem identificar o modelo de esquadria.
          </p>
        </div>
      </div>

      <a
        :href="whatsappUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="w-full min-h-[50px] px-5 py-3 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        @click="onWhatsAppClick"
      >
        <Icon name="lucide:message-circle" class="w-5 h-5" />
        <span>ENVIAR FOTOS PELO WHATSAPP</span>
      </a>
    </div>

    <p class="text-xs text-gray-500 pt-2">
      Prefere aguardar? Não se preocupe: entraremos em contato com você em breve.
    </p>
  </div>
</template>
