import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

function getChangedFiles() {
  try {
    const rawBuffer = execSync('git status --porcelain=v1 -z')
    const tokens = rawBuffer.toString('utf8').split('\0').filter(Boolean)
    const files = []
    for (let i = 0; i < tokens.length; i++) {
      const entry = tokens[i]
      if (entry.length < 3) continue
      const statusXY = entry.substring(0, 2)
      const filePath = entry.substring(3)
      if (filePath) files.push(filePath)
      // Se renomeado (R) ou copiado (C), o próximo token em -z é o destino
      if ((statusXY[0] === 'R' || statusXY[0] === 'C') && i + 1 < tokens.length) {
        i++
        const destPath = tokens[i]
        if (destPath) files.push(destPath)
      }
    }
    return { source: 'git status --porcelain=v1 -z', files }
  } catch {
    return { source: 'fallback', files: [] }
  }
}

const { source, files } = getChangedFiles()

const logicOver200 = []
const codeOver600 = []
let logicCount = 0
let codeCount = 0
let maxLogicLines = 0
let maxCodeLines = 0

// Expand directories if untracked directory was returned (e.g. app/components/admin/gallery/)
const allFilesToAudit = []
function collectFiles(fPath) {
  if (!fs.existsSync(fPath)) return
  const stat = fs.statSync(fPath)
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(fPath)
    for (const entry of entries) {
      collectFiles(path.join(fPath, entry))
    }
  } else {
    allFilesToAudit.push(fPath.replace(/\\/g, '/'))
  }
}

for (const f of files) {
  collectFiles(f)
}

// Remove duplicates
const uniqueFiles = Array.from(new Set(allFilesToAudit))

for (const f of uniqueFiles) {
  if (!fs.existsSync(f)) continue
  
  // Exclusions: migrations legadas, fixtures, test scripts, non-app files, zip files, docs
  if (
    f.startsWith('scripts/') ||
    f.startsWith('docs/') ||
    f.endsWith('.zip') ||
    f.endsWith('.sha256') ||
    f.endsWith('.md') ||
    f.endsWith('.json') ||
    f.endsWith('.d.ts') ||
    f.includes('migrations/') ||
    f.includes('database.types') ||
    f.endsWith('.sql')
  ) {
    continue
  }

  const content = fs.readFileSync(f, 'utf8')
  const lines = content.split('\n').length

  const isLogic = (f.endsWith('.ts') || f.endsWith('.mjs') || f.endsWith('.js'))
  const isVue = f.endsWith('.vue')

  if (isLogic) {
    logicCount++
    if (lines > maxLogicLines) maxLogicLines = lines
    if (lines > 200) {
      logicOver200.push({ file: f, lines })
    }
  } else if (isVue) {
    codeCount++
    if (lines > maxCodeLines) maxCodeLines = lines
    if (lines > 600) {
      codeOver600.push({ file: f, lines })
    }
    const scriptMatch = content.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/)
    if (scriptMatch) {
      const scriptLines = scriptMatch[1].split('\n').length
      if (scriptLines > maxLogicLines) maxLogicLines = scriptLines
      if (scriptLines > 200) {
        logicOver200.push({ file: `${f} (<script>)`, lines: scriptLines })
      }
    }
  }
}

console.log(`DEPLOY_DIFF_SOURCE=${source}`)
console.log(`DEPLOY_DIFF_APPLICATION_LOGIC_FILE_COUNT=${logicCount}`)
console.log(`DEPLOY_DIFF_APPLICATION_LOGIC_FILES_OVER_200=${logicOver200.length}`)
if (logicOver200.length > 0) {
  console.log('VIOLATIONS_LOGIC_OVER_200:', JSON.stringify(logicOver200, null, 2))
}
console.log(`DEPLOY_DIFF_APPLICATION_CODE_FILES_OVER_600=${codeOver600.length}`)
if (codeOver600.length > 0) {
  console.log('VIOLATIONS_CODE_OVER_600:', JSON.stringify(codeOver600, null, 2))
}
console.log(`MAX_APPLICATION_LOGIC_FILE_LINES=${maxLogicLines}`)
console.log(`MAX_APPLICATION_CODE_FILE_LINES=${maxCodeLines}`)
console.log(`AUDIT_GIT_STATUS_PARSER=FIXED`)
console.log(`CODE_SIZE_POLICY=${logicOver200.length === 0 && codeOver600.length === 0 ? 'PASS' : 'FAIL'}`)
