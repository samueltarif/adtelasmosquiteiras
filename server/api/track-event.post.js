// API para enviar eventos do servidor para Google Analytics 4
// Usando Measurement Protocol API

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  const { eventName, eventParams, clientId } = body
  
  if (!eventName) {
    throw createError({
      statusCode: 400,
      message: 'eventName é obrigatório'
    })
  }
  
  // Gerar client_id se não fornecido
  const finalClientId = clientId || `${Date.now()}.${Math.random()}`
  
  try {
    // Enviar evento para GA4 via Measurement Protocol
    const response = await $fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${config.public.gaMeasurementId}&api_secret=${config.gaApiSecret}`,
      {
        method: 'POST',
        body: {
          client_id: finalClientId,
          events: [
            {
              name: eventName,
              params: eventParams || {}
            }
          ]
        }
      }
    )
    
    return {
      success: true,
      message: 'Evento enviado com sucesso'
    }
  } catch (error) {
    console.error('Erro ao enviar evento para GA4:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro ao enviar evento'
    })
  }
})
