# Sovereign Code v1.0.0 — Deployment & Distribution Guide

**Status**: Production Ready ✅  
**Build Version**: 1.0.0  
**Build Date**: 2026-04-02  
**Platform Support**: Windows, macOS, Linux

---

## Overview

This guide covers deploying Sovereign Code from source code to end-user packages for Windows, macOS, and Linux.

### Deployment Flow

```
Source Code (GitHub)
    ↓
    ├─ Development Setup (npm install, pip install)
    ├─ Verification (npm test, manual testing)
    ├─ Production Build (npm run build)
    │
    ├─ Windows Package
    │   └─ npm run dist:win
    │       → sovereign-code-1.0.0.exe (installer)
    │
    ├─ macOS Package
    │   └─ npm run dist:mac
    │       → Sovereign-Code-1.0.0.dmg (installer)
    │
    ├─ Linux Package
    │   └─ npm run dist:linux
    │       → sovereign-code-1.0.0.AppImage (executable)
    │
    └─ Release
        ├─ GitHub Release
        ├─ Update website downloads
        ├─ Publish release notes
        └─ Announce v1.0.0
```

---

## Prerequisites for Deployment

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 18.x | 20.x LTS |
| Python | 3.10 | 3.12 |
| RAM | 8 GB | 16 GB |
| Disk | 20 GB | 50 GB |

### Required Tools

For **all platforms**:
```bash
node --version          # >= 18.x
npm --version           # >= 8.x
git --version           # >= 2.30
python --version        # >= 3.10
```

For **Windows packages**:
- NSIS (installed via npm dependencies)
- Visual Studio Build Tools (optional, for code signing)

For **macOS packages**:
- Xcode Command Line Tools
- Apple Developer account (for code signing)
- `appdmg` (installed via npm)

For **Linux packages**:
- AppImage tools (installed via npm)
- `fuse` library (system package)

---

## Step-by-Step Deployment

### Step 1: Environment Preparation

```powershell
# Clone repository
git clone https://github.com/YOUR_ORG/sovereign-code.git
cd sovereign-code

# Verify clean git state
git status                  # Should be clean with no uncommitted changes
git log --oneline -1        # Show current commit

# Create clean environment
cd apps/desktop
rm -r node_modules dist out   # Clean old artifacts (optional)
npm cache clean --force       # Clean npm cache
```

### Step 2: Install Dependencies

```powershell
# Install Node dependencies
npm install

# Verify installation
npm list | head -20          # Show dependency tree

# Install Python dependencies (for services)
cd services/training-service
pip install -r requirements.txt --quiet --disable-pip-version-check

cd ../voice-service
pip install -r requirements.txt --quiet --disable-pip-version-check
```

### Step 3: Run Complete Test Suite

```powershell
# Go back to desktop app
cd apps/desktop

# Run all 314 tests
npm test

# Expected output:
# ✓ 314 tests passed
# ✓ 10 tests skipped
# ✗ 0 tests failed
# Duration: ~3.5 seconds
```

**If tests fail:**
```powershell
npm test -- --reporter=verbose    # Show detailed output
npm test -- --testPathPattern="<ComponentName>"  # Test specific component
```

### Step 4: Build Production Bundle

```powershell
# Build desktop app
npm run build

# Verify output exists
ls out/main/
ls out/preload/
ls out/renderer/assets/

# Expected sizes:
# - main/index.js: ~4 KB
# - preload/index.mjs: ~0.2 KB
# - renderer CSS: ~33 KB
# - renderer JS: ~508 KB
# - Total: ~546 KB minified
```

### Step 5: Verify Production Build

```powershell
# Manual verification
Test-Path "out/main/index.js"           # Should be True
Test-Path "out/preload/index.mjs"       # Should be True
Test-Path "out/renderer/index.html"     # Should be True
Test-Path "out/renderer/assets"         # Should be True

# Check bundle sizes
(Get-Item out/main/index.js).Length / 1KB          # Show in KB
(Get-Item "out/renderer/assets/index-*.js").Length / 1KB
```

---

## Creating Distribution Packages

### Option A: Windows Installer

```powershell
# Create Windows installer (NSIS-based)
npm run dist:win

# Output location:
# dist/Sovereign Code Setup 1.0.0.exe  (~300-400 MB depending on assets)

# To test installer:
# - Run the .exe file
# - Follow installation wizard
# - Verify app launches after installation
```

**Windows Build Options** (in `package.json`):
```json
{
  "build": {
    "win": {
      "target": ["nsis", "portable"],
      "certificateFile": null,
      "certificatePassword": null
    }
  }
}
```

### Option B: macOS Package

```bash
# Create macOS DMG installer (Apple Silicon + Intel)
npm run dist:mac

# Output location:
# dist/Sovereign Code-1.0.0-arm64.dmg  (Apple Silicon)
# dist/Sovereign Code-1.0.0-x64.dmg    (Intel)

# To test DMG:
# - Double-click to mount
# - Drag app to Applications folder
# - Run from Applications
# - Verify on both Intel and Apple Silicon if possible
```

**macOS Build Options**:
```json
{
  "build": {
    "mac": {
      "target": ["dmg", "zip"],
      "identity": null,
      "certificateFile": null,
      "certificatePassword": null
    }
  }
}
```

### Option C: Linux AppImage

```bash
# Create Linux AppImage
npm run dist:linux

# Output location:
# dist/sovereign-code-1.0.0.AppImage  (~500-600 MB)

# To test AppImage:
chmod +x sovereign-code-1.0.0.AppImage
./sovereign-code-1.0.0.AppImage

# Or install fuse if needed:
# Ubuntu/Debian: sudo apt-get install libfuse2
# Fedora: sudo dnf install fuse
```

**Linux Build Options**:
```json
{
  "build": {
    "linux": {
      "target": ["AppImage", "rpm"],
      "category": "Development"
    }
  }
}
```

---

## GitHub Release Process

### Step 1: Create Release Tag

```bash
# Tag the release
git tag -a v1.0.0 -m "Sovereign Code v1.0.0 Release"
git push origin v1.0.0

# Verify tag created
git tag -l | grep 1.0.0
git show v1.0.0
```

### Step 2: Create GitHub Release

Via GitHub CLI:
```bash
# Create release with auto-generated notes
gh release create v1.0.0 --generate-notes

# Or with custom release notes
gh release create v1.0.0 \
  --title "Sovereign Code v1.0.0" \
  --notes "See RELEASE_NOTES_v1.0.0.md for full details"
```

Or manually via GitHub web interface:
1. Go to Releases page
2. Click "Draft a new release"
3. Tag version: `v1.0.0`
4. Title: "Sovereign Code v1.0.0"
5. Description: Copy from `RELEASE_NOTES_v1.0.0.md`
6. Upload assets (see Step 3)

### Step 3: Upload Distribution Assets

Attach built packages to the GitHub release:

```bash
# After creating release, upload assets
gh release upload v1.0.0 \
  dist/'Sovereign Code Setup 1.0.0.exe' \
  dist/'Sovereign Code-1.0.0-arm64.dmg' \
  dist/'Sovereign Code-1.0.0-x64.dmg' \
  dist/sovereign-code-1.0.0.AppImage \
  dist/sovereign-code-1.0.0.rpm

# Or upload manually on GitHub website:
# - Drag files to release assets section
# - Verify all files upload successfully
```

### Step 4: Publish Release

```bash
# Make release public
gh release edit v1.0.0 --draft=false

# Verify published
gh release view v1.0.0
```

---

## Post-Deployment Verification

### Checklist After Release

- [ ] GitHub Release created and published
- [ ] All assets uploaded (Windows, macOS, Linux)
- [ ] Release notes visible on GitHub
- [ ] Download links working
- [ ] File checksums match expected sizes
- [ ] Release announcement sent
- [ ] Website updated with download links
- [ ] Documentation links verified
- [ ] No broken links in release notes

### Testing Released Packages

**Windows:**
```powershell
# Download installer
curl -L "https://github.com/YOUR_ORG/.../Sovereign%20Coder%20Setup%201.0.0.exe" -o setup.exe

# Run installer
.\setup.exe

# Verify app works
# App should launch after installation
# Chat should respond
# Training screen accessible
```

**macOS:**
```bash
# Download DMG
curl -L "https://github.com/YOUR_ORG/.../Sovereign%20Coder-1.0.0-arm64.dmg" -o app.dmg

# Mount and test
hdiutil mount app.dmg
cp -r /Volumes/"Sovereign Code"/Sovereign\ Coder.app ~/Applications/

# Launch and verify
open ~/Applications/"Sovereign Code.app"
```

**Linux:**
```bash
# Download AppImage
curl -L "https://github.com/YOUR_ORG/.../sovereign-code-1.0.0.AppImage" -o app.AppImage
chmod +x app.AppImage

# Run and verify
./app.AppImage

# Or install fuse library if needed
sudo apt-get install libfuse2
./app.AppImage
```

---

## Automated Deployment Script

Create `scripts/deploy.ps1` for one-command deployment:

```powershell
#!/usr/bin/env pwsh
# Sovereign Code Deployment Script
# Usage: .\scripts\deploy.ps1 -Version "1.0.0" -Platform "windows"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("windows", "macos", "linux", "all")]
    [string]$Platform = "all"
)

Write-Host "Deploying Sovereign Code v$Version" -ForegroundColor Green

# Step 1: Verify environment
Write-Host "Step 1: Verifying environment..." -ForegroundColor Blue
if ((npm --version) -eq $null) { throw "npm not found" }
if ((node --version) -eq $null) { throw "node not found" }
if ((git status) -eq $null) { throw "git repo broken" }

# Step 2: Clean and install
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Blue
cd apps/desktop
rm -r node_modules -ErrorAction SilentlyContinue
npm install --silent

# Step 3: Run tests
Write-Host "Step 3: Running tests..." -ForegroundColor Blue
$testResult = npm test 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tests failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ All tests passed" -ForegroundColor Green

# Step 4: Build
Write-Host "Step 4: Building production bundle..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green

# Step 5: Create packages
Write-Host "Step 5: Creating distribution packages..." -ForegroundColor Blue

if ($Platform -eq "windows" -or $Platform -eq "all") {
    Write-Host "  Creating Windows installer..." -ForegroundColor Cyan
    npm run dist:win
}

if ($Platform -eq "macos" -or $Platform -eq "all") {
    Write-Host "  Creating macOS packages..." -ForegroundColor Cyan
    npm run dist:mac
}

if ($Platform -eq "linux" -or $Platform -eq "all") {
    Write-Host "  Creating Linux AppImage..." -ForegroundColor Cyan
    npm run dist:linux
}

Write-Host "✓ Deployment complete" -ForegroundColor Green
Write-Host ""
Write-Host "Packages ready in dist/ directory" -ForegroundColor Yellow
Get-ChildItem dist/ | Select-Object Name, Length
```

**Usage:**
```powershell
# Deploy Windows only
.\scripts\deploy.ps1 -Version "1.0.0" -Platform "windows"

# Deploy all platforms
.\scripts\deploy.ps1 -Version "1.0.0" -Platform "all"
```

---

## Signing & Code Integrity

### Windows Code Signing (Optional)

For production builds, sign the installer:

```powershell
# Requires: Code signing certificate and password
$env:WIN_CERT_FILE = "C:\path\to\certificate.pfx"
$env:WIN_CERT_PASSWORD = "your-password-here"

npm run dist:win
```

### macOS Code Signing (Optional)

For production builds, sign the app:

```bash
# Requires: Apple Developer account and certificates
export MAC_CERT_NAME="Developer ID Application: Your Name"
export MAC_CERT_PASSWORD="your-password-here"

npm run dist:mac
```

---

## Performance & Bundle Optimization

### Current Build Metrics

```
Production Build (v1.0.0):
├── Main process: 4.29 kB (electron-vite/main)
├── Preload script: 0.25 kB (IPC bridge)
├── CSS bundle: 33.50 kB (Tailwind CSS)
├── JS bundle: 508.20 kB (React + dependencies)
├── HTML: 0.40 kB (entrypoint)
└── Total: ~546 kB minified

Distribution Packages:
├── Windows installer: ~300-400 MB
├── macOS DMG: ~400-500 MB per architecture
└── Linux AppImage: ~500-600 MB
```

### Optimization Tips

**To reduce bundle size:**
1. Enable code splitting: `rollup: { output: { manualChunks: {...} } }`
2. Tree-shake unused modules: `npm run build -- --format esm`
3. Lazy-load routes: Use React.lazy() for screen components
4. Defer non-critical styles: Use CSS-in-JS for dynamic styles

**Current optimization status:**
- ✅ Minified (esbuild/terser)
- ✅ Tree-shaken (Rollup)
- ✅ CSS deduplicated (Tailwind)
- ✅ No source maps in production
- ✅ No debug code included

---

## CI/CD Integration (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Sovereign Code

on:
  release:
    types: [published]

jobs:
  deploy-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd apps/desktop && npm install
      - run: cd apps/desktop && npm test
      - run: cd apps/desktop && npm run dist:win
      - uses: softprops/action-gh-release@v1
        with:
          files: apps/desktop/dist/Sovereign*.exe

  deploy-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd apps/desktop && npm install
      - run: cd apps/desktop && npm test
      - run: cd apps/desktop && npm run dist:mac
      - uses: softprops/action-gh-release@v1
        with:
          files: apps/desktop/dist/Sovereign*.dmg

  deploy-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: sudo apt-get install -y libfuse2
      - run: cd apps/desktop && npm install
      - run: cd apps/desktop && npm test
      - run: cd apps/desktop && npm run dist:linux
      - uses: softprops/action-gh-release@v1
        with:
          files: apps/desktop/dist/sovereign*.AppImage
```

---

## Troubleshooting Deployment

### Common Issues

**npm ERR! peer dep missing**
```powershell
npm install --legacy-peer-deps
```

**Build fails with "out of memory"**
```powershell
$env:NODE_OPTIONS = "--max-old-space-size=4096"
npm run build
```

**Windows installer creation fails**
```powershell
# NSIS not found - install globally
npm install -g nsis
```

**macOS DMG signing fails**
```bash
# Skip signing for development
npm run dist:mac -- --publish=never
```

**Linux AppImage not executable**
```bash
chmod +x sovereign-code-*.AppImage
```

---

## Rollback Procedure

If deployment issues are discovered:

```bash
# Revert GitHub release
gh release delete v1.0.0 --cleanup-tag

# Revert git tags and commits
git tag -d v1.0.0
git push origin :v1.0.0
git reset --hard <previous-commit>

# Republish announcement
# "We discovered issues with v1.0.0. Back to v0.9.x for now. v1.0.1 coming soon."
```

---

## Next Deployment (v1.0.1)

For future patches and updates:

1. **Merge fixes** to main branch
2. **Bump version** in `package.json`: `"version": "1.0.1"`
3. **Update CHANGELOG** with fixes
4. **Tag release**: `git tag v1.0.1`
5. **Follow this guide** for deployment

Increment patch version (1.0.X) for bugfixes, minor version (1.X.0) for features.

---

## Support & Documentation

- **Getting Started**: [GETTING_STARTED.md](../GETTING_STARTED.md)
- **Setup Guide**: [SETUP_GUIDE.md](../SETUP_GUIDE.md)
- **Integration Testing**: [LIVE_INTEGRATION_TESTING_GUIDE.md](../LIVE_INTEGRATION_TESTING_GUIDE.md)
- **Release Notes**: [RELEASE_NOTES_v1.0.0.md](../RELEASE_NOTES_v1.0.0.md)

---

**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Last Updated**: 2026-04-02

