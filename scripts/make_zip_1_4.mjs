import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const files = [
  'server/api/admin/auth/login.post.ts',
  'server/api/admin/auth/logout.post.ts',
  'server/api/admin/auth/session.get.ts',
  'server/utils/adminAuth.ts',
  'server/utils/adminAuthCookies.ts',
  'server/utils/adminAuthSession.ts',
  'server/shared/adminAuthCore.mjs',
  'server/shared/adminMediaAuthCore.mjs',
  'server/api/admin/analytics/initial.get.ts',
  'server/utils/adminAnalytics.ts',
  'server/shared/adminAnalyticsClassification.mjs',
  'server/shared/adminAnalyticsMetrics.mjs',
  'server/utils/crm.ts',
  'server/utils/crmAppointmentHelpers.ts',
  'app/composables/useAdminAuth.ts',
  'scripts/test_admin_performance_patch1.mjs',
  'scripts/test_crm_phase5c1_bff.mjs',
  'docs/CRM_PHASE_5_IMPLEMENTATION.md',
  'docs/ANTIGRAVITY_HANDOFF.md',
  'implementation_plan.md'
]

const zipName = 'admin_performance_patch_1_4_external_review.zip'
if (fs.existsSync(zipName)) fs.unlinkSync(zipName)

const { default: AdmZip } = await import('adm-zip')
const zip = new AdmZip()

for (const f of files) {
  if (fs.existsSync(f)) {
    zip.addLocalFile(f, path.dirname(f))
    console.log('  +', f)
  } else {
    console.log('  SKIP (missing):', f)
  }
}

zip.writeZip(zipName)
const size = fs.statSync(zipName).size
console.log(`\nZIP gerado: ${zipName} (${size} bytes / ${(size/1024).toFixed(1)} KB)`)
