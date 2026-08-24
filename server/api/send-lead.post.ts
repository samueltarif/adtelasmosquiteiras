import { isIdempotentRequest } from '../utils/analytics'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event) || {}

  const {
    submission_id,
    visitor_id,
    session_id,
    landing_path,
    conversion_path,
    channel,
    session_channel,
    first_touch_channel,
    first_touch_landing_path,
    first_touch_referrer,
    first_touch_utm_source,
    first_touch_utm_medium,
    first_touch_utm_campaign,
    first_touch_utm_content,
    first_touch_utm_term,
    first_touch_gclid,
    first_touch_gbraid,
    first_touch_wbraid,
    first_touch_fbclid,
    first_touch_msclkid,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    gclid,
    gbraid,
    wbraid,
    fbclid,
    msclkid,
    referrer,
    nome,
    cidade,
    bairro,
    servico,
    telefone,
    email,
    mensagem,
    origem
  } = body

  if (!nome || !cidade) {
    throw createError({ statusCode: 400, message: 'Nome e cidade são obrigatórios' })
  }

  // 0. VERIFICAR IDEMPOTÊNCIA DE SERVIDOR (Evita re-envios acidentais por retries de rede)
  if (submission_id && isIdempotentRequest(submission_id)) {
    console.log(`[send-lead] [IDEMPOTENCY] Requisição duplicada ignorada para submission_id: ${submission_id}`)
    return { success: true, idempotent: true }
  }

  // 1. GRAVAR NO BANCO DE DADOS (Supabase - tabela leads com atribuição Phase B.2)
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
          submission_id: submission_id || null,
          visitor_id: visitor_id || null,
          session_id: session_id || null,
          landing_path: landing_path || null,
          conversion_path: conversion_path || null,
          session_channel: session_channel || channel || null,

          // Atribuição de Sessão Atual
          referrer: referrer || null,
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          utm_content: utm_content || null,
          utm_term: utm_term || null,
          gclid: gclid || null,
          gbraid: gbraid || null,
          wbraid: wbraid || null,
          fbclid: fbclid || null,
          msclkid: msclkid || null,

          // Atribuição First Touch Completa
          first_touch_channel: first_touch_channel || null,
          first_touch_landing_path: first_touch_landing_path || null,
          first_touch_referrer: first_touch_referrer || null,
          first_touch_utm_source: first_touch_utm_source || null,
          first_touch_utm_medium: first_touch_utm_medium || null,
          first_touch_utm_campaign: first_touch_utm_campaign || null,
          first_touch_utm_content: first_touch_utm_content || null,
          first_touch_utm_term: first_touch_utm_term || null,
          first_touch_gclid: first_touch_gclid || null,
          first_touch_gbraid: first_touch_gbraid || null,
          first_touch_wbraid: first_touch_wbraid || null,
          first_touch_fbclid: first_touch_fbclid || null,
          first_touch_msclkid: first_touch_msclkid || null,

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
      console.log('[send-lead] Lead real com telemetria Phase B.2 gravado no Supabase com sucesso')
    } catch (dbErr: any) {
      // Se for violação de UNIQUE constraint no banco (código Postgres 23505/409), responde sucesso idempotente
      if (dbErr?.message?.includes('duplicate key') || dbErr?.message?.includes('23505') || dbErr?.status === 409) {
        console.log('[send-lead] [IDEMPOTENCY_DB] Conflito UNIQUE de submission_id no Supabase capturado com sucesso')
        return { success: true, idempotent: true }
      }
      console.error('[send-lead] Erro ao gravar lead no Supabase:', dbErr?.message || dbErr)
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
