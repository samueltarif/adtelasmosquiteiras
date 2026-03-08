// Composable para rastreamento de eventos no Google Analytics 4
// Suporta tanto eventos client-side (gtag) quanto server-side (Measurement Protocol)

export const useGATracking = () => {
  const config = useRuntimeConfig()
  
  /**
   * Envia evento client-side usando gtag
   * @param {string} eventName - Nome do evento
   * @param {object} eventParams - Parâmetros do evento
   */
  const trackClientEvent = (eventName, eventParams = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventParams)
    }
  }
  
  /**
   * Envia evento server-side usando Measurement Protocol API
   * @param {string} eventName - Nome do evento
   * @param {object} eventParams - Parâmetros do evento
   * @param {string} clientId - ID do cliente (opcional)
   */
  const trackServerEvent = async (eventName, eventParams = {}, clientId = null) => {
    try {
      await $fetch('/api/track-event', {
        method: 'POST',
        body: {
          eventName,
          eventParams,
          clientId
        }
      })
    } catch (error) {
      console.error('Erro ao enviar evento server-side:', error)
    }
  }
  
  /**
   * Envia evento tanto client-side quanto server-side
   * Útil para garantir que eventos críticos sejam rastreados
   * @param {string} eventName - Nome do evento
   * @param {object} eventParams - Parâmetros do evento
   */
  const trackEvent = (eventName, eventParams = {}) => {
    // Client-side
    trackClientEvent(eventName, eventParams)
    
    // Server-side (opcional, para eventos críticos)
    // trackServerEvent(eventName, eventParams)
  }
  
  /**
   * Rastreia conversão de formulário
   * @param {string} formName - Nome do formulário
   * @param {object} formData - Dados do formulário
   */
  const trackFormSubmit = (formName, formData = {}) => {
    trackEvent('form_submit', {
      form_name: formName,
      ...formData
    })
  }
  
  /**
   * Rastreia clique em botão de contato
   * @param {string} method - Método de contato (whatsapp, phone, email)
   * @param {string} origem - Origem do clique
   */
  const trackContactClick = (method, origem = '') => {
    trackEvent('contact_click', {
      method,
      origem
    })
  }
  
  /**
   * Rastreia visualização de serviço
   * @param {string} serviceName - Nome do serviço
   * @param {string} categoria - Categoria do serviço
   */
  const trackServiceView = (serviceName, categoria = '') => {
    trackEvent('view_item', {
      item_name: serviceName,
      item_category: categoria
    })
  }
  
  return {
    trackClientEvent,
    trackServerEvent,
    trackEvent,
    trackFormSubmit,
    trackContactClick,
    trackServiceView
  }
}
