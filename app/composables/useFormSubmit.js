import { ref } from 'vue'
import { useAnalyticsIdentity } from './useAnalyticsIdentity'
import { useAttribution } from './useAttribution'

let activeSubmissionId = null

/**
 * Composable reutilizável para submit de formulários comerciais
 * Envia lead via API /api/send-lead com idempotência, atribuição,
 * e aciona upload direto assíncrono de mídias para o Cloudflare R2.
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

  /**
   * Envia o lead comercial e orquestra o upload direto de mídias vinculadas.
   *
   * @param {Object} fields Dados do formulário
   * @param {Object} mediaUploaderRef Referência opcional ao componente MediaUploader
   */
  const redirectToThankYou = async (fields, mediaUploaderRef = null) => {
    if (isSubmitting.value) return
    isSubmitting.value = true

    const t_submitStart = performance.now()

    try {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
      const visitorId = identity.getOrCreateVisitorId()
      const { sessionId } = identity.getOrCreateSessionId(currentPath)
      const landingPath = identity.getSessionLandingPath(currentPath)
      const attr = attribution.getOrInitAttribution()
      const ftContext = identity.getFirstTouchContext()

      // Reutiliza o mesmo submission_id em caso de retries
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

      // Adiciona contagem não-sensível das mídias selecionadas para o template de e-mail
      if (mediaUploaderRef?.value) {
        const uploader = mediaUploaderRef.value
        const items = uploader.mediaItems || []
        const pCount = typeof uploader.photoCount === 'number' ? uploader.photoCount : (uploader.photoCount?.value ?? items.filter(m => m.type === 'photo').length)
        const vCount = typeof uploader.videoCount === 'number' ? uploader.videoCount : (uploader.videoCount?.value ?? items.filter(m => m.type === 'video').length)
        
        if (pCount > 0 || vCount > 0) {
          payload.media_selection_summary = {
            photoCount: Number(pCount) || 0,
            videoCount: Number(vCount) || 0
          }
        }
      }

      // 1. Salvar Lead e disparar E-mail DATA-ONLY (LEAD_CREATION_ORDER = FIRST)
      const response = await $fetch('/api/send-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      })

      const t_sendLeadResponse = performance.now()
      const preMediaWaitMs = (t_sendLeadResponse - t_submitStart).toFixed(1)

      if (import.meta.dev) {
        console.log(`[useFormSubmit Timing] PRE_MEDIA_WAIT_MS: ${preMediaWaitMs}ms (LeadId: ${response?.leadId})`)
      }

      // 2. Se o cliente selecionou fotos ou vídeos e o servidor retornou uploadToken, executa upload direto
      if (mediaUploaderRef?.value?.hasFiles && response?.uploadToken) {
        try {
          const t_mediaStart = performance.now()
          if (import.meta.dev) {
            console.log(`[useFormSubmit] Iniciando upload de mídias em ${t_mediaStart - t_submitStart}ms após o clique`)
          }
          await mediaUploaderRef.value.uploadAllMedia(response.uploadToken)
        } catch (mediaErr) {
          console.warn('[useFormSubmit] Erro parcial no upload de mídias:', mediaErr)
          // O lead já está salvo; prossegue para /obrigado sem interromper
        }
      }

      // Registrar conversão Google Ads
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
