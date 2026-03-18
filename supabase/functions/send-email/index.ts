import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GMAIL_EMAIL = Deno.env.get("GMAIL_EMAIL")!
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD")!
const DEST_EMAIL = "vendas.adtelaseredes@gmail.com"

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
    const { nome, cidade, bairro, servico, telefone, email, mensagem } = await req.json()

    // Montar HTML do email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22345F; border-bottom: 3px solid #F49A1A; padding-bottom: 8px;">
          🔔 Nova Solicitação de Orçamento
        </h2>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 16px;">
          <p style="margin: 8px 0;"><strong>Nome:</strong> ${nome}</p>
          <p style="margin: 8px 0;"><strong>Cidade:</strong> ${cidade}</p>
          ${bairro ? `<p style="margin: 8px 0;"><strong>Bairro:</strong> ${bairro}</p>` : ""}
          ${telefone ? `<p style="margin: 8px 0;"><strong>WhatsApp:</strong> ${telefone}</p>` : ""}
          ${email ? `<p style="margin: 8px 0;"><strong>E-mail:</strong> ${email}</p>` : ""}
          <p style="margin: 8px 0;"><strong>Serviço:</strong> ${servico || "Não especificado"}</p>
          ${mensagem ? `<p style="margin: 8px 0;"><strong>Mensagem:</strong> ${mensagem}</p>` : ""}
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Recebido em ${new Date().toLocaleString("pt-BR")} • AD Telas e Redes
        </p>
      </div>
    `

    // Enviar via Gmail SMTP usando fetch para a API do Gmail
    const credentials = btoa(`${GMAIL_EMAIL}:${GMAIL_APP_PASSWORD}`)
    
    // Usar o serviço de email do Deno via SMTP
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts")
    
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: GMAIL_EMAIL,
          password: GMAIL_APP_PASSWORD,
        },
      },
    })

    await client.send({
      from: GMAIL_EMAIL,
      to: DEST_EMAIL,
      subject: `🔔 Novo Lead: ${servico || "Orçamento"} - ${nome}`,
      html,
    })

    await client.close()

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("Erro:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  }
})
