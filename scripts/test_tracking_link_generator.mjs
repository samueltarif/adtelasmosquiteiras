/**
 * Orquestrador da Suíte de Testes do Gerador de Links de Rastreamento (Fase 6)
 * Arquivo: scripts/test_tracking_link_generator.mjs
 */

import { assert, printHeader, printSummary } from './test_tracking_link_helpers.mjs'
import { runLinkCases } from './test_tracking_link_cases.mjs'

printHeader('SUÍTE DE TESTES: GERADOR DE LINKS DE RASTREAMENTO (FASE 6)')

// Executa os 16 casos canônicos de teste (LINK-01 a LINK-16)
runLinkCases(assert)

printSummary()
