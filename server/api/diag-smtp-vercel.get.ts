/**
 * ENDPOINT DE DIAGNÓSTICO TEMPORÁRIO — SMTP SÍNCRONO NO VERCEL
 * Rota: GET /api/diag-smtp-vercel
 *
 * REMOVER APÓS DIAGNÓSTICO CONCLUÍDO.
 * NÃO expõe senhas. NÃO altera banco. NÃO envia lead real.
 */
import nodemailer from 'nodemailer'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const gmailEmail        = config.gmailEmail        || ''
  const gmailAppPassword  = config.gmailAppPassword  || ''

  const result: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env_gmail_email_present:    !!gmailEmail,
    env_gmail_email_prefix:     gmailEmail ? gmailEmail.slice(0, 6) + '...' : 'MISSING',
    env_gmail_password_present: !!gmailAppPassword,
    env_gmail_password_length:  gmailAppPassword.length,
    env_gmail_password_prefix:  gmailAppPassword ? gmailAppPassword.slice(0, 4) + '****' : 'MISSING',
    VERCEL_SMTP_VERIFY:   false,
    VERCEL_SYNC_SEND:     false,
    VERCEL_SMTP_ACCEPTED: [],
    VERCEL_SMTP_REJECTED: [],
    VERCEL_SMTP_RESPONSE: '',
    VERCEL_SMTP_MESSAGE_ID: '',
    verify_error: '',
    send_error: ''
  }

  if (!gmailEmail || !gmailAppPassword) {
    result.ROOT_CAUSE = 'ENV_MISSING_IN_VERCEL_RUNTIME'
    return result
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailEmail, pass: gmailAppPassword },
    connectionTimeout: 10000,
    socketTimeout: 15000
  })

  // 1. VERIFY
  try {
    await transporter.verify()
    result.VERCEL_SMTP_VERIFY = true
  } catch (e: any) {
    result.VERCEL_SMTP_VERIFY = false
    result.verify_error = e?.message || String(e)
    result.ROOT_CAUSE = 'SMTP_AUTH_FAILED_IN_VERCEL_RUNTIME'
    return result
  }

  // 2. SENDMAIL SÍNCRONO
  try {
    const info = await transporter.sendMail({
      from:    `"AD Telas Diagnóstico Vercel" <${gmailEmail}>`,
      to:      'vendas.adtelaseredes@gmail.com',
      subject: `[DIAG VERCEL PRODUÇÃO] SMTP Síncrono — ${new Date().toISOString()}`,
      text:    `Teste SMTP síncrono executado DENTRO do runtime Vercel.\nTimestamp: ${new Date().toISOString()}\nSe este e-mail chegou, o SMTP funciona no Vercel.\nO problema está no background job (waitUntil).`,
      html:    `<h2>Teste SMTP — Runtime Vercel</h2>
<p>Este e-mail foi enviado de forma síncrona, <strong>antes da resposta HTTP</strong>, dentro do runtime Vercel.</p>
<ul>
  <li>Timestamp: <code>${new Date().toISOString()}</code></li>
  <li>Se chegou: SMTP funciona no Vercel → problema está no <strong>background job (waitUntil)</strong></li>
  <li>Se não chegou: SMTP falha mesmo no Vercel → problema de credenciais/rede</li>
</ul>`
    })

    result.VERCEL_SYNC_SEND     = true
    result.VERCEL_SMTP_ACCEPTED = info.accepted || []
    result.VERCEL_SMTP_REJECTED = info.rejected || []
    result.VERCEL_SMTP_RESPONSE = info.response || ''
    result.VERCEL_SMTP_MESSAGE_ID = info.messageId || ''
    result.ROOT_CAUSE_HINT = 'SMTP_OK_IN_VERCEL — se email chegou: root cause = BACKGROUND_FLOW_BROKEN; se não chegou: investigar entrega Gmail'
  } catch (e: any) {
    result.VERCEL_SYNC_SEND = false
    result.send_error = e?.message || String(e)
    result.ROOT_CAUSE = 'SMTP_SENDMAIL_FAILED_IN_VERCEL_RUNTIME'
  }

  return result
})
