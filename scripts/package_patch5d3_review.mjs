import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import archiver from 'archiver'

const ROOT_DIR = process.cwd()
const ZIP_NAME = 'phase_5_0d3_delta_external_review.zip'
const ZIP_PATH = path.join(ROOT_DIR, ZIP_NAME)
const SHA_PATH = path.join(ROOT_DIR, `${ZIP_NAME}.sha256`)

const FILES_TO_PACKAGE = [
  'server/utils/crmAppointmentErrors.ts',
  'app/utils/crmDateTime.ts',
  'app/pages/admin/ordens-servico/nova.vue',
  'app/pages/admin/ordens-servico/[id].vue',
  'app/components/admin/work-orders/WorkOrderGeneralEditModal.vue',
  'app/components/admin/work-orders/WorkOrderStatusModal.vue',
  'app/components/admin/work-orders/WorkOrderHeader.vue',
  'app/components/admin/crm/LeadConversionModal.vue',
  'app/components/admin/staff/StaffDeactivateDialog.vue',
  'nuxt.config.ts',
  'server/utils/adminAuth.ts',
  'scripts/test_admin_ui_phase5d_browser.mjs',
  'scripts/test_admin_ui_phase5d.mjs',
  'scripts/test_crm_phase5c1_bff.mjs',
  'implementation_plan.md',
  'docs/ANTIGRAVITY_HANDOFF.md',
  'docs/CRM_PHASE_5_IMPLEMENTATION.md'
]

async function createPackage() {
  console.log(`[PACKAGE] Gerando pacote delta: ${ZIP_NAME}`)
  
  if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH)
  if (fs.existsSync(SHA_PATH)) fs.unlinkSync(SHA_PATH)

  const output = fs.createWriteStream(ZIP_PATH)
  const archive = archiver('zip', { zlib: { level: 9 } })

  output.on('close', () => {
    const fileBytes = fs.readFileSync(ZIP_PATH)
    const hashHex = crypto.createHash('sha256').update(fileBytes).digest('hex').toUpperCase()
    fs.writeFileSync(SHA_PATH, `${hashHex}  ${ZIP_NAME}\n`, 'utf-8')

    // Also copy to docs/ for permanent audit trail
    fs.copyFileSync(ZIP_PATH, path.join(ROOT_DIR, 'docs', ZIP_NAME))
    fs.copyFileSync(SHA_PATH, path.join(ROOT_DIR, 'docs', `${ZIP_NAME}.sha256`))

    console.log(`[PACKAGE] Concluído com sucesso!`)
    console.log(`[PACKAGE] Tamanho: ${archive.pointer()} bytes`)
    console.log(`[PACKAGE] SHA-256: ${hashHex}`)
    console.log(`[PACKAGE] Arquivos inclusos (${FILES_TO_PACKAGE.length}):`)
    FILES_TO_PACKAGE.forEach(f => console.log(`  - ${f}`))
  })

  archive.on('error', (err) => { throw err })
  archive.pipe(output)

  for (const relPath of FILES_TO_PACKAGE) {
    const fullPath = path.join(ROOT_DIR, relPath)
    if (!fs.existsSync(fullPath)) {
      console.warn(`[WARN] Arquivo não encontrado: ${relPath}`)
      continue
    }
    archive.file(fullPath, { name: relPath })
  }

  await archive.finalize()
}

createPackage()
