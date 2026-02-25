<script setup>
const showModal = ref(false)
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <h1 class="text-3xl font-bold mb-4">Teste Simples de Modal</h1>
    
    <div class="space-y-4">
      <p>Estado do modal: <strong>{{ showModal }}</strong></p>
      
      <button
        @click="showModal = true"
        class="px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600"
      >
        Abrir Modal
      </button>
      
      <button
        @click="showModal = false"
        class="px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
      >
        Fechar Modal
      </button>
    </div>

    <!-- Modal Simples -->
    <Teleport to="body">
      <div 
        v-if="showModal"
        class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
        @click="showModal = false"
      >
        <div 
          class="bg-white rounded-lg p-8 max-w-md w-full"
          @click.stop
        >
          <h2 class="text-2xl font-bold mb-4">Modal Funcionando!</h2>
          <p class="mb-4">Se você está vendo isso, o modal está funcionando.</p>
          <button
            @click="showModal = false"
            class="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </Teleport>

    <!-- StickyFormModal -->
    <StickyFormModal v-model="showModal" />
  </div>
</template>
