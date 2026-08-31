import fs from 'fs'
import { execSync } from 'child_process'

const rootPlan = fs.readFileSync('implementation_plan.md', 'utf8')

// Extrai implementation_plan.md do zip para pasta temporária de verificação
const tempExtractDir = 'scripts/temp_zip_verify'
if (fs.existsSync(tempExtractDir)) {
  fs.rmSync(tempExtractDir, { recursive: true, force: true })
}
fs.mkdirSync(tempExtractDir, { recursive: true })

execSync(`powershell -Command "Expand-Archive -Path 'docs/phase_5_0d7_delta_external_review.zip' -DestinationPath '${tempExtractDir}' -Force"`)

const zipPlan = fs.readFileSync(`${tempExtractDir}/implementation_plan.md`, 'utf8')
fs.rmSync(tempExtractDir, { recursive: true, force: true })

if (zipPlan === rootPlan) {
  console.log('FINAL_ZIP_INTERNAL_PLAN_MATCH=YES')
} else {
  console.error('FINAL_ZIP_INTERNAL_PLAN_MATCH=NO (MISMATCH!)')
  process.exit(1)
}
