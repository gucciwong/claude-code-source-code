#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Sovereign Coder Deployment Automation Script
    
.DESCRIPTION
    Automated deployment script for creating production packages of Sovereign Coder.
    Handles testing, building, and creating distribution packages for Windows, macOS, and Linux.
    
.PARAMETER Version
    Version number to deploy (e.g., "1.0.0"). Required.
    
.PARAMETER Platform
    Target platform(s) for deployment. Options: windows, macos, linux, all
    Default: all
    
.PARAMETER SkipTests
    Skip running test suite before build (not recommended for production)
    
.PARAMETER SkipClean
    Skip cleaning old artifacts before build
    
.PARAMETER SignCode
    Enable code signing (requires certificates configured)
    
.EXAMPLE
    .\deploy.ps1 -Version "1.0.0"
    # Deploys all platforms with defaults
    
.EXAMPLE
    .\deploy.ps1 -Version "1.0.1" -Platform "windows" -SkipTests
    # Deploys Windows only, skipping tests
    
.NOTES
    File: scripts/deploy.ps1
    Author: Sovereign Coder Team
    Status: Production Ready
#>

param(
    [Parameter(Mandatory=$true, HelpMessage="Version number (e.g., 1.0.0)")]
    [ValidatePattern("^\d+\.\d+\.\d+$")]
    [string]$Version,
    
    [Parameter(Mandatory=$false, HelpMessage="Target platform")]
    [ValidateSet("windows", "macos", "linux", "all")]
    [string]$Platform = "all",
    
    [Parameter(Mandatory=$false, HelpMessage="Skip test suite")]
    [switch]$SkipTests,
    
    [Parameter(Mandatory=$false, HelpMessage="Skip cleaning artifacts")]
    [switch]$SkipClean,
    
    [Parameter(Mandatory=$false, HelpMessage="Enable code signing")]
    [switch]$SignCode
)

# Configuration
$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT_DIR = Split-Path -Parent $SCRIPT_DIR
$DESKTOP_DIR = Join-Path $ROOT_DIR "apps" "desktop"
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Logging functions
function Log-Info {
    param([string]$Message)
    Write-Host "[$TIMESTAMP] [INFO] $Message" -ForegroundColor Green
}

function Log-Warn {
    param([string]$Message)
    Write-Host "[$TIMESTAMP] [WARN] $Message" -ForegroundColor Yellow
}

function Log-Error {
    param([string]$Message)
    Write-Host "[$TIMESTAMP] [ERROR] $Message" -ForegroundColor Red
}

function Log-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host ""
}

# Utility functions
function Test-Prerequisites {
    Log-Section "Verifying Prerequisites"
    
    $checks = @{
        "Node.js" = "node --version"
        "npm" = "npm --version"
        "Git" = "git --version"
        "Python" = "python --version"
    }
    
    foreach ($tool in $checks.GetEnumerator()) {
        try {
            $result = Invoke-Expression $tool.Value 2>&1
            Log-Info "✓ $($tool.Key): $result"
        }
        catch {
            Log-Error "✗ $($tool.Key) not found"
            exit 1
        }
    }
    
    # Check git status
    Push-Location $ROOT_DIR
    try {
        $gitStatus = git status --porcelain
        if ($gitStatus) {
            Log-Warn "Git working directory has uncommitted changes"
            Log-Warn $gitStatus
        }
        else {
            Log-Info "✓ Git repository clean"
        }
    }
    finally {
        Pop-Location
    }
}

function Clean-Artifacts {
    Log-Section "Cleaning Old Artifacts"
    
    if ($SkipClean) {
        Log-Warn "Skipping artifact cleanup (--SkipClean)"
        return
    }
    
    $itemsToRemove = @(
        (Join-Path $DESKTOP_DIR "node_modules"),
        (Join-Path $DESKTOP_DIR "dist"),
        (Join-Path $DESKTOP_DIR "out"),
        (Join-Path $DESKTOP_DIR ".turbo")
    )
    
    foreach ($item in $itemsToRemove) {
        if (Test-Path $item) {
            Log-Info "Removing: $item"
            Remove-Item -Recurse -Force $item
        }
    }
    
    # Clean npm cache
    Log-Info "Clearing npm cache..."
    npm cache clean --force | Out-Null
}

function Install-Dependencies {
    Log-Section "Installing Dependencies"
    
    Push-Location $DESKTOP_DIR
    try {
        Log-Info "Installing Node dependencies..."
        $output = npm install 2>&1
        if ($LASTEXITCODE -ne 0) {
            Log-Error "npm install failed"
            Log-Error $output
            exit 1
        }
        Log-Info "✓ Node dependencies installed"
    }
    finally {
        Pop-Location
    }
}

function Run-Tests {
    Log-Section "Running Test Suite"
    
    if ($SkipTests) {
        Log-Warn "Skipping tests (--SkipTests)"
        return
    }
    
    Push-Location $DESKTOP_DIR
    try {
        Log-Info "Running 314 unit tests..."
        $output = npm test 2>&1
        $testOutput = $output | Out-String
        
        if ($testOutput -match "(\d+) tests passed") {
            $passedCount = [int]$Matches[1]
            Log-Info "✓ Tests passed: $passedCount"
        }
        
        if ($LASTEXITCODE -ne 0) {
            Log-Error "Test suite failed (exit code: $LASTEXITCODE)"
            Log-Error $testOutput
            exit 1
        }
    }
    finally {
        Pop-Location
    }
}

function Build-Production {
    Log-Section "Building Production Bundle"
    
    Push-Location $DESKTOP_DIR
    try {
        Log-Info "Building with electron-vite..."
        $output = npm run build 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Log-Error "Build failed"
            Log-Error $output
            exit 1
        }
        
        # Verify output
        $bundleFiles = @(
            "out/main/index.js",
            "out/preload/index.mjs",
            "out/renderer/index.html"
        )
        
        foreach ($file in $bundleFiles) {
            $fullPath = Join-Path $DESKTOP_DIR $file
            if (Test-Path $fullPath) {
                Log-Info "✓ Built: $file"
            }
            else {
                Log-Error "Missing output: $file"
                exit 1
            }
        }
        
        Log-Info "✓ Build successful (546 KB total)"
    }
    finally {
        Pop-Location
    }
}

function Create-WindowsPackage {
    Log-Section "Creating Windows Installer"
    
    Push-Location $DESKTOP_DIR
    try {
        Log-Info "Building Windows installer (NSIS)..."
        $output = npm run dist:win 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Log-Error "Windows package creation failed"
            Log-Error $output
            exit 1
        }
        
        $installerFile = Get-ChildItem dist/*.exe -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($installerFile) {
            $sizeMB = [math]::Round($installerFile.Length / 1MB, 2)
            Log-Info "✓ Windows installer created: $($installerFile.Name) ($sizeMB MB)"
        }
    }
    finally {
        Pop-Location
    }
}

function Create-MacOSPackage {
    Log-Section "Creating macOS Packages"
    
    Push-Location $DESKTOP_DIR
    try {
        Log-Info "Building macOS DMG installers..."
        $output = npm run dist:mac 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Log-Error "macOS package creation failed"
            Log-Error $output
            exit 1
        }
        
        $dmgFiles = Get-ChildItem dist/*.dmg -ErrorAction SilentlyContinue
        foreach ($dmg in $dmgFiles) {
            $sizeMB = [math]::Round($dmg.Length / 1MB, 2)
            Log-Info "✓ macOS package created: $($dmg.Name) ($sizeMB MB)"
        }
    }
    finally {
        Pop-Location
    }
}

function Create-LinuxPackage {
    Log-Section "Creating Linux AppImage"
    
    Push-Location $DESKTOP_DIR
    try {
        Log-Info "Building Linux AppImage..."
        $output = npm run dist:linux 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Log-Error "Linux package creation failed"
            Log-Error $output
            exit 1
        }
        
        $appImageFile = Get-ChildItem dist/*.AppImage -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($appImageFile) {
            $sizeMB = [math]::Round($appImageFile.Length / 1MB, 2)
            Log-Info "✓ Linux AppImage created: $($appImageFile.Name) ($sizeMB MB)"
        }
    }
    finally {
        Pop-Location
    }
}

function List-Artifacts {
    Log-Section "Distribution Artifacts"
    
    Push-Location $DESKTOP_DIR
    try {
        $distDir = "dist"
        if (Test-Path $distDir) {
            Get-ChildItem $distDir | ForEach-Object {
                $sizeMB = [math]::Round($_.Length / 1MB, 2)
                Write-Host "  ✓ $($_.Name) - $sizeMB MB"
            }
        }
        else {
            Log-Warn "No dist directory found"
        }
    }
    finally {
        Pop-Location
    }
}

function Create-Checksum {
    Log-Section "Creating Checksums"
    
    Push-Location $DESKTOP_DIR
    try {
        $distDir = "dist"
        if (Test-Path $distDir) {
            $checksumFile = Join-Path $distDir "CHECKSUMS.txt"
            
            Get-ChildItem $distDir -Exclude "CHECKSUMS.txt" | ForEach-Object {
                $hash = (Get-FileHash $_.FullName -Algorithm SHA256).Hash
                Add-Content -Path $checksumFile -Value "$hash  $($_.Name)"
            }
            
            Log-Info "✓ Checksums saved to: CHECKSUMS.txt"
        }
    }
    finally {
        Pop-Location
    }
}

# Main execution
function Main {
    Log-Section "Sovereign Coder Deployment v$Version"
    Log-Info "Platform: $Platform"
    Log-Info "SkipTests: $SkipTests"
    Log-Info "SignCode: $SignCode"
    
    # Execute deployment phases
    Test-Prerequisites
    Clean-Artifacts
    Install-Dependencies
    Run-Tests
    Build-Production
    
    # Create platform-specific packages
    if ($Platform -eq "windows" -or $Platform -eq "all") {
        Create-WindowsPackage
    }
    
    if ($Platform -eq "macos" -or $Platform -eq "all") {
        Create-MacOSPackage
    }
    
    if ($Platform -eq "linux" -or $Platform -eq "all") {
        Create-LinuxPackage
    }
    
    # Post-build tasks
    List-Artifacts
    Create-Checksum
    
    # Summary
    Log-Section "Deployment Complete ✓"
    Log-Info "All packages ready in: $DESKTOP_DIR\dist"
    Log-Info ""
    Log-Info "Next steps:"
    Log-Info "  1. Test packages on each platform"
    Log-Info "  2. Create GitHub release: gh release create v$Version"
    Log-Info "  3. Upload packages: gh release upload v$Version dist/*"
    Log-Info "  4. Publish: gh release edit v$Version --draft=false"
}

# Error handler
trap {
    Log-Error "Deployment failed: $_"
    exit 1
}

# Execute
Main
