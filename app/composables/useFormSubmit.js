/**
 * Composable reutilizável para submit de formulários comerciais
 * Envia lead via API /api/send-lead, grava no Supabase e redireciona para /obrigado
 */
export function useFormSubmit() {
  const isSubmitting = ref(false)

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
    // Evita submissões simultâneas duplicadas
    if (isSubmitting.value) return
    isSubmitting.value = true

    try {
      const payload = {
        nome: fields?.nome || '',
        cidade: fields?.cidade || fields?.bairro || 'São Paulo',
        bairro: fields?.bairro || '',
        servico: fields?.servico || fields?.tipoServico || 'Não especificado',
        telefone: fields?.telefone || fields?.celular || '',
        email: fields?.email || '',
        mensagem: fields?.mensagem || '',
        origem: fields?.origem || ('formulario_' + (typeof window !== 'undefined' ? window.location.pathname : 'geral'))
      }

      console.log('[useFormSubmit] Disparando POST /api/send-lead com payload:', payload)

      const response = await $fetch('/api/send-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      })

      console.log('[useFormSubmit] Resposta de /api/send-lead:', response)

      // Registrar conversão
      reportConversion()

      // Redirecionar para página de obrigado
      await navigateTo('/obrigado')
    } catch (e) {
      console.error('[useFormSubmit] Erro ao enviar formulário:', e)
      // Fallback em caso de falha de rede
      throw e
    } finally {
      isSubmitting.value = false
    }
  }

  return { isSubmitting, redirectToThankYou }
}
