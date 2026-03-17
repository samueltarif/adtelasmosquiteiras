import nodemailer from 'nodemailer'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { nome, cidade, bairro, servico, telefone, email, mensagem } = body

  if (!nome || !cidade) {
    throw createError({ statusCode: 400, message: 'Nome e cidade são obrigatórios' })
  }

  // 1. Salvar lead no Supabase
  try {
    await $fetch(`${config.supabaseUrl}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': config.supabaseServiceRoleKey,
        'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: {
        name: nome,
        whatsapp: telefone || '',
        service_type: servico || 'Não especificado',
        neighborhood: bairro || '',
        cidade: cidade,
        email: email || '',
        message: mensagem || '',
        source: 'website',
        status: 'novo'
      }
    })
    console.log('[send-lead] Lead salvo no Supabase')
  } catch (err) {
    console.error('[send-lead] Erro ao salvar no Supabase:', err)
    // Não bloqueia — continua para enviar email
  }

  // 2. Enviar email via Gmail
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: config.gmailEmail,
        pass: config.gmailAppPassword
      }
    })

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22345F; border-bottom: 3px solid #F49A1A; padding-bottom: 8px;">
          Nova Solicitação de Orçamento
        </h2>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 16px;">
          <p style="margin: 8px 0;"><strong>Nome:</strong> ${nome}</p>
          <p style="margin: 8px 0;"><strong>Cidade:</strong> ${cidade}</p>
          ${bairro ? `<p style="margin: 8px 0;"><strong>Bairro:</strong> ${bairro}</p>` : ''}
          ${telefone ? `<p style="margin: 8px 0;"><strong>WhatsApp:</strong> ${telefone}</p>` : ''}
          ${email ? `<p style="margin: 8px 0;"><strong>E-mail:</strong> ${email}</p>` : ''}
          <p style="margin: 8px 0;"><strong>Serviço:</strong> ${servico || 'Não especificado'}</p>
          ${mensagem ? `<p style="margin: 8px 0;"><strong>Mensagem:</strong> ${mensagem}</p>` : ''}
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Recebido em ${new Date().toLocaleString('pt-BR')} • AD Telas e Redes
        </p>
      </div>
    `

    await transporter.sendMail({
      from: `"AD Telas - Site" <${config.gmailEmail}>`,
      to: config.gmailEmail,
      subject: `🔔 Novo Lead: ${servico || 'Orçamento'} - ${nome}`,
      html
    })
    console.log('[send-lead] Email enviado com sucesso')
  } catch (err) {
    console.error('[send-lead] Erro ao enviar email:', err)
    // Não bloqueia o redirect
  }

  return { success: true }
})
