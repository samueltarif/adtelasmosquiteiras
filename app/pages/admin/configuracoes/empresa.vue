<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CompanyLogoUploader from '~/components/admin/company/CompanyLogoUploader.vue'
import CompanyDocumentPreview from '~/components/admin/company/CompanyDocumentPreview.vue'

definePageMeta({
  layout: 'admin'
})

const profile = ref<any>({
  trade_name: 'AD Telas e Redes de Proteção',
  legal_name: '',
  cnpj: '',
  phone_display: '',
  whatsapp_number: '',
  email_contact: '',
  website: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: 'São Paulo',
  state: 'SP',
  business_hours: '',
  warranty_support_hours: '',
  document_footer_text: '',
  logo_source: 'static',
  logo_url: '/images/logo_adt_telas_nova.png'
})

const isLoading = ref(true)
const isSaving = ref(false)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

async function fetchCompanyProfile() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<any>('/api/admin/configuracoes/empresa')
    if (res?.success && res.profile) {
      profile.value = {
        ...profile.value,
        ...res.profile
      }
    }
  } catch {
    console.error('[CompanySettings] Erro ao carregar perfil')
    errorMessage.value = 'Erro ao carregar dados da empresa.'
  } finally {
    isLoading.value = false
  }
}

async function handleSaveProfile() {
  if (!profile.value.trade_name?.trim() || profile.value.trade_name.trim().length < 2) {
    errorMessage.value = 'O nome fantasia da empresa deve ter pelo menos 2 caracteres.'
    return
  }

  isSaving.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const res = await $fetch<any>('/api/admin/configuracoes/empresa', {
      method: 'PATCH',
      body: {
        trade_name: profile.value.trade_name?.trim(),
        legal_name: profile.value.legal_name?.trim() || null,
        cnpj: profile.value.cnpj?.trim() || null,
        phone_display: profile.value.phone_display?.trim() || null,
        whatsapp_number: profile.value.whatsapp_number?.trim() || null,
        email_contact: profile.value.email_contact?.trim() || null,
        website: profile.value.website?.trim() || null,
        cep: profile.value.cep?.trim() || null,
        street: profile.value.street?.trim() || null,
        number: profile.value.number?.trim() || null,
        complement: profile.value.complement?.trim() || null,
        neighborhood: profile.value.neighborhood?.trim() || null,
        city: profile.value.city?.trim() || 'São Paulo',
        state: profile.value.state?.trim()?.toUpperCase() || 'SP',
        business_hours: profile.value.business_hours?.trim() || null,
        warranty_support_hours: profile.value.warranty_support_hours?.trim() || null,
        document_footer_text: profile.value.document_footer_text?.trim() || null
      }
    })

    if (res?.success) {
      successMessage.value = 'Dados da empresa atualizados com sucesso!'
      setTimeout(() => {
        successMessage.value = null
      }, 4000)
    }
  } catch (err: any) {
    console.error('[CompanySettings] Erro ao salvar')
    errorMessage.value = err?.data?.message || err?.message || 'Erro ao salvar alterações.'
  } finally {
    isSaving.value = false
  }
}

function handleLogoUpdated(newLogoUrl: string) {
  profile.value.logo_url = newLogoUrl
  fetchCompanyProfile()
}

onMounted(() => {
  fetchCompanyProfile()
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Icon name="lucide:building-2" class="w-6 h-6 text-indigo-400" />
          <span>Perfil da Empresa</span>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Dados institucionais, logotipo e informações aplicadas em cabeçalhos de orçamentos e recibos
        </p>
      </div>

      <button
        type="button"
        :disabled="isSaving || isLoading"
        @click="handleSaveProfile"
        class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer shrink-0"
      >
        <Icon v-if="isSaving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
        <Icon v-else name="lucide:save" class="w-4 h-4" />
        <span>{{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}</span>
      </button>
    </div>

    <!-- Mensagens de Sucesso / Erro -->
    <div v-if="successMessage" class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
      <Icon name="lucide:check-circle" class="w-5 h-5 shrink-0" />
      <span>{{ successMessage }}</span>
    </div>

    <div v-if="errorMessage" class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs sm:text-sm flex items-center gap-2">
      <Icon name="lucide:alert-circle" class="w-5 h-5 shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-16 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
      <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-indigo-400" />
      <span>Carregando dados da empresa...</span>
    </div>

    <div v-else class="space-y-6">
      <!-- 1. Gestão de Logotipo -->
      <CompanyLogoUploader
        :logo-url="profile.logo_url"
        :logo-source="profile.logo_source"
        @updated="handleLogoUpdated"
      />

      <!-- 2. Formulário de Informações Corporativas -->
      <form @submit.prevent="handleSaveProfile" class="space-y-6">
        <!-- Identificação -->
        <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
          <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Icon name="lucide:file-badge" class="w-4 h-4 text-indigo-400" />
            <span>Identificação Institucional</span>
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                Nome Comercial / Fantasia <span class="text-red-400">*</span>
              </label>
              <input
                v-model="profile.trade_name"
                type="text"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                CNPJ
              </label>
              <input
                v-model="profile.cnpj"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
                placeholder="00.000.000/0001-00"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Razão Social Completa
            </label>
            <input
              v-model="profile.legal_name"
              type="text"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              placeholder="Razão Social Registrada"
            />
          </div>
        </div>

        <!-- Contato & Canais -->
        <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
          <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Icon name="lucide:phone" class="w-4 h-4 text-indigo-400" />
            <span>Canais de Atendimento</span>
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                Telefone de Exibição
              </label>
              <input
                v-model="profile.phone_display"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
                placeholder="(11) 98358-6611"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                Número WhatsApp (com DDD)
              </label>
              <input
                v-model="profile.whatsapp_number"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
                placeholder="5511983586611"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail Institucional de Contato
              </label>
              <input
                v-model="profile.email_contact"
                type="email"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
                placeholder="contato@adtelasmosquiteiras.com.br"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                Website Oficial
              </label>
              <input
                v-model="profile.website"
                type="url"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
                placeholder="https://adtelasmosquiteiras.com.br"
              />
            </div>
          </div>
        </div>

        <!-- Endereço Operacional / Base -->
        <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
          <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Icon name="lucide:map-pin" class="w-4 h-4 text-indigo-400" />
            <span>Endereço da Base / Escritório</span>
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">CEP</label>
              <input
                v-model="profile.cep"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
                placeholder="00000-000"
              />
            </div>

            <div class="sm:col-span-3">
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Logradouro / Rua</label>
              <input
                v-model="profile.street"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Número</label>
              <input
                v-model="profile.number"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Complemento</label>
              <input
                v-model="profile.complement"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Bairro</label>
              <input
                v-model="profile.neighborhood"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
              />
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Cidade</label>
                <input
                  v-model="profile.city"
                  type="text"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm min-h-[44px]"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">UF</label>
                <input
                  v-model="profile.state"
                  type="text"
                  maxlength="2"
                  class="w-full px-2 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm uppercase font-bold text-center min-h-[44px]"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Horários & Rodapé -->
        <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
          <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Icon name="lucide:clock" class="w-4 h-4 text-indigo-400" />
            <span>Horários & Rodapé de Documentos</span>
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                Horário de Atendimento Comercial
              </label>
              <input
                v-model="profile.business_hours"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm min-h-[44px]"
                placeholder="Seg a Sex 08h às 18h | Sáb 08h às 13h"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                Suporte / Garantia
              </label>
              <input
                v-model="profile.warranty_support_hours"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm min-h-[44px]"
                placeholder="Seg a Sex 09h às 17h"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Texto Padrão de Rodapé dos Documentos (Orçamentos / Recibos)
            </label>
            <textarea
              v-model="profile.document_footer_text"
              rows="2"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="Ex: AD Telas e Redes — Especialista em proteção para sua família."
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            :disabled="isSaving"
            class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Icon v-if="isSaving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <Icon v-else name="lucide:save" class="w-4 h-4" />
            <span>{{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}</span>
          </button>
        </div>
      </form>

      <!-- 3. Live Preview do Cabeçalho de Documentos -->
      <CompanyDocumentPreview
        :profile="profile"
      />
    </div>
  </div>
</template>
