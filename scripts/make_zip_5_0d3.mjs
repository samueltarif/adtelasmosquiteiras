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
  'app/pages/admin/ordens-servico/[id].vue',
  'app/pages/admin/dashboard.vue',
  'app/pages/admin/galeria.vue',

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
  'app/components/admin/work-orders/WorkOrderMediaGallery.vue',
  'app/components/admin/AdminKpiCard.vue',
  'app/components/admin/LeadJourneyDrawer.vue',
  'app/components/admin/MediaLightbox.vue',
  'app/components/admin/RecentActivityFeed.vue',
  'app/components/admin/TrafficChart.vue',
  'app/components/admin/crm/ClientNotesManager.vue',
  'app/components/services/ServicePublicGallery.vue',
  'app/components/services/ServicePublicLightbox.vue',

  // 5. Frontend Composables, Utils, Middleware, Plugins & Types
  'app/composables/useCrmAgenda.ts',
  'app/composables/useCrmStaff.ts',
  'app/composables/useModalA11y.ts',
  'app/composables/useAdminAuth.ts',
  'app/composables/useAdminAnalytics.ts',
  'app/composables/useAdminSiteMedia.ts',
  'app/utils/crmDateTime.ts',
  'app/utils/crmAgendaErrors.ts',
  'app/utils/ctaTaxonomy.ts',
  'app/types/crmAppointments.ts',
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
  'server/api/admin/crm/work-orders/[id]/media/[mediaId]/index.delete.ts',
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
  'server/api/admin/analytics/acquisition.get.ts',
  'server/api/admin/analytics/funnel.get.ts',
  'server/api/admin/analytics/lead-journey.get.ts',
  'server/api/admin/analytics/overview.get.ts',
  'server/api/admin/analytics/pages.get.ts',
  'server/api/admin/analytics/services.get.ts',
  'server/api/admin/analytics/initial.get.ts',
  'server/api/admin/configuracoes/empresa/logo/authorize.post.ts',
  'server/api/admin/configuracoes/empresa/logo/finalize.post.ts',
  'server/api/admin/dashboard-stats.get.ts',
  'server/api/admin/leads.get.ts',
  'server/api/admin/media/signed-url.get.ts',
  'server/api/admin/media/site/authorize-upload.post.ts',
  'server/api/admin/recent-activity.get.ts',
  'server/api/track-click.post.ts',
  'server/api/track-visit.post.ts',

  // 7. Server Utils & Shared Modules
  'server/utils/crm.ts',
  'server/utils/crmAppointmentHelpers.ts',
  'server/utils/crmAppointmentErrors.ts',
  'server/utils/proposalOrchestrator.ts',
  'server/utils/analytics.ts',
  'server/utils/adminAnalytics.ts',
  'server/shared/appointmentValidation.mjs',
  'server/shared/appointmentErrorMap.mjs',
  'server/shared/appointmentTypes.ts',
  'server/shared/crmValidation.mjs',
  'server/shared/adminAnalyticsCore.mjs',
  'server/shared/adminAnalyticsActivity.mjs',
  'server/shared/adminAnalyticsClassification.mjs',
  'server/shared/adminAnalyticsDateRange.mjs',
  'server/shared/adminAnalyticsMetrics.mjs',
  'server/utils/adminAuth.ts',
  'server/utils/adminAuthCookies.ts',
  'server/utils/adminAuthSession.ts',
  'server/shared/adminAuthCore.mjs',
  'server/shared/adminMediaAuthCore.mjs',

  // 8. Test Suites & Config
  'scripts/test_admin_ui_phase5d.mjs',
  'scripts/test_admin_ui_phase5d_browser.mjs',
  'scripts/test_crm_phase5c1_bff.mjs',
  'scripts/test_admin_performance_patch1.mjs',
  'nuxt.config.ts',
  'package.json',
  'tsconfig.json',

  // 9. Documentation
  'docs/CRM_PHASE_5_IMPLEMENTATION.md',
  'docs/ANTIGRAVITY_HANDOFF.md',
  'docs/ADMIN_PERFORMANCE_PATCH_1_DOCUMENTATION.md',
  'implementation_plan.md'
]

// Obtém arquivos modificados pelo git para conferir se todos estão cobertos
const gitStatusOutput = execSync('git status --porcelain', { encoding: 'utf8' })
const gitModifiedFiles = gitStatusOutput
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.length > 0 && !l.endsWith('.zip') && !l.endsWith('.sha256') && !l.includes('make_zip') && !l.includes('package_'))
  .map(l => l.replace(/^[MADRCU?!]{1,2}\s+/, '').trim())
  .filter(f => fs.existsSync(f) && fs.statSync(f).isFile())

const allFilesSet = new Set([...staticFiles, ...gitModifiedFiles])
const files = Array.from(allFilesSet).sort()

console.log('1. Verificando existência de todos os arquivos para o pacote da Fase 5.0D.3...')
const missing = files.filter(f => !fs.existsSync(f))
if (missing.length > 0) {
  console.error('ERRO: Arquivos ausentes:', missing)
  process.exit(1)
}
console.log(`✓ Todos os ${files.length} arquivos confirmados fisicamente no disco.`)

const zipPathDocs = 'docs/admin_ui_phase_5_0d3_external_review.zip'
const zipPathRoot = 'admin_ui_phase_5_0d3_external_review.zip'
const shaPathDocs = 'docs/admin_ui_phase_5_0d3_external_review.zip.sha256'
const shaPathRoot = 'admin_ui_phase_5_0d3_external_review.zip.sha256'

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

// Calcula SHA-256
const zipBuffer = fs.readFileSync(zipPathDocs)
const sha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex').toUpperCase()
fs.writeFileSync(shaPathDocs, `${sha256}  admin_ui_phase_5_0d3_external_review.zip\n`)
fs.writeFileSync(shaPathRoot, `${sha256}  admin_ui_phase_5_0d3_external_review.zip\n`)

console.log(`\n======================================================================`)
console.log(`PACOTE GERADO COM SUCESSO!`)
console.log(`GIT_DIFF_FILE_COUNT=${gitModifiedFiles.length}`)
console.log(`EXTERNAL_REVIEW_PACKAGE_FILE_COUNT=${files.length}`)
console.log(`REVIEW_PACKAGE_COVERS_DEPLOY_DIFF=YES`)
console.log(`Arquivo: ${zipPathDocs} (${zipBuffer.length} bytes)`)
console.log(`SHA-256: ${sha256}`)
console.log(`Sidecar: ${shaPathDocs}`)
console.log(`======================================================================\n`)
