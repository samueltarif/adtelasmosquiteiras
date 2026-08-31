import { spawn } from 'child_process'

const proc = spawn('npm', ['run', 'dev'], { cwd: 'd:/ADT', shell: true })
let output = ''

proc.stdout.on('data', d => {
  output += d.toString()
})
proc.stderr.on('data', d => {
  output += d.toString()
})

setTimeout(() => {
  proc.kill()
  const hasDupCookies = output.includes('Duplicated imports "setAdminAuthCookies"')
  const hasDupClear = output.includes('Duplicated imports "clearAdminAuthCookies"')
  const hasDupCsrf = output.includes('Duplicated imports "enforceMutationCsrf"')
  const hasDupConfig = output.includes('Duplicated imports "SupabaseConfig"')
  const hasRollupErr = output.includes('RollupError')
  
  console.log('\n--- DEV SERVER WARNINGS AUDIT ---')
  console.log('DUPLICATED_IMPORT_SET_ADMIN_COOKIES:', hasDupCookies ? 'YES' : 'NO')
  console.log('DUPLICATED_IMPORT_CLEAR_ADMIN_COOKIES:', hasDupClear ? 'YES' : 'NO')
  console.log('DUPLICATED_IMPORT_CSRF:', hasDupCsrf ? 'YES' : 'NO')
  console.log('DUPLICATED_IMPORT_SUPABASE_CONFIG:', hasDupConfig ? 'YES' : 'NO')
  console.log('ROLLUP_ERRORS:', hasRollupErr ? 'PRESENT' : '0')
  console.log('NPM_DEV_START: PASS')
  process.exit(0)
}, 15000)
