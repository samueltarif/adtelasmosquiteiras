/**
 * Orquestrador Principal da Suíte de Testes da Migration 012
 * Arquivo: scripts/test_crm_migration012_local.mjs
 */

import { auditEnvironmentAndSecurity, state } from './migration012/helpers.mjs'
import { setupCleanOfficialBaseline, runPreflightAndRollbackTests } from './migration012/baseline-setup.mjs'
import { runConstraintsAndTriggersTests } from './migration012/constraints-tests.mjs'
import { runRpcLifecycleTests } from './migration012/rpc-lifecycle-tests.mjs'
import { runBusinessRulesTests } from './migration012/business-rules-tests.mjs'
import { runSecurityAndPrivilegeTests } from './migration012/security-privileges-tests.mjs'
import { runConcurrencyTests } from './migration012/concurrency-tests.mjs'
import { runDeadlockAndCrossRpcTests } from './migration012/deadlock-cross-rpc-tests.mjs'

async function main() {
  console.log('=================================================================')
  console.log('FASE 5.0B.1 — EXECUÇÃO DE TESTES E AUDITORIA DA MIGRATION 012')
  console.log('=================================================================\n')

  const startTime = Date.now()

  // 1. Auditoria de Ambiente e SHA-256
  const envAudit = auditEnvironmentAndSecurity()

  // 2. Preparação do Baseline Oficial 010 + 011
  setupCleanOfficialBaseline()

  // 3. Testes de Preflight Fail-Fast e Rollback Global
  const execDurationMs = runPreflightAndRollbackTests(envAudit.migrationSql)

  // 4. Testes de Constraints, Índices e Triggers
  runConstraintsAndTriggersTests()

  // 5. Testes do Ciclo de Vida das 5 RPCs Atômicas
  runRpcLifecycleTests()

  // 6. Testes de Regras de Negócio, Timezone e Garantia
  runBusinessRulesTests()

  // 7. Testes de Segurança, Least Privilege e Minimização PII
  runSecurityAndPrivilegeTests()

  // 8. Testes de Concorrência Real e Cross-RPC Deadlock
  await runConcurrencyTests()
  await runDeadlockAndCrossRpcTests()

  const totalDuration = Date.now() - startTime

  console.log('\n=================================================================')
  console.log(`RESULTADO DA SUÍTE DE TESTES DA MIGRATION 012 (${totalDuration}ms):`)
  console.log(`  TOTAL DE ASSERTS EXECUTADOS: ${state.passed + state.failed}`)
  console.log(`  ASSERTS APROVADOS (PASS):   ${state.passed}`)
  console.log(`  ASSERTS REPROVADOS (FAIL):  ${state.failed}`)
  console.log('=================================================================\n')

  if (state.failed > 0) {
    console.error('ERRO: A suíte de testes falhou. Corrija os erros antes de prosseguir.')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('ERRO FATAL NA EXECUÇÃO DO TESTE:', err)
  process.exit(1)
})
