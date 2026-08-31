import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { execSync } from 'child_process'

const fileList = [
  // 16 Handlers BFF CRM
  'server/api/admin/crm/appointments/index.post.ts',
  'server/api/admin/crm/appointments/index.get.ts',
  'server/api/admin/crm/appointments/search.post.ts',
  'server/api/admin/crm/appointments/[id]/index.get.ts',
  'server/api/admin/crm/appointments/[id]/index.patch.ts',
  'server/api/admin/crm/appointments/[id]/reschedule.post.ts',
  'server/api/admin/crm/appointments/[id]/cancel.post.ts',
  'server/api/admin/crm/appointments/[id]/status.post.ts',
  'server/api/admin/crm/work-orders/index.post.ts',
  'server/api/admin/crm/work-orders/[id]/index.patch.ts',
  'server/api/admin/crm/work-orders/[id]/status.post.ts',
  'server/api/admin/crm/work-orders/[id]/appointments.get.ts',
  'server/api/admin/crm/staff/index.get.ts',
  'server/api/admin/crm/staff/index.post.ts',
  'server/api/admin/crm/staff/[id].patch.ts',
  'server/api/admin/crm/leads/[id]/convert.post.ts',

  // Auth & Analytics Handlers
  'server/api/admin/auth/login.post.ts',
  'server/api/admin/auth/logout.post.ts',
  'server/api/admin/auth/session.get.ts',
  'server/api/admin/analytics/initial.get.ts',

  // Server Shared Modules
  'server/shared/adminAnalyticsActivity.mjs',
  'server/shared/adminAnalyticsClassification.mjs',
  'server/shared/adminAnalyticsCore.mjs',
  'server/shared/adminAnalyticsDateRange.mjs',
  'server/shared/adminAnalyticsMetrics.mjs',
  'server/shared/adminAuthCore.mjs',
  'server/shared/adminMediaAuthCore.mjs',
  'server/shared/appointmentErrorMap.mjs',
  'server/shared/appointmentTypes.ts',
  'server/shared/appointmentValidation.mjs',
  'server/shared/crmValidation.mjs',

  // Server Utils Modules
  'server/utils/adminAnalytics.ts',
  'server/utils/adminAuth.ts',
  'server/utils/adminAuthCookies.ts',
  'server/utils/adminAuthSession.ts',
  'server/utils/crm.ts',
  'server/utils/crmAppointmentErrors.ts',
  'server/utils/crmAppointmentHelpers.ts',

  // UI Composables & Pages
  'app/composables/useAdminAnalytics.ts',
  'app/composables/useAdminAuth.ts',
  'app/pages/admin/dashboard.vue',
  'app/pages/admin/login.vue',
  'app/middleware/admin-auth.global.ts',

  // Scripts
  'scripts/test_admin_performance_patch1.mjs',
  'scripts/test_crm_phase5c1_bff.mjs',
  'scripts/test_dev_warnings.mjs',

  // Docs & Plan
  'docs/ADMIN_PERFORMANCE_PATCH_1_DOCUMENTATION.md',
  'docs/ANTIGRAVITY_HANDOFF.md',
  'docs/CRM_PHASE_5_IMPLEMENTATION.md',
  'implementation_plan.md',

  // Reference Migration 012
  'supabase/manual/012_crm_appointments_and_staff_engine.sql'
]

console.log('--- 1. VERIFICAÇÃO DE EXISTÊNCIA DOS ARQUIVOS ---')
fileList.forEach(relPath => {
  if (!fs.existsSync(relPath)) {
    console.error('ARQUIVO AUSENTE:', relPath)
    process.exit(1)
  }
})
console.log(`Todos os ${fileList.length} arquivos existem.`)

console.log('--- 2. AUDITORIA ESTÁTICA DE SEGREDOS ---')
let secretsFound = 0
const sensitivePatterns = [
  /eyJ[a-zA-Z0-9_-]{30,}\.[a-zA-Z0-9_-]{30,}/,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s]+/,
  /SUPABASE_ANON_KEY\s*=\s*[^\s]+/
]

fileList.forEach(relPath => {
  const content = fs.readFileSync(relPath, 'utf8')
  for (const pattern of sensitivePatterns) {
    if (pattern.test(content)) {
      console.warn('Possível segredo em:', relPath)
      secretsFound++
    }
  }
})
console.log(`SECRETS_FOUND = ${secretsFound}`)

console.log('--- 3. VERIFICAÇÃO DO SHA-256 DA MIGRATION 012 ---')
const sql012 = fs.readFileSync('supabase/manual/012_crm_appointments_and_staff_engine.sql', 'utf8').replace(/\r\n/g, '\n')
const sql012Sha = crypto.createHash('sha256').update(sql012, 'utf8').digest('hex').toUpperCase()
console.log('SHA256 Migration 012:', sql012Sha)
const expectedSha = '43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F'
console.log('Matches expected:', sql012Sha === expectedSha)

console.log('--- 4. GERAÇÃO DO PACOTE ZIP ---')
const zipName = 'admin_performance_patch_1_3_external_review.zip'
if (fs.existsSync(zipName)) {
  fs.unlinkSync(zipName)
}

const tempDir = path.join(process.cwd(), '.temp_patch1_3_zip_staging')
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true })
}
fs.mkdirSync(tempDir, { recursive: true })

fileList.forEach(f => {
  const dest = path.join(tempDir, f)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(f, dest)
})

const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${tempDir}/*' -DestinationPath '${zipName}' -Force"`
execSync(psCmd, { stdio: 'inherit' })

fs.rmSync(tempDir, { recursive: true, force: true })

const stats = fs.statSync(zipName)
console.log(`ZIP_NAME = ${zipName}`)
console.log(`FILE_COUNT = ${fileList.length}`)
console.log(`ZIP_SIZE = ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`)
