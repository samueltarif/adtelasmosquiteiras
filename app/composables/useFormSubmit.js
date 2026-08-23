/**
 * Composable reutilizável para submit de formulários
 * Envia email/lead via API e redireciona para /obrigado
 */
export function useFormSubmit() {
  const isSubmitting = ref(false)

  // Função de conversão Google Ads - Contato
  const reportConversion = () => {
    if (typeof window !== 'undefined') {
      // gtag direct
      if (window.gtag) {
        window.gtag('event', 'conversion', {
          'send_to': 'AW-17981093809/4GwPCPCPWSjoccELHvhv5C'
        })
      }
      // dataLayer push for GTM
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'form_submission',
        event_category: 'lead',
        event_label: 'formulario_contato'
      })
    }
  }

  const redirectToThankYou = async (fields) => {
    // Trava de segurança contra duplo clique / requisições simultâneas
    if (isSubmitting.value) return
    isSubmitting.value = true

    // Disparar conversão Google Ads
    reportConversion()

    try {
      // Enviar email e gravar lead no banco via API
      await $fetch('/api/send-lead', {
        method: 'POST',
        body: {
          nome: fields.nome || '',
          cidade: fields.cidade || fields.bairro || 'São Paulo',
          bairro: fields.bairro || '',
          servico: fields.servico || fields.tipoServico || 'Não especificado',
          telefone: fields.telefone || '',
          email: fields.email || '',
          mensagem: fields.mensagem || '',
          origem: fields.origem || 'formulario_' + (window?.location?.pathname || 'geral')
        }
      })
    } catch (e) {
      console.error('Erro ao enviar lead/email:', e)
    } finally {
      isSubmitting.value = false
    }

    // Redirecionar para /obrigado sem query params
    await navigateTo('/obrigado')
  }

  return { isSubmitting, redirectToThankYou }
}
