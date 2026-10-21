<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAttribution } from '~/composables/useAttribution'
import { useAnalyticsIdentity } from '~/composables/useAnalyticsIdentity'
import { useFunnelTracking } from '~/composables/useFunnelTracking'
import LeadNeedStep from './steps/LeadNeedStep.vue'
import LeadQuantityStep from './steps/LeadQuantityStep.vue'
import LeadLocationStep from './steps/LeadLocationStep.vue'
import LeadTimelineStep from './steps/LeadTimelineStep.vue'
import LeadContactStep from './steps/LeadContactStep.vue'
import LeadSuccessStep from './steps/LeadSuccessStep.vue'

const props = withDefaults(defineProps<{
  initialNeed?: string | null
  ctaLocation?: string
}>(), {
  initialNeed: null,
  ctaLocation: 'lp_funnel'
})

const route = useRoute()
const attribution = useAttribution()
const identity = useAnalyticsIdentity()
const { trackFunnelEvent } = useFunnelTracking()

const currentStep = ref(1)
const isSubmitting = ref(false)
const submitError = ref('')
const createdLeadId = ref<string | null>(null)

const form = reactive({
  need_type: props.initialNeed,
  quantity_range: '1-2',
  property_type: 'apartamento',
  postal_code: '',
  cidade: 'São Paulo',
  bairro: '',
  installation_timeline: 'asap',
  nome: '',
  telefone: '',
  email: '',
  has_photos: false
})

const progressPercent = computed(() => {
  if (currentStep.value > 5) return 100
  return Math.round(((currentStep.value - 1) / 5) * 100)
})

function goToStep(step: number) {
  currentStep.value = step
}

function onStep1Next() {
  trackFunnelEvent('funnel_start', {
    step: 1,
    step_name: 'need_type',
    need_type: form.need_type,
    cta_location: props.ctaLocation
  })
  trackFunnelEvent('funnel_step_complete', {
    step: 1,
    step_name: 'need_type',
    need_type: form.need_type
  })
  currentStep.value = 2
}

function onStep2Next() {
  trackFunnelEvent('funnel_step_complete', {
    step: 2,
    step_name: 'quantity_and_property',
    quantity_range: form.quantity_range,
    property_type: form.property_type
  })
  currentStep.value = 3
}

function onStep3Next() {
  trackFunnelEvent('funnel_step_complete', {
    step: 3,
    step_name: 'location'
  })
  currentStep.value = 4
}

function onStep4Next() {
  trackFunnelEvent('funnel_step_complete', {
    step: 4,
    step_name: 'timeline',
    installation_timeline: form.installation_timeline
  })
  currentStep.value = 5
}

async function onSubmitForm() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  submitError.value = ''

  const cleanNome = (form.nome || '').trim()
  const cleanPhone = (form.telefone || '').replace(/\D/g, '')

  if (cleanNome.length < 2 || (cleanPhone.length !== 10 && cleanPhone.length !== 11)) {
    submitError.value = 'Por favor, informe seu nome e um WhatsApp válido com DDD.'
    isSubmitting.value = false
    return
  }

  trackFunnelEvent('funnel_submit_attempt', {
    need_type: form.need_type,
    quantity_range: form.quantity_range,
    property_type: form.property_type,
    installation_timeline: form.installation_timeline,
    has_photos: form.has_photos
  })

  try {
    const currentPath = route.path || '/lp/orcamento-telas-mosquiteiras'
    const visitorId = identity.getOrCreateVisitorId()
    const { sessionId } = identity.getOrCreateSessionId(currentPath)
    const landingPath = identity.getSessionLandingPath(currentPath)
    const attr = attribution.getOrInitAttribution()
    const savedFt = identity.getFirstTouchContext()

    const ftSnapshot = savedFt || {
      first_touch_channel: attr.channel || 'direct',
      first_touch_landing_path: landingPath || null,
      first_touch_referrer: attr.referrer || null,
      first_touch_utm_source: attr.utm_source || null,
      first_touch_utm_medium: attr.utm_medium || null,
      first_touch_utm_campaign: attr.utm_campaign || null,
      first_touch_utm_content: attr.utm_content || null,
      first_touch_utm_term: attr.utm_term || null,
      first_touch_gclid: attr.gclid || null,
      first_touch_fbclid: attr.fbclid || null
    }

    if (!savedFt) {
      identity.setFirstTouchContextOnce(ftSnapshot)
    }

    const submissionId = identity.generateUUID()

    // Formatar resumo detalhado do lead para o campo 'mensagem' e 'servico'
    const needLabelMap: Record<string, string> = {
      window: 'Janelas',
      door: 'Portas',
      balcony: 'Sacadas / Varandas',
      multiple: 'Vários Locais'
    }

    const timelineLabelMap: Record<string, string> = {
      asap: 'O mais rápido possível (Urgente)',
      '30_days': 'Nos próximos 30 dias',
      '90_days': 'Nos próximos 3 meses',
      researching: 'Apenas pesquisando'
    }

    const needLabel = needLabelMap[form.need_type || ''] || 'Telas Mosquiteiras'
    const timelineLabel = timelineLabelMap[form.installation_timeline || ''] || form.installation_timeline

    const payload = {
      submission_id: submissionId,
      visitor_id: visitorId,
      session_id: sessionId,
      landing_path: currentPath,
      conversion_path: currentPath,
      channel: attr.channel || 'direct',
      session_channel: attr.channel || 'direct',
      referrer: attr.referrer || null,
      utm_source: attr.utm_source || null,
      utm_medium: attr.utm_medium || null,
      utm_campaign: attr.utm_campaign || null,
      utm_content: attr.utm_content || null,
      utm_term: attr.utm_term || null,
      gclid: attr.gclid || null,
      gbraid: attr.gbraid || null,
      wbraid: attr.wbraid || null,
      fbclid: attr.fbclid || null,
      msclkid: attr.msclkid || null,
      ttclid: attr.ttclid || null,
      google_campaign_id: attr.campaign_id || null,
      google_adgroup_id: attr.adgroup_id || null,

      // Dados de Contato e Local
      nome: cleanNome,
      telefone: cleanPhone,
      email: (form.email || '').trim() || null,
      cidade: form.cidade || 'São Paulo',
      bairro: form.bairro || null,
      postal_code: form.postal_code || null,
      servico: `Telas Mosquiteiras — ${needLabel}`,
      origem: 'funil_orcamento_lp',

      // Campos Estruturados do Funil
      need_type: form.need_type,
      quantity_range: form.quantity_range,
      property_type: form.property_type,
      installation_timeline: form.installation_timeline,
      has_photos: form.has_photos,
      pipeline_stage: 'NOVO',

      // Mensagem estruturada para compatibilidade legada no painel
      mensagem: [
        `Local: ${needLabel}`,
        `Quantidade: ${form.quantity_range}`,
        `Tipo do Imóvel: ${form.property_type}`,
        `Prazo: ${timelineLabel}`,
        `CEP: ${form.postal_code || 'Não informado'} (${form.bairro || 'Bairro a confirmar'}, ${form.cidade || 'SP'})`,
        `Possui fotos: ${form.has_photos ? 'Sim' : 'Não'}`
      ].join('\n')
    }

    const response = await $fetch<{ success?: boolean; leadId?: string }>('/api/send-lead', {
      method: 'POST',
      body: payload
    })

    if (response?.success) {
      createdLeadId.value = response.leadId || null
      trackFunnelEvent('lead_submit_success', {
        need_type: form.need_type,
        quantity_range: form.quantity_range,
        property_type: form.property_type,
        installation_timeline: form.installation_timeline,
        has_photos: form.has_photos
      })
      currentStep.value = 6
    } else {
      throw new Error('Falha ao processar orçamento')
    }
  } catch (err: any) {
    submitError.value = 'Não foi possível enviar seu pedido. Seus dados estão salvos aqui; tente novamente.'
    trackFunnelEvent('lead_submit_error', {
      error_message: err?.message || 'submission_failed'
    })
  } finally {
    isSubmitting.value = false
  }
}

function onWhatsAppAfterLeadClick() {
  trackFunnelEvent('whatsapp_after_lead_click', {
    has_photos: form.has_photos,
    need_type: form.need_type
  })
}

onMounted(() => {
  trackFunnelEvent('funnel_view', {
    cta_location: props.ctaLocation
  })
})
</script>

<template>
  <div id="formulario-orcamento" class="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 sm:p-8 max-w-xl mx-auto transition-all">
    <!-- Barra de Progresso Superior (Visível até o passo 5) -->
    <div v-if="currentStep <= 5" class="mb-6">
      <div class="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
        <span>Etapa {{ currentStep }} de 5</span>
        <span class="text-[#22345F] font-bold">{{ progressPercent }}% concluído</span>
      </div>
      <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-[#F49A1A] to-amber-500 rounded-full transition-all duration-300 ease-out"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <!-- Etapas -->
    <div class="min-h-[280px]">
      <LeadNeedStep
        v-if="currentStep === 1"
        v-model="form.need_type"
        @next="onStep1Next"
      />

      <LeadQuantityStep
        v-else-if="currentStep === 2"
        v-model:quantity="form.quantity_range"
        v-model:property-type="form.property_type"
        @next="onStep2Next"
        @back="goToStep(1)"
      />

      <LeadLocationStep
        v-else-if="currentStep === 3"
        v-model:postal-code="form.postal_code"
        v-model:cidade="form.cidade"
        v-model:bairro="form.bairro"
        @next="onStep3Next"
        @back="goToStep(2)"
      />

      <LeadTimelineStep
        v-else-if="currentStep === 4"
        v-model:timeline="form.installation_timeline"
        @next="onStep4Next"
        @back="goToStep(3)"
      />

      <LeadContactStep
        v-else-if="currentStep === 5"
        v-model:nome="form.nome"
        v-model:telefone="form.telefone"
        v-model:email="form.email"
        v-model:has-photos="form.has_photos"
        :is-submitting="isSubmitting"
        :error-message="submitError"
        @submit="onSubmitForm"
        @back="goToStep(4)"
      />

      <LeadSuccessStep
        v-else-if="currentStep === 6"
        :lead-id="createdLeadId"
        :nome="form.nome"
        :telefone="form.telefone"
        :has-photos="form.has_photos"
        :need-type="form.need_type"
        @whatsapp-click="onWhatsAppAfterLeadClick"
      />
    </div>
  </div>
</template>
