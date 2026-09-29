/**
 * Gerador de Arquivos JSON para Exportação
 * Arquivo: server/utils/dashboard-export/exportJson.ts
 * Limite: <= 200 linhas
 */

import type { ExportMetadata } from '../../../app/types/dashboardExport.ts'
import type { ExportTable } from './exportDataBuilder.ts'

export function generateJsonExport(meta: ExportMetadata, tables: Record<string, ExportTable>): Buffer {
  const exportPayload: Record<string, any> = {
    metadata: meta,
    data: {}
  }

  for (const [key, table] of Object.entries(tables)) {
    exportPayload.data[key] = {
      title: table.title,
      headers: table.headers,
      total_rows: table.rows.length,
      records: table.rows.map(row => {
        const obj: Record<string, any> = {}
        table.headers.forEach((h, i) => {
          obj[h] = row[i]
        })
        return obj
      })
    }
  }

  const jsonStr = JSON.stringify(exportPayload, null, 2)
  return Buffer.from(jsonStr, 'utf-8')
}
