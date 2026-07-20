export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { nome, cidade, bairro, servico, telefone, email, mensagem, origem } = body

  if (!nome || !cidade) {
    throw createError({ statusCode: 400, message: 'Nome e cidade são obrigatórios' })
  }

  // 1. GRAVAR NO BANCO DE DADOS (Supabase - tabela leads)
  if (config.supabaseUrl && config.supabaseServiceRoleKey) {
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
          nome,
          cidade,
          bairro: bairro || null,
          servico: servico || 'Não especificado',
          telefone: telefone || null,
          email: email || null,
          mensagem: mensagem || null,
          origem: origem || 'formulario_geral',
          status: 'Novo',
          valor_orcamento: 0
        }
      })
      console.log('[send-lead] Lead gravado no Supabase com sucesso')
    } catch (dbErr: any) {
      console.error('[send-lead] Erro ao gravar lead no Supabase:', dbErr?.message || dbErr)
      // Continua mesmo se o banco falhar — o e-mail ainda é enviado
    }
  }

  // 2. ENVIAR EMAIL via Edge Function do Supabase
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
