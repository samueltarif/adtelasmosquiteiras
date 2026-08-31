import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import crypto from 'crypto'

const staticFiles = [
  // 1. UI Pages & Composables (Fase 5.0D)
  'app/pages/admin/agenda/index.vue',
  'app/pages/admin/equipe/index.vue',
  'app/pages/admin/ordens-servico/nova.vue',
  'app/pages/admin/ordens-servico/[id].vue',
  'app/pages/admin/clientes/index.vue',
  'app/pages/admin/clientes/[id].vue',
  'app/pages/admin/leads.vue',
  'app/pages/admin/galeria.vue',
  'app/pages/orcamento.vue',
  'app/pages/contato.vue',
  'app/components/MediaUploader.vue',
  'app/components/PhotoUploader.vue',
  'app/components/SocialButtons.vue',
  'app/components/Breadcrumb.vue',
  'app/components/Footer.vue',
  'app/components/ui/switch/Switch.vue',
  'app/composables/useCrmAgenda.ts',
  'app/composables/useCrmStaff.ts',
  'app/composables/useModalA11y.ts',
  'app/composables/useFormSubmit.js',
  'app/composables/useLeadJourneyMedia.ts',
  'app/composables/useLightboxZoom.ts',
  'app/types/crmAppointments.ts',
  'app/utils/crmDateTime.ts',
  'app/utils/crmAgendaErrors.ts',
  'app/utils/phone.ts',
  'app/layouts/admin.vue',

  // 2. UI Components (Agenda + Staff + Work Orders + CRM + Gallery)
  'app/components/admin/agenda/AgendaHeader.vue',
  'app/components/admin/agenda/AgendaWeekView.vue',
  'app/components/admin/agenda/AgendaDayView.vue',
  'app/components/admin/agenda/AgendaListView.vue',
  'app/components/admin/agenda/AgendaMonthView.vue',
  'app/components/admin/agenda/AppointmentCard.vue',
  'app/components/admin/agenda/AppointmentDetailSheet.vue',
  'app/components/admin/agenda/AppointmentCreateModal.vue',
  'app/components/admin/agenda/AppointmentRescheduleModal.vue',
  'app/components/admin/agenda/AppointmentEditModal.vue',
  'app/components/admin/agenda/AppointmentCancelDialog.vue',
  'app/components/admin/staff/StaffHeader.vue',
  'app/components/admin/staff/StaffListTable.vue',
  'app/components/admin/staff/StaffListCards.vue',
  'app/components/admin/staff/StaffFormModal.vue',
  'app/components/admin/staff/StaffDeactivateDialog.vue',
  'app/components/admin/work-orders/WorkOrderAppointmentsSection.vue',
  'app/components/admin/work-orders/WorkOrderGeneralEditModal.vue',
  'app/components/admin/work-orders/WorkOrderStatusModal.vue',
  'app/components/admin/work-orders/WorkOrderMeasurementsTable.vue',
  'app/components/admin/work-orders/WorkOrderMeasurementModal.vue',
  'app/components/admin/work-orders/WorkOrderItemsManager.vue',
  'app/components/admin/work-orders/WorkOrderItemModal.vue',
  'app/components/admin/work-orders/WorkOrderProposalsManager.vue',
  'app/components/admin/work-orders/WorkOrderMediaGallery.vue',
  'app/components/admin/work-orders/WorkOrderMediaUploader.vue',
  'app/components/admin/work-orders/WorkOrderMediaEditModal.vue',
  'app/components/admin/work-orders/WorkOrderNotesManager.vue',
  'app/components/admin/crm/LeadConversionModal.vue',
  'app/components/admin/crm/ClientListTable.vue',
  'app/components/admin/crm/ClientAddressManager.vue',
  'app/components/admin/crm/ClientNotesManager.vue',
  'app/components/admin/crm/ClientActivityTimeline.vue',
  'app/components/admin/crm/ClientDuplicateAlert.vue',
  'app/components/admin/LeadJourneyDrawer.vue',
  'app/components/admin/MediaLightbox.vue',
  'app/components/admin/TrafficChart.vue',
  'app/components/admin/gallery/GalleryUploadQueue.vue',
  'app/components/admin/gallery/GalleryMediaCard.vue',
  'app/components/admin/gallery/GalleryEditModal.vue',
  'app/components/admin/gallery/GalleryDeleteModal.vue',
  'app/components/Header.vue',

  // 3. Server Utils & Shared Modules
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
  'server/shared/adminMediaAuthCore.mjs',
  'server/redirectsMap.ts',

  // 4. Server BFF Handlers
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
  'server/api/admin/crm/staff/index.get.ts',
  'server/api/admin/crm/staff/index.post.ts',
  'server/api/admin/crm/staff/[id].patch.ts',
  'server/api/admin/crm/leads/[id]/convert.post.ts',
  'server/api/admin/crm/work-orders/index.post.ts',
  'server/api/admin/auth/login.post.ts',
  'server/api/admin/auth/logout.post.ts',
  'server/api/admin/auth/session.get.ts',
  'server/api/admin/analytics/initial.get.ts',

  // 5. Test Suites & Audits
  'scripts/test_admin_ui_phase5d.mjs',
  'scripts/test_admin_ui_phase5d_browser.mjs',
  'scripts/test_crm_phase5c1_bff.mjs',
  'scripts/test_admin_performance_patch1.mjs',
  'scripts/audit_git_diff_loc.mjs',
  'scripts/audit_loc_all.mjs',
  'scripts/scan_raw_logs.js',

  // 6. Config & Documentation
  'nuxt.config.ts',
  'package.json',
  'tsconfig.json',
  'docs/CRM_PHASE_5_IMPLEMENTATION.md',
  'docs/ANTIGRAVITY_HANDOFF.md',
  'implementation_plan.md'
]

// Extrai modificados via git status --porcelain=v1 -z seguro
const rawStatus = execSync('git status --porcelain=v1 -z', { encoding: 'buffer' })
const gitEntries = rawStatus.toString('utf8').split('\0').filter(Boolean)
const gitModifiedFiles = []

for (let i = 0; i < gitEntries.length; i++) {
  const entry = gitEntries[i]
  if (entry.length < 4) continue
  const xy = entry.slice(0, 2)
  const pathPart = entry.slice(3)
  
  if (pathPart.endsWith('.zip') || pathPart.endsWith('.sha256') || pathPart.includes('make_zip') || pathPart.includes('package_')) {
    continue
  }
  
  if (xy.includes('R')) {
    const orig = pathPart
    const dest = gitEntries[++i]
    if (dest && fs.existsSync(dest) && fs.statSync(dest).isFile()) {
      gitModifiedFiles.push(dest)
    }
  } else {
    if (fs.existsSync(pathPart) && fs.statSync(pathPart).isFile()) {
      gitModifiedFiles.push(pathPart)
    }
  }
}

const allFilesSet = new Set([...staticFiles, ...gitModifiedFiles])
const files = Array.from(allFilesSet).sort()

console.log('1. Verificando integridade física de todos os arquivos para o pacote da Fase 5.0D.9...')
const missing = files.filter(f => !fs.existsSync(f))
if (missing.length > 0) {
  console.error('ERRO: Arquivos ausentes (MISSING_LOCAL_IMPORTS blocker):', missing)
  process.exit(1)
}
console.log(`✓ Todos os ${files.length} arquivos confirmados fisicamente no disco.`)
console.log(`  MISSING_LOCAL_IMPORTS=0`)

const zipName = 'phase_5_0d9_delta_external_review.zip'
const zipPathDocs = `docs/${zipName}`
const zipPathRoot = zipName
const shaPathDocs = `docs/${zipName}.sha256`
const shaPathRoot = `${zipName}.sha256`

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
    $entryName = $f.Replace('\\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f, $entryName) | Out-Null
  }
  $zip.Dispose()
}
`

fs.writeFileSync('scripts/make_zip_temp_5d9.ps1', psScript)
execSync('powershell -ExecutionPolicy Bypass -File scripts/make_zip_temp_5d9.ps1')
try {
  fs.unlinkSync('scripts/make_zip_temp_5d9.ps1')
} catch (e) {
  // Ignore lock
}

// Validação de correspondência de implementation_plan.md dentro do ZIP
console.log('\n3. Validando conformidade interna de implementation_plan.md no ZIP...')
const verifyPs = `
Add-Type -AssemblyName 'System.IO.Compression'
Add-Type -AssemblyName 'System.IO.Compression.FileSystem'

$zip = [System.IO.Compression.ZipFile]::OpenRead('${zipPathDocs}')
$entry = $zip.GetEntry('implementation_plan.md')
if ($null -eq $entry) {
  Write-Error 'implementation_plan.md missing in zip'
  exit 1
}
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$zipPlan = $reader.ReadToEnd()
$reader.Dispose()
$stream.Dispose()
$zip.Dispose()

$rootPlan = [System.IO.File]::ReadAllText('implementation_plan.md')

if ($zipPlan -eq $rootPlan) {
  Write-Output 'FINAL_ZIP_INTERNAL_PLAN_MATCH=YES'
} else {
  Write-Error 'FINAL_ZIP_INTERNAL_PLAN_MATCH=FAIL'
  exit 1
}
`
const verifyOutput = execSync(`powershell -ExecutionPolicy Bypass -Command "${verifyPs.replace(/"/g, '\\"')}"`, { encoding: 'utf8' })
console.log(verifyOutput.trim())

// Calcula SHA-256
const zipBuffer = fs.readFileSync(zipPathDocs)
const sha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex').toUpperCase()
fs.writeFileSync(shaPathDocs, `${sha256}  ${zipName}\n`)
fs.writeFileSync(shaPathRoot, `${sha256}  ${zipName}\n`)

console.log(`\n======================================================================`)
console.log(`FASE 5.0D.9 — FINAL EXTERNAL REVIEW PACKAGE GERADO COM SUCESSO!`)
console.log(`EXTERNAL_REVIEW_PACKAGE_FILE_COUNT=${files.length}`)
console.log(`MISSING_LOCAL_IMPORTS=0`)
console.log(`FINAL_ZIP_INTERNAL_PLAN_MATCH=YES`)
console.log(`Arquivo: ${zipPathDocs} (${zipBuffer.length} bytes)`)
console.log(`SHA-256: ${sha256}`)
console.log(`Sidecar: ${shaPathDocs}`)
console.log(`======================================================================\n`)
