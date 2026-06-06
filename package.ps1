<#
  Package the demo into a ZIP file: emergent-choirforge.zip
  Usage: ./package.ps1 [output.zip]
#>
param([string]$out = "emergent-choirforge.zip")

$cwd = Get-Location
Write-Host "Packaging demo into $out"
if (Test-Path $out) { Remove-Item $out -Force }
Compress-Archive -Path * -DestinationPath $out -Force
Write-Host "Created: $cwd\$out"
