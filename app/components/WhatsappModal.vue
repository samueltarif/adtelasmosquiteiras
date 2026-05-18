<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'submit'])

// Dados do formulário
const formData = ref({
  nome: '',
  cidade: '',
  bairro: '',
  tipoServico: ''
})

// Watch para debug
watch(() => formData.value.tipoServico, (newValue) => {
  console.log('Tipo de serviço alterado para:', newValue)
})

// Método para atualizar o serviço
const updateTipoServico = async (event) => {
  const value = event.target.value
  formData.value.tipoServico = value
  await nextTick()
  console.log('Valor atualizado:', formData.value.tipoServico)
}

// Validação do formulário
const isFormValid = computed(() => {
  return formData.value.nome.trim() !== '' &&
         formData.value.cidade.trim() !== '' &&
         formData.value.bairro.trim() !== '' &&
         formData.value.tipoServico !== ''
})

// Fechar modal
const closeModal = () => {
  emit('close')
  // Reset form
  formData.value = {
    nome: '',
    cidade: '',
    bairro: '',
    tipoServico: ''
  }
}

// Enviar formulário
const submitForm = () => {
  if (isFormValid.value) {
    emit('submit', formData.value)
    closeModal()
  }
}

// Fechar modal ao clicar no overlay
const handleOverlayClick = (event) => {
  if (event.target === event.currentTarget) {
    closeModal()
  }
}
</script>

<template>
  <!-- Modal Overlay -->
  <div 
    v-if="isOpen"
    @click="handleOverlayClick"
    class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
    style="z-index: 9999 !important;"
  >
    <!-- Modal Content -->
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto relative" @click.stop>
      <!-- Header -->
      <div class="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
        <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div 
            style="background-color: #25D366;" 
            class="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center"
          >
            <!-- WhatsApp Icon SVG -->
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-base sm:text-lg font-bold text-gray-900 truncate">Falar no WhatsApp</h3>
            <p class="text-xs sm:text-sm text-gray-500 truncate">Preencha seus dados</p>
          </div>
        </div>
        <button 
          @click="closeModal"
          class="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors ml-2"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="submitForm" class="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <!-- Nome -->
        <div>
          <label for="nome" class="block text-sm font-semibold text-gray-700 mb-1.5">
            Nome *
          </label>
          <input
            id="nome"
            v-model="formData.nome"
            type="text"
            required
            placeholder="Digite seu nome"
            class="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-colors"
          />
        </div>

        <!-- Cidade -->
        <div>
          <label for="cidade" class="block text-sm font-semibold text-gray-700 mb-1.5">
            Cidade *
          </label>
          <input
            id="cidade"
            v-model="formData.cidade"
            type="text"
            required
            placeholder="Ex: São Paulo"
            class="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-colors"
          />
        </div>

        <!-- Bairro -->
        <div>
          <label for="bairro" class="block text-sm font-semibold text-gray-700 mb-1.5">
            Bairro / Região *
          </label>
          <input
            id="bairro"
            v-model="formData.bairro"
            type="text"
            required
            placeholder="Ex: Vila Mariana, Pinheiros"
            class="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-colors"
          />
        </div>

        <!-- Tipo de Serviço -->
        <div>
          <label for="tipoServico" class="block text-sm font-semibold text-gray-700 mb-1.5">
            Tipo de serviço *
          </label>
          <select
            id="tipoServico"
            :value="formData.tipoServico"
            @input="updateTipoServico"
            @change="updateTipoServico"
            required
            class="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-colors bg-white text-gray-900"
          >
            <option value="" class="text-gray-500">Selecione um serviço</option>
            <option value="Tela mosqueteira" class="text-gray-900">Tela mosqueteira</option>
            <option value="Rede de proteção" class="text-gray-900">Rede de proteção</option>
            <option value="Telas Pets Screen" class="text-gray-900">Telas Pets Screen</option>
            <option value="Manutenção" class="text-gray-900">Manutenção</option>
            <option value="Orçamento geral" class="text-gray-900">Orçamento geral</option>
          </select>
        </div>

        <!-- Buttons -->
        <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
          <button
            type="button"
            @click="closeModal"
            class="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors order-2 sm:order-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="!isFormValid"
            :style="isFormValid ? { backgroundColor: '#25D366' } : {}"
            :class="[
              'w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 order-1 sm:order-2',
              isFormValid 
                ? 'text-white hover:shadow-lg hover:-translate-y-0.5' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
            @mouseover="isFormValid ? $event.target.style.backgroundColor = '#1DA851' : null"
            @mouseout="isFormValid ? $event.target.style.backgroundColor = '#25D366' : null"
          >
            <!-- WhatsApp Icon SVG -->
            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
            </svg>
            <span>Enviar WhatsApp</span>
          </button>
        </div>
      </form>

      <!-- Footer -->
      <div class="px-4 sm:px-6 pb-4 sm:pb-6">
        <p class="text-xs text-gray-500 text-center leading-relaxed">
          Ao continuar, você será redirecionado para o WhatsApp com sua mensagem preenchida
        </p>
      </div>
    </div>
  </div>
</template>