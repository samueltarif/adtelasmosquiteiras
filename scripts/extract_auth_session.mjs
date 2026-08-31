import { execSync } from 'child_process'
import fs from 'fs'

const psScript = `
Add-Type -AssemblyName 'System.IO.Compression.FileSystem'
$zip = [System.IO.Compression.ZipFile]::OpenRead('admin_performance_patch_1_8_external_review.zip')
$entry = $zip.GetEntry('server/utils/adminAuthSession.ts')
if ($entry) {
  $stream = $entry.Open()
  $reader = New-Object System.IO.StreamReader($stream)
  $content = $reader.ReadToEnd()
  $reader.Dispose()
  $stream.Dispose()
  Set-Content -Path 'server/utils/adminAuthSession.ts' -Value $content -NoNewline
  Write-Host "EXTRACTED_SUCCESS"
}
$zip.Dispose()
`

fs.writeFileSync('scripts/extract_temp.ps1', psScript)
const res = execSync('powershell -ExecutionPolicy Bypass -File scripts/extract_temp.ps1', { encoding: 'utf8' })
console.log(res)
fs.unlinkSync('scripts/extract_temp.ps1')
