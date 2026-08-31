<script setup>
import { ref, watch } from 'vue'
import { useAdminAuth } from '../composables/useAdminAuth'

const route = useRoute()
const { user, logout } = useAdminAuth()
const isMobileMenuOpen = ref(false)

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// Fecha o menu mobile automaticamente ao mudar de rota
watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})

const handleLogout = async () => {
  isMobileMenuOpen.value = false
  await logout()
}
</script>

<template>
  <div class="flex min-h-screen min-h-[100dvh] w-full max-w-full bg-slate-950 font-sans text-slate-100 antialiased">
    <!-- Sidebar Desktop (>= 768px) -->
    <aside class="hidden md:flex flex-col h-full py-6 px-4 bg-slate-900/95 fixed h-full w-[260px] lg:w-[280px] left-0 top-0 border-r border-white/10 z-40">
      <div class="flex items-center gap-3 mb-8 px-2">
        <div class="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400 shadow-md">
          <Icon name="lucide:shield" class="w-6 h-6" />
        </div>
        <div>
          <div class="text-base font-bold text-white leading-tight tracking-tight">AD Telas e Redes</div>
          <p class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Painel Admin</p>
        </div>
      </div>
      
      <nav class="flex flex-col gap-1.5 flex-1">
        <NuxtLink 
          to="/admin/dashboard" 
          class="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 min-h-[44px]"
          :class="route.path === '/admin/dashboard' || route.path === '/admin' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'"
        >
          <Icon name="lucide:layout-dashboard" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Dashboard</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/admin/leads" 
          class="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 min-h-[44px]"
          :class="route.path === '/admin/leads' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'"
        >
          <Icon name="lucide:message-square" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Leads</span>
        </NuxtLink>

        <NuxtLink 
          to="/admin/clientes" 
          class="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 min-h-[44px]"
          :class="route.path.startsWith('/admin/clientes') ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'"
        >
          <Icon name="lucide:users" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Clientes</span>
        </NuxtLink>

        <NuxtLink 
          to="/admin/ordens-servico" 
          class="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 min-h-[44px]"
          :class="route.path.startsWith('/admin/ordens-servico') ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'"
        >
          <Icon name="lucide:clipboard-list" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Ordens de Serviço</span>
        </NuxtLink>

        <NuxtLink 
          to="/admin/agenda" 
          class="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 min-h-[44px]"
          :class="route.path.startsWith('/admin/agenda') ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'"
        >
          <Icon name="lucide:calendar" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Agenda</span>
        </NuxtLink>

        <NuxtLink 
          to="/admin/equipe" 
          class="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 min-h-[44px]"
          :class="route.path.startsWith('/admin/equipe') ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'"
        >
          <Icon name="lucide:users-round" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Equipe</span>
        </NuxtLink>

        <NuxtLink 
          to="/admin/galeria" 
          class="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 min-h-[44px]"
          :class="route.path.startsWith('/admin/galeria') ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'"
        >
          <Icon name="lucide:images" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Galeria</span>
        </NuxtLink>

        <NuxtLink 
          to="/admin/configuracoes/empresa" 
          class="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 min-h-[44px]"
          :class="route.path.startsWith('/admin/configuracoes') ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'"
        >
          <Icon name="lucide:building-2" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Perfil da Empresa</span>
        </NuxtLink>
      </nav>
      
      <div class="mt-auto border-t border-white/10 pt-4">
        <button 
          @click="handleLogout" 
          class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer min-h-[44px]"
        >
          <Icon name="lucide:log-out" class="w-5 h-5 shrink-0" />
          <span class="text-sm font-medium">Sair</span>
        </button>
      </div>
    </aside>

    <!-- Sidebar Mobile Drawer Overlay -->
    <div 
      v-if="isMobileMenuOpen" 
      @click="closeMobileMenu" 
      class="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
    ></div>

    <!-- Sidebar Mobile Drawer (Sheet pattern) -->
    <aside 
      class="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-slate-900 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] px-4 z-50 flex flex-col border-r border-white/10 transform transition-transform duration-300 md:hidden shadow-2xl"
      :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center justify-between mb-8 px-2">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
            <Icon name="lucide:shield" class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-white leading-tight">AD Telas</h2>
            <p class="text-[10px] text-slate-400 font-semibold uppercase">Admin V2</p>
          </div>
        </div>
        <button 
          @click="closeMobileMenu" 
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Fechar menu"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <nav class="flex flex-col gap-2 flex-1">
        <NuxtLink 
          to="/admin/dashboard" 
          @click="closeMobileMenu"
          class="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 min-h-[48px]"
          :class="route.path === '/admin/dashboard' || route.path === '/admin' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:layout-dashboard" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Dashboard</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/admin/leads" 
          @click="closeMobileMenu"
          class="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 min-h-[48px]"
          :class="route.path === '/admin/leads' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:message-square" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Leads</span>
        </NuxtLink>

        <NuxtLink 
          to="/admin/clientes" 
          @click="closeMobileMenu"
          class="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 min-h-[48px]"
          :class="route.path.startsWith('/admin/clientes') ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:users" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Clientes</span>
        </NuxtLink>

        <NuxtLink 
          to="/admin/ordens-servico" 
          @click="closeMobileMenu"
          class="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 min-h-[48px]"
          :class="route.path.startsWith('/admin/ordens-servico') ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:clipboard-list" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Ordens de Serviço</span>
        </NuxtLink>

        <NuxtLink 
          to="/admin/agenda" 
          @click="closeMobileMenu"
          class="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 min-h-[48px]"
          :class="route.path.startsWith('/admin/agenda') ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:calendar" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Agenda</span>
        </NuxtLink>

        <NuxtLink 
          to="/admin/equipe" 
          @click="closeMobileMenu"
          class="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 min-h-[48px]"
          :class="route.path.startsWith('/admin/equipe') ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:users-round" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Equipe</span>
        </NuxtLink>

        <NuxtLink 
          to="/admin/galeria" 
          @click="closeMobileMenu"
          class="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 min-h-[48px]"
          :class="route.path.startsWith('/admin/galeria') ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:images" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Galeria</span>
        </NuxtLink>

        <NuxtLink 
          to="/admin/configuracoes/empresa" 
          @click="closeMobileMenu"
          class="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 min-h-[48px]"
          :class="route.path.startsWith('/admin/configuracoes') ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Icon name="lucide:building-2" class="w-5 h-5 shrink-0" />
          <span class="text-sm">Perfil da Empresa</span>
        </NuxtLink>
      </nav>
      
      <div class="mt-auto border-t border-white/10 pt-4">
        <button 
          @click="handleLogout" 
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer min-h-[48px]"
        >
          <Icon name="lucide:log-out" class="w-5 h-5 shrink-0" />
          <span class="text-sm font-medium">Sair</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 min-w-0 md:ml-[260px] lg:ml-[280px] flex flex-col min-h-screen min-h-[100dvh]">
      <!-- TopNavBar -->
      <header class="flex justify-between items-center h-16 px-3 sm:px-6 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 border-b border-white/10 shadow-sm w-full max-w-full">
        <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button 
            @click="toggleMobileMenu" 
            class="md:hidden text-slate-300 p-2.5 rounded-xl hover:bg-white/10 transition-colors active:scale-95 flex items-center justify-center min-h-[44px] min-w-[44px] shrink-0"
            aria-label="Abrir menu"
          >
            <Icon name="lucide:menu" class="w-6 h-6" />
          </button>
          <div class="text-xs sm:text-sm text-slate-400 truncate min-w-0">
            Administração <span class="mx-1 text-slate-600">/</span> 
            <span class="text-white font-semibold">
              {{ 
                route.path.startsWith('/admin/clientes') ? 'Clientes' : 
                route.path.startsWith('/admin/ordens-servico') ? 'Ordens de Serviço' :
                route.path.startsWith('/admin/agenda') ? 'Agenda & Agendamentos' :
                route.path.startsWith('/admin/equipe') ? 'Equipe Operacional' :
                route.path.startsWith('/admin/configuracoes') ? 'Perfil da Empresa' : 
                route.path.startsWith('/admin/galeria') ? 'Galeria de Serviços' : 
                route.path === '/admin/leads' ? 'Leads' : 'Dashboard' 
              }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <NuxtLink 
            to="/" 
            target="_blank"
            class="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors hidden sm:flex items-center gap-1.5 min-h-[44px]"
            title="Ver site público"
          >
            <Icon name="lucide:external-link" class="w-3.5 h-3.5" />
            <span>Ver Site</span>
          </NuxtLink>

          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              A
            </div>
            <span class="text-xs font-medium text-slate-300 hidden sm:block">Admin</span>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 bg-slate-950 w-full max-w-full min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>
