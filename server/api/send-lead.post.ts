export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { nome, cidade, bairro, servico, telefone, email, mensagem } = body

  if (!nome || !cidade) {
    throw createError({ statusCode: 400, message: 'Nome e cidade são obrigatórios' })
  }

  // Chamar Edge Function do Supabase para enviar email via Gmail
  try {
    const res = await $fetch(`${config.supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: { nome, cidade, bairro, servico, telefone, email, mensagem }
    })
    console.log('[send-lead] Email enviado via Edge Function:', res)
  } catch (err: any) {
    console.error('[send-lead] Erro ao chamar Edge Function:', err?.message || err)
  }

  return { success: true }
})
