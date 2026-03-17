import nodemailer from 'nodemailer'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { nome, cidade, bairro, servico } = body

  if (!nome || !cidade) {
    throw createError({
      statusCode: 400,
      message: 'Nome e cidade são obrigatórios'
    })
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.gmailEmail,
        pass: config.gmailAppPassword
      }
    })

    const htmlEmail = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22345F;">Nova Solicitação de Orçamento</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Cidade:</strong> ${cidade}</p>
          ${bairro ? `<p><strong>Bairro/Região:</strong> ${bairro}</p>` : ''}
          ${servico ? `<p><strong>Serviço de Interesse:</strong> ${servico}</p>` : '<p><strong>Serviço de Interesse:</strong> Não especificado</p>'}
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Solicitação recebida em ${new Date().toLocaleString('pt-BR')}
        </p>
        <p style="color: #666; font-size: 12px;">
          <strong>Próximos passos:</strong> Entre em contato via WhatsApp: (11) 98358-6611
        </p>
      </div>
    `

    await transporter.sendMail({
      from: `"AD Telas - Site" <${config.gmailEmail}>`,
      to: config.gmailEmail,
      subject: `Nova Solicitação: ${servico} - ${nome}`,
      html: htmlEmail
    })

    return { success: true, message: 'Email enviado com sucesso' }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro ao enviar email'
    })
  }
})
