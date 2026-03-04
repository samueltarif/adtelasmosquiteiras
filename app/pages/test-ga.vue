<script setup>
// Página de teste do Google Analytics
const gaStatus = ref({
  scriptLoaded: false,
  gtagExists: false,
  dataLayerExists: false,
  measurementId: 'G-S0038L1Q6R',
  events: []
})

onMounted(() => {
  // Verificar se o script está carregado
  setTimeout(() => {
    gaStatus.value.scriptLoaded = !!document.querySelector('script[src*="googletagmanager.com/gtag"]')
    gaStatus.value.gtagExists = typeof window.gtag === 'function'
    gaStatus.value.dataLayerExists = Array.isArray(window.dataLayer)
    
    if (window.dataLayer) {
      gaStatus.value.events = window.dataLayer.slice(0, 5) // Primeiros 5 eventos
    }
  }, 2000)
})

const sendTestEvent = () => {
  if (window.gtag) {
    window.gtag('event', 'test_event', {
      event_category: 'test',
      event_label: 'Manual Test',
      value: 1
    })
    alert('Evento de teste enviado! Verifique no console e no GA4 Real-Time.')
    console.log('✅ Evento enviado:', 'test_event')
  } else {
    alert('❌ gtag não está disponível!')
  }
}

useHead({
  title: 'Teste Google Analytics - AD Telas'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12">
    <div class="container mx-auto px-4 max-w-4xl">
      
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <h1 class="text-3xl font-bold text-[#22345F] mb-2">
          🔍 Teste Google Analytics
        </h1>
        <p class="text-gray-600">
          Verificação de instalação do GA4
        </p>
      </div>

      <!-- Status Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        <!-- Script Carregado -->
        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center gap-3 mb-3">
            <div :class="[
              'w-12 h-12 rounded-full flex items-center justify-center',
              gaStatus.scriptLoaded ? 'bg-green-100' : 'bg-red-100'
            ]">
              <span class="text-2xl">{{ gaStatus.scriptLoaded ? '✅' : '❌' }}</span>
            </div>
            <div>
              <h3 class="font-bold text-[#22345F]">Script Carregado</h3>
              <p class="text-sm text-gray-600">gtag.js no DOM</p>
            </div>
          </div>
          <p class="text-xs text-gray-500">
            {{ gaStatus.scriptLoaded ? 'Script encontrado no <head>' : 'Script não encontrado' }}
          </p>
        </div>

        <!-- gtag Function -->
        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center gap-3 mb-3">
            <div :class="[
              'w-12 h-12 rounded-full flex items-center justify-center',
              gaStatus.gtagExists ? 'bg-green-100' : 'bg-red-100'
            ]">
              <span class="text-2xl">{{ gaStatus.gtagExists ? '✅' : '❌' }}</span>
            </div>
            <div>
              <h3 class="font-bold text-[#22345F]">gtag() Function</h3>
              <p class="text-sm text-gray-600">Função global</p>
            </div>
          </div>
          <p class="text-xs text-gray-500">
            {{ gaStatus.gtagExists ? 'window.gtag disponível' : 'window.gtag não encontrado' }}
          </p>
        </div>

        <!-- dataLayer -->
        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center gap-3 mb-3">
            <div :class="[
              'w-12 h-12 rounded-full flex items-center justify-center',
              gaStatus.dataLayerExists ? 'bg-green-100' : 'bg-red-100'
            ]">
              <span class="text-2xl">{{ gaStatus.dataLayerExists ? '✅' : '❌' }}</span>
            </div>
            <div>
              <h3 class="font-bold text-[#22345F]">dataLayer</h3>
              <p class="text-sm text-gray-600">Array de eventos</p>
            </div>
          </div>
          <p class="text-xs text-gray-500">
            {{ gaStatus.dataLayerExists ? `${gaStatus.events.length} eventos` : 'dataLayer não encontrado' }}
          </p>
        </div>

        <!-- Measurement ID -->
        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span class="text-2xl">🎯</span>
            </div>
            <div>
              <h3 class="font-bold text-[#22345F]">Measurement ID</h3>
              <p class="text-sm text-gray-600">ID do GA4</p>
            </div>
          </div>
          <p class="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">
            {{ gaStatus.measurementId }}
          </p>
        </div>

      </div>

      <!-- Teste Manual -->
      <div class="bg-white rounded-xl shadow-md p-8 mb-6">
        <h2 class="text-xl font-bold text-[#22345F] mb-4">
          🧪 Teste Manual
        </h2>
        <p class="text-gray-600 mb-4">
          Clique no botão abaixo para enviar um evento de teste para o GA4.
          Depois verifique no Google Analytics em <strong>Relatórios > Tempo Real</strong>.
        </p>
        <button
          @click="sendTestEvent"
          class="px-6 py-3 bg-[#F49A1A] hover:bg-[#e08910] text-white rounded-xl font-bold transition-all shadow-lg"
        >
          Enviar Evento de Teste
        </button>
      </div>

      <!-- dataLayer Events -->
      <div v-if="gaStatus.dataLayerExists" class="bg-white rounded-xl shadow-md p-8">
        <h2 class="text-xl font-bold text-[#22345F] mb-4">
          📊 Eventos no dataLayer
        </h2>
        <div class="space-y-2">
          <div
            v-for="(event, index) in gaStatus.events"
            :key="index"
            class="bg-gray-50 p-3 rounded-lg font-mono text-xs overflow-x-auto"
          >
            <pre>{{ JSON.stringify(event, null, 2) }}</pre>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-4">
          Abra o console do navegador (F12) e digite <code class="bg-gray-100 px-2 py-1 rounded">window.dataLayer</code> para ver todos os eventos.
        </p>
      </div>

      <!-- Instruções -->
      <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mt-6">
        <h3 class="font-bold text-[#22345F] mb-3">📝 Como Verificar no GA4:</h3>
        <ol class="list-decimal list-inside space-y-2 text-gray-700">
          <li>Acesse <a href="https://analytics.google.com/" target="_blank" class="text-blue-600 hover:underline">Google Analytics</a></li>
          <li>Vá em <strong>Relatórios</strong> > <strong>Tempo Real</strong></li>
          <li>Você deve ver 1 usuário ativo (você)</li>
          <li>Clique em "Enviar Evento de Teste" acima</li>
          <li>O evento "test_event" deve aparecer em tempo real</li>
        </ol>
      </div>

      <!-- Voltar -->
      <div class="mt-6 text-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-[#22345F] hover:text-[#F49A1A] font-medium"
        >
          <Icon name="lucide:arrow-left" class="w-4 h-4" />
          Voltar para Home
        </NuxtLink>
      </div>

    </div>
  </div>
</template>
