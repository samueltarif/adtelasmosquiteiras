/**
 * Sanitizador de Fórmulas e Formatador de CSV (Defesa Contra CSV Injection)
 * Arquivo: server/utils/dashboard-export/exportSanitizer.ts
 * Limite: <= 200 linhas
 */

const FORMULA_INJECTION_CHARS = ['=', '+', '-', '@', '\t', '\r']

/**
 * Neutraliza tentativas de injeção de fórmulas no Excel / LibreOffice
 */
export function sanitizeCsvFormula(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (!str) return ''

  // Se inicia com caracteres perigosos, adiciona aspa simples inicial
  const firstChar = str.trimStart().charAt(0)
  if (FORMULA_INJECTION_CHARS.includes(firstChar)) {
    return `'${str}`
  }

  return str
}

/**
 * Escapa uma célula CSV para compatibilidade RFC 4180 e Excel brasileiro
 */
export function escapeCsvCell(value: any): string {
  const sanitized = sanitizeCsvFormula(value)
  if (sanitized === '') return ''

  const needsQuotes = 
    sanitized.includes(';') || 
    sanitized.includes(',') || 
    sanitized.includes('"') || 
    sanitized.includes('\n') || 
    sanitized.includes('\r')

  if (needsQuotes) {
    return `"${sanitized.replace(/"/g, '""')}"`
  }

  return sanitized
}

/**
 * Converte um array de linhas e colunas em string CSV com UTF-8 BOM
 */
export function buildCsvString(headers: string[], rows: any[][]): string {
  const bom = '\uFEFF'
  const headerLine = headers.map(h => escapeCsvCell(h)).join(';')
  const dataLines = rows.map(row => row.map(cell => escapeCsvCell(cell)).join(';'))
  return bom + [headerLine, ...dataLines].join('\r\n')
}
