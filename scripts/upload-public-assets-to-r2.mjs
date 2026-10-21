import fs from 'node:fs'
import path from 'node:path'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

function loadEnvSafely() {
  const envPath = path.resolve('.env')
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

const MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_MAP[ext] || 'application/octet-stream'
}

function scanDir(dir, baseDir = dir) {
  let results = []
  if (!fs.existsSync(dir)) return results
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      results = results.concat(scanDir(fullPath, baseDir))
    } else {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/')
      results.push({ fullPath, relPath, size: stat.size })
    }
  }
  return results
}

async function main() {
  const accountId = process.env.R2_SITE_MEDIA_ACCOUNT_ID
  const accessKeyId = process.env.R2_SITE_MEDIA_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SITE_MEDIA_SECRET_ACCESS_KEY
  const bucketName = process.env.R2_SITE_MEDIA_BUCKET_NAME || 'adtelas-site-media'

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Credenciais R2_SITE_MEDIA_* não configuradas no .env')
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  })

  console.log('======================================================================')
  console.log('SINCRONIZAÇÃO DE MÍDIAS ESTÁTICAS PARA O CLOUDFLARE R2')
  console.log(`Bucket Alvo: ${bucketName}`)
  console.log(`Endpoint: https://${accountId}.r2.cloudflarestorage.com`)
  console.log('======================================================================\n')

  const images = scanDir(path.resolve('public/images')).map(f => ({
    ...f,
    storageKey: `images/${f.relPath}`
  }))

  const videos = scanDir(path.resolve('public/videos')).map(f => ({
    ...f,
    storageKey: `videos/${f.relPath}`
  }))

  const allFiles = [...images, ...videos]
  console.log(`Total de arquivos encontrados: ${allFiles.length}`)
  const totalBytes = allFiles.reduce((acc, f) => acc + f.size, 0)
  console.log(`Volume total de mídia: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB\n`)

  let uploaded = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i]
    const mime = getMime(file.fullPath)
    const progress = `[${i + 1}/${allFiles.length}]`

    try {
      // Verificar se já existe no R2 com mesmo tamanho
      try {
        const head = await client.send(new HeadObjectCommand({
          Bucket: bucketName,
          Key: file.storageKey
        }))
        if (head.ContentLength === file.size) {
          console.log(`${progress} [SKIP] ${file.storageKey} (já existe no R2)`)
          skipped++
          continue
        }
      } catch (headErr) {
        // Se 404/NotFound, prossegue para upload
      }

      const fileBuffer = fs.readFileSync(file.fullPath)
      await client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: file.storageKey,
        Body: fileBuffer,
        ContentType: mime,
        CacheControl: 'public, max-age=31536000, immutable'
      }))

      console.log(`${progress} [UPLOADED] ${file.storageKey} (${(file.size / 1024).toFixed(1)} KB) - ${mime}`)
      uploaded++
    } catch (err) {
      console.error(`${progress} [ERROR] ${file.storageKey}:`, err.message)
      errors++
    }
  }

  console.log('\n======================================================================')
  console.log('RESUMO DO UPLOAD:')
  console.log(`Enviados com sucesso: ${uploaded}`)
  console.log(`Já existiam (ignorados): ${skipped}`)
  console.log(`Erros: ${errors}`)
  console.log('======================================================================')
}

main().catch(err => {
  console.error('Erro geral:', err)
  process.exit(1)
})
