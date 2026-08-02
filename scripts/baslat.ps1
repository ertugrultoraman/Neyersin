# Ne Yersin? — siteyi başlat
# ============================================================================
#
# İki süreç ayağa kalkıyor:
#   1. Next.js üretim sunucusu  → 127.0.0.1:3000
#   2. HTTPS vekili             → 0.0.0.0:443  (https://neyersin.local)
#
# Bu betik Windows'un "Başlangıç" klasörüne kısayol olarak konduğunda site
# bilgisayar her açıldığında kendiliğinden çalışır; hiçbir uygulamanın açık
# kalmasına gerek kalmaz.
#
# Elle çalıştırmak için:  powershell -ExecutionPolicy Bypass -File scripts\baslat.ps1
# Durdurmak için:         scripts\durdur.ps1

$ErrorActionPreference = "Stop"
$proje = Split-Path -Parent $PSScriptRoot
Set-Location $proje

function PortDinliyorMu([int]$port) {
  $null -ne (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
}

# Derleme yoksa önce derle — aksi hâlde `next start` hata verir.
if (-not (Test-Path (Join-Path $proje ".next"))) {
  Write-Host "Derleme bulunamadi, once 'npm run build' calistiriliyor..."
  & npm.cmd run build
}

if (PortDinliyorMu 3000) {
  Write-Host "Next zaten calisiyor (3000)"
} else {
  Write-Host "Next baslatiliyor (127.0.0.1:3000)..."
  Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start" `
    -WorkingDirectory $proje -WindowStyle Hidden
}

# Next hazır olana kadar bekle (en fazla ~45 sn)
for ($i = 0; $i -lt 45; $i++) {
  if (PortDinliyorMu 3000) { break }
  Start-Sleep -Seconds 1
}

if (PortDinliyorMu 443) {
  Write-Host "HTTPS vekili zaten calisiyor (443)"
} else {
  Write-Host "HTTPS vekili baslatiliyor (0.0.0.0:443)..."
  Start-Process -FilePath "npm.cmd" -ArgumentList "run", "https" `
    -WorkingDirectory $proje -WindowStyle Hidden
}

Start-Sleep -Seconds 2
Write-Host ""
Write-Host "Site hazir:"
Write-Host "  https://neyersin.local"
foreach ($a in (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" })) {
  Write-Host "  https://$($a.IPAddress)   (ayni agdaki cihazlar)"
}
