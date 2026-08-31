/**
 * Mapeador Central de Erros de RPC e Banco de Dados para Agenda/Equipe
 * Arquivo: server/utils/crmAppointmentErrors.ts
 *
 * Importa o dicionário canônico unificado (28 chaves) de appointmentErrorMap.mjs
 * Garantia de zero duplicação de autoridade e sanitização estrita de logs (zero PII).
 */

import { createError } from 'h3'
import { APPOINTMENT_ERROR_MAP } from '../shared/appointmentErrorMap.mjs'

export { APPOINTMENT_ERROR_MAP }

export function handleRpcError(err: any): never {
  const sqlState = String(err?.code || err?.data?.code || '')
  const rawMessage = typeof err?.data?.message === 'string'
    ? err.data.message
    : (typeof err?.message === 'string' ? err.message : '')
  const rawDetails = typeof err?.data?.details === 'string'
    ? err.data.details
    : (typeof err?.details === 'string' ? err.details : '')
  const fullText = `${rawMessage} ${rawDetails}`

  // 1. Busca por código explícito conhecido no mapa canônico (28 chaves)
  for (const [key, def] of Object.entries(APPOINTMENT_ERROR_MAP)) {
    if (fullText.includes(key) || sqlState === key) {
      throw createError({
        statusCode: (def as any).status,
        statusMessage: (def as any).message,
        data: {
          error: {
            code: (def as any).code,
            message: (def as any).message
          }
        }
      })
    }
  }

  // 2. Interpretação estruturada de SQLSTATE (err.code ou err.data.code ou fullText)
  if (sqlState === '23P01' || fullText.includes('23P01') || fullText.includes('unq_appointments_staff_active_period')) {
    const def = (APPOINTMENT_ERROR_MAP as any).ERR_STAFF_SCHEDULE_CONFLICT
    throw createError({
      statusCode: def.status,
      statusMessage: def.message,
      data: { error: { code: def.code, message: def.message } }
    })
  }

  if (sqlState === '23505' || fullText.includes('23505')) {
    if (fullText.includes('unq_active_installation_per_wo')) {
      const def = (APPOINTMENT_ERROR_MAP as any).ERR_ACTIVE_INSTALLATION_EXISTS
      throw createError({
        statusCode: def.status,
        statusMessage: def.message,
        data: { error: { code: def.code, message: def.message } }
      })
    }
    const def = (APPOINTMENT_ERROR_MAP as any).ERR_CONCURRENCY_CONFLICT
    throw createError({
      statusCode: 409,
      statusMessage: def.message,
      data: { error: { code: def.code, message: def.message } }
    })
  }

  if (sqlState === '23503' || fullText.includes('23503')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Violação de integridade referencial: registro associado não existe.',
      data: {
        error: {
          code: 'ERR_FOREIGN_KEY_VIOLATION',
          message: 'Registro associado não foi encontrado.'
        }
      }
    })
  }

  // 3. Fallback genérico estritamente higienizado — ZERO logging de PII ou raw payload
  const sanitizedCode = sqlState || 'ERR_RPC_UNKNOWN'
  const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500
  console.error(`[CRM Appointment RPC Error] code=${sanitizedCode} status=${statusCode}`)

  throw createError({
    statusCode,
    statusMessage: 'Falha ao processar operação na agenda.',
    data: {
      error: {
        code: 'ERR_INTERNAL_SERVER_ERROR',
        message: 'Ocorreu um erro ao processar a solicitação.'
      }
    }
  })
}
