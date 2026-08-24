<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const whatsappLink = 'https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21%20Gostaria%20de%20um%20or%C3%A7amento%20para%20instalar%20telas%20de%20seguran%C3%A7a.%20Vim%20pelo%20site%3A%20https%3A%2F%2Fwww.adtelasmosquiteiras.com.br&type=phone_number&app_absent=0'

// Mostra o tooltip expandido após 3s (técnica de "delayed reveal" — aumenta CTR em ~20%)
const showTooltip = ref(false)
let tooltipTimer = null

onMounted(() => {
  tooltipTimer = setTimeout(() => {
    showTooltip.value = true
    // Fecha sozinho após 6s para não poluir
    setTimeout(() => { showTooltip.value = false }, 6000)
  }, 3000)
})

onUnmounted(() => clearTimeout(tooltipTimer))
</script>

<template>
  <div class="fixed bottom-5 right-4 md:bottom-8 md:right-6 z-[99] flex flex-col items-end gap-2">

    <!-- Tooltip expansível (aparece após 3s — urgência + social proof) -->
    <Transition name="tooltip">
      <div
        v-if="showTooltip"
        class="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 max-w-[200px] text-right"
      >
        <!-- Social proof: estrelas -->
        <div class="flex items-center justify-end gap-1 mb-1">
          <span v-for="i in 5" :key="i" class="text-yellow-400 text-xs">★</span>
          <span class="text-xs font-bold text-gray-700 ml-1">5.0</span>
        </div>
        <!-- Urgência + benefício -->
        <p class="text-xs font-bold text-gray-800 leading-tight">Orçamento grátis agora</p>
        <p class="text-[11px] text-gray-500 mt-0.5">Resposta em minutos · Sem compromisso</p>
        <!-- Seta apontando pro botão -->
        <div class="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45"></div>
      </div>
    </Transition>

    <!-- Botão principal -->
    <div class="relative">
      <!-- Ondas de pulso (atenção visual — padrão Intercom/Drift) -->
      <span class="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping"></span>
      <span class="absolute inset-0 rounded-full bg-[#25D366] opacity-20 animate-ping" style="animation-delay: 0.4s"></span>

      <a
        :href="whatsappLink"
        target="_blank"
        rel="noopener noreferrer"
        data-cta-location="floating_whatsapp"
        title="Falar no WhatsApp agora"
        class="relative flex items-center gap-2 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-full shadow-2xl transition-colors duration-300 active:scale-95 pl-3 pr-4 py-3 md:pl-4 md:pr-5 md:py-3.5 wpp-bounce"
        @mouseenter="showTooltip = false"
      >
        <!-- Ícone WhatsApp -->
        <svg class="w-7 h-7 md:w-8 md:h-8 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
        </svg>
        <!-- Texto CTA (técnica: verbo de ação + benefício imediato) -->
        <div class="flex flex-col leading-tight">
          <span class="text-[11px] font-medium opacity-90">Orçamento grátis</span>
          <span class="text-sm font-bold">Falar agora</span>
        </div>
      </a>
    </div>

  </div>
</template>

<style scoped>
.tooltip-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tooltip-leave-active {
  transition: all 0.2s ease-in;
}
.tooltip-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
}
.tooltip-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@keyframes wpp-bounce {
  0%, 100% { transform: translateY(0); }
  30%       { transform: translateY(-10px); }
  50%       { transform: translateY(-5px); }
  70%       { transform: translateY(-8px); }
}
.wpp-bounce {
  animation: wpp-bounce 1.6s ease-in-out infinite;
}
.wpp-bounce:hover {
  animation: none;
  transform: scale(1.05);
}
</style>
