import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  LOCAL_SERVICE_MEDIA,
  getLocalMediaForService
} from '../server/shared/localServiceMediaCatalog.mjs'

console.log('======================================================================')
console.log('LOCAL SERVICE MEDIA & VIDEOS MAPPING TEST SUITE')
console.log('======================================================================\n')

let passed = 0
let failed = 0

function test(description, fn) {
  try {
    fn()
    console.log(`  [PASS] ${description}`)
    passed++
  } catch (err) {
    console.error(`  [FAIL] ${description}`)
    console.error('         Error:', err.message)
    failed++
  }
}

// 1. All 12 files exist in public/videos
test('Todos os 12 arquivos físicos existem na pasta public/videos', () => {
  const videosDir = path.resolve('public/videos')
  assert.ok(fs.existsSync(videosDir), 'Diretório public/videos não existe')
  const files = fs.readdirSync(videosDir)
  assert.strictEqual(files.length, 12, `Esperado 12 arquivos, encontrado: ${files.length}`)

  const expectedFiles = [
    '3 telas-moquiteiras-instaladas-para-janelas.jpeg',
    'VIDEO-2026-06-03-15-58-22.mp4',
    'VIDEO-2026-08-27-10-56-13.mp4',
    'instalação-rede-sacada.mp4',
    'rede-proteção-para-escada.jpeg',
    'rede-proteção-sacada.mp4',
    'tela-mosquiteira-cozinha-restaurante.mp4',
    'tela-mosquiteira-janela-.mp4',
    'tela-mosquiteira-janela-e-porta.mp4',
    'tela-mosquiteira-para-janela-removivel.mp4',
    'tela-mosquiteira-porta.mp4',
    'tela-removivel.mp4'
  ]

  for (const f of expectedFiles) {
    assert.ok(files.includes(f), `Arquivo esperado não encontrado: ${f}`)
  }
})

// 2. All 12 files are cataloged
test('Todos os 12 arquivos estão catalogados em LOCAL_SERVICE_MEDIA', () => {
  const storageKeys = LOCAL_SERVICE_MEDIA.map(m => m.storage_key)
  const uniqueFilenames = new Set(storageKeys.map(k => k.replace('videos/', '')))
  assert.strictEqual(uniqueFilenames.size, 12, 'Todos os 12 arquivos únicos devem estar catalogados')
})

// 3. Schema & metadata integrity
test('Todos os registros possuem metadados válidos, alt_text e URLs sanitizadas', () => {
  for (const item of LOCAL_SERVICE_MEDIA) {
    assert.ok(item.id, 'ID ausente')
    assert.ok(item.service_key, 'service_key ausente')
    assert.ok(['photo', 'video'].includes(item.media_type), `media_type inválido: ${item.media_type}`)
    assert.ok(item.mime_type.startsWith('image/') || item.mime_type.startsWith('video/'), `mime_type inválido: ${item.mime_type}`)
    assert.ok(item.title && item.title.length > 5, `title muito curto ou ausente: ${item.title}`)
    assert.ok(item.alt_text && item.alt_text.length > 10, `alt_text muito curto: ${item.alt_text}`)
    assert.ok(item.publicUrl.startsWith('/videos/'), `publicUrl inválido: ${item.publicUrl}`)
    assert.strictEqual(typeof item.sort_order, 'number')
    assert.strictEqual(typeof item.is_featured, 'boolean')
  }
})

// 4. Mapping: Telas para Janelas
test('telas_janelas possui mídias corretas (vídeo janela, foto 3 janelas, etc.)', () => {
  const items = getLocalMediaForService('telas_janelas')
  assert.ok(items.length >= 3, `Esperado no mínimo 3 mídias para telas_janelas, obtido: ${items.length}`)
  const keys = items.map(i => i.storage_key)
  assert.ok(keys.includes('videos/tela-mosquiteira-janela-.mp4'))
  assert.ok(keys.includes('videos/3 telas-moquiteiras-instaladas-para-janelas.jpeg'))
  assert.ok(keys.includes('videos/VIDEO-2026-08-27-10-56-13.mp4'))
})

// 5. Mapping: Telas para Portas
test('telas_portas possui mídias corretas (porta de abrir, janela e porta, etc.)', () => {
  const items = getLocalMediaForService('telas_portas')
  assert.ok(items.length >= 2, `Esperado no mínimo 2 mídias para telas_portas, obtido: ${items.length}`)
  const keys = items.map(i => i.storage_key)
  assert.ok(keys.includes('videos/tela-mosquiteira-porta.mp4'))
  assert.ok(keys.includes('videos/tela-mosquiteira-janela-e-porta.mp4'))
})

// 6. Mapping: Telas Removíveis
test('telas_removiveis possui mídias corretas (desencaixe prático, vãos externos)', () => {
  const items = getLocalMediaForService('telas_removiveis')
  assert.strictEqual(items.length, 2)
  const keys = items.map(i => i.storage_key)
  assert.ok(keys.includes('videos/tela-mosquiteira-para-janela-removivel.mp4'))
  assert.ok(keys.includes('videos/tela-removivel.mp4'))
})

// 7. Mapping: Telas para Restaurantes
test('telas_restaurantes possui mídias corretas (balcão passa-pratos e refeitório)', () => {
  const items = getLocalMediaForService('telas_restaurantes')
  assert.strictEqual(items.length, 2)
  const keys = items.map(i => i.storage_key)
  assert.ok(keys.includes('videos/tela-mosquiteira-cozinha-restaurante.mp4'))
  assert.ok(keys.includes('videos/VIDEO-2026-06-03-15-58-22.mp4'))
})

// 8. Mapping: Redes para Sacadas
test('redes_sacadas possui mídias corretas (instalação e sacada finalizada)', () => {
  const items = getLocalMediaForService('redes_sacadas')
  assert.strictEqual(items.length, 2)
  const keys = items.map(i => i.storage_key)
  assert.ok(keys.includes('videos/instalação-rede-sacada.mp4'))
  assert.ok(keys.includes('videos/rede-proteção-sacada.mp4'))
})

// 9. Mapping: Redes para Escadas
test('redes_escadas possui mídia correta (foto escada vazada)', () => {
  const items = getLocalMediaForService('redes_escadas')
  assert.strictEqual(items.length, 1)
  const keys = items.map(i => i.storage_key)
  assert.ok(keys.includes('videos/rede-proteção-para-escada.jpeg'))
  assert.strictEqual(items[0].media_type, 'photo')
})

// 10. URL Encoding test
test('URLs públicas com acentos e espaços são devidamente codificadas', () => {
  const sacadaItem = LOCAL_SERVICE_MEDIA.find(m => m.storage_key.includes('instalação'))
  assert.ok(sacadaItem, 'Item de instalação não encontrado')
  assert.ok(sacadaItem.publicUrl.includes('%C3%A7%C3%A3o'), `URL deve estar URL-encoded: ${sacadaItem.publicUrl}`)

  const janelasItem = LOCAL_SERVICE_MEDIA.find(m => m.storage_key.includes('3 telas'))
  assert.ok(janelasItem, 'Item de 3 telas não encontrado')
  assert.ok(janelasItem.publicUrl.includes('%20'), `Espaços devem estar codificados: ${janelasItem.publicUrl}`)
})

console.log('\n======================================================================')
console.log(`TEST SUITE FINISHED: ${passed} PASSED | ${failed} FAILED`)
console.log('======================================================================')

if (failed > 0) process.exit(1)
