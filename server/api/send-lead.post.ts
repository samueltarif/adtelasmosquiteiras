import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { nome, cidade, bairro, servico, telefone, email, mensagem } = body

  if (!nome || !cidade) {
    throw createError({
      statusCode: 400,
      message: 'Nome e cidade são obrigatórios'
    })
  }

  // Log para debug no Vercel
  console.log('[send-lead] Recebido:', { nome, cidade, servico })
  console.log('[send-lead] RESEND_API_KEY configurada:', !!config.resendApiKey)

  try {
    const resend = new Resend(config.resendApiKey)

    const htmlEmail = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22345F;">Nova Solicitação de Orçamento</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Cidade:</strong> ${cidade}</p>
          ${bairro ? `<p><strong>Bairro/Região:</strong> ${bairro}</p>` : ''}
          ${telefone ? `<p><strong>Telefone/WhatsApp:</strong> ${telefone}</p>` : ''}
          ${email ? `<p><strong>E-mail:</strong> ${email}</p>` : ''}
          ${servico ? `<p><strong>Serviço de Interesse:</strong> ${servico}</p>` : '<p><strong>Serviço de Interesse:</strong> Não especificado</p>'}
          ${mensagem ? `<p><strong>Mensagem:</strong><br>${mensagem}</p>` : ''}
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Solicitação recebida em ${new Date().toLocaleString('pt-BR')}
        </p>
        <p style="color: #666; font-size: 12px;">
          <strong>Próximos passos:</strong> Entre em contato via WhatsApp: (11) 98358-6611
        </p>
      </div>
    `

    const { data, error } = await resend.emails.send({
      from: 'AD Telas - Site <onboarding@resend.dev>',
      to: ['vendas.adtelaseredes@gmail.com'],
      subject: `Nova Solicitação: ${servico || 'Orçamento'} - ${nome}`,
      html: htmlEmail
    })

    if (error) {
      console.error('[send-lead] Erro Resend:', error)
      throw createError({ statusCode: 500, message: 'Erro ao enviar email' })
    }

    console.log('[send-lead] Email enviado com sucesso:', data?.id)
    return { success: true, message: 'Email enviado com sucesso' }

  } catch (error) {
    console.error('[send-lead] Erro:', error)
    throw createError({ statusCode: 500, message: 'Erro ao enviar email' })
  }
})
