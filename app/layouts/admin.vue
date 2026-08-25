<script setup>
import { ref } from 'vue'
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

const handleLogout = async () => {
  await logout()
}
</script>

<template>
  <div class="flex min-h-screen bg-admin-surface font-sans text-admin-on-surface antialiased overflow-x-hidden">
    <!-- Sidebar Desktop -->
    <aside class="hidden md:flex flex-col h-full py-6 px-4 bg-admin-surface-container-lowest fixed h-full w-[280px] left-0 top-0 border-r border-admin-outline-variant/30 z-40">
      <div class="flex items-center gap-3 mb-8 px-2">
        <div class="w-10 h-10 rounded-lg bg-admin-primary-container flex items-center justify-center shrink-0">
          <Icon name="lucide:shield" class="text-white w-6 h-6" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-admin-primary leading-tight tracking-tight">AD Telas e Redes</h1>
          <p class="text-xs text-admin-on-surface-variant font-semibold uppercase tracking-wider">Painel Admin</p>
        </div>
      </div>
      
      <nav class="flex flex-col gap-2 flex-1">
        <NuxtLink 
          to="/admin/dashboard" 
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
          :class="route.path === '/admin/dashboard' ? 'bg-admin-primary/5 text-admin-primary font-bold' : 'text-admin-on-surface-variant hover:text-admin-primary hover:bg-admin-surface-container-low'"
        >
          <Icon name="lucide:layout-dashboard" class="w-5 h-5" />
          <span class="text-sm font-medium">Dashboard</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/admin/leads" 
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
          :class="route.path === '/admin/leads' ? 'bg-admin-primary/5 text-admin-primary font-bold' : 'text-admin-on-surface-variant hover:text-admin-primary hover:bg-admin-surface-container-low'"
        >
          <Icon name="lucide:users" class="w-5 h-5" />
          <span class="text-sm font-medium">Leads</span>
        </NuxtLink>
      </nav>
      
      <div class="mt-auto border-t border-admin-outline-variant/20 pt-4">
        <button 
          @click="handleLogout" 
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-admin-on-surface-variant hover:text-red-600 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
        >
          <Icon name="lucide:log-out" class="w-5 h-5" />
          <span class="text-sm font-medium">Sair</span>
        </button>
      </div>
    </aside>

    <!-- Sidebar Mobile Drawer Overlay -->
    <div 
      v-if="isMobileMenuOpen" 
      @click="toggleMobileMenu" 
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
    ></div>

    <!-- Sidebar Mobile Drawer -->
    <aside 
      class="fixed inset-y-0 left-0 w-[280px] bg-admin-surface-container-lowest py-6 px-4 z-50 flex flex-col border-r border-admin-outline-variant/30 transform transition-transform duration-300 md:hidden"
      :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center justify-between mb-8 px-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-admin-primary-container flex items-center justify-center shrink-0">
            <Icon name="lucide:shield" class="text-white w-6 h-6" />
          </div>
          <div>
            <h1 class="text-lg font-bold text-admin-primary leading-tight">AD Telas</h1>
            <p class="text-xs text-admin-on-surface-variant font-semibold">Painel Admin</p>
          </div>
        </div>
        <button @click="toggleMobileMenu" class="p-1 rounded-full hover:bg-admin-surface-container-low text-admin-on-surface-variant">
          <Icon name="lucide:x" class="w-6 h-6" />
        </button>
      </div>

      <nav class="flex flex-col gap-2 flex-1">
        <NuxtLink 
          to="/admin/dashboard" 
          @click="isMobileMenuOpen = false"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
          :class="route.path === '/admin/dashboard' ? 'bg-admin-primary/5 text-admin-primary font-bold' : 'text-admin-on-surface-variant'"
        >
          <Icon name="lucide:layout-dashboard" class="w-5 h-5" />
          <span class="text-sm font-medium">Dashboard</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/admin/leads" 
          @click="isMobileMenuOpen = false"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
          :class="route.path === '/admin/leads' ? 'bg-admin-primary/5 text-admin-primary font-bold' : 'text-admin-on-surface-variant'"
        >
          <Icon name="lucide:users" class="w-5 h-5" />
          <span class="text-sm font-medium">Leads</span>
        </NuxtLink>
      </nav>
      
      <div class="mt-auto border-t border-admin-outline-variant/20 pt-4">
        <button 
          @click="handleLogout" 
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-admin-on-surface-variant hover:text-red-600 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
        >
          <Icon name="lucide:log-out" class="w-5 h-5" />
          <span class="text-sm font-medium">Sair</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 md:ml-[280px] flex flex-col min-h-screen">
      <!-- TopNavBar -->
      <header class="flex justify-between items-center h-16 px-6 bg-admin-surface/80 backdrop-blur-md sticky top-0 z-30 border-b border-admin-outline-variant/30 shadow-sm">
        <div class="flex items-center gap-4">
          <button @click="toggleMobileMenu" class="md:hidden text-admin-primary p-2 rounded-full hover:bg-admin-surface-container-high transition-colors active:scale-95 flex items-center">
            <Icon name="lucide:menu" class="w-6 h-6" />
          </button>
          <div class="text-sm text-admin-on-surface-variant hidden sm:block">
            Administração <span class="mx-2 text-admin-outline-variant">/</span> <span class="text-admin-primary font-medium">{{ route.path === '/admin/dashboard' ? 'Dashboard' : 'Leads' }}</span>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <button class="p-2 rounded-full text-admin-primary hover:bg-admin-surface-container-high transition-colors relative flex items-center">
            <Icon name="lucide:bell" class="w-5 h-5" />
            <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
          </button>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-admin-primary flex items-center justify-center text-white text-sm font-bold">
              A
            </div>
            <span class="text-sm font-medium text-admin-on-surface hidden sm:block">Admin</span>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 bg-admin-surface">
        <slot />
      </main>
    </div>
  </div>
</template>
