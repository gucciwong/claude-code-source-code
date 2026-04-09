#!/usr/bin/env pwsh
# Stop All Sovereign Code Services
# Usage: .\scripts\stop-all-services.ps1

$ports = 8000..8017

Write-Host "`n=== Sovereign Code — Stopping All Services ===" -ForegroundColor Cyan

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $procId = $conn.OwningProcess
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "  STOP  port $port  pid $procId  ($($proc.Name))" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nAll services stopped.`n" -ForegroundColor Green
