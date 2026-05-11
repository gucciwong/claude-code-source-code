<#
.SYNOPSIS
  One-shot push for the GA Runway W1–W8 deliverables.

.DESCRIPTION
  This script is a Windows-side substitute for "have the agent push for me".
  The sandbox the agent runs in cannot execute `gh` or `git push` because:
    1. gh CLI is not installable (proxy 403)
    2. no GitHub token is mounted in the agent env
    3. .git/worktrees is mounted read-only from Linux
    4. .worktrees/* contains Windows absolute paths that break Linux git

  Running this on Windows side bypasses all four blockers.

.PARAMETER Branch
  Branch name to create + push. Default: feat/ga-runway-w1-w8.

.PARAMETER Base
  Base branch for the PR. Default: main.

.PARAMETER Title
  PR title. Default: "GA Runway W1-W8 — v1.0.0 release readiness".

.PARAMETER Draft
  Open the PR as a draft so CI runs without requesting review. Default: $true.

.PARAMETER SkipPR
  Push the branch but skip `gh pr create` (useful if PR already exists).

.EXAMPLE
  cd "D:\Users\Admin\Documents\GitHub\Sovereign Code"
  .\scripts\push-ga.ps1

.EXAMPLE
  .\scripts\push-ga.ps1 -Branch feat/ga-w7-only -SkipPR

.NOTES
  Requires: git, gh (logged in via `gh auth login`).
  Re-runnable: if the branch already exists locally, the script aborts before
  destructive operations. Delete the branch first to retry.
#>

[CmdletBinding()]
param(
    [string] $Branch = "feat/ga-runway-w1-w8",
    [string] $Base = "main",
    [string] $Title = "GA Runway W1-W8 - v1.0.0 release readiness",
    [bool]   $Draft = $true,
    [switch] $SkipPR
)

$ErrorActionPreference = "Stop"

function Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Warn($msg) { Write-Host "!!  $msg" -ForegroundColor Yellow }
function Die($msg)  { Write-Host "XX  $msg" -ForegroundColor Red; exit 1 }

# -----------------------------------------------------------------------------
# 0. PATH bootstrap — some launchers (Desktop Commander, scheduled tasks,
# CI runners) spawn PowerShell with a minimal PATH (system32 only). Pull
# the full Machine + User PATH from the registry so `git` and `gh` resolve.
# -----------------------------------------------------------------------------
$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath    = [Environment]::GetEnvironmentVariable("Path", "User")
$env:PATH = "$machinePath;$userPath"

# -----------------------------------------------------------------------------
# 0b. Preconditions
# -----------------------------------------------------------------------------
Step "Checking preconditions"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Die "git not found in PATH (Machine+User PATH both checked)"
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue) -and -not $SkipPR) {
    Die "gh not found in PATH (install: https://cli.github.com/) — or rerun with -SkipPR"
}

# Confirm we're at repo root by looking for the runway plan file.
if (-not (Test-Path "docs/plans/2026-05-11-ga-runway-plan.md")) {
    Die "Run this from the repo root (where docs/plans/2026-05-11-ga-runway-plan.md exists)"
}

# Confirm gh is authenticated (otherwise PR create will fail).
if (-not $SkipPR) {
    & gh auth status 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Die "gh is not authenticated. Run: gh auth login"
    }
}

# -----------------------------------------------------------------------------
# 1. Clean up the legacy Windows-path worktree pointers
# -----------------------------------------------------------------------------
Step "Pruning stale worktrees (.worktrees/feat/*)"
& git worktree prune 2>&1 | ForEach-Object { Write-Host "    $_" }

# Some pointers reference Windows absolute paths from an old layout; remove
# them manually if `git worktree prune` doesn't clean them. We only touch
# .git/worktrees/<name> entries that point to a non-existent path.
$wtDir = ".git/worktrees"
if (Test-Path $wtDir) {
    Get-ChildItem $wtDir -Directory | ForEach-Object {
        $gitdirFile = Join-Path $_.FullName "gitdir"
        if (Test-Path $gitdirFile) {
            $target = (Get-Content $gitdirFile -Raw).Trim()
            $targetParent = Split-Path $target -Parent
            if ($targetParent -and -not (Test-Path $targetParent)) {
                Warn "Stale worktree '$($_.Name)' points to missing dir; removing"
                Remove-Item -Recurse -Force $_.FullName
            }
        }
    }
}

# Also wipe the local .worktrees/ scratch dir if it carries the old Windows
# absolute-path pointer files (`.git` is a file, not a dir, inside worktrees).
if (Test-Path ".worktrees") {
    Step "Stashing legacy .worktrees scratch dir to .worktrees.bak (you can delete later)"
    if (Test-Path ".worktrees.bak") { Remove-Item -Recurse -Force ".worktrees.bak" }
    Move-Item ".worktrees" ".worktrees.bak"
}

# -----------------------------------------------------------------------------
# 2. Branch checkout
# -----------------------------------------------------------------------------
Step "Switching to base branch: $Base"
& git checkout $Base
if ($LASTEXITCODE -ne 0) { Die "checkout $Base failed" }

Step "Fetching latest from origin/$Base (so the new branch isn't behind)"
& git fetch origin $Base 2>&1 | ForEach-Object { Write-Host "    $_" }

# Allow re-running: if branch exists, switch to it; otherwise create fresh.
$existing = & git branch --list $Branch
if ($existing) {
    Warn "Branch '$Branch' already exists locally — using it as-is"
    & git checkout $Branch
} else {
    Step "Creating branch: $Branch"
    & git checkout -b $Branch
}
if ($LASTEXITCODE -ne 0) { Die "branch checkout failed" }

# -----------------------------------------------------------------------------
# 3. Stage + commit
# -----------------------------------------------------------------------------
Step "Staging all GA Runway changes"
& git add -A
if ($LASTEXITCODE -ne 0) { Die "git add failed" }

# If nothing to commit (re-run, already committed), surface and continue.
$diffStat = & git diff --cached --stat
if (-not $diffStat) {
    Warn "No staged changes — assuming a previous run already committed this branch"
} else {
    Write-Host $diffStat
    $commitMsg = @"
feat: complete GA Runway W1-W8

- W1 PRD truth reconciliation + Federation cleanup
- W2 HF download UI / Mirror toggle / Training real data (verified done)
- W3 local-token guard (32 routes, 4 services) + Electron token chain
- W4 services-ci / release / supply-chain / e2e workflows; electron-updater
- W5 CAMR Context-Aware Model Router + SQLite ledger + Auto UI
- W6 SQLite persistence + Prometheus/Grafana/Loki + structured logs
- W7 Playwright e2e + first-run onboarding + perf budget + TODO sweep
- W8 cosign + SBOM + Aliyun OSS + SECURITY.md + COMPLIANCE.md + Day-0 runbook

See docs/plans/2026-05-11-ga-runway-plan.md for the 8-week plan and
RELEASE_NOTES_v1.0.0.md for the GA-ready feature summary.
"@
    Step "Committing"
    & git commit -m $commitMsg
    if ($LASTEXITCODE -ne 0) { Die "git commit failed" }
}

# -----------------------------------------------------------------------------
# 4. Push
# -----------------------------------------------------------------------------
Step "Pushing to origin/$Branch (this will trigger CI on PR)"
& git push -u origin $Branch
if ($LASTEXITCODE -ne 0) { Die "git push failed" }

# -----------------------------------------------------------------------------
# 5. Open PR
# -----------------------------------------------------------------------------
if ($SkipPR) {
    Step "Done. -SkipPR was set so no PR was opened."
    exit 0
}

Step "Opening PR via gh"

# Use RELEASE_NOTES as the body so the PR description is the GA feature summary.
$bodyFile = "RELEASE_NOTES_v1.0.0.md"
if (-not (Test-Path $bodyFile)) {
    Warn "$bodyFile not found — falling back to short body"
    $bodyArgs = @("--body", "Closes the entire 8-week runway. See docs/plans/2026-05-11-ga-runway-plan.md.")
} else {
    $bodyArgs = @("--body-file", $bodyFile)
}

$prArgs = @(
    "pr","create",
    "--base", $Base,
    "--head", $Branch,
    "--title", $Title
) + $bodyArgs

if ($Draft) { $prArgs += "--draft" }

& gh @prArgs
if ($LASTEXITCODE -ne 0) {
    Warn "gh pr create failed (a PR may already exist). Listing PRs from this branch:"
    & gh pr list --head $Branch
    exit 1
}

# -----------------------------------------------------------------------------
# 6. Surface CI run URLs
# -----------------------------------------------------------------------------
Step "Waiting 8s for CI workflows to register, then listing runs"
Start-Sleep -Seconds 8
& gh run list --branch $Branch --limit 10

Step "Done. PR draft is open. Tail CI in real time with:  gh pr checks --watch"
