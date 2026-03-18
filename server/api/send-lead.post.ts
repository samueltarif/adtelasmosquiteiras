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
  }

  // 2. Chamar Edge Function do Supabase para enviar email
  // (Edge Functions têm acesso SMTP, diferente do Vercel serverless)
  try {
    await $fetch(`${config.supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: { nome, cidade, bairro, servico, telefone, email, mensagem }
    })
    console.log('[send-lead] Email enviado via Edge Function')
  } catch (err) {
    console.error('[send-lead] Erro ao chamar Edge Function:', err)
  }

  return { success: true }
})
