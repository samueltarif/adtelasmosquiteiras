const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const DEST_EMAIL = 'vendas.adtelaseredes@gmail.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nome, cidade, bairro, servico, telefone, email, mensagem } = await req.json()

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY não configurada')
    }

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

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AD Telas - Site <noreply@adtelasmosquiteiras.com.br>',
        to: [DEST_EMAIL],
        subject: `Novo Lead: ${servico || 'Orçamento'} - ${nome}`,
        html,
      }),
    })

    const data = await res.json()
    console.log('Resend response:', JSON.stringify(data))

    if (!res.ok) {
      throw new Error(JSON.stringify(data))
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
