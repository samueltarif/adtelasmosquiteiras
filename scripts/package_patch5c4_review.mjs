import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import crypto from 'crypto'

const staticFiles = [
  // 1. Server Utils & Shared Modules
  'server/utils/adminAuth.ts',
  'server/utils/adminAuthCookies.ts',
  'server/utils/adminAuthSession.ts',
  'server/shared/adminAuthCore.mjs',
  'server/utils/crm.ts',
  'server/utils/crmDuplicateSearch.ts',
  'server/utils/crmAppointmentErrors.ts',
  'server/utils/crmAppointmentHelpers.ts',
  'server/shared/appointmentValidation.mjs',
  'server/shared/appointmentErrorMap.mjs',
  'server/shared/appointmentTypes.ts',
  'server/shared/crmValidation.mjs',

  // 2. Server BFF Handlers (16)
  'server/api/admin/crm/appointments/index.get.ts',
  'server/api/admin/crm/appointments/index.post.ts',
  'server/api/admin/crm/appointments/search.post.ts',
  'server/api/admin/crm/appointments/[id]/index.get.ts',
  'server/api/admin/crm/appointments/[id]/index.patch.ts',
  'server/api/admin/crm/appointments/[id]/reschedule.post.ts',
  'server/api/admin/crm/appointments/[id]/cancel.post.ts',
  'server/api/admin/crm/appointments/[id]/status.post.ts',
  'server/api/admin/crm/work-orders/[id]/appointments.get.ts',
  'server/api/admin/crm/work-orders/[id]/index.patch.ts',
  'server/api/admin/crm/work-orders/[id]/status.post.ts',
  'server/api/admin/crm/work-orders/index.get.ts',
  'server/api/admin/crm/work-orders/index.post.ts',
  'server/api/admin/crm/work-orders/search.post.ts',
  'server/api/admin/crm/work-orders/summary.get.ts',
  'server/api/admin/crm/staff/index.get.ts',
  'server/api/admin/crm/staff/index.post.ts',
  'server/api/admin/crm/staff/[id].patch.ts',
  'server/api/admin/crm/leads/[id]/convert.post.ts',
  'server/api/admin/crm/clients/search-duplicates.post.ts',
  'server/api/admin/crm/clients/index.post.ts',
  'server/api/admin/auth/login.post.ts',
  'server/api/admin/auth/logout.post.ts',
  'server/api/admin/auth/session.get.ts',
  'server/api/admin/analytics/initial.get.ts',

  // 3. Test Suites & Config
  'scripts/test_crm_phase5c1_bff.mjs',
  'scripts/test_admin_performance_patch1.mjs',
  'scripts/test_admin_ui_phase5d.mjs',
  'scripts/audit_git_diff_loc.mjs',
  'nuxt.config.ts',
  'package.json',
  'tsconfig.json',

  // 4. Documentation
  'docs/CRM_PHASE_5_IMPLEMENTATION.md',
  'docs/ANTIGRAVITY_HANDOFF.md',
  'docs/ADMIN_PERFORMANCE_PATCH_1_DOCUMENTATION.md',
  'implementation_plan.md'
]

const gitStatusOutput = execSync('git status --porcelain', { encoding: 'utf8' })
const gitModifiedFiles = gitStatusOutput
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.length > 0 && !l.endsWith('.zip') && !l.endsWith('.sha256') && !l.includes('make_zip') && !l.includes('package_'))
  .map(l => l.replace(/^[MADRCU?!]{1,2}\s+/, '').trim())
  .filter(f => fs.existsSync(f) && fs.statSync(f).isFile())

const allFilesSet = new Set([...staticFiles, ...gitModifiedFiles])
const files = Array.from(allFilesSet).sort()

console.log('1. Verificando existência de todos os arquivos para o pacote do Patch 5.0C.4...')
const missing = files.filter(f => !fs.existsSync(f))
if (missing.length > 0) {
  console.error('ERRO: Arquivos ausentes:', missing)
  process.exit(1)
}
console.log(`✓ Todos os ${files.length} arquivos confirmados fisicamente no disco.`)

const zipPathDocs = 'docs/phase_5_0c4_external_review.zip'
const zipPathRoot = 'phase_5_0c4_external_review.zip'
const shaPathDocs = 'docs/phase_5_0c4_external_review.zip.sha256'
const shaPathRoot = 'phase_5_0c4_external_review.zip.sha256'

console.log('\n2. Criando pacotes ZIP...')
const psScript = `
Add-Type -AssemblyName 'System.IO.Compression'
Add-Type -AssemblyName 'System.IO.Compression.FileSystem'

$files = @(
${files.map(f => `  '${f.replace(/'/g, "''")}'`).join(',\n')}
)

$targetZips = @('${zipPathDocs}', '${zipPathRoot}')

foreach ($zipPath in $targetZips) {
  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
  $zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
  foreach ($f in $files) {
    $entryName = $f.Replace('\\\\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f, $entryName) | Out-Null
  }
  $zip.Dispose()
}
`

fs.writeFileSync('scripts/make_zip_temp_5c4.ps1', psScript)
execSync('powershell -ExecutionPolicy Bypass -File scripts/make_zip_temp_5c4.ps1')
fs.unlinkSync('scripts/make_zip_temp_5c4.ps1')

// Calcula SHA-256
const zipBuffer = fs.readFileSync(zipPathDocs)
const sha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex').toUpperCase()
fs.writeFileSync(shaPathDocs, `${sha256}  phase_5_0c4_external_review.zip\n`)
fs.writeFileSync(shaPathRoot, `${sha256}  phase_5_0c4_external_review.zip\n`)

console.log(`\n======================================================================`)
console.log(`PACOTE DO PATCH 5.0C.4 GERADO COM SUCESSO!`)
console.log(`EXTERNAL_REVIEW_PACKAGE_FILE_COUNT=${files.length}`)
console.log(`Arquivo: ${zipPathDocs} (${zipBuffer.length} bytes)`)
console.log(`SHA-256: ${sha256}`)
console.log(`Sidecar: ${shaPathDocs}`)
console.log(`======================================================================\n`)
