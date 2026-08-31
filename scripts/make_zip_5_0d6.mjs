import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import crypto from 'crypto'

// Lista canônica de todos os arquivos relevantes da aplicação, UI, backend, scripts, configs e documentação
const staticFiles = [
  // 1. Frontend Layouts & Pages
  'app/layouts/admin.vue',
  'app/pages/admin/agenda/index.vue',
  'app/pages/admin/equipe/index.vue',
  'app/pages/admin/ordens-servico/index.vue',
  'app/pages/admin/ordens-servico/nova.vue',
  'app/pages/admin/ordens-servico/[id].vue',
  'app/pages/admin/clientes/index.vue',
  'app/pages/admin/clientes/novo.vue',
  'app/pages/admin/clientes/[id].vue',
  'app/pages/admin/configuracoes/empresa.vue',
  'app/pages/admin/dashboard.vue',
  'app/pages/admin/galeria.vue',
  'app/pages/admin/leads.vue',
  'app/pages/contato.vue',
  'app/pages/orcamento.vue',

  // 2. Agenda Components (11)
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

  // 3. Staff Components (5)
  'app/components/admin/staff/StaffHeader.vue',
  'app/components/admin/staff/StaffListTable.vue',
  'app/components/admin/staff/StaffListCards.vue',
  'app/components/admin/staff/StaffFormModal.vue',
  'app/components/admin/staff/StaffDeactivateDialog.vue',

  // 4. Work Order Components & Other Admin Components
  'app/components/admin/work-orders/WorkOrderAppointmentsSection.vue',
  'app/components/admin/work-orders/WorkOrderMeasurementsTable.vue',
  'app/components/admin/work-orders/WorkOrderMeasurementModal.vue',
  'app/components/admin/work-orders/WorkOrderMediaGallery.vue',
  'app/components/admin/work-orders/WorkOrderMediaEditModal.vue',
  'app/components/admin/work-orders/WorkOrderMediaUploader.vue',
  'app/components/admin/work-orders/WorkOrderHeader.vue',
  'app/components/admin/work-orders/WorkOrderGeneralEditModal.vue',
  'app/components/admin/work-orders/WorkOrderStatusModal.vue',
  'app/components/admin/work-orders/WorkOrderArchiveModal.vue',
  'app/components/admin/work-orders/WorkOrderActivityTimeline.vue',
  'app/components/admin/work-orders/WorkOrderNotesManager.vue',
  'app/components/admin/work-orders/WorkOrderProposalsManager.vue',
  'app/components/admin/work-orders/WorkOrderProposalModal.vue',
  'app/components/admin/work-orders/WorkOrderProposalAcceptModal.vue',
  'app/components/admin/work-orders/WorkOrderItemsManager.vue',
  'app/components/admin/work-orders/WorkOrderItemModal.vue',
  'app/components/admin/work-orders/WorkOrderSummaryCards.vue',
  'app/components/admin/work-orders/WorkOrderListTable.vue',
  'app/components/admin/work-orders/WorkOrderListCards.vue',
  'app/components/admin/crm/ClientListTable.vue',
  'app/components/admin/crm/ClientListCards.vue',
  'app/components/admin/crm/ClientActivityTimeline.vue',
  'app/components/admin/crm/ClientAddressManager.vue',
  'app/components/admin/crm/ClientArchiveModal.vue',
  'app/components/admin/crm/ClientEditModal.vue',
  'app/components/admin/crm/ClientNotesManager.vue',
  'app/components/admin/crm/LeadConversionModal.vue',
  'app/components/admin/crm/ClientWorkOrdersReadOnly.vue',
  'app/components/admin/gallery/GalleryUploadQueue.vue',
  'app/components/admin/gallery/GalleryMediaCard.vue',
  'app/components/admin/gallery/GalleryEditModal.vue',
  'app/components/admin/gallery/GalleryDeleteModal.vue',
  'app/components/admin/AdminKpiCard.vue',
  'app/components/admin/LeadJourneyDrawer.vue',
  'app/components/admin/MediaLightbox.vue',
  'app/components/admin/RecentActivityFeed.vue',
  'app/components/admin/TrafficChart.vue',
  'app/components/admin/company/CompanyLogoUploader.vue',
  'app/components/services/ServicePublicGallery.vue',
  'app/components/services/ServicePublicLightbox.vue',
  'app/components/LeadForm.vue',
  'app/components/MediaUploader.vue',

  // 5. Frontend Composables, Utils, Middleware, Plugins & Types
  'app/composables/useCrmAgenda.ts',
  'app/composables/useCrmStaff.ts',
  'app/composables/useModalA11y.ts',
  'app/composables/useLeadJourneyMedia.ts',
  'app/composables/useAdminAuth.ts',
  'app/composables/useAdminAnalytics.ts',
  'app/composables/useAdminSiteMedia.ts',
  'app/composables/useSiteMediaUpload.ts',
  'app/composables/useLightboxZoom.ts',
  'app/composables/useLeadMediaUploadQueue.ts',
  'app/composables/useFormSubmit.js',
  'app/composables/useGATracking.js',
  'app/utils/crmDateTime.ts',
  'app/utils/crmAgendaErrors.ts',
  'app/utils/phone.ts',
  'app/utils/formConversion.js',
  'app/utils/leadMediaPipeline.ts',
  'app/utils/leadMediaSelection.ts',
  'app/utils/ctaTaxonomy.ts',
  'app/types/crmAppointments.ts',
  'app/types/siteMedia.ts',
  'app/middleware/admin-auth.global.ts',
  'app/plugins/track-clicks.client.ts',

  // 6. Server BFF Handlers
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
  'server/api/admin/crm/clients/index.get.ts',
  'server/api/admin/crm/clients/search.post.ts',
  'server/api/admin/crm/clients/[id]/activity.get.ts',
  'server/api/admin/crm/clients/[id]/notes.get.ts',
  'server/api/admin/crm/clients/[id]/work-orders.get.ts',
  'server/api/admin/crm/leads/[id]/convert.post.ts',
  'server/api/admin/auth/login.post.ts',
  'server/api/admin/auth/logout.post.ts',
  'server/api/admin/auth/session.get.ts',
  'server/api/admin/analytics/initial.get.ts',

  // 7. Server Utils & Shared Modules
  'server/utils/crm.ts',
  'server/utils/crmAppointmentHelpers.ts',
  'server/utils/crmAppointmentErrors.ts',
  'server/utils/crmDuplicateSearch.ts',
  'server/shared/appointmentValidation.mjs',
  'server/shared/appointmentErrorMap.mjs',
  'server/shared/appointmentTypes.ts',
  'server/shared/crmValidation.mjs',
  'server/utils/adminAuth.ts',
  'server/utils/adminAuthCookies.ts',
  'server/utils/adminAuthSession.ts',
  'server/utils/adminAnalytics.ts',
  'server/shared/adminAuthCore.mjs',
  'server/shared/adminAnalyticsCore.mjs',
  'server/shared/adminAnalyticsActivity.mjs',
  'server/shared/adminAnalyticsClassification.mjs',
  'server/shared/adminAnalyticsDateRange.mjs',
  'server/shared/adminAnalyticsMetrics.mjs',

  // 8. Test Suites & Config
  'scripts/test_admin_ui_phase5d.mjs',
  'scripts/test_admin_ui_phase5d_browser.mjs',
  'scripts/test_crm_phase5c1_bff.mjs',
  'scripts/test_admin_performance_patch1.mjs',
  'scripts/audit_git_diff_loc.mjs',
  'scripts/audit_loc_all.mjs',
  'scripts/scan_raw_logs.js',
  'nuxt.config.ts',
  'package.json',
  'tsconfig.json',

  // 9. Documentation
  'docs/CRM_PHASE_5_IMPLEMENTATION.md',
  'docs/ANTIGRAVITY_HANDOFF.md',
  'docs/ADMIN_PERFORMANCE_PATCH_1_DOCUMENTATION.md',
  'implementation_plan.md'
]

// Obtém arquivos modificados pelo git status --porcelain=v1 -z
const rawBuffer = execSync('git status --porcelain=v1 -z')
const tokens = rawBuffer.toString('utf8').split('\0').filter(Boolean)
const gitModifiedFiles = []
for (let i = 0; i < tokens.length; i++) {
  const entry = tokens[i]
  if (entry.length < 3) continue
  const statusXY = entry.substring(0, 2)
  const filePath = entry.substring(3)
  if (filePath && !filePath.endsWith('.zip') && !filePath.endsWith('.sha256') && !filePath.includes('make_zip')) {
    gitModifiedFiles.push(filePath)
  }
  if ((statusXY[0] === 'R' || statusXY[0] === 'C') && i + 1 < tokens.length) {
    i++
    const destPath = tokens[i]
    if (destPath && !destPath.endsWith('.zip') && !destPath.endsWith('.sha256') && !destPath.includes('make_zip')) {
      gitModifiedFiles.push(destPath)
    }
  }
}

// Expande diretórios se houver
const expandedGitFiles = []
function collect(fPath) {
  if (!fs.existsSync(fPath)) return
  const stat = fs.statSync(fPath)
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(fPath)
    for (const e of entries) {
      collect(path.join(fPath, e))
    }
  } else {
    expandedGitFiles.push(fPath.replace(/\\/g, '/'))
  }
}
for (const gf of gitModifiedFiles) {
  collect(gf)
}

const allFilesSet = new Set([...staticFiles, ...expandedGitFiles])
const files = Array.from(allFilesSet).sort()

console.log('1. Verificando existência de todos os arquivos para o pacote da Fase 5.0D.6...')
const missing = files.filter(f => !fs.existsSync(f))
if (missing.length > 0) {
  console.error('ERRO: Arquivos ausentes:', missing)
  process.exit(1)
}
console.log(`✓ Todos os ${files.length} arquivos confirmados fisicamente no disco.`)

const zipPathDocs = 'docs/phase_5_0d6_delta_external_review.zip'
const zipPathRoot = 'phase_5_0d6_delta_external_review.zip'
const shaPathDocs = 'docs/phase_5_0d6_delta_external_review.zip.sha256'
const shaPathRoot = 'phase_5_0d6_delta_external_review.zip.sha256'

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

fs.writeFileSync('scripts/make_zip_temp.ps1', psScript)
execSync('powershell -ExecutionPolicy Bypass -File scripts/make_zip_temp.ps1')
fs.unlinkSync('scripts/make_zip_temp.ps1')

// 3. Reabrindo o ZIP para confirmar que implementation_plan.md interno registra exatamente a fase atual
console.log('\n3. Reabrindo ZIP para validação do implementation_plan.md interno...')
const checkPsScript = `
Add-Type -AssemblyName 'System.IO.Compression.FileSystem'
$zip = [System.IO.Compression.ZipFile]::OpenRead('${zipPathDocs}')
$entry = $zip.GetEntry('implementation_plan.md')
if ($entry -eq $null) {
  Write-Error "implementation_plan.md nao encontrado no zip!"
  exit 1
}
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$text = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

if ($text -like "*PATCH_5_0D_6_STATUS=COMPLETE_VALIDATED*") {
  Write-Host "MATCH: implementation_plan.md interno registra FASE_5_0D.6 e PATCH_5_0D_6_STATUS=COMPLETE_VALIDATED"
} else {
  Write-Error "DIVERGENCIA: implementation_plan.md interno nao contem PATCH_5_0D_6_STATUS=COMPLETE_VALIDATED"
  exit 1
}
`
fs.writeFileSync('scripts/check_zip_temp.ps1', checkPsScript)
const checkOut = execSync('powershell -ExecutionPolicy Bypass -File scripts/check_zip_temp.ps1', { encoding: 'utf8' })
console.log(checkOut.trim())
fs.unlinkSync('scripts/check_zip_temp.ps1')

// 4. Calcula SHA-256 e gera sidecars
const zipBuffer = fs.readFileSync(zipPathDocs)
const sha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex').toUpperCase()
fs.writeFileSync(shaPathDocs, `${sha256}  phase_5_0d6_delta_external_review.zip\n`)
fs.writeFileSync(shaPathRoot, `${sha256}  phase_5_0d6_delta_external_review.zip\n`)

console.log(`\n======================================================================`)
console.log(`PACOTE 5.0D.6 GERADO COM SUCESSO!`)
console.log(`FINAL_ZIP_INTERNAL_PLAN_MATCH=YES`)
console.log(`GIT_DIFF_FILE_COUNT=${gitModifiedFiles.length}`)
console.log(`EXTERNAL_REVIEW_PACKAGE_FILE_COUNT=${files.length}`)
console.log(`REVIEW_PACKAGE_COVERS_DEPLOY_DIFF=YES`)
console.log(`Arquivo: ${zipPathDocs} (${zipBuffer.length} bytes)`)
console.log(`SHA-256: ${sha256}`)
console.log(`Sidecar: ${shaPathDocs}`)
console.log(`======================================================================\n`)
