Add-Type -AssemblyName 'System.IO.Compression'
Add-Type -AssemblyName 'System.IO.Compression.FileSystem'

$files = @(
  'server/api/admin/auth/login.post.ts',
  'server/api/admin/auth/logout.post.ts',
  'server/api/admin/auth/session.get.ts',
  'server/utils/adminAuth.ts',
  'server/utils/adminAuthCookies.ts',
  'server/utils/adminAuthSession.ts',
  'server/shared/adminAuthCore.mjs',
  'server/shared/adminMediaAuthCore.mjs',
  'app/composables/useAdminAuth.ts',
  'app/middleware/admin-auth.global.ts',
  'server/api/admin/analytics/initial.get.ts',
  'server/utils/adminAnalytics.ts',
  'server/shared/adminAnalyticsCore.mjs',
  'server/shared/adminAnalyticsClassification.mjs',
  'server/shared/adminAnalyticsMetrics.mjs',
  'server/utils/crm.ts',
  'server/utils/crmAppointmentHelpers.ts',
  'server/utils/crmAppointmentErrors.ts',
  'server/shared/appointmentValidation.mjs',
  'server/shared/appointmentErrorMap.mjs',
  'scripts/test_admin_performance_patch1.mjs',
  'scripts/test_crm_phase5c1_bff.mjs',
  'docs/CRM_PHASE_5_IMPLEMENTATION.md',
  'docs/ANTIGRAVITY_HANDOFF.md',
  'implementation_plan.md'
)

$targetZips = @(
  'docs/admin_performance_patch_1_5_external_review.zip',
  'admin_performance_patch_1_5_external_review.zip'
)

foreach ($zipPath in $targetZips) {
  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
  $zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
  foreach ($f in $files) {
    $entryName = $f.Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f, $entryName) | Out-Null
  }
  $zip.Dispose()
  $hash = (Get-FileHash $zipPath -Algorithm SHA256).Hash
  $size = (Get-Item $zipPath).Length
  Write-Host "Created: $zipPath ($size bytes) | SHA256: $hash"
}
