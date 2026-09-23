<script setup lang="ts">
import { useId } from 'vue'
defineProps<{ kind: 'pivotante' | 'porta-dupla' }>()
const patternId = useId()
const patternId2 = useId()
</script>
<template>
  <div class="td-model-diagram">
    <!-- Janela Pivotante -->
    <svg v-if="kind === 'pivotante'" viewBox="0 0 420 240" role="img" aria-label="Esquema ilustrativo de janela pivotante">
      <defs>
        <pattern :id="patternId" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 0H6M0 0V6" fill="none" stroke="#7da3c0" stroke-width="0.6"/>
        </pattern>
      </defs>
      <!-- Fundo -->
      <rect x="0" y="0" width="420" height="240" fill="#edf3fa"/>
      <!-- Parede / moldura externa -->
      <rect x="80" y="18" width="260" height="185" rx="3" fill="#c8d8e8" stroke="#9cb6cc" stroke-width="1.5"/>
      <!-- Interior da folha aberta (trapezoide inclinado à direita para indicar pivô) -->
      <!-- Folha em posição semi-aberta -->
      <polygon points="210,28 320,52 320,170 210,192" :fill="`url(#${patternId})`" stroke="#234b73" stroke-width="3"/>
      <!-- Folha espelhada esquerda (fechada, mais transparente) -->
      <polygon points="210,28 100,52 100,170 210,192" fill="#d8e9f5" stroke="#234b73" stroke-width="3" opacity="0.45"/>
      <!-- Eixo de pivotamento (traço vertical central) -->
      <line x1="210" y1="18" x2="210" y2="205" stroke="#956d00" stroke-width="2.5" stroke-dasharray="7 4"/>
      <!-- Arco de abertura esquerdo -->
      <path d="M130 110 A80 80 0 0 1 210 30" fill="none" stroke="#956d00" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/>
      <!-- Arco de abertura direito -->
      <path d="M290 110 A80 80 0 0 0 210 30" fill="none" stroke="#956d00" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/>
      <!-- Seta de giro (esquerda) -->
      <path d="M134 108 L130 110 L135 114" fill="none" stroke="#956d00" stroke-width="1.8"/>
      <!-- Seta de giro (direita) -->
      <path d="M286 108 L290 110 L285 114" fill="none" stroke="#956d00" stroke-width="1.8"/>
      <!-- Ponto de pivô central -->
      <circle cx="210" cy="110" r="5" fill="#956d00" stroke="white" stroke-width="1.5"/>
      <!-- Rótulo eixo -->
      <text x="218" y="106" fill="#956d00" font-size="9" font-family="sans-serif" font-weight="bold">EIXO</text>
      <!-- Rodapé da moldura -->
      <rect x="80" y="195" width="260" height="10" rx="2" fill="#b0c8dc" stroke="#9cb6cc" stroke-width="1"/>
      <!-- Topo da moldura -->
      <rect x="80" y="10" width="260" height="10" rx="2" fill="#b0c8dc" stroke="#9cb6cc" stroke-width="1"/>
      <!-- Legenda -->
      <text x="210" y="228" text-anchor="middle" fill="#506176" font-size="10" font-family="sans-serif">ESQUEMA ILUSTRATIVO · JANELA PIVOTANTE · SOB MEDIDA</text>
    </svg>

    <!-- Porta Dupla -->
    <svg v-else viewBox="0 0 420 240" role="img" aria-label="Esquema ilustrativo de porta dupla com duas folhas">
      <defs>
        <pattern :id="patternId2" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 0H6M0 0V6" fill="none" stroke="#7da3c0" stroke-width="0.6"/>
        </pattern>
      </defs>
      <!-- Fundo -->
      <rect x="0" y="0" width="420" height="240" fill="#edf3fa"/>
      <!-- Parede / moldura -->
      <rect x="75" y="14" width="270" height="198" rx="3" fill="#c8d8e8" stroke="#9cb6cc" stroke-width="1.5"/>
      <!-- Trilho superior -->
      <rect x="82" y="20" width="256" height="8" rx="2" fill="#a0bcd0" stroke="#7da3c0" stroke-width="1"/>
      <!-- Trilho inferior -->
      <rect x="82" y="198" width="256" height="8" rx="2" fill="#a0bcd0" stroke="#7da3c0" stroke-width="1"/>
      <!-- Folha esquerda -->
      <rect x="82" y="28" width="121" height="170" :fill="`url(#${patternId2})`" stroke="#234b73" stroke-width="3"/>
      <!-- Folha direita -->
      <rect x="217" y="28" width="121" height="170" :fill="`url(#${patternId2})`" stroke="#234b73" stroke-width="3"/>
      <!-- Divisória central -->
      <line x1="210" y1="28" x2="210" y2="198" stroke="#234b73" stroke-width="2" stroke-dasharray="4 3" opacity="0.5"/>
      <!-- Puxador esquerdo (lado direito da folha esquerda) -->
      <rect x="195" y="103" width="6" height="20" rx="3" fill="#956d00"/>
      <!-- Puxador direito (lado esquerdo da folha direita) -->
      <rect x="219" y="103" width="6" height="20" rx="3" fill="#956d00"/>
      <!-- Setas de abertura -->
      <path d="M188 113 L176 113 L180 109 M176 113 L180 117" fill="none" stroke="#956d00" stroke-width="1.8"/>
      <path d="M232 113 L244 113 L240 109 M244 113 L240 117" fill="none" stroke="#956d00" stroke-width="1.8"/>
      <!-- Rótulos folhas -->
      <text x="143" y="116" text-anchor="middle" fill="#506176" font-size="9" font-family="sans-serif">FOLHA A</text>
      <text x="277" y="116" text-anchor="middle" fill="#506176" font-size="9" font-family="sans-serif">FOLHA B</text>
      <!-- Legenda -->
      <text x="210" y="228" text-anchor="middle" fill="#506176" font-size="10" font-family="sans-serif">ESQUEMA ILUSTRATIVO · PORTA DUPLA · SOB MEDIDA</text>
    </svg>
  </div>
</template>
