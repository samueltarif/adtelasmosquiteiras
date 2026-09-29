/**
 * Gerador de Pacotes Compactados ZIP (JSZip)
 * Suporta ZIP com múltiplos CSVs e Pacote Completo Consolidado
 * Arquivo: server/utils/dashboard-export/exportZip.ts
 * Limite: <= 200 linhas
 */

import JSZip from 'jszip'
import type { ExportMetadata } from '../../../app/types/dashboardExport.ts'
import type { ExportTable } from './exportDataBuilder.ts'
import { generateCsvFromTable } from './exportCsv.ts'
import { generateJsonExport } from './exportJson.ts'
import { generateXlsxExport } from './exportXlsx.ts'
import { generatePdfExport } from './exportPdf.ts'


export async function generateCsvZipPackage(tables: Record<string, ExportTable>): Promise<Buffer> {
  const zip = new JSZip()
  for (const [key, table] of Object.entries(tables)) {
    const csvBuffer = generateCsvFromTable(table)
    const filename = `${key.replace(/_/g, '-')}.csv`
    zip.file(filename, csvBuffer)
  }
  return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}

export async function generateCompleteZipPackage(
  meta: ExportMetadata,
  tables: Record<string, ExportTable>
): Promise<Buffer> {
  const zip = new JSZip()

  // 1. XLSX Consolidado
  const xlsxBuffer = await generateXlsxExport(meta, tables)
  zip.file('consolidado.xlsx', xlsxBuffer)

  // 2. PDF Executivo
  const pdfBuffer = await generatePdfExport(meta, tables)
  zip.file('resumo.pdf', pdfBuffer)

  // 3. Raw JSON
  const jsonBuffer = generateJsonExport(meta, tables)
  zip.folder('raw')?.file('dados.json', jsonBuffer)

  // 4. CSVs Individuais
  const csvFolder = zip.folder('csv')
  for (const [key, table] of Object.entries(tables)) {
    const csvBuf = generateCsvFromTable(table)
    csvFolder?.file(`${key.replace(/_/g, '-')}.csv`, csvBuf)
  }

  // 5. README.txt
  const readmeContent = [
    '======================================================================',
    'AD TELAS E REDES DE PROTEÇÃO — CENTRAL DE EXPORTAÇÃO ANALÍTICA',
    '======================================================================',
    '',
    `Data da Exportação: ${new Date(meta.exported_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    `Fuso Horário: ${meta.timezone}`,
    `Período: ${meta.period_label}`,
    `Início UTC: ${meta.requested_start_utc}`,
    `Fim UTC: ${meta.requested_end_utc}`,
    '',
    'ESTRUTURA DO PACOTE:',
    '  - /consolidado.xlsx : Planilha unificada formatada com todas as abas e métricas.',
    '  - /resumo.pdf       : Relatório executivo gerencial consolidado para visualização rápida.',
    '  - /raw/dados.json   : Estrutura completa dos dados em formato JSON com metadados.',
    '  - /csv/*.csv        : Arquivos CSV individuais em UTF-8 com BOM e sanitização de fórmulas.',
    '',
    'DATASETS INCLUÍDOS:',
    ...Object.entries(tables).map(([k, t]) => `  • [${k}] ${t.title} (${t.rows.length} registros)`),
    '',
    'FONTES DE DADOS:',
    `  - Tracking: ${meta.data_sources.tracking}`,
    `  - KPIs: ${meta.data_sources.manual_kpis}`,
    '======================================================================'
  ].join('\r\n')

  zip.file('README.txt', readmeContent)

  return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}
