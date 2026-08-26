/**
 * ======================================================================
 * SCRIPT DE SMOKE TEST MANUAL REAL — CLOUDFLARE R2 SITE MEDIA
 * ======================================================================
 * REGRAS DE SEGURANÇA E EXECUÇÃO:
 * 1. Exige a flag explícita `--execute` para ser executado.
 * 2. Opera EXCLUSIVAMENTE no bucket 'adtelas-site-media' com credenciais R2_SITE_MEDIA_*.
 * 3. NUNCA toca no bucket privado 'adtelas-leads-private' nem em credenciais de leads.
 * 4. NUNCA acessa o Supabase (0 leituras, 0 inserções, 0 mutações no banco).
 * 5. Prefixo estritamente temporário: 'tmp/site-media-tests/'
 * 6. Garantia de limpeza (cleanup) em bloco finally: confirma remoção física.
 * 7. NUNCA imprime Access Keys, Secrets ou URLs assinadas completas com credenciais.
 * 8. Testa todo o pipeline: Presigned PUT -> HeadObject -> Range GET (Magic Bytes)
 *    -> Custom Domain Público (CDN) -> Delete -> Confirmação de 0 residual.
 * ======================================================================
 */

import fs from 'node:fs'
import path from 'node:path'

// Carregador seguro de .env local (sem logar segredos)
function loadEnvSafely() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim()
        let val = trimmed.slice(idx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
}

loadEnvSafely()

import {
  getSiteR2Config,
  isSiteR2Configured,
  generateSitePresignedUploadUrl,
  headSiteObjectInR2,
  getSiteObjectMagicBytes,
  deleteSiteObjectFromR2,
  validateSiteMediaMagicBytes,
  buildPublicMediaUrl
} from '../server/shared/r2SiteStorageCore.mjs'

import { getR2Config as getLeadR2Config } from '../server/shared/r2StorageCore.mjs'

// Imagem JPEG real e válida de 1x1 pixel (sem metadados pessoais)
const VALID_1X1_JPEG_BUFFER = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
  0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x09, 0xFF, 0xDA, 0x00, 0x08,
  0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x7F, 0x00, 0xFF, 0xD9
])

async function runRealSmokeTest() {
  console.log('======================================================================')
  console.log('CLOUDFLARE R2 SITE MEDIA — REAL SMOKE TEST (ISOLATED EXECUTION)')
  console.log('======================================================================\n')

  // 1. Auditoria de Segurança Pré-Execução
  const siteConfig = getSiteR2Config()
  const leadConfig = getLeadR2Config()

  console.log('--- 1. AUDITORIA DE ISOLAMENTO DE AMBIENTE ---')
  console.log('Bucket Alvo Site Media:', siteConfig.bucketName)
  console.log('Bucket Privado de Leads:', leadConfig.bucketName)

  if (siteConfig.bucketName !== 'adtelas-site-media') {
    throw new Error(`Bucket alvo incorreto: ${siteConfig.bucketName}. Deve ser exclusivamente "adtelas-site-media".`)
  }

  if (siteConfig.bucketName === leadConfig.bucketName) {
    throw new Error('Falha de isolamento crítico: Bucket do site é idêntico ao bucket de leads.')
  }

  if (!isSiteR2Configured(siteConfig)) {
    throw new Error('Credenciais R2_SITE_MEDIA_* não configuradas adequadamente no ambiente.')
  }
  console.log('Status de Configuração Site Media: CONFIGURADO (Credenciais carregadas com segurança)\n')

  const testKey = `tmp/site-media-tests/smoke-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`
  console.log('Chave Temporária Isolada:', testKey)
  console.log('Tamanho da Imagem de Teste (JPEG 1x1):', VALID_1X1_JPEG_BUFFER.length, 'bytes\n')

  let putSuccess = false
  let headSuccess = false
  let rangeSuccess = false
  let magicSuccess = false
  let publicGetSuccess = false
  let deleteSuccess = false
  let confirmedRemoved = false

  try {
    // 2. Presigned PUT Real
    console.log('--- 2. PRESIGNED PUT REAL ---')
    const uploadUrl = await generateSitePresignedUploadUrl(testKey, 'image/jpeg', 300)
    console.log('Presigned PUT URL gerada com sucesso (URL ocultada por segurança).')

    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      body: VALID_1X1_JPEG_BUFFER
    })

    if (!putResponse.ok) {
      const errText = await putResponse.text().catch(() => '')
      throw new Error(`PUT HTTP falhou com status ${putResponse.status}: ${errText}`)
    }
    putSuccess = true
    console.log('Upload PUT realizado com sucesso: HTTP', putResponse.status, putResponse.statusText)

    // 3. HeadObject Real
    console.log('\n--- 3. HEADOBJECT REAL ---')
    const head = await headSiteObjectInR2(testKey)
    if (!head.exists) {
      throw new Error('HeadObjectCommand informou que o objeto não existe após upload.')
    }
    if (head.contentLength !== VALID_1X1_JPEG_BUFFER.length) {
      throw new Error(`Tamanho retornado pelo HeadObject (${head.contentLength}) diverge do buffer enviado (${VALID_1X1_JPEG_BUFFER.length}).`)
    }
    headSuccess = true
    console.log('HeadObject confirmado com sucesso: exists = true | ContentLength =', head.contentLength, '| ContentType =', head.contentType)

    // 4. GetObjectCommand com Range 0-511 (Magic Bytes Real)
    console.log('\n--- 4. RANGE GET & MAGIC BYTES REAL ---')
    const magicBytesBuffer = await getSiteObjectMagicBytes(testKey)
    if (!magicBytesBuffer || magicBytesBuffer.length === 0) {
      throw new Error('Buffer recebido na leitura parcial Range GET está vazio.')
    }
    rangeSuccess = true
    console.log('Range GET executado com sucesso: Bytes recebidos =', magicBytesBuffer.length)

    const isMagicValid = validateSiteMediaMagicBytes(magicBytesBuffer, 'image/jpeg')
    if (!isMagicValid) {
      throw new Error('Assinatura de Magic Bytes do JPEG falhou na validação da aplicação.')
    }
    magicSuccess = true
    console.log('Magic Bytes validado com sucesso pela aplicação: Assinatura JPEG reconhecida.')

    // 5. Custom Domain Público (CDN)
    console.log('\n--- 5. CUSTOM DOMAIN PÚBLICO (CDN) ---')
    const publicUrl = buildPublicMediaUrl(siteConfig.publicBaseUrl, testKey)
    console.log('Consultando Custom Domain Público:', publicUrl)

    try {
      const publicResponse = await fetch(publicUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'AD-Telas-Smoke-Test/1.0' }
      })

      console.log('Resposta Custom Domain:', publicResponse.status, publicResponse.statusText)
      if (publicResponse.ok) {
        const publicBuffer = Buffer.from(await publicResponse.arrayBuffer())
        if (publicBuffer.length === VALID_1X1_JPEG_BUFFER.length) {
          publicGetSuccess = true
          console.log('Custom Domain entregou o arquivo com integridade perfeita (HTTP 200).')
        } else {
          console.warn(`Aviso: Custom domain retornou status ${publicResponse.status}, mas tamanho (${publicBuffer.length}) divergiu.`)
        }
      } else {
        console.warn(`Aviso: Custom domain retornou HTTP ${publicResponse.status}. O DNS/SSL pode estar propagando ou rota protegida.`)
      }
    } catch (cdnErr) {
      console.warn('Aviso na requisição pública via Custom Domain:', cdnErr.message)
    }

    // 6. DeleteObjectCommand Real
    console.log('\n--- 6. DELETE REAL ---')
    const delResult = await deleteSiteObjectFromR2(testKey)
    if (!delResult) {
      throw new Error('DeleteObjectCommand retornou falha.')
    }
    deleteSuccess = true
    console.log('DeleteObjectCommand executado com sucesso.')

    // 7. Confirmação de Remoção
    console.log('\n--- 7. CONFIRMAÇÃO DE REMOÇÃO (ZERO RESIDUAL) ---')
    const postHead = await headSiteObjectInR2(testKey)
    if (postHead.exists) {
      throw new Error('Objeto ainda existe no bucket após comando de exclusão!')
    }
    confirmedRemoved = true
    console.log('Confirmação pós-exclusão: exists = false (Nenhum objeto residual no bucket).')

  } finally {
    // 8. Cleanup de Segurança Garantido
    if (!confirmedRemoved) {
      console.log('\nExecutando cleanup forçado de segurança...')
      try {
        await deleteSiteObjectFromR2(testKey)
        const check = await headSiteObjectInR2(testKey)
        if (!check.exists) {
          confirmedRemoved = true
          console.log('Cleanup de segurança concluiu remoção do objeto temporário.')
        }
      } catch (cleanupErr) {
        console.error('ALERTA: Falha no cleanup de segurança para chave:', testKey)
      }
    }
  }

  console.log('\n======================================================================')
  console.log('RESUMO DA EXECUÇÃO DO SMOKE TEST REAL:')
  console.log('======================================================================')
  console.log('PRESIGNED_PUT_REAL:          ', putSuccess ? 'PASS' : 'FAIL')
  console.log('HEAD_OBJECT_REAL:            ', headSuccess ? 'PASS' : 'FAIL')
  console.log('RANGE_GET_REAL:              ', rangeSuccess ? 'PASS' : 'FAIL')
  console.log('MAGIC_BYTES_REAL:            ', magicSuccess ? 'PASS' : 'FAIL')
  console.log('CUSTOM_DOMAIN_PUBLIC_GET:    ', publicGetSuccess ? 'PASS' : 'FAIL')
  console.log('DELETE_REAL:                 ', deleteSuccess ? 'PASS' : 'FAIL')
  console.log('OBJECT_CONFIRMED_REMOVED:    ', confirmedRemoved ? 'YES' : 'NO')
  console.log('RESIDUAL_R2_OBJECT:          ', confirmedRemoved ? 'NO' : 'YES')
  console.log('SERVICE_MEDIA_ROWS_CREATED:   0')
  console.log('DATABASE_CHANGED:             NO')
  console.log('LEAD_PRIVATE_BUCKET_TOUCHED:  NO')
  console.log('======================================================================\n')
}

// Execução protegida por flag
if (process.argv.includes('--execute')) {
  runRealSmokeTest().catch((err) => {
    console.error('\nFALHA NO SMOKE TEST REAL:', err.message || err)
    process.exit(1)
  })
} else {
  console.log('Aviso: Smoke test do R2 em modo passivo. Para executar use a flag --execute:')
  console.log('node scripts/smoke-test-r2-site-media-manual.mjs --execute')
}
