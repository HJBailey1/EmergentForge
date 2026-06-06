<#
  Simple serve script for Windows PowerShell.
  Usage: ./serve.ps1 [port]
#>
param([int]$port = 8000)

Write-Host "Starting local server on http://localhost:$port"
if (Get-Command python -ErrorAction SilentlyContinue) {
  python -m http.server $port
} elseif (Get-Command php -ErrorAction SilentlyContinue) {
  php -S "0.0.0.0:$port"
} else {
  Write-Host "No python/php found. Install Python or use a different server. You can also run: npx serve ."
}
