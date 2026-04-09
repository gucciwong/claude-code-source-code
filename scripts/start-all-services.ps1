#!/usr/bin/env pwsh
# Start All Sovereign Code Services
# Usage: .\scripts\start-all-services.ps1
# Logs are written to logs\ in each service directory

$ROOT = Split-Path -Parent $PSScriptRoot
$PYTHON = "$ROOT\.venv\Scripts\python.exe"
$LOG_DIR = "$ROOT\logs"

if (-not (Test-Path $LOG_DIR)) { New-Item -ItemType Directory -Path $LOG_DIR | Out-Null }

# Service definitions: name | relative path | port
$services = @(
    @{ Name = "voice-service";           Path = "services/voice-service";           Port = 8000 },
    @{ Name = "training-service";        Path = "services/training-service";        Port = 8001 },
    @{ Name = "model-manager";           Path = "services/model-manager";           Port = 8002 },
    @{ Name = "knowledge-service";       Path = "services/knowledge-service";       Port = 8003 },
    @{ Name = "enterprise-data-service"; Path = "services/enterprise-data-service"; Port = 8004 },
    @{ Name = "execution-trace-service"; Path = "services/execution-trace-service"; Port = 8005 },
    @{ Name = "orchestration-service";   Path = "services/orchestration-service";   Port = 8006 },
    @{ Name = "code-completion-service"; Path = "services/code-completion-service"; Port = 8007 },
    @{ Name = "federation-service";      Path = "services/federation-service";      Port = 8008 },
    @{ Name = "analytics-service";       Path = "services/analytics-service";       Port = 8009 },
    @{ Name = "memory-service";          Path = "services/memory-service";          Port = 8010 },
    @{ Name = "award-service";           Path = "services/award-service";           Port = 8011 },
    @{ Name = "messaging-bridge-service";Path = "services/messaging-bridge-service";Port = 8012 },
    @{ Name = "org-intelligence-service";Path = "services/org-intelligence-service";Port = 8013 },
    @{ Name = "persona-council-service"; Path = "services/persona-council-service"; Port = 8014 },
    @{ Name = "plugin-registry-service"; Path = "services/plugin-registry-service"; Port = 8015 },
    @{ Name = "pr-review-service";       Path = "services/pr-review-service";       Port = 8016 },
    @{ Name = "semantic-search-service"; Path = "services/semantic-search-service"; Port = 8017 }
)

Write-Host "`n=== Sovereign Code — Starting All Services ===" -ForegroundColor Cyan
Write-Host "Python: $PYTHON" -ForegroundColor DarkGray
Write-Host "Logs:   $LOG_DIR`n" -ForegroundColor DarkGray

foreach ($svc in $services) {
    $svcPath = Join-Path $ROOT $svc.Path
    $logFile = "$LOG_DIR\$($svc.Name).log"
    $port = $svc.Port

    if (-not (Test-Path "$svcPath\main.py")) {
        Write-Host "  SKIP  $($svc.Name) (no main.py found)" -ForegroundColor Yellow
        continue
    }

    # Check if port is already in use
    $portInUse = $null
    try {
        $portInUse = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
    } catch {}

    if ($portInUse) {
        Write-Host "  SKIP  $($svc.Name):$port (port already in use)" -ForegroundColor Yellow
        continue
    }

    # Start the service
    $proc = Start-Process -FilePath $PYTHON `
        -ArgumentList "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "$port", "--log-level", "warning" `
        -WorkingDirectory $svcPath `
        -RedirectStandardOutput $logFile `
        -RedirectStandardError "$LOG_DIR\$($svc.Name).err.log" `
        -NoNewWindow -PassThru

    if ($proc) {
        Write-Host "  START $($svc.Name.PadRight(30)) port $port  (pid $($proc.Id))" -ForegroundColor Green
    } else {
        Write-Host "  FAIL  $($svc.Name)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 200
}

Write-Host "`nWaiting 5 seconds for services to initialize..." -ForegroundColor DarkGray
Start-Sleep -Seconds 5

# Health check
Write-Host "`n=== Health Check ===" -ForegroundColor Cyan
$allOk = $true
foreach ($svc in $services) {
    $port = $svc.Port
    $url = "http://127.0.0.1:$port/health"
    try {
        $resp = Invoke-RestMethod -Uri $url -TimeoutSec 3 -ErrorAction Stop
        Write-Host "  OK    $($svc.Name.PadRight(30)) $url" -ForegroundColor Green
    } catch {
        $portInUse = $null
        try { $portInUse = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) } catch {}
        if ($portInUse) {
            Write-Host "  UP    $($svc.Name.PadRight(30)) port $port (no /health endpoint)" -ForegroundColor Yellow
        } else {
            Write-Host "  DOWN  $($svc.Name.PadRight(30)) port $port" -ForegroundColor Red
            $allOk = $false
        }
    }
}

Write-Host "`n=== Service URLs ===" -ForegroundColor Cyan
foreach ($svc in $services) {
    Write-Host "  http://127.0.0.1:$($svc.Port)  — $($svc.Name)"
}

Write-Host "`nLogs: $LOG_DIR" -ForegroundColor DarkGray
Write-Host "Stop: .\scripts\stop-all-services.ps1`n" -ForegroundColor DarkGray
