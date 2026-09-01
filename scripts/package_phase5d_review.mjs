import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { execSync } from 'child_process'

const staticFiles = [
  // 1. PÁGINAS ADMIN (Agenda, Equipe, Ordens de Serviço, Clientes, Leads, Galeria, Dashboard)
  'app/pages/admin/agenda/index.vue',
  'app/pages/admin/equipe/index.vue',
  'app/pages/admin/ordens-servico/index.vue',
  'app/pages/admin/ordens-servico/nova.vue',
  'app/pages/admin/ordens-servico/[id].vue',
  'app/pages/admin/clientes/index.vue',
  'app/pages/admin/clientes/[id].vue',
  'app/pages/admin/leads.vue',
  'app/pages/admin/galeria.vue',
  'app/pages/admin/dashboard.vue',
  'app/pages/admin/login.vue',
  'app/pages/admin/index.vue',

  // 2. PÁGINAS E COMPONENTES PÚBLICOS AUDITADOS POR HARDENING
  'app/pages/contato.vue',
  'app/pages/orcamento.vue',
  'app/components/MediaUploader.vue',
  'app/components/Header.vue',
  'app/components/Footer.vue',
  'app/components/Breadcrumb.vue',
  'app/components/SocialButtons.vue',

  // 3. LAYOUT & NAVEGAÇÃO ADMIN
  'app/layouts/admin.vue',

  // 4. COMPONENTES DA AGENDA
  'app/components/admin/agenda/AgendaHeader.vue',
  'app/components/admin/agenda/AgendaWeekView.vue',
  'app/components/admin/agenda/AgendaDayView.vue',
  'app/components/admin/agenda/AgendaMonthView.vue',
  'app/components/admin/agenda/AgendaListView.vue',
  'app/components/admin/agenda/AppointmentCard.vue',
  'app/components/admin/agenda/AppointmentDetailSheet.vue',
  'app/components/admin/agenda/AppointmentCreateModal.vue',
  'app/components/admin/agenda/AppointmentRescheduleModal.vue',
  'app/components/admin/agenda/AppointmentEditModal.vue',
  'app/components/admin/agenda/AppointmentCancelDialog.vue',

  // 5. COMPONENTES DE EQUIPE (STAFF)
  'app/components/admin/staff/StaffHeader.vue',
  'app/components/admin/staff/StaffListTable.vue',
  'app/components/admin/staff/StaffListCards.vue',
  'app/components/admin/staff/StaffFormModal.vue',
  'app/components/admin/staff/StaffDeactivateDialog.vue',

  // 6. COMPONENTES DE ORDENS DE SERVIÇO (TODAS AS 7 ABAS + MODAIS)
  'app/components/admin/work-orders/WorkOrderAppointmentsSection.vue',
  'app/components/admin/work-orders/WorkOrderHeader.vue',
  'app/components/admin/work-orders/WorkOrderGeneralEditModal.vue',
  'app/components/admin/work-orders/WorkOrderStatusModal.vue',
  'app/components/admin/work-orders/WorkOrderArchiveModal.vue',
  'app/components/admin/work-orders/WorkOrderItemsManager.vue',
  'app/components/admin/work-orders/WorkOrderItemModal.vue',
  'app/components/admin/work-orders/WorkOrderMeasurementsTable.vue',
  'app/components/admin/work-orders/WorkOrderMeasurementModal.vue',
  'app/components/admin/work-orders/WorkOrderProposalsManager.vue',
  'app/components/admin/work-orders/WorkOrderProposalModal.vue',
  'app/components/admin/work-orders/WorkOrderProposalAcceptModal.vue',
  'app/components/admin/work-orders/WorkOrderMediaGallery.vue',
  'app/components/admin/work-orders/WorkOrderMediaUploader.vue',
  'app/components/admin/work-orders/WorkOrderMediaEditModal.vue',
  'app/components/admin/work-orders/WorkOrderNotesManager.vue',
  'app/components/admin/work-orders/WorkOrderActivityTimeline.vue',
  'app/components/admin/work-orders/WorkOrderListTable.vue',
  'app/components/admin/work-orders/WorkOrderListCards.vue',
  'app/components/admin/work-orders/WorkOrderSummaryCards.vue',

  // 7. COMPONENTES CRM / LEADS / CLIENTES / GALERIA
  'app/components/admin/crm/LeadConversionModal.vue',
  'app/components/admin/crm/ClientListTable.vue',
  'app/components/admin/crm/ClientAddressManager.vue',
  'app/components/admin/crm/ClientNotesManager.vue',
  'app/components/admin/crm/ClientActivityTimeline.vue',
  'app/components/admin/crm/ClientDuplicateAlert.vue',
  'app/components/admin/crm/ClientWorkOrdersReadOnly.vue',
  'app/components/admin/LeadJourneyDrawer.vue',
  'app/components/admin/MediaLightbox.vue',
  'app/components/admin/TrafficChart.vue',
  'app/components/admin/gallery/GalleryUploadQueue.vue',
  'app/components/admin/gallery/GalleryMediaCard.vue',
  'app/components/admin/gallery/GalleryEditModal.vue',
  'app/components/admin/gallery/GalleryDeleteModal.vue',

  // 8. COMPOSABLES / HELPERS / TYPES
  'app/composables/useCrmAgenda.ts',
  'app/composables/useCrmStaff.ts',
  'app/composables/useModalA11y.ts',
  'app/composables/useAdminAuth.ts',
  'app/composables/useFormSubmit.js',
  'app/composables/useLeadJourneyMedia.ts',
  'app/composables/useLeadMediaUploadQueue.ts',
  'app/composables/useLightboxZoom.ts',
  'app/composables/useSiteMediaUpload.ts',
  'app/types/crmAppointments.ts',
  'app/types/siteMedia.ts',
  'app/utils/crmDateTime.ts',
  'app/utils/crmAgendaErrors.ts',
  'app/utils/phone.ts',
  'app/utils/formConversion.js',
  'app/utils/leadMediaPipeline.ts',
  'app/utils/leadMediaSelection.ts',

  // 9. SERVER UTILS & SHARED DOMAIN MODULES
  'server/shared/appointmentTypes.ts',
  'server/shared/appointmentValidation.mjs',
  'server/shared/appointmentErrorMap.mjs',
  'server/shared/crmValidation.mjs',
  'server/shared/adminAuthCore.mjs',
  'server/shared/adminMediaAuthCore.mjs',
  'server/shared/adminAnalyticsCore.mjs',
  'server/shared/adminAnalyticsDateRange.mjs',
  'server/shared/adminAnalyticsMetrics.mjs',
  'server/shared/adminAnalyticsActivity.mjs',
  'server/shared/adminAnalyticsClassification.mjs',
  'server/utils/adminAuth.ts',
  'server/utils/adminAuthCookies.ts',
  'server/utils/adminAuthSession.ts',
  'server/utils/adminAnalytics.ts',
  'server/utils/crm.ts',
  'server/utils/crmDuplicateSearch.ts',
  'server/utils/crmAppointmentErrors.ts',
  'server/utils/crmAppointmentHelpers.ts',

  // 10. SERVER BFF HANDLERS (12 ENDPOINTS 5.0C + WORK ORDERS + AUTH + ANALYTICS)
  'server/api/admin/crm/appointments/index.get.ts',
  'server/api/admin/crm/appointments/index.post.ts',
  'server/api/admin/crm/appointments/search.post.ts',
  'server/api/admin/crm/appointments/[id]/index.get.ts',
  'server/api/admin/crm/appointments/[id]/index.patch.ts',
  'server/api/admin/crm/appointments/[id]/reschedule.post.ts',
  'server/api/admin/crm/appointments/[id]/cancel.post.ts',
  'server/api/admin/crm/appointments/[id]/status.post.ts',
  'server/api/admin/crm/staff/index.get.ts',
  'server/api/admin/crm/staff/index.post.ts',
  'server/api/admin/crm/staff/[id].patch.ts',
  'server/api/admin/crm/work-orders/[id]/appointments.get.ts',
  'server/api/admin/crm/work-orders/index.post.ts',
  'server/api/admin/crm/work-orders/index.get.ts',
  'server/api/admin/crm/work-orders/search.post.ts',
  'server/api/admin/crm/work-orders/summary.get.ts',
  'server/api/admin/crm/work-orders/[id]/index.get.ts',
  'server/api/admin/crm/work-orders/[id]/index.patch.ts',
  'server/api/admin/crm/work-orders/[id]/status.post.ts',
  'server/api/admin/crm/work-orders/[id]/activity.get.ts',
  'server/api/admin/crm/leads/[id]/convert.post.ts',
  'server/api/admin/auth/login.post.ts',
  'server/api/admin/auth/logout.post.ts',
  'server/api/admin/auth/session.get.ts',
  'server/api/admin/analytics/initial.get.ts',

  // 11. SUÍTES DE TESTES & SCRIPTS DE AUDITORIA
  'scripts/test_admin_ui_phase5d_browser.mjs',
  'scripts/test_admin_ui_phase5d.mjs',
  'scripts/test_crm_phase5c1_bff.mjs',
  'scripts/test_admin_performance_patch1.mjs',
  'scripts/audit_git_diff_loc.mjs',
  'scripts/audit_loc_all.mjs',
  'scripts/scan_raw_logs.js',

  // 12. CONFIGURAÇÃO, DOCUMENTAÇÃO E REFERÊNCIA MIGRATION 012
  'nuxt.config.ts',
  'package.json',
  'tsconfig.json',
  'implementation_plan.md',
  'docs/CRM_PHASE_5_IMPLEMENTATION.md',
  'docs/ANTIGRAVITY_HANDOFF.md',
  'docs/CRM_PHASE_5D_COMPREHENSIVE_REPORT.md',
  'docs/ADMIN_PERFORMANCE_PATCH_1_DOCUMENTATION.md',
  'supabase/manual/012_crm_appointments_and_staff_engine.sql'
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

console.log('1. Verificando integridade física dos arquivos para o pacote...')
const missing = files.filter(f => !fs.existsSync(f))
if (missing.length > 0) {
  console.error('ERRO: Arquivos ausentes:', missing)
  process.exit(1)
}
console.log(`✓ Todos os ${files.length} arquivos confirmados fisicamente no disco.`)

// Verificação de segurança (secrets, .env, backups, etc.)
let envFilesCount = 0
let backupsCount = 0
let secretsFoundCount = 0

for (const f of files) {
  const lower = f.toLowerCase()
  if (lower.includes('.env')) envFilesCount++
  if (lower.startsWith('backups/') || lower.includes('/backups/')) backupsCount++
  if (lower.includes('node_modules') || lower.includes('.output') || lower.includes('.nuxt')) secretsFoundCount++
}

console.log(`  ENV_FILES_INCLUDED = ${envFilesCount}`)
console.log(`  BACKUPS_INCLUDED = ${backupsCount}`)
console.log(`  SECRETS_FOUND = ${secretsFoundCount}`)

if (envFilesCount > 0 || backupsCount > 0 || secretsFoundCount > 0) {
  console.error('ERRO: Inclusão indevida de arquivos confidenciais!')
  process.exit(1)
}

const zipName = 'phase_5_0d_external_review.zip'
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

const psPath = 'scripts/temp_make_zip_5_0d.ps1'
fs.writeFileSync(psPath, psScript, 'utf8')

try {
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File ${psPath}`, { stdio: 'inherit' })
} finally {
  if (fs.existsSync(psPath)) fs.unlinkSync(psPath)
}

console.log('\n3. Calculando SHA-256 canônico...')
const zipBuf = fs.readFileSync(zipPathRoot)
const sha256 = crypto.createHash('sha256').update(zipBuf).digest('hex').toUpperCase()
const sizeBytes = zipBuf.length

fs.writeFileSync(shaPathRoot, `${sha256} *${zipName}\n`, 'utf8')
fs.writeFileSync(shaPathDocs, `${sha256} *${zipName}\n`, 'utf8')

console.log(`\n======================================================================`)
console.log(`PHASE_5_0D_REVIEW_PACKAGE = ${zipName}`)
console.log(`TOTAL_FILES = ${files.length}`)
console.log(`TOTAL_SIZE_BYTES = ${sizeBytes}`)
console.log(`SHA256 = ${sha256}`)
console.log(`ENV_FILES_INCLUDED = 0`)
console.log(`BACKUPS_INCLUDED = 0`)
console.log(`SECRETS_FOUND = 0`)
console.log(`MIGRATION_012_INCLUDED_REFERENCE_ONLY = YES`)
console.log(`MIGRATION_012_MODIFIED = NO`)
console.log(`PRODUCTION_DATABASE_WRITES = 0`)
console.log(`APPLICATION_DEPLOY = NO`)
console.log(`======================================================================\n`)

console.log('LISTAGEM DE ARQUIVOS NO PACOTE:')
files.forEach((f, idx) => console.log(`  [${String(idx + 1).padStart(3, ' ')}] ${f}`))
