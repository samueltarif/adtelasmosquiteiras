/**
 * ======================================================================
 * CPF & CNPJ VALIDATION & NORMALIZATION — AD Telas e Redes
 * ======================================================================
 * Suporte a CPF e CNPJ numérico e alfanumérico conforme Instrução Normativa RFB nº 2.229/2024.
 */

/**
 * Normaliza CPF ou CNPJ removendo pontuações e espaços, preservando caracteres alfanuméricos em caixa alta.
 */
export function normalizeCpfCnpj(doc) {
  if (!doc || typeof doc !== 'string') return ''
  return doc.trim().toUpperCase().replace(/[^0-9A-Z]/g, '')
}

/**
 * Valida CPF (11 dígitos numéricos com Módulo 11).
 */
export function isValidCpf(cpf) {
  if (!cpf || typeof cpf !== 'string') return false
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11) return false
  if (/^(\d)\1{10}$/.test(clean)) return false

  let sum1 = 0
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(clean[i], 10) * (10 - i)
  }
  const mod1 = sum1 % 11
  const dv1 = mod1 < 2 ? 0 : 11 - mod1
  if (parseInt(clean[9], 10) !== dv1) return false

  let sum2 = 0
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(clean[i], 10) * (11 - i)
  }
  const mod2 = sum2 % 11
  const dv2 = mod2 < 2 ? 0 : 11 - mod2
  return parseInt(clean[10], 10) === dv2
}

/**
 * Valida CNPJ numérico e alfanumérico (IN RFB 2.229/2024 - Módulo 11 com tabela ASCII-48).
 */
export function isValidCnpj(cnpj) {
  if (!cnpj || typeof cnpj !== 'string') return false
  const clean = normalizeCpfCnpj(cnpj)
  if (clean.length !== 14) return false
  if (/^(\d)\1{13}$/.test(clean)) return false
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(clean)) return false

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum1 = 0
  for (let i = 0; i < 12; i++) {
    const val = clean.charCodeAt(i) - 48
    sum1 += val * w1[i]
  }
  const mod1 = sum1 % 11
  const dv1 = mod1 < 2 ? 0 : 11 - mod1
  if (parseInt(clean[12], 10) !== dv1) return false

  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum2 = 0
  for (let i = 0; i < 13; i++) {
    const val = i === 12 ? dv1 : clean.charCodeAt(i) - 48
    sum2 += val * w2[i]
  }
  const mod2 = sum2 % 11
  const dv2 = mod2 < 2 ? 0 : 11 - mod2
  return parseInt(clean[13], 10) === dv2
}

/**
 * Valida formato e dígitos verificadores de CNPJ ou CPF.
 */
export function isValidCpfCnpj(doc) {
  const clean = normalizeCpfCnpj(doc)
  if (clean.length === 11) return isValidCpf(clean)
  if (clean.length === 14) return isValidCnpj(clean)
  return false
}

export const isValidNumericCnpj = isValidCnpj
export const isValidAlphanumericCnpj = isValidCnpj
export const isValidCpfCnpjGeneral = isValidCpfCnpj

