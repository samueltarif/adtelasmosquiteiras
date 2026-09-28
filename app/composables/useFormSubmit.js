import { ref } from 'vue'
import { useAnalyticsIdentity } from './useAnalyticsIdentity'
import { useAttribution } from './useAttribution'
import { reportFormConversion } from '~/utils/formConversion'

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

  /**
   * Envia o lead comercial e orquestra o upload direto de mídias vinculadas.
   *
   * @param {Object} fields Dados do formulário
   * @param {Object} mediaUploaderRef Referência opcional ao componente MediaUploader
   */
  const redirectToThankYou = async (fields, mediaUploaderRef = null, options = {}) => {
    if (isSubmitting.value) return
    isSubmitting.value = true

    const t_submitStart = performance.now()

    try {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
      const visitorId = identity.getOrCreateVisitorId()
      const { sessionId } = identity.getOrCreateSessionId(currentPath)
      const landingPath = identity.getSessionLandingPath(currentPath)
      const attr = attribution.getOrInitAttribution()
      const savedFt = identity.getFirstTouchContext()

      // Snapshot atômico First Touch (preserva campos null se já existir; inicializa se não existir)
      const ftSnapshot = savedFt || {
        first_touch_channel: attr.channel || 'direct',
        first_touch_landing_path: landingPath || null,
        first_touch_referrer: attr.referrer || null,
        first_touch_utm_source: attr.utm_source || null,
        first_touch_utm_medium: attr.utm_medium || null,
        first_touch_utm_campaign: attr.utm_campaign || null,
        first_touch_utm_content: attr.utm_content || null,
        first_touch_utm_term: attr.utm_term || null,
        first_touch_google_campaign_id: attr.campaign_id || null,
        first_touch_google_adgroup_id: attr.adgroup_id || null,
        first_touch_google_creative_id: attr.creative || null,
        first_touch_google_match_type: attr.matchtype || null,
        first_touch_google_network: attr.network || null,
        first_touch_google_device: attr.device || null,
        first_touch_google_target_id: attr.target_id || null,
        first_touch_gclid: attr.gclid || null, first_touch_gbraid: attr.gbraid || null, first_touch_wbraid: attr.wbraid || null,
        first_touch_fbclid: attr.fbclid || null, first_touch_msclkid: attr.msclkid || null, first_touch_ttclid: attr.ttclid || null,
        first_touch_tiktok_campaign_id: attr.tiktok_campaign_id || null,
        first_touch_tiktok_adgroup_id: attr.tiktok_adgroup_id || null,
        first_touch_tiktok_ad_id: attr.tiktok_ad_id || null,
        first_touch_tiktok_creative_id: attr.tiktok_creative_id || null,
        first_touch_tiktok_placement: attr.tiktok_placement || null
      }

      if (!savedFt) {
        identity.setFirstTouchContextOnce(ftSnapshot)
      }

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
        channel: attr.channel,
        session_channel: attr.channel,
        referrer: attr.referrer,
        utm_source: attr.utm_source,
        utm_medium: attr.utm_medium,
        utm_campaign: attr.utm_campaign,
        utm_content: attr.utm_content,
        utm_term: attr.utm_term,
        google_campaign_id: attr.campaign_id || null,
        google_adgroup_id: attr.adgroup_id || null,
        google_creative_id: attr.creative || null,
        google_match_type: attr.matchtype || null,
        google_network: attr.network || null,
        google_device: attr.device || null,
        google_target_id: attr.target_id || null,
        gclid: attr.gclid, gbraid: attr.gbraid, wbraid: attr.wbraid,
        fbclid: attr.fbclid, msclkid: attr.msclkid,
        meta_campaign_id: attr.meta_campaign_id || null,
        meta_adset_id: attr.meta_adset_id || null,
        meta_ad_id: attr.meta_ad_id || null,
        meta_placement: attr.meta_placement || null,
        ttclid: attr.ttclid || null,
        tiktok_campaign_id: attr.tiktok_campaign_id || null,
        tiktok_adgroup_id: attr.tiktok_adgroup_id || null,
        tiktok_ad_id: attr.tiktok_ad_id || null,
        tiktok_creative_id: attr.tiktok_creative_id || null,
        tiktok_placement: attr.tiktok_placement || null,

        // Contexto First Touch Atômico (SEM fallback individual)
        first_touch_channel: ftSnapshot.first_touch_channel,
        first_touch_landing_path: ftSnapshot.first_touch_landing_path ?? null,
        first_touch_referrer: ftSnapshot.first_touch_referrer ?? null,
        first_touch_utm_source: ftSnapshot.first_touch_utm_source ?? null,
        first_touch_utm_medium: ftSnapshot.first_touch_utm_medium ?? null,
        first_touch_utm_campaign: ftSnapshot.first_touch_utm_campaign ?? null,
        first_touch_utm_content: ftSnapshot.first_touch_utm_content ?? null,
        first_touch_utm_term: ftSnapshot.first_touch_utm_term ?? null,
        first_touch_google_campaign_id: ftSnapshot.first_touch_google_campaign_id ?? null,
        first_touch_google_adgroup_id: ftSnapshot.first_touch_google_adgroup_id ?? null,
        first_touch_google_creative_id: ftSnapshot.first_touch_google_creative_id ?? null,
        first_touch_google_match_type: ftSnapshot.first_touch_google_match_type ?? null,
        first_touch_google_network: ftSnapshot.first_touch_google_network ?? null,
        first_touch_google_device: ftSnapshot.first_touch_google_device ?? null,
        first_touch_google_target_id: ftSnapshot.first_touch_google_target_id ?? null,
        first_touch_gclid: ftSnapshot.first_touch_gclid ?? null, first_touch_gbraid: ftSnapshot.first_touch_gbraid ?? null, first_touch_wbraid: ftSnapshot.first_touch_wbraid ?? null,
        first_touch_fbclid: ftSnapshot.first_touch_fbclid ?? null, first_touch_msclkid: ftSnapshot.first_touch_msclkid ?? null, first_touch_ttclid: ftSnapshot.first_touch_ttclid ?? null,
        first_touch_tiktok_campaign_id: ftSnapshot.first_touch_tiktok_campaign_id ?? null,
        first_touch_tiktok_adgroup_id: ftSnapshot.first_touch_tiktok_adgroup_id ?? null,
        first_touch_tiktok_ad_id: ftSnapshot.first_touch_tiktok_ad_id ?? null,
        first_touch_tiktok_creative_id: ftSnapshot.first_touch_tiktok_creative_id ?? null,
        first_touch_tiktok_placement: ftSnapshot.first_touch_tiktok_placement ?? null,
        nome: fields?.nome || '',
        cidade: fields?.cidade || fields?.bairro || 'São Paulo',
        bairro: fields?.bairro || '',
        servico: fields?.servico || fields?.tipoServico || 'Não especificado',
        telefone: fields?.telefone || fields?.celular || '',
        email: fields?.email || '',
        mensagem: fields?.mensagem || '',
        origem: fields?.origem || ('formulario_' + currentPath)
      }

      if (mediaUploaderRef?.value) {
        const uploader = mediaUploaderRef.value
        const items = uploader.mediaItems || []
        const pCount = typeof uploader.photoCount === 'number' ? uploader.photoCount : (uploader.photoCount?.value ?? items.filter(m => m.type === 'photo').length)
        const vCount = typeof uploader.videoCount === 'number' ? uploader.videoCount : (uploader.videoCount?.value ?? items.filter(m => m.type === 'video').length)
        if (pCount > 0 || vCount > 0) {
          payload.media_selection_summary = { photoCount: Number(pCount) || 0, videoCount: Number(vCount) || 0 }
        }
      }

      // 1. Salvar Lead e disparar E-mail DATA-ONLY (LEAD_CREATION_ORDER = FIRST)
      const response = await $fetch('/api/send-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      })

      if (response?.success !== true || response?.leadSaved !== true || !response?.leadId) {
        throw new Error('Não foi possível confirmar o recebimento do pedido.')
      }

      // 2. Se o cliente selecionou fotos ou vídeos e o servidor retornou uploadToken, executa upload direto
      if (mediaUploaderRef?.value?.hasFiles && response?.uploadToken) {
        try {
          const t_mediaStart = performance.now()
          if (import.meta.dev) {
            console.log(`[useFormSubmit] Iniciando upload de mídias em ${t_mediaStart - t_submitStart}ms após o clique`)
          }
          await mediaUploaderRef.value.uploadAllMedia(response.uploadToken)
        } catch {
          console.warn('[useFormSubmit] Erro parcial no upload de mídias')
          // O lead já está salvo; prossegue para /obrigado sem interromper
        }
      }

      // 3. Disparar evento canônico lead_form_success para o GTM (Single Source of Truth: APÓS confirmação real de sucesso da API)
      const submittedId = payload.submission_id
      reportFormConversion(submittedId)

      // Reset do submissionId após sucesso
      activeSubmissionId = null

      // Redirecionar para página de obrigado (pura UI)
      if (options.redirect !== false) await navigateTo('/obrigado')
      return response
    } catch (e) {
      console.error('[useFormSubmit] Erro ao enviar formulário')
      throw e
    } finally {
      isSubmitting.value = false
    }
  }

  return { isSubmitting, redirectToThankYou }
}
