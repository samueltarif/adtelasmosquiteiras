import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import crypto from 'crypto'

const files = [
  // 1. Frontend Layouts & Pages
  'app/layouts/admin.vue',
  'app/pages/admin/agenda/index.vue',
  'app/pages/admin/equipe/index.vue',
  'app/pages/admin/ordens-servico/[id].vue',

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

  // 4. Work Order Components
  'app/components/admin/work-orders/WorkOrderAppointmentsSection.vue',

  // 5. Frontend Composables, Utils & Types
  'app/composables/useCrmAgenda.ts',
  'app/composables/useCrmStaff.ts',
  'app/composables/useAdminAuth.ts',
  'app/utils/crmDateTime.ts',
  'app/utils/crmAgendaErrors.ts',
  'app/types/crmAppointments.ts',
  'app/middleware/admin-auth.global.ts',

  // 6. Server BFF Handlers (12)
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

  // 7. Server Utils & Shared Modules
  'server/utils/crm.ts',
  'server/utils/crmAppointmentHelpers.ts',
  'server/utils/crmAppointmentErrors.ts',
  'server/shared/appointmentValidation.mjs',
  'server/shared/appointmentErrorMap.mjs',
  'server/shared/appointmentTypes.ts',
  'server/shared/crmValidation.mjs',
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
  'implementation_plan.md'
]

console.log('1. Verificando existência de todos os arquivos para o pacote da Fase 5.0D.2...')
const missing = files.filter(f => !fs.existsSync(f))
if (missing.length > 0) {
  console.error('ERRO: Arquivos ausentes:', missing)
  process.exit(1)
}
console.log(`✓ Todos os ${files.length} arquivos confirmados fisicamente no disco.`)

const zipPathDocs = 'docs/admin_ui_phase_5_0d2_external_review.zip'
const zipPathRoot = 'admin_ui_phase_5_0d2_external_review.zip'
const shaPathDocs = 'docs/admin_ui_phase_5_0d2_external_review.zip.sha256'
const shaPathRoot = 'admin_ui_phase_5_0d2_external_review.zip.sha256'

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
fs.writeFileSync(shaPathDocs, `${sha256}  admin_ui_phase_5_0d2_external_review.zip\n`)
fs.writeFileSync(shaPathRoot, `${sha256}  admin_ui_phase_5_0d2_external_review.zip\n`)

console.log(`\n======================================================================`)
console.log(`PACOTE GERADO COM SUCESSO!`)
console.log(`Arquivo: ${zipPathDocs} (${zipBuffer.length} bytes)`)
console.log(`SHA-256: ${sha256}`)
console.log(`Sidecar: ${shaPathDocs}`)
console.log(`======================================================================\n`)
