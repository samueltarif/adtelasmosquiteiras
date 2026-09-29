/**
 * Gerador de Arquivos CSV para Exportação
 * Arquivo: server/utils/dashboard-export/exportCsv.ts
 * Limite: <= 200 linhas
 */

import { buildCsvString } from './exportSanitizer.ts'
import type { ExportTable } from './exportDataBuilder.ts'


export function generateCsvFromTable(table: ExportTable): Buffer {
  const csvContent = buildCsvString(table.headers, table.rows)
  return Buffer.from(csvContent, 'utf-8')
}
