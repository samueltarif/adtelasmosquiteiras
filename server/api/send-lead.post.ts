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
    first_touch_channel,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    gclid,
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

  // 1. GRAVAR NO BANCO DE DADOS (Supabase - tabela leads com atribuição Phase B)
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
          channel: channel || 'direct',
          first_touch_channel: first_touch_channel || 'direct',
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          utm_content: utm_content || null,
          utm_term: utm_term || null,
          gclid: gclid || null,
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
      console.log('[send-lead] Lead real com telemetria Phase B gravado no Supabase com sucesso')
    } catch (dbErr: any) {
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
