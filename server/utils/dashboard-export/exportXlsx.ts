/**
 * Gerador de Arquivos XLSX com Múltiplas Planilhas (ExcelJS)
 * Arquivo: server/utils/dashboard-export/exportXlsx.ts
 * Limite: <= 200 linhas
 */

import ExcelJS from 'exceljs'
import type { ExportMetadata } from '../../../app/types/dashboardExport'
import type { ExportTable } from './exportDataBuilder'

export async function generateXlsxExport(meta: ExportMetadata, tables: Record<string, ExportTable>): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'AD Telas e Redes'
  workbook.created = new Date()

  // 1. Planilha de Metadados
  const metaSheet = workbook.addWorksheet('Metadados')
  metaSheet.columns = [
    { header: 'Propriedade', key: 'prop', width: 25 },
    { header: 'Valor', key: 'val', width: 55 }
  ]
  metaSheet.addRows([
    { prop: 'Projeto', val: meta.project_name },
    { prop: 'Data de Exportação', val: meta.exported_at },
    { prop: 'Fuso Horário', val: meta.timezone },
    { prop: 'Período', val: meta.period_label },
    { prop: 'Início UTC', val: meta.requested_start_utc },
    { prop: 'Fim UTC', val: meta.requested_end_utc },
    { prop: 'Formato', val: meta.filters.format.toUpperCase() },
    { prop: 'Fonte de Dados Tracking', val: meta.data_sources.tracking },
    { prop: 'Fonte de Dados KPIs', val: meta.data_sources.manual_kpis }
  ])
  metaSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  metaSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }

  // 2. Planilhas de cada Dataset
  for (const [key, table] of Object.entries(tables)) {
    // Nome da sheet <= 31 caracteres
    const sheetName = table.title.slice(0, 31).replace(/[:\\\/\?\*\[\]]/g, ' ')
    const sheet = workbook.addWorksheet(sheetName)

    // Configurar colunas
    sheet.columns = table.headers.map(h => ({
      header: h,
      key: h,
      width: Math.max(h.length + 4, 15)
    }))

    // Estilizar cabeçalho
    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

    // Congelar cabeçalho
    sheet.views = [{ state: 'frozen', ySplit: 1 }]

    // Inserir linhas
    for (const rowData of table.rows) {
      const row = sheet.addRow(rowData)
      
      // Formatação de células
      table.headers.forEach((h, colIndex) => {
        const cell = row.getCell(colIndex + 1)
        const headerLower = h.toLowerCase()

        // IDs como texto para não virar notação científica
        if (headerLower.includes('id') || headerLower.includes('código') || headerLower.includes('session')) {
          cell.numFmt = '@'
        }
        // Moeda
        else if (headerLower.includes('r$') || headerLower.includes('orçamento') || headerLower.includes('gasto') || headerLower.includes('receita')) {
          if (typeof cell.value === 'number') {
            cell.numFmt = '"R$"#,##0.00'
          }
        }
        // Números inteiros
        else if (typeof cell.value === 'number' && Number.isInteger(cell.value)) {
          cell.numFmt = '#,##0'
        }
      })
    }

    // Ativar autofiltro
    if (table.rows.length > 0) {
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: table.headers.length }
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
