/**
 * Orquestrador Principal da Suíte de Testes Automatizados da Migration 011
 * Arquivo: scripts/test_crm_migration011_local.mjs
 * 
 * Executa todas as baterias modulares de testes em ambiente local isolado (Docker).
 */

import { auditEnvironmentAndSecurity, setupCleanBaseline, state, getMigrationSql } from './migration011/helpers.mjs'
import { runPreflightAndRollbackTests, setupFixturesAndCompanyTests, runCommercialTermsAndParametersMatrix } from './migration011/lifecycle-tests.mjs'
import { runSecurityAndPrivilegeTests, runImmutabilityAndTriggerMatrixTests } from './migration011/security-tests.mjs'
import { runProposalFlowTests } from './migration011/proposal-flow-tests.mjs'
import { runConcurrencyTests } from './migration011/concurrency-tests.mjs'
import { runVersioningAndActivityRegressionTests } from './migration011/regression-tests.mjs'

async function main() {
  console.log('=================================================================')
  console.log('FASE 4.1B.3.1 — COMPLETUDE DE EVIDÊNCIAS DO LOCAL EXECUTION GATE')
  console.log('=================================================================\n')

  const startTime = Date.now()

  // 1. Auditoria de Segurança, Docker Daemon e SHA-256
  const envAudit = auditEnvironmentAndSecurity()

  // 2. Preparação do Baseline 010 com Assert de Runtime
  setupCleanBaseline(envAudit.migrationSql)

  // 3. Testes de Preflight, Drift e Rollback Global
  const execDurationMs = runPreflightAndRollbackTests(envAudit.migrationSql)

  // 4. Testes de RLS e Privilégios de Tabela / RPCs
  runSecurityAndPrivilegeTests()

  // 5. Configuração de Fixtures e Teste de Company Profile
  setupFixturesAndCompanyTests()

  // 6. Matrizes de Termos Comerciais, Data de Validade, SHA e Storage Key
  runCommercialTermsAndParametersMatrix()

  // 7. Fluxo Completo de Propostas (Reserva, PDF, Finalize, Aceite, Falhas, Lease)
  const proposalFlow = runProposalFlowTests()

  // 8. Matriz de Imutabilidade (14 campos) e Triggers de Integridade
  runImmutabilityAndTriggerMatrixTests(
    proposalFlow.readyProposalId,
    proposalFlow.reservedProposalId,
    proposalFlow.failedProposalId
  )

  // 9. Concorrência Real com Duas Conexões Simultâneas
  await runConcurrencyTests()

  // 10. Versionamento e Regressão das 22 Ações do Activity Log
  const regressionResults = runVersioningAndActivityRegressionTests(proposalFlow.readyProposalId)

  const totalDuration = Date.now() - startTime

  console.log('\n=================================================================')
  console.log(`RESULTADO DA SUÍTE DE TESTES (Duração: ${totalDuration}ms):`)
  console.log(`  TOTAL DE ASSERTS EXECUTADOS: ${state.passed + state.failed}`)
  console.log(`  ASSERTS APROVADOS (PASS):   ${state.passed}`)
  console.log(`  ASSERTS REPROVADOS (FAIL):  ${state.failed}`)
  console.log('=================================================================\n')

  if (state.failed > 0) {
    console.error('ERRO: A suíte de testes falhou. Corrija as asserções reprovadas antes de prosseguir.')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('ERRO FATAL NA EXECUÇÃO DO TESTE:', err)
  process.exit(1)
})
