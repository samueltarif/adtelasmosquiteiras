import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

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

// 1. Validar existência de todos os arquivos
console.log('1. Verificando existência de todos os arquivos...')
const missingFiles = files.filter(f => !fs.existsSync(f))
if (missingFiles.length > 0) {
  console.error('ERRO: Arquivos ausentes:', missingFiles)
  process.exit(1)
}
console.log(`✓ Todos os ${files.length} arquivos existem.`)

// 2. Validar programaticamente todos os imports locais relativos
console.log('\n2. Validando programaticamente todos os imports relativos...')
const fileSet = new Set(files.map(f => path.normalize(f).replace(/\\/g, '/')))
let missingImports = 0

for (const filePath of files) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.mjs') && !filePath.endsWith('.js')) continue
  const content = fs.readFileSync(filePath, 'utf8')
  const dir = path.dirname(filePath)

  // Regex para import ... from './...' ou '../...'
  const importRegex = /(?:import|export)\s+(?:.*?from\s+)?['"](\.[^'"]+)['"]/g
  let match
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1]
    const resolvedPath = path.normalize(path.join(dir, importPath)).replace(/\\/g, '/')
    
    // Tentar caminho exato ou extensões comuns (.ts, .mjs, .js, /index.ts)
    const candidates = [
      resolvedPath,
      `${resolvedPath}.ts`,
      `${resolvedPath}.mjs`,
      `${resolvedPath}.js`,
      `${resolvedPath}/index.ts`
    ]
    const found = candidates.some(c => fileSet.has(c) || fs.existsSync(c))
    if (!found) {
      console.error(`  [MISSING IMPORT] In ${filePath}: cannot resolve '${importPath}'`)
      missingImports++
    }
  }
}

console.log(`REVIEW_PACKAGE_MISSING_LOCAL_IMPORTS = ${missingImports}`)
if (missingImports > 0) {
  process.exit(1)
}

// 3. Criar ZIPs usando PowerShell System.IO.Compression
console.log('\n3. Criando pacotes ZIP...')
const psScript = `
Add-Type -AssemblyName 'System.IO.Compression'
Add-Type -AssemblyName 'System.IO.Compression.FileSystem'

$files = @(
${files.map(f => `  '${f}'`).join(',\n')}
)

$targetZips = @(
  'docs/admin_performance_patch_1_6_external_review.zip',
  'admin_performance_patch_1_6_external_review.zip'
)

foreach ($zipPath in $targetZips) {
  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
  $zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
  foreach ($f in $files) {
    $entryName = $f.Replace('\\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f, $entryName) | Out-Null
  }
  $zip.Dispose()
  $hash = (Get-FileHash $zipPath -Algorithm SHA256).Hash
  $size = (Get-Item $zipPath).Length
  Write-Host "Created: $zipPath ($size bytes) | SHA256: $hash"
}
`

fs.writeFileSync('scripts/make_zip_temp.ps1', psScript)
const zipOutput = execSync('powershell -ExecutionPolicy Bypass -File scripts/make_zip_temp.ps1').toString()
console.log(zipOutput)
fs.unlinkSync('scripts/make_zip_temp.ps1')
