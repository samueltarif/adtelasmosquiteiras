import fs from 'fs'
import path from 'path'

function getAllFiles(dir, allList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.nuxt' && entry.name !== '.output' && entry.name !== 'dist' && entry.name !== '.git') {
        getAllFiles(fullPath, allList)
      }
    } else {
      allList.push(fullPath)
    }
  }
  return allList
}

const appFiles = getAllFiles('app').concat(getAllFiles('server'))
let maxLogic = 0
let maxCode = 0
const over200 = []
const over600 = []

for (const f of appFiles) {
  const rel = path.relative('.', f).replace(/\\/g, '/')
  if (rel.endsWith('.d.ts')) continue
  const content = fs.readFileSync(f, 'utf8')
  const lines = content.split('\n').length

  const isLogic = (rel.endsWith('.ts') || rel.endsWith('.mjs') || rel.endsWith('.js'))
  const isVue = rel.endsWith('.vue')

  if (isLogic) {
    if (lines > maxLogic) maxLogic = lines
    if (lines > 200) over200.push({ file: rel, lines })
  } else if (isVue) {
    if (lines > maxCode) maxCode = lines
    if (lines > 600) over600.push({ file: rel, lines })
    const scriptMatch = content.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/)
    if (scriptMatch) {
      const scriptLines = scriptMatch[1].split('\n').length
      if (scriptLines > maxLogic) maxLogic = scriptLines
      if (scriptLines > 200) over200.push({ file: `${rel} (<script>)`, lines: scriptLines })
    }
  }
}

console.log('MAX_APPLICATION_LOGIC_FILE_LINES =', maxLogic)
console.log('MAX_APPLICATION_CODE_FILE_LINES =', maxCode)
console.log('APPLICATION_LOGIC_FILES_OVER_200_LINES =', over200.length)
if (over200.length > 0) console.log(over200)
console.log('APPLICATION_CODE_FILES_OVER_600_LINES =', over600.length)
if (over600.length > 0) console.log(over600)
