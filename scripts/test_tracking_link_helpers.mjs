/**
 * Utilitários e Asserções para Testes do Gerador de Links (Fase 6)
 * Arquivo: scripts/test_tracking_link_helpers.mjs
 */

export const stats = {
  pass: 0,
  fail: 0
}

export function assert(condition, testCode, description) {
  if (condition) {
    console.log(`  [PASS] ${testCode}: ${description}`)
    stats.pass++
  } else {
    console.error(`  [FAIL] ${testCode}: ${description}`)
    stats.fail++
  }
}

export function printHeader(title) {
  console.log('='.repeat(70))
  console.log(title)
  console.log('='.repeat(70))
}

export function printSummary() {
  console.log('='.repeat(70))
  console.log(`TOTAL DE TESTES DO GERADOR: ${stats.pass} PASS | ${stats.fail} FAIL`)
  console.log('='.repeat(70))
  if (stats.fail > 0) {
    process.exit(1)
  } else {
    console.log('TODOS OS 16 TESTES DO GERADOR DE LINKS FORAM APROVADOS COM SUCESSO!\n')
  }
}
