<script setup lang="ts">
import { ref } from 'vue'
import type { TelasService } from '~/data/telas/types'
defineProps<{ service: TelasService }>()
const menuOpen = ref(false)
</script>
<template>
  <header class="td-header" data-cta-location="header"><div class="td-wrap td-header-inner">
    <NuxtLink to="/" class="td-logo" aria-label="AD Telas e Redes — início"><img src="/images/logo-adt-lp.png" width="112" height="56" alt="AD Telas e Redes" /><span>AD TELAS E REDES<small>TELAS MOSQUITEIRAS</small></span></NuxtLink>
    <nav class="td-desktop-nav" aria-label="Navegação da página"><NuxtLink to="/servicos/telas">Serviços</NuxtLink><a href="#projetos">Fotos</a><a href="#modelos">Modelos</a><a href="#depoimentos">Depoimentos</a><a href="#orcamento-servico">Contato</a></nav>
    <button class="td-menu-toggle" :aria-expanded="menuOpen" aria-controls="td-mobile-nav" aria-label="Abrir navegação" @click="menuOpen = !menuOpen"><Icon :name="menuOpen ? 'lucide:x' : 'lucide:menu'" /></button>
  </div><nav v-if="menuOpen" id="td-mobile-nav" aria-label="Navegação mobile" @click="menuOpen = false"><NuxtLink to="/servicos/telas">Todos os serviços de telas</NuxtLink><a href="#projetos">Fotos</a><a href="#modelos">Modelos</a><a href="#depoimentos">Depoimentos</a><a href="#orcamento-servico">Orçamento</a></nav></header>
</template>
