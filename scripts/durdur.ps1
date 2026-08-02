# Ne Yersin? — siteyi durdur
# 3000 ve 443 portlarını dinleyen süreçleri kapatır.

foreach ($port in @(443, 3000)) {
  $pidler = (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess
  if ($pidler) {
    foreach ($p in @($pidler)) {
      Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
      Write-Host "port $port kapatildi (PID $p)"
    }
  } else {
    Write-Host "port $port zaten kapali"
  }
}
