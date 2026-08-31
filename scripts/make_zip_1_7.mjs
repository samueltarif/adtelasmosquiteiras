import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import crypto from 'crypto'

const files = [
  // Auth & Session
  'server/api/admin/auth/login.post.ts',
  'server/api/admin/auth/logout.post.ts',
  'server/api/admin/auth/session.get.ts',
  'server/utils/adminAuth.ts',
  'server/utils/adminAuthCookies.ts',
  'server/utils/adminAuthSession.ts',
  'server/shared/adminAuthCore.mjs',
  'server/shared/adminMediaAuthCore.mjs',

  // Frontend Composable & Middleware
  'app/composables/useAdminAuth.ts',
  'app/middleware/admin-auth.global.ts',

  // Analytics Aggregator
  'server/api/admin/analytics/initial.get.ts',
  'server/utils/adminAnalytics.ts',
  'server/shared/adminAnalyticsCore.mjs',
  'server/shared/adminAnalyticsClassification.mjs',
  'server/shared/adminAnalyticsMetrics.mjs',
  'server/shared/adminAnalyticsDateRange.mjs',
  'server/shared/adminAnalyticsActivity.mjs',

  // CRM Engine & Utilities
  'server/utils/crm.ts',
  'server/utils/crmAppointmentHelpers.ts',
  'server/utils/crmAppointmentErrors.ts',
  'server/shared/appointmentValidation.mjs',
  'server/shared/appointmentErrorMap.mjs',
  'server/shared/appointmentTypes.ts',
  'server/shared/crmValidation.mjs',
  'server/redirectsMap.ts',

  // CRM 16 Nitro Handlers
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

  // Types & Configs
  'app/types/crmAppointments.ts',
  'nuxt.config.ts',
  'package.json',
  'package-lock.json',
  'tsconfig.json',

  // Tests & Documentation
  'scripts/test_admin_performance_patch1.mjs',
  'scripts/test_crm_phase5c1_bff.mjs',
  'docs/CRM_PHASE_5_IMPLEMENTATION.md',
  'docs/ANTIGRAVITY_HANDOFF.md',
  'implementation_plan.md'
]

console.log('1. Verificando existência dos arquivos no repositório...')
const missing = files.filter(f => !fs.existsSync(f))
if (missing.length > 0) {
  console.error('ERRO: Arquivos ausentes:', missing)
  process.exit(1)
}
console.log(`✓ Todos os ${files.length} arquivos existem.`)

const zipPathDocs = 'docs/admin_performance_patch_1_7_external_review.zip'
const zipPathRoot = 'admin_performance_patch_1_7_external_review.zip'
const shaPathDocs = 'docs/admin_performance_patch_1_7_external_review.zip.sha256'
const shaPathRoot = 'admin_performance_patch_1_7_external_review.zip.sha256'

console.log('\n2. Criando pacotes ZIP...')
const psScript = `
Add-Type -AssemblyName 'System.IO.Compression'
Add-Type -AssemblyName 'System.IO.Compression.FileSystem'

$files = @(
${files.map(f => `  '${f}'`).join(',\n')}
)

$targetZips = @('${zipPathDocs}', '${zipPathRoot}')

foreach ($zipPath in $targetZips) {
  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
  $zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
  foreach ($f in $files) {
    $entryName = $f.Replace('\\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f, $entryName) | Out-Null
  }
  $zip.Dispose()
}
`

fs.writeFileSync('scripts/make_zip_temp.ps1', psScript)
execSync('powershell -ExecutionPolicy Bypass -File scripts/make_zip_temp.ps1')
fs.unlinkSync('scripts/make_zip_temp.ps1')

// Calcula SHA-256
const zipBuffer = fs.readFileSync(zipPathDocs)
const sha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex').toUpperCase()
fs.writeFileSync(shaPathDocs, `${sha256}  admin_performance_patch_1_7_external_review.zip\n`)
fs.writeFileSync(shaPathRoot, `${sha256}  admin_performance_patch_1_7_external_review.zip\n`)

console.log(`Created: ${zipPathDocs} (${zipBuffer.length} bytes)`)
console.log(`SHA256:  ${sha256}`)
console.log(`Sidecar: ${shaPathDocs}`)

// 3. Extrair em diretório temporário e validar imports contra o ZIP extraído
console.log('\n3. Extraindo ZIP para diretório temporário para validação real de imports...')
const extractDir = 'scratch/review_zip_extracted_1_7'
if (fs.existsSync(extractDir)) {
  fs.rmSync(extractDir, { recursive: true, force: true })
}
fs.mkdirSync(extractDir, { recursive: true })

const psExtract = `
Add-Type -AssemblyName 'System.IO.Compression.FileSystem'
[System.IO.Compression.ZipFile]::ExtractToDirectory('${zipPathDocs}', '${extractDir}')
`
fs.writeFileSync('scripts/extract_temp.ps1', psExtract)
execSync('powershell -ExecutionPolicy Bypass -File scripts/extract_temp.ps1')
fs.unlinkSync('scripts/extract_temp.ps1')

console.log('4. Validando programaticamente todos os imports relativos contra o ZIP extraído...')

function getAllFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList)
    } else {
      fileList.push(fullPath)
    }
  }
  return fileList
}

const extractedFiles = getAllFiles(extractDir)
let missingImports = 0

for (const fullFilePath of extractedFiles) {
  const relFilePath = path.relative(extractDir, fullFilePath).replace(/\\/g, '/')
  if (!relFilePath.endsWith('.ts') && !relFilePath.endsWith('.mjs') && !relFilePath.endsWith('.js')) continue

  const content = fs.readFileSync(fullFilePath, 'utf8')
  const dir = path.dirname(fullFilePath)

  const importRegex = /(?:import|export)\s+(?:.*?from\s+)?['"](\.[^'"]+)['"]/g
  let match
  while ((match = importRegex.exec(content)) !== null) {
    const importSpecifier = match[1]
    const resolvedBase = path.resolve(dir, importSpecifier)
    
    const candidates = [
      resolvedBase,
      `${resolvedBase}.ts`,
      `${resolvedBase}.mjs`,
      `${resolvedBase}.js`,
      path.join(resolvedBase, 'index.ts'),
      path.join(resolvedBase, 'index.mjs'),
      path.join(resolvedBase, 'index.js')
    ]

    const exists = candidates.some(c => fs.existsSync(c))
    if (!exists) {
      console.error(`  [MISSING IMPORT IN EXTRACTED ZIP] In ${relFilePath}: cannot resolve '${importSpecifier}'`)
      missingImports++
    }
  }
}

console.log(`\nREVIEW_PACKAGE_MISSING_LOCAL_IMPORTS = ${missingImports}`)

if (missingImports === 0) {
  console.log('✓ O pacote ZIP é 100% autossuficiente e livre de referências quebradas!')
} else {
  console.error(`❌ O pacote contém ${missingImports} imports relativos quebrados!`)
  process.exit(1)
}
