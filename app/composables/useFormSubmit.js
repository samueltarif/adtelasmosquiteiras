/**
 * Composable reutilizável para submit de formulários com redirecionamento WhatsApp
 * Mostra tela de obrigado com URL visível e contador regressivo
 */
export function useFormSubmit() {
  const isSubmitting = ref(false)
  const submitSuccess = ref(false)
  const countdown = ref(5)
  const whatsappRedirectUrl = ref('')

  const startRedirect = (url) => {
    whatsappRedirectUrl.value = url
    submitSuccess.value = true
    countdown.value = 5

    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        window.open(whatsappRedirectUrl.value, '_blank')
      }
    }, 1000)
  }

  const buildWhatsappUrl = (fields) => {
    let msg = `Olá! Vim pelo site e gostaria de um orçamento.\n\n`
    if (fields.nome)     msg += `📝 Nome: ${fields.nome}\n`
    if (fields.telefone) msg += `📞 Telefone: ${fields.telefone}\n`
    if (fields.email)    msg += `📧 E-mail: ${fields.email}\n`
    if (fields.bairro)   msg += `📍 Bairro: ${fields.bairro}\n`
    if (fields.cidade)   msg += `🏙️ Cidade: ${fields.cidade}\n`
    if (fields.servico)  msg += `🔧 Serviço: ${fields.servico}\n`
    if (fields.tipoServico) msg += `🔧 Serviço: ${fields.tipoServico}\n`
    if (fields.mensagem) msg += `\n💬 Mensagem:\n${fields.mensagem}\n`
    msg += `\nPode me ajudar?`
    return `https://wa.me/5511983586611?text=${encodeURIComponent(msg)}`
  }

  return { isSubmitting, submitSuccess, countdown, whatsappRedirectUrl, startRedirect, buildWhatsappUrl }
}
