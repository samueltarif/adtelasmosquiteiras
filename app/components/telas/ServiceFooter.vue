<script setup lang="ts">
import type { TelasService } from '~/data/telas/types'
defineProps<{ service: TelasService }>()
</script>
<template>
  <footer class="td-footer" data-cta-location="footer"><div class="td-wrap td-footer-top"><NuxtLink to="/" class="td-logo"><img src="/images/logo-adt-lp.png" width="112" height="56" alt="AD Telas e Redes — início" /><span>AD TELAS E REDES<small>TELAS MOSQUITEIRAS</small></span></NuxtLink><p>Qualidade e conforto para seu ambiente.<br />Atendemos São Paulo e região.</p><a :href="service.whatsappUrl" class="td-button td-gold" target="_blank" rel="noopener noreferrer"><WhatsappIcon /> Orçamento no WhatsApp</a></div><div class="td-wrap td-footer-bottom"><span>© {{ new Date().getFullYear() }} AD Telas e Redes.</span><NuxtLink to="/servicos/telas">Telas mosquiteiras</NuxtLink><NuxtLink to="/politica-de-privacidade">Política de Privacidade</NuxtLink><a href="tel:+5511983586611">(11) 98358-6611</a></div></footer>
</template>
