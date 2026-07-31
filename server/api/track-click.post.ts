import { createHash } from 'crypto'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const headers = getHeaders(event)

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return { success: false }
  }

  const forwarded = headers['x-forwarded-for'] || headers['x-real-ip'] || '0.0.0.0'
  const rawIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim()
  const ipHash = createHash('sha256').update(rawIp + 'adt-click-salt').digest('hex').substring(0, 16)

  const rawPath = body.origem || '/'
  const path = (rawPath === '/' || rawPath === '') ? 'Home (/)' : rawPath

  try {
    // 1. Grava no lead_clicks
    await $fetch(`${config.supabaseUrl}/rest/v1/lead_clicks`, {
      method: 'POST',
      headers: {
        'apikey': config.supabaseServiceRoleKey,
        'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: {
        tipo: body.tipo || 'whatsapp',
        origem: path,
        url_origem: path,
        user_agent: (headers['user-agent'] || '').substring(0, 500),
        ip_hash: ipHash
      }
    })

    // 2. Transforma o clique em LEAD na tabela leads
    const tipo = body.tipo || 'whatsapp'
    if (tipo === 'whatsapp' || tipo === 'telefone' || tipo === 'formulario_submit' || tipo === 'cta_interno') {
      let servicoNome = 'Atendimento WhatsApp'
      const lowerPath = rawPath.toLowerCase()
      if (lowerPath.includes('redes')) servicoNome = 'Redes de Proteção'
      else if (lowerPath.includes('telas') || lowerPath.includes('mosquiteira')) servicoNome = 'Telas Mosquiteiras'
      else if (lowerPath.includes('vidracaria') || lowerPath.includes('vidro')) servicoNome = 'Vidraçaria'
      else if (rawPath === '/' || rawPath === '' || rawPath === 'Home (/)') servicoNome = 'Orçamento Home (WhatsApp)'

      await $fetch(`${config.supabaseUrl}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseServiceRoleKey,
          'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: {
          nome: `Lead WhatsApp (${path})`,
          cidade: 'São Paulo',
          bairro: null,
          servico: servicoNome,
          telefone: null,
          email: null,
          mensagem: body.text ? `Clique em: "${body.text}"` : `Clique no WhatsApp a partir da página ${path}`,
          origem: path,
          status: 'Novo',
          valor_orcamento: 0
        }
      }).catch((err: any) => console.error('[track-click] Erro ao criar Lead:', err?.message))
    }

    return { success: true }
  } catch (error: any) {
    console.error('[track-click] Erro:', error?.message)
    return { success: false }
  }
})
