/**
 * Composable reutilizável para submit de formulários
 * Redireciona para /obrigado com a URL do WhatsApp como query param
 */
export function useFormSubmit() {
  const isSubmitting = ref(false)
  const router = useRouter()

  const buildWhatsappUrl = (fields) => {
    let msg = `Olá! Vim pelo site e gostaria de um orçamento.\n\n`
    if (fields.nome)        msg += `📝 Nome: ${fields.nome}\n`
    if (fields.telefone)    msg += `📞 Telefone: ${fields.telefone}\n`
    if (fields.email)       msg += `📧 E-mail: ${fields.email}\n`
    if (fields.bairro)      msg += `📍 Bairro: ${fields.bairro}\n`
    if (fields.cidade)      msg += `🏙️ Cidade: ${fields.cidade}\n`
    if (fields.servico)     msg += `🔧 Serviço: ${fields.servico}\n`
    if (fields.tipoServico) msg += `🔧 Serviço: ${fields.tipoServico}\n`
    if (fields.mensagem)    msg += `\n💬 Mensagem:\n${fields.mensagem}\n`
    msg += `\nPode me ajudar?`
    return `https://wa.me/5511983586611?text=${encodeURIComponent(msg)}`
  }

  const redirectToThankYou = (fields) => {
    const url = buildWhatsappUrl(fields)
    router.push({
      path: '/obrigado',
      query: { url, nome: fields.nome || '' }
    })
  }

  return { isSubmitting, buildWhatsappUrl, redirectToThankYou }
}
