Add-Type -AssemblyName 'System.IO.Compression.FileSystem'
$zip = [System.IO.Compression.ZipFile]::OpenRead('docs/admin_performance_patch_1_5_external_review.zip')
Write-Host "Total de arquivos no ZIP: $($zip.Entries.Count)"
foreach ($entry in $zip.Entries) {
  Write-Host "  + $($entry.FullName)"
}
$zip.Dispose()
