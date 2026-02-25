<script setup>
const showFormModal = ref(false)

const openFormModal = () => {
  console.log('🟢 [TEST] openFormModal() chamado')
  console.log('🟢 [TEST] showFormModal antes:', showFormModal.value)
  showFormModal.value = true
  console.log('🟢 [TEST] showFormModal depois:', showFormModal.value)
}

// Teste manual
const testOpenModal = () => {
  console.log('🔴 [TEST] Botão de teste clicado')
  openFormModal()
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">Teste de Modais</h1>
      
      <!-- Botão de teste manual -->
      <div class="bg-white p-6 rounded-lg shadow mb-8">
        <h2 class="text-xl font-bold mb-4">Teste Manual</h2>
        <button
          @click="testOpenModal"
          class="px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600"
        >
          🔴 Abrir Modal (Teste Manual)
        </button>
        <p class="mt-2 text-sm text-gray-600">
          Estado atual: showFormModal = {{ showFormModal }}
        </p>
      </div>

      <!-- Instruções -->
      <div class="bg-white p-6 rounded-lg shadow mb-8">
        <h2 class="text-xl font-bold mb-4">Instruções</h2>
        <ol class="list-decimal list-inside space-y-2 text-gray-700">
          <li>Abra o console do navegador (F12)</li>
          <li>Role a página para baixo >200px para ver o MobileUnifiedCTA (verde)</li>
          <li>Role a página para baixo >400px para ver o StickyFormModal (laranja)</li>
          <li>Clique no botão azul acima para testar manualmente</li>
          <li>Verifique os logs no console</li>
        </ol>
      </div>

      <!-- Espaçador para scroll -->
      <div class="space-y-4">
        <div v-for="i in 20" :key="i" class="bg-white p-6 rounded-lg shadow">
          <h3 class="font-bold">Seção {{ i }}</h3>
          <p class="text-gray-600">
            Role para baixo para testar os botões flutuantes.
            Scroll atual: {{ i * 100 }}px
          </p>
        </div>
      </div>
    </div>

    <!-- MobileUnifiedCTA -->
    <MobileUnifiedCTA
      servico-atual="Teste de Modal"
      msg-padrao="Olá! Teste de modal."
      @open-form="openFormModal"
    />

    <!-- StickyFormModal -->
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>
