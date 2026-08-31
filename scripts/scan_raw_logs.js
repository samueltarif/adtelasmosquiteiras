import fs from 'fs'
import path from 'path'

function walk(d) {
  let r = []
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    if (fs.statSync(p).isDirectory()) {
      r = r.concat(walk(p))
    } else if (/\.(vue|ts|js|mjs)$/.test(f)) {
      r.push(p)
    }
  }
  return r
}

const raw = []
for (const f of walk('app')) {
  const lines = fs.readFileSync(f, 'utf8').split('\n')
  lines.forEach((l, i) => {
    const m = l.match(/console\.(error|warn)\(([^)]+)\)/)
    if (m) {
      const a = m[2].trim()
      // If it contains a comma (multiple args) or variable
      const isStringLiteral = /^['"`][^'"`]*['"`]$/.test(a)
      if (!isStringLiteral) {
        raw.push({ file: f, line: i + 1, text: l.trim() })
      }
    }
  })
}

console.log('RAW LOGS COUNT: ' + raw.length)
raw.forEach(m => console.log(`${m.file}:${m.line} ${m.text}`))
