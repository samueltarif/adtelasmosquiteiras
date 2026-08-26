<script setup lang="ts">
defineProps<{
  profile: {
    trade_name?: string | null
    legal_name?: string | null
    cnpj?: string | null
    phone_display?: string | null
    whatsapp_number?: string | null
    email_contact?: string | null
    website?: string | null
    street?: string | null
    number?: string | null
    complement?: string | null
    neighborhood?: string | null
    city?: string | null
    state?: string | null
    cep?: string | null
    business_hours?: string | null
    document_footer_text?: string | null
    logo_url?: string | null
  }
}>()
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-sm space-y-3">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-bold text-white uppercase tracking-wider">Prévia do Cabeçalho em Documentos</h3>
        <p class="text-xs text-slate-400">Simulação visual de como os dados da empresa aparecerão nos orçamentos e relatórios</p>
      </div>

      <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
        Live Preview
      </span>
    </div>

    <!-- Container em estilo folha de papel / cabeçalho formal -->
    <div class="rounded-xl border border-slate-300/20 bg-white text-slate-900 p-6 shadow-md select-none">
      <div class="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <!-- Logo -->
        <div class="w-40 h-16 flex items-center justify-center sm:justify-start shrink-0">
          <img 
            :src="profile.logo_url || '/images/logo_adt_telas_nova.png'" 
            alt="Logo Preview" 
            class="max-w-full max-h-full object-contain"
          />
        </div>

        <!-- Dados da Empresa -->
        <div class="text-center sm:text-right text-xs leading-relaxed space-y-0.5">
          <h4 class="font-bold text-slate-950 text-sm">
            {{ profile.trade_name || 'AD Telas e Redes de Proteção' }}
          </h4>
          <p v-if="profile.legal_name" class="text-slate-600 font-medium">
            {{ profile.legal_name }}
          </p>
          <p v-if="profile.cnpj" class="text-slate-600 font-mono">
            CNPJ: {{ profile.cnpj }}
          </p>
          <p class="text-slate-600">
            <span v-if="profile.street">{{ profile.street }}, {{ profile.number || 'S/N' }}</span>
            <span v-if="profile.complement"> - {{ profile.complement }}</span>
            <span v-if="profile.neighborhood">, {{ profile.neighborhood }}</span>
          </p>
          <p class="text-slate-600">
            {{ profile.city || 'São Paulo' }} - {{ profile.state || 'SP' }}
            <span v-if="profile.cep"> | CEP: {{ profile.cep }}</span>
          </p>
          <p class="text-slate-700 font-semibold pt-1">
            <span v-if="profile.phone_display">Tel: {{ profile.phone_display }}</span>
            <span v-if="profile.email_contact"> | {{ profile.email_contact }}</span>
            <span v-if="profile.website"> | {{ profile.website }}</span>
          </p>
        </div>
      </div>

      <!-- Rodapé Simulado -->
      <div v-if="profile.document_footer_text" class="pt-3 text-[10px] text-slate-500 text-center italic">
        {{ profile.document_footer_text }}
      </div>
    </div>
  </div>
</template>
