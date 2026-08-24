import { ref } from 'vue'
import { useAnalyticsIdentity } from './useAnalyticsIdentity'
import { useAttribution } from './useAttribution'

let activeSubmissionId = null

/**
 * Composable reutilizável para submit de formulários comerciais
 * Envia lead via API /api/send-lead com idempotência, atribuição e telemetria completa.
 */
export function useFormSubmit() {
  const isSubmitting = ref(false)
  const identity = useAnalyticsIdentity()
  const attribution = useAttribution()

  // Função de conversão Google Ads & GTM
  const reportConversion = () => {
    if (typeof window !== 'undefined') {
      if (window.gtag) {
        window.gtag('event', 'conversion', {
          'send_to': 'AW-17981093809/4GwPCPCPWSjoccELHvhv5C'
        })
      }
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'form_submission',
        event_category: 'lead',
        event_label: 'formulario_contato'
      })
    }
  }

  const redirectToThankYou = async (fields) => {
    // Evita submissões simultâneas duplicadas client-side
    if (isSubmitting.value) return
    isSubmitting.value = true

    try {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
      const visitorId = identity.getOrCreateVisitorId()
      const { sessionId } = identity.getOrCreateSessionId(currentPath)
      const landingPath = identity.getSessionLandingPath(currentPath)
      const attr = attribution.getOrInitAttribution()
      const ftContext = identity.getFirstTouchContext()

      // Reutiliza o mesmo submission_id em caso de retries da mesma tentativa de submissão
      if (!activeSubmissionId) {
        activeSubmissionId = identity.generateUUID()
      }

      const payload = {
        submission_id: activeSubmissionId,
        visitor_id: visitorId,
        session_id: sessionId,
        landing_path: landingPath,
        conversion_path: currentPath,
        session_channel: attr.channel,
        referrer: attr.referrer,
        utm_source: attr.utm_source,
        utm_medium: attr.utm_medium,
        utm_campaign: attr.utm_campaign,
        utm_content: attr.utm_content,
        utm_term: attr.utm_term,
        gclid: attr.gclid,
        gbraid: attr.gbraid,
        wbraid: attr.wbraid,
        fbclid: attr.fbclid,
        msclkid: attr.msclkid,

        // Contexto First Touch Completo
        first_touch_channel: ftContext.first_touch_channel || attr.channel,
        first_touch_landing_path: ftContext.first_touch_landing_path || landingPath,
        first_touch_referrer: ftContext.first_touch_referrer || attr.referrer,
        first_touch_utm_source: ftContext.first_touch_utm_source || attr.utm_source,
        first_touch_utm_medium: ftContext.first_touch_utm_medium || attr.utm_medium,
        first_touch_utm_campaign: ftContext.first_touch_utm_campaign || attr.utm_campaign,
        first_touch_utm_content: ftContext.first_touch_utm_content || attr.utm_content,
        first_touch_utm_term: ftContext.first_touch_utm_term || attr.utm_term,
        first_touch_gclid: ftContext.first_touch_gclid || attr.gclid,
        first_touch_gbraid: ftContext.first_touch_gbraid || attr.gbraid,
        first_touch_wbraid: ftContext.first_touch_wbraid || attr.wbraid,
        first_touch_fbclid: ftContext.first_touch_fbclid || attr.fbclid,
        first_touch_msclkid: ftContext.first_touch_msclkid || attr.msclkid,

        nome: fields?.nome || '',
        cidade: fields?.cidade || fields?.bairro || 'São Paulo',
        bairro: fields?.bairro || '',
        servico: fields?.servico || fields?.tipoServico || 'Não especificado',
        telefone: fields?.telefone || fields?.celular || '',
        email: fields?.email || '',
        mensagem: fields?.mensagem || '',
        origem: fields?.origem || ('formulario_' + currentPath)
      }

      console.log('[useFormSubmit] Disparando POST /api/send-lead com payload e atribuição completa:', payload)

      const response = await $fetch('/api/send-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      })

      console.log('[useFormSubmit] Resposta de /api/send-lead:', response)

      // Registrar conversão
      reportConversion()

      // Reset do submissionId após sucesso
      activeSubmissionId = null

      // Redirecionar para página de obrigado
      await navigateTo('/obrigado')
    } catch (e) {
      console.error('[useFormSubmit] Erro ao enviar formulário:', e)
      throw e
    } finally {
      isSubmitting.value = false
    }
  }

  return { isSubmitting, redirectToThankYou }
}
