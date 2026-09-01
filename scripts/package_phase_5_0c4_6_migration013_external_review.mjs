import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import crypto from 'crypto'

const requiredFiles = [
  // 1. Full Database Schema & All Manual Migrations (001 to 013)
  'supabase/export/schema_full.sql',
  'supabase/manual/001_v2_analytics_and_callbacks.sql',
  'supabase/manual/002_fix_admin_rls.sql',
  'supabase/manual/003_phase_b_identity_attribution_idempotency.sql',
  'supabase/manual/004_cta_service_tracking.sql',
  'supabase/manual/005_reset_admin_analytics_data.sql',
  'supabase/manual/006_lead_email_delivery_state.sql',
  'supabase/manual/007_lead_media_storage.sql',
  'supabase/manual/008_admin_auth.sql',
  'supabase/manual/009_service_media_storage.sql',
  'supabase/manual/010_crm_core_tables.sql',
  'supabase/manual/011_crm_work_order_proposals.sql',
  'supabase/manual/012_crm_appointments_and_staff_engine.sql',
  'supabase/manual/013_work_order_terminal_appointment_invariant.sql',

  // 2. Server Shared & Utils Modules (Closure de Importações)
  'server/utils/adminAuth.ts',
  'server/utils/adminAuthCookies.ts',
  'server/utils/adminAuthSession.ts',
  'server/shared/adminAuthCore.mjs',
  'server/shared/adminMediaAuthCore.mjs',
  'server/utils/crm.ts',
  'server/utils/crmDuplicateSearch.ts',
  'server/utils/crmAppointmentErrors.ts',
  'server/utils/crmAppointmentHelpers.ts',
  'server/shared/appointmentValidation.mjs',
  'server/shared/appointmentErrorMap.mjs',
  'server/shared/appointmentTypes.ts',
  'server/shared/crmValidation.mjs',

  // 3. Server API Handlers (16 BFF Handlers Executados no Teste BFF)
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
  'server/api/admin/crm/work-orders/index.post.ts',
  'server/api/admin/crm/staff/index.get.ts',
  'server/api/admin/crm/staff/index.post.ts',
  'server/api/admin/crm/staff/[id].patch.ts',
  'server/api/admin/crm/leads/[id]/convert.post.ts',

  // 4. Test Suites & Complete Helper Tree
  'scripts/test_crm_migration013_local.mjs',
  'scripts/test_crm_phase5c1_bff.mjs',
  'scripts/migration012/baseline-setup.mjs',
  'scripts/migration012/helpers.mjs',
  'scripts/migration012/business-rules-tests.mjs',
  'scripts/migration012/concurrency-tests.mjs',
  'scripts/migration012/constraints-tests.mjs',
  'scripts/migration012/deadlock-cross-rpc-tests.mjs',
  'scripts/migration012/rpc-lifecycle-tests.mjs',
  'scripts/migration012/security-privileges-tests.mjs',

  // 5. Node Dependencies & Config
  'package.json',
  'package-lock.json',
  'nuxt.config.ts',
  'tsconfig.json',

  // 6. Canonical Governance Documentation
  'docs/ANTIGRAVITY_HANDOFF.md',
  'docs/CRM_PHASE_5_IMPLEMENTATION.md',
  'docs/CRM_PHASE_5D_COMPREHENSIVE_REPORT.md',
  'implementation_plan.md'
]

console.log('1. Verificando existência estrita de todos os arquivos requeridos (FAIL-CLOSED)...')
const missing = requiredFiles.filter(f => !fs.existsSync(f))
if (missing.length > 0) {
  console.error('ERRO FATAL: Arquivos obrigatórios ausentes no repositório:', missing)
  process.exit(1)
}
console.log(`✓ Todos os ${requiredFiles.length} arquivos obrigatórios confirmados fisicamente no disco.`)

const zipPathDocs = 'docs/phase_5_0c4_6_migration013_external_review.zip'
const zipPathRoot = 'phase_5_0c4_6_migration013_external_review.zip'
const shaPathDocs = 'docs/phase_5_0c4_6_migration013_external_review.zip.sha256'
const shaPathRoot = 'phase_5_0c4_6_migration013_external_review.zip.sha256'

console.log('\n2. Criando pacotes ZIP canônicos com closure completa de dependências...')
const psScript = `
Add-Type -AssemblyName 'System.IO.Compression'
Add-Type -AssemblyName 'System.IO.Compression.FileSystem'

$files = @(
${requiredFiles.map(f => `  '${f.replace(/'/g, "''")}'`).join(',\n')}
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
  Write-Host "ZIP gerado: $zipPath"
}
`

const tempPsFile = 'scripts/make_zip_temp_5c4_6.ps1'
fs.writeFileSync(tempPsFile, psScript, 'utf8')
execSync(`powershell -ExecutionPolicy Bypass -File ${tempPsFile}`, { stdio: 'inherit' })
if (fs.existsSync(tempPsFile)) {
  fs.unlinkSync(tempPsFile)
}

console.log('\n3. Calculando e gerando arquivos sidecar SHA-256 a partir do ZIP físico...')
const zipBuffer = fs.readFileSync(zipPathRoot)
const zipSha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex').toUpperCase()

fs.writeFileSync(shaPathRoot, `${zipSha256}  phase_5_0c4_6_migration013_external_review.zip\n`, 'utf8')
fs.writeFileSync(shaPathDocs, `${zipSha256}  phase_5_0c4_6_migration013_external_review.zip\n`, 'utf8')

console.log(`\n=================================================================`)
console.log(`PACOTE DE REVISÃO EXTERNA PATCH 5.0C.4.6 GERADO COM SUCESSO:`)
console.log(`  Arquivo Raiz:     ${zipPathRoot}`)
console.log(`  Arquivo Docs:     ${zipPathDocs}`)
console.log(`  Total de Arquivos: ${requiredFiles.length}`)
console.log(`  Tamanho:          ${zipBuffer.length} bytes`)
console.log(`  SHA-256 ZIP:      ${zipSha256}`)
console.log(`=================================================================\n`)
