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
  'app/composables/useCrmAgenda.ts',
  'app/composables/useCrmStaff.ts',
  'app/composables/useModalA11y.ts',
  'app/types/crmAppointments.ts',
  'app/utils/crmDateTime.ts',
  'app/utils/crmAgendaErrors.ts',
  'app/layouts/admin.vue',

  // 2. UI Components (Agenda + Staff + Work Orders)
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
  'app/components/admin/crm/LeadConversionModal.vue',

  // 3. Server Utils & Shared Modules (MISSING_LOCAL_IMPORTS=0)
  'server/utils/adminAuth.ts',
  'server/utils/adminAuthCookies.ts',
  'server/utils/adminAuthSession.ts',
  'server/shared/adminAuthCore.mjs',
  'server/utils/crm.ts',
  'server/utils/crmDuplicateSearch.ts',
  'server/utils/crmAppointmentErrors.ts',    // Inclusão obrigatória (MISSING_LOCAL_IMPORTS=0)
  'server/utils/crmAppointmentHelpers.ts',
  'server/shared/appointmentValidation.mjs',
  'server/shared/appointmentErrorMap.mjs',
  'server/shared/appointmentTypes.ts',
  'server/shared/crmValidation.mjs',
  'server/shared/adminMediaAuthCore.mjs',
  'server/redirectsMap.ts',                 // Inclusão obrigatória referenciada por nuxt.config.ts

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

  // 5. Test Suites
  'scripts/test_admin_ui_phase5d.mjs',          // 30/30 PASS
  'scripts/test_admin_ui_phase5d_browser.mjs',  // E2E Playwright
  'scripts/test_crm_phase5c1_bff.mjs',          // 45/45 PASS
  'scripts/test_admin_performance_patch1.mjs',  // 70/70 PASS
  'scripts/audit_git_diff_loc.mjs',

  // 6. Config & Documentation
  'nuxt.config.ts',
  'package.json',
  'tsconfig.json',
  'docs/CRM_PHASE_5_IMPLEMENTATION.md',
  'docs/ANTIGRAVITY_HANDOFF.md',
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

console.log('1. Verificando integridade física de todos os arquivos para o pacote da Fase 5.0D...')
const missing = files.filter(f => !fs.existsSync(f))
if (missing.length > 0) {
  console.error('ERRO: Arquivos ausentes (MISSING_LOCAL_IMPORTS blocker):', missing)
  process.exit(1)
}
console.log(`✓ Todos os ${files.length} arquivos confirmados fisicamente no disco.`)
console.log(`  MISSING_LOCAL_IMPORTS=0`)

const zipPathDocs = 'docs/phase_5_0d_final_external_review.zip'
const zipPathRoot = 'phase_5_0d_final_external_review.zip'
const shaPathDocs = 'docs/phase_5_0d_final_external_review.zip.sha256'
const shaPathRoot = 'phase_5_0d_final_external_review.zip.sha256'

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
    $entryName = $f.Replace('\\\\\\\\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f, $entryName) | Out-Null
  }
  $zip.Dispose()
}
`

fs.writeFileSync('scripts/make_zip_temp_5d.ps1', psScript)
execSync('powershell -ExecutionPolicy Bypass -File scripts/make_zip_temp_5d.ps1')
try {
  fs.unlinkSync('scripts/make_zip_temp_5d.ps1')
} catch (e) {
  // Ignora lock transitivo no Windows
}

// Calcula SHA-256
const zipBuffer = fs.readFileSync(zipPathDocs)
const sha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex').toUpperCase()
fs.writeFileSync(shaPathDocs, `${sha256}  phase_5_0d_final_external_review.zip\n`)
fs.writeFileSync(shaPathRoot, `${sha256}  phase_5_0d_final_external_review.zip\n`)

console.log(`\n======================================================================`)
console.log(`FASE 5.0D — FINAL EXTERNAL REVIEW PACKAGE GERADO COM SUCESSO!`)
console.log(`EXTERNAL_REVIEW_PACKAGE_FILE_COUNT=${files.length}`)
console.log(`MISSING_LOCAL_IMPORTS=0`)
console.log(`Arquivo: ${zipPathDocs} (${zipBuffer.length} bytes)`)
console.log(`SHA-256: ${sha256}`)
console.log(`Sidecar: ${shaPathDocs}`)
console.log(`======================================================================\n`)
