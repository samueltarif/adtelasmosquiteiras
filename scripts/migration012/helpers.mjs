/**
 * Helpers e Utilitários para Testes Locais da Migration 012
 * Arquivo: scripts/migration012/helpers.mjs
 */

import { execSync } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

export const CONTAINER_NAME = 'adt-postgres17-test'
export const TEST_DB = 'test_crm_phase5'
export const EXPECTED_MIGRATION_SHA256 = '43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F'

export const state = {
  passed: 0,
  failed: 0,
  asserts: []
}

export function assert(condition, message, extra = '') {
  if (condition) {
    state.passed++
    state.asserts.push({ status: 'PASS', message })
    console.log(`  [PASS] ${message}`)
  } else {
    state.failed++
    state.asserts.push({ status: 'FAIL', message, extra })
    console.error(`  [FAIL] ${message} - ${extra}`)
  }
}

export function runSql(sql, db = TEST_DB) {
  try {
    const stdout = execSync(`docker exec -i ${CONTAINER_NAME} psql -U postgres -d ${db} -v ON_ERROR_STOP=1 -A -t`, {
      input: sql,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })
    return { success: true, stdout: stdout.trim(), stderr: '' }
  } catch (err) {
    return { success: false, stdout: (err.stdout || '').trim(), stderr: (err.stderr || err.message || '').trim() }
  }
}

export async function runAsyncSql(sql, db = TEST_DB) {
  return new Promise((resolve) => {
    try {
      const stdout = execSync(`docker exec -i ${CONTAINER_NAME} psql -U postgres -d ${db} -v ON_ERROR_STOP=1 -A -t`, {
        input: sql,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      })
      resolve({ success: true, stdout: stdout.trim(), stderr: '' })
    } catch (err) {
      resolve({ success: false, stdout: (err.stdout || '').trim(), stderr: (err.stderr || err.message || '').trim() })
    }
  })
}

export function auditEnvironmentAndSecurity() {
  console.log('[1/8] Auditoria de Segurança e Conexão Local...')
  
  const containerCheck = execSync(`docker ps --filter "name=${CONTAINER_NAME}" --format "{{.Names}}"`).toString().trim()
  assert(containerCheck === CONTAINER_NAME, `1. Container PostgreSQL 17 local (${CONTAINER_NAME}) está ativo`)

  const portCheck = execSync(`docker port ${CONTAINER_NAME} 5432`).toString().trim()
  assert(portCheck.includes('54330'), '1b. Porta mapeada para 54330')
  assert(portCheck.includes('127.0.0.1:54330') || portCheck.includes('0.0.0.0:54330'), `1c. Binding inspecionado: ${portCheck}`)

  const migrationFile = path.resolve('supabase/manual/012_crm_appointments_and_staff_engine.sql')
  const migrationSql = fs.readFileSync(migrationFile, 'utf8')
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(migrationFile)).digest('hex').toUpperCase()
  assert(sha256 === EXPECTED_MIGRATION_SHA256, `2. SHA-256 físico corresponde ao esperado (${sha256})`)

  return { migrationSql, sha256, networkExposure: portCheck }
}
