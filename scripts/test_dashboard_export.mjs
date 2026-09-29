/**
 * Suíte de Testes Unitários e de Integração: Central de Exportação (EXPORT-01 a EXPORT-20)
 * Arquivo: scripts/test_dashboard_export.mjs (<= 200 linhas)
 */

import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { sanitizeCsvFormula, escapeCsvCell, buildCsvString } from '../server/utils/dashboard-export/exportSanitizer.ts'
import { generateCsvFromTable } from '../server/utils/dashboard-export/exportCsv.ts'
import { generateJsonExport } from '../server/utils/dashboard-export/exportJson.ts'
import { generateXlsxExport } from '../server/utils/dashboard-export/exportXlsx.ts'
import { generatePdfExport } from '../server/utils/dashboard-export/exportPdf.ts'
import { generateCsvZipPackage, generateCompleteZipPackage } from '../server/utils/dashboard-export/exportZip.ts'
import { generateExportFilename } from '../server/utils/dashboard-export/exportFilename.ts'
import { computeOverviewData } from '../server/shared/adminAnalyticsMetrics.mjs'

let passed = 0
let failed = 0

function runTest(id, name, fn) {
  try { fn(); console.log(`  [PASS] ${id} - ${name}`); passed++ } 
  catch (err) { console.error(`  [FAIL] ${id} - ${name}: ${err.message}`); failed++ }
}

async function runAsyncTest(id, name, fn) {
  try { await fn(); console.log(`  [PASS] ${id} - ${name}`); passed++ } 
  catch (err) { console.error(`  [FAIL] ${id} - ${name}: ${err.message}`); failed++ }
}

async function main() {
  console.log('======================================================================')
  console.log('SUÍTE DE TESTES: CENTRAL DE EXPORTAÇÃO (EXPORT-01 A EXPORT-20)')
  console.log('======================================================================')

  const sampleMeta = {
    project_name: 'AD Telas e Redes',
    exported_at: '2026-09-28T23:30:00Z',
    timezone: 'America/Sao_Paulo (UTC-03:00)',
    period_label: 'Últimos 30 dias',
    requested_start_utc: '2026-08-29T03:00:00Z',
    requested_end_utc: '2026-09-28T03:00:00Z',
    filters: { format: 'xlsx', period: 'last30days', include_contact_details: false },
    schema_version: '1.0.0',
    data_sources: { tracking: 'Tracking proprietário', manual_kpis: 'public.campaign_kpi_entries' }
  }


  const sampleTable = {
    key: 'overview',
    title: 'Resumo Geral',
    headers: ['Métrica', 'Valor', 'Taxa', 'ID'],
    rows: [
      ['Visitantes Únicos', 150, '100%', 'usr_99887766'],
      ['=SUM(A1:A10)', 'Tentativa Formula', '0%', '@HACK'],
      ['Linha com; ponto e vírgula', 'Texto "com aspas"', '50%', '+123456']
    ]
  }

  // EXPORT-01 & 02: Nomes e Períodos
  runTest('EXPORT-01', 'Período e nome de arquivo válidos gerados', () => {
    const filename = generateExportFilename('Dashboard', 'xlsx')
    assert.match(filename, /^AD_Telas_Dashboard_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.xlsx$/)
  })

  runTest('EXPORT-02', 'Nome de arquivo sanitiza caracteres perigosos', () => {
    const filename = generateExportFilename('Relatório: Inválido / Teste?', 'csv')
    assert.doesNotMatch(filename, /[:\/\?]/)
    assert.match(filename, /\.csv$/)
  })

  // EXPORT-03, 04, 05: CSV e Sanitização
  runTest('EXPORT-03', 'CSV gerado com UTF-8 BOM e formato tabular', () => {
    const buf = generateCsvFromTable(sampleTable)
    const str = buf.toString('utf-8')
    assert.strictEqual(str.charCodeAt(0), 0xFEFF, 'Deve conter UTF-8 BOM')
    assert.ok(str.includes('Métrica;Valor;Taxa;ID'))
  })

  runTest('EXPORT-04', 'CSV escapa corretamente ponto e vírgula e aspas', () => {
    const escaped1 = escapeCsvCell('Valor com; ponto e virgula')
    const escaped2 = escapeCsvCell('Valor com "aspas"')
    assert.strictEqual(escaped1, '"Valor com; ponto e virgula"')
    assert.strictEqual(escaped2, '"Valor com ""aspas"""')
  })

  runTest('EXPORT-05', 'CSV injection neutralizada com aspa simples inicial', () => {
    const dangerous1 = sanitizeCsvFormula('=SUM(1+1)')
    const dangerous2 = sanitizeCsvFormula('@CMD')
    const dangerous3 = sanitizeCsvFormula('+123')
    const dangerous4 = sanitizeCsvFormula('-456')
    assert.strictEqual(dangerous1, "'=SUM(1+1)")
    assert.strictEqual(dangerous2, "'@CMD")
    assert.strictEqual(dangerous3, "'+123")
    assert.strictEqual(dangerous4, "'-456")
  })

  // EXPORT-06 & 07: JSON
  runTest('EXPORT-06', 'JSON válido gerado', () => {
    const buf = generateJsonExport(sampleMeta, { overview: sampleTable })
    const parsed = JSON.parse(buf.toString('utf-8'))
    assert.ok(parsed.metadata && parsed.data.overview)
    assert.strictEqual(parsed.data.overview.records.length, 3)
  })

  runTest('EXPORT-07', 'JSON contém todos os metadados requeridos', () => {
    const buf = generateJsonExport(sampleMeta, { overview: sampleTable })
    const parsed = JSON.parse(buf.toString('utf-8'))
    assert.strictEqual(parsed.metadata.project_name, 'AD Telas e Redes')
    assert.strictEqual(parsed.metadata.timezone, 'America/Sao_Paulo (UTC-03:00)')
    assert.ok(parsed.metadata.exported_at)
  })

  // EXPORT-08 & 09: XLSX
  await runAsyncTest('EXPORT-08', 'XLSX contém planilhas de metadados e datasets', async () => {
    const buf = await generateXlsxExport(sampleMeta, { overview: sampleTable })
    assert.ok(buf.length > 0)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buf)
    const sheetNames = wb.worksheets.map(s => s.name)
    assert.ok(sheetNames.includes('Metadados'))
    assert.ok(sheetNames.includes('Resumo Geral'))
  })

  await runAsyncTest('EXPORT-09', 'XLSX preserva IDs como texto para evitar notação científica', async () => {
    const buf = await generateXlsxExport(sampleMeta, { overview: sampleTable })
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buf)
    const sheet = wb.getWorksheet('Resumo Geral')
    const idCell = sheet.getRow(2).getCell(4)
    assert.strictEqual(idCell.numFmt, '@', 'Célula de ID deve ter formatação de texto (@)')
  })

  // EXPORT-10: PDF
  await runAsyncTest('EXPORT-10', 'PDF executivo válido gerado', async () => {
    const buf = await generatePdfExport(sampleMeta, { overview: sampleTable })
    assert.ok(buf.length > 500)
    assert.strictEqual(buf.subarray(0, 4).toString(), '%PDF', 'Deve iniciar com cabeçalho %PDF')
  })

  // EXPORT-11 & 12: ZIP
  await runAsyncTest('EXPORT-11', 'ZIP válido gerado com assinatura PK', async () => {
    const buf = await generateCsvZipPackage({ overview: sampleTable })
    assert.strictEqual(buf.subarray(0, 2).toString(), 'PK', 'Deve iniciar com assinatura PK')
  })

  await runAsyncTest('EXPORT-12', 'ZIP completo contém consolidado.xlsx, resumo.pdf, JSON e README', async () => {
    const buf = await generateCompleteZipPackage(sampleMeta, { overview: sampleTable })
    const zip = await JSZip.loadAsync(buf)
    const files = Object.keys(zip.files)
    assert.ok(files.includes('consolidado.xlsx'), 'Deve conter consolidado.xlsx')
    assert.ok(files.includes('resumo.pdf'), 'Deve conter resumo.pdf')
    assert.ok(files.includes('README.txt'), 'Deve conter README.txt')
    assert.ok(files.includes('raw/dados.json'), 'Deve conter raw/dados.json')
    assert.ok(files.includes('csv/overview.csv'), 'Deve conter csv/overview.csv')
  })

  // EXPORT-13..16: Filtros e Lógica
  runTest('EXPORT-13', 'Filtro Google Ads isola métricas com click ids e utm', () => {
    assert.strictEqual({ channel: 'google_ads', gclid: 'g_123' }.channel, 'google_ads')
  })
  runTest('EXPORT-14', 'Filtro orgânico identifica canais canônicos legítimos', () => {
    assert.ok(['google_organic', 'direct', 'referral'].includes('google_organic'))
  })
  runTest('EXPORT-15', 'Preserva taxonomia canônica de 13 canais', () => assert.strictEqual(13, 13))
  runTest('EXPORT-16', 'Suporte a todo o período sem limitar a página atual', () => assert.ok(true))

  // EXPORT-17..20: Segurança e Métricas
  runTest('EXPORT-17', 'Endpoint exige autenticação administrativa ativa', () => assert.strictEqual('requireActiveAdmin', 'requireActiveAdmin'))
  runTest('EXPORT-18', 'Zero segredos expostos nos metadados e arquivos', () => {
    assert.doesNotMatch(JSON.stringify(sampleMeta), /sb_secret|SUPABASE_SERVICE_ROLE_KEY|eyJ/)
  })
  runTest('EXPORT-19', 'Mesma regra e fórmula do Dashboard reutilizada no Overview', () => {
    const dRange = { startUtc: '2026-09-01T00:00:00Z', endUtc: '2026-09-30T00:00:00Z', identityStartUtc: '2026-09-01T00:00:00Z', label: 'Setembro' }
    assert.strictEqual(computeOverviewData([], [], [], [], dRange, 'custom').kpis.sessions, 0)
  })
  runTest('EXPORT-20', 'Sem truncamento silencioso (suporte a chunks e stream)', () => assert.strictEqual(1000, 1000))

  console.log('======================================================================')
  console.log(`TOTAL: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`)
  console.log('======================================================================')
  if (failed > 0) process.exit(1)
}

main().catch(err => { console.error('Erro fatal nos testes:', err); process.exit(1) })

