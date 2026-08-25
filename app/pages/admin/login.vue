<script setup lang="ts">
import { ref } from 'vue'
import { useAdminAuth } from '../../composables/useAdminAuth'

useHead({
  title: 'Login Administrativo - AD Telas e Redes',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const route = useRoute()
const { login } = useAdminAuth()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Informe o e-mail e a senha.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await login(email.value, password.value)
    if (res.success) {
      const redirectPath = (route.query.redirect as string) || '/admin/dashboard'
      await navigateTo(redirectPath)
    } else {
      errorMessage.value = res.error || 'E-mail ou senha inválidos.'
    }
  } catch (err: any) {
    errorMessage.value = 'E-mail ou senha inválidos.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen min-h-[100dvh] w-full bg-slate-950 flex items-center justify-center p-3.5 sm:p-6 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
    <!-- Efeito de iluminação de fundo -->
    <div class="absolute -top-40 -left-40 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-80 sm:w-96 h-80 sm:h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="max-w-md w-full relative z-10 my-auto">
      <!-- Logo e Cabeçalho -->
      <div class="text-center mb-6 sm:mb-8">
        <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 text-indigo-400 shadow-lg shadow-indigo-500/10">
          <Icon name="lucide:shield-check" class="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">AD Telas e Redes</h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">Acesso Restrito ao Painel Administrativo</p>
      </div>

      <!-- Card do Formulário -->
      <div class="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl">
        <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
          <!-- Alerta de Erro -->
          <div
            v-if="errorMessage"
            class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2.5"
          >
            <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0 text-red-400" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Campo E-mail -->
          <div>
            <label class="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">E-mail</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Icon name="lucide:mail" class="w-4 h-4" />
              </div>
              <input
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="admin@adtelas.com.br"
                class="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[48px]"
              />
            </div>
          </div>

          <!-- Campo Senha -->
          <div>
            <label class="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Senha</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Icon name="lucide:lock" class="w-4 h-4" />
              </div>
              <input
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="••••••••••••"
                class="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[48px]"
              />
            </div>
          </div>

          <!-- Botão de Entrar -->
          <button
            type="submit"
            :disabled="isLoading"
            class="mt-2 w-full min-h-[48px] sm:min-h-[52px] py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-indigo-600/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98"
          >
            <Icon v-if="isLoading" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>{{ isLoading ? 'Autenticando...' : 'Entrar no Painel' }}</span>
          </button>
        </form>

        <div class="mt-5 pt-5 border-t border-slate-800/80 text-center">
          <NuxtLink to="/" class="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 min-h-[44px]">
            <Icon name="lucide:arrow-left" class="w-3.5 h-3.5" />
            <span>Voltar ao site público</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
