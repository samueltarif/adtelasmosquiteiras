import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const fileList = [
  'server/utils/adminAuth.ts',
  'server/utils/adminAuthSession.ts',
  'server/utils/adminAuthCookies.ts',
  'server/api/admin/auth/login.post.ts',
  'server/api/admin/auth/session.get.ts',
  'server/api/admin/auth/logout.post.ts',
  'server/api/admin/analytics/initial.get.ts',
  'app/composables/useAdminAuth.ts',
  'app/composables/useAdminAnalytics.ts',
  'app/middleware/admin-auth.global.ts',
  'app/pages/admin/login.vue',
  'app/pages/admin/dashboard.vue',
  'server/shared/adminAuthCore.mjs',
  'server/shared/adminMediaAuthCore.mjs',
  'server/shared/adminAnalyticsCore.mjs',
  'server/utils/adminAnalytics.ts',
  'scripts/test_admin_performance_patch1.mjs',
  'scripts/test_crm_phase5c1_bff.mjs',
  'scripts/performance_audit.mjs',
  'docs/ADMIN_PERFORMANCE_PATCH_1_DOCUMENTATION.md'
]

let secretsFound = 0
const sensitivePatterns = [
  /eyJ[a-zA-Z0-9_-]{30,}\.[a-zA-Z0-9_-]{30,}/,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s]+/,
  /SUPABASE_ANON_KEY\s*=\s*[^\s]+/
]

console.log('--- 1. AUDITORIA DE SEGREDOS ---')
fileList.forEach(relPath => {
  if (!fs.existsSync(relPath)) {
    console.error('ARQUIVO AUSENTE:', relPath)
    process.exit(1)
  }
  const content = fs.readFileSync(relPath, 'utf8')
  for (const pattern of sensitivePatterns) {
    if (pattern.test(content)) {
      console.warn('Possível segredo detectado em:', relPath)
      secretsFound++
    }
  }
})
console.log(`SECRETS_FOUND = ${secretsFound}`)

const zipName = 'admin_performance_patch_1_external_review.zip'
if (fs.existsSync(zipName)) {
  fs.unlinkSync(zipName)
}

const tempDir = path.join(process.cwd(), '.temp_zip_staging')
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true })
}
fs.mkdirSync(tempDir, { recursive: true })

fileList.forEach(f => {
  const dest = path.join(tempDir, f)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(f, dest)
})

console.log('--- 2. GERANDO PACOTE ZIP ---')
const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${tempDir}/*' -DestinationPath '${zipName}' -Force"`
execSync(psCmd, { stdio: 'inherit' })

fs.rmSync(tempDir, { recursive: true, force: true })

const stats = fs.statSync(zipName)
console.log(`ZIP_FILE = ${zipName}`)
console.log(`FILE_COUNT = ${fileList.length}`)
console.log(`ZIP_SIZE = ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`)
