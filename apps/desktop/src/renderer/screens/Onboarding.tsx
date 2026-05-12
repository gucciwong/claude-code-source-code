/**
 * W7-T20 — First-run onboarding screen.
 * UI W3 — 4-phase Stitch-distilled flow with illustrated steps.
 *
 *   Phase 1 — Pick a model
 *     Wraps the original 5-step model-pick sub-machine (detect → choose →
 *     download → warmup → ready). When `step === 'ready'`, the user can
 *     advance to Phase 2.
 *
 *   Phase 2 — Import workspace
 *     User accepts the suggested root or enters their own. Stored in
 *     `useCodingStore.workspaceRoot`. Skippable.
 *
 *   Phase 3 — Enable agent
 *     Toggle agent-mode + dry-run defaults. Skippable.
 *
 *   Phase 4 — Invite a federation peer (optional)
 *     Show the local node identifier; user can copy + paste it into a
 *     peer's "Add manual peer" field later, or skip entirely.
 *
 * Rendered by `MainContent` when `useOnboardingStore.hasCompleted === false`.
 */

import { useEffect, useState } from 'react'
import {
  Sparkles,
  Cpu,
  Download,
  Check,
  AlertCircle,
  Loader2,
  ClipboardCopy,
  ArrowRight,
} from 'lucide-react'

import { useOnboardingStore, type OnboardingPhase } from '../store/onboardingStore'
import { useSystemStore } from '../store/systemStore'
import { useCodingStore } from '../store/codingStore'
import { useAgentStore } from '../store/agentStore'
import { useModelManager } from '../hooks/useModelManager'

/** Display copy for the 4-step header stepper. */
const PHASE_META: Array<{ id: OnboardingPhase; label: string; subtitle: string }> = [
  { id: 'model', label: 'Pick a model', subtitle: 'Detect VRAM, download the right one' },
  { id: 'workspace', label: 'Import workspace', subtitle: 'Point us at your repo root' },
  { id: 'agent', label: 'Enable agent', subtitle: 'Tools that read & write code' },
  { id: 'federation', label: 'Invite a peer', subtitle: 'Optional — federate later if solo' },
]

export function Onboarding() {
  const phase = useOnboardingStore(s => s.phase)
  const advancePhase = useOnboardingStore(s => s.advancePhase)
  const skipPhase = useOnboardingStore(s => s.skipPhase)
  const error = useOnboardingStore(s => s.error)

  return (
    <div
      data-testid="screen-onboarding"
      className="flex flex-col items-center h-full px-8 py-10 bg-bg-base overflow-y-auto"
    >
      <div className="max-w-3xl w-full space-y-8">
        {/* Hero header */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-500/15 border border-accent-500/30 mx-auto">
            <Sparkles size={26} className="text-accent-400" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Welcome to Sovereign Code
          </h1>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Four quick steps and you&apos;ll be chatting with a fully local model.
            Skip anything that isn&apos;t for you — you can always finish setup later from
            Settings.
          </p>
        </header>

        {/* Stepper */}
        <PhaseStepper active={phase} />

        {/* Phase content */}
        {phase === 'model' && <ModelPhase onDone={advancePhase} />}
        {phase === 'workspace' && (
          <WorkspacePhase onDone={advancePhase} onSkip={skipPhase} />
        )}
        {phase === 'agent' && (
          <AgentPhase onDone={advancePhase} onSkip={skipPhase} />
        )}
        {phase === 'federation' && (
          <FederationPhase onDone={advancePhase} onSkip={skipPhase} />
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/40 text-sm text-red-200"
          >
            <AlertCircle size={18} aria-hidden="true" />
            <div>
              <p className="font-semibold">Something went wrong</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Horizontal 4-dot stepper. Done phases get an emerald check, active gets
 * an emerald ring, future phases stay muted. The connector line between
 * dots fills in as the user progresses.
 */
function PhaseStepper({ active }: { active: OnboardingPhase }) {
  const order: OnboardingPhase[] = ['model', 'workspace', 'agent', 'federation']
  const activeIndex = order.indexOf(active)
  const progressPct = activeIndex < 0 ? 100 : (activeIndex / (order.length - 1)) * 100

  return (
    <nav aria-label="Onboarding progress" className="relative">
      {/* Connector track */}
      <div
        className="absolute left-[6%] right-[6%] top-4 h-0.5 bg-border-subtle"
        aria-hidden="true"
      />
      <div
        className="absolute left-[6%] top-4 h-0.5 bg-accent-500 transition-all duration-500 ease-out"
        style={{ width: `calc(${progressPct}% * 0.88)` }}
        aria-hidden="true"
      />
      <ol className="relative flex justify-between">
        {PHASE_META.map((p, i) => {
          const isActive = p.id === active
          const isDone = activeIndex > i
          return (
            <li
              key={p.id}
              className="flex flex-col items-center gap-2"
              style={{ width: `${100 / order.length}%` }}
            >
              <div
                aria-current={isActive ? 'step' : undefined}
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors',
                  isDone
                    ? 'bg-accent-500 text-text-primary'
                    : isActive
                      ? 'bg-bg-surface-2 text-accent-400 border-2 border-accent-500'
                      : 'bg-bg-surface-2 text-text-muted border border-border-default',
                ].join(' ')}
              >
                {isDone ? <Check size={14} aria-hidden="true" /> : i + 1}
              </div>
              <div className="text-center px-1 hidden sm:block">
                <div
                  className={[
                    'text-[12px] font-medium leading-tight',
                    isActive ? 'text-text-primary' : isDone ? 'text-text-secondary' : 'text-text-muted',
                  ].join(' ')}
                >
                  {p.label}
                </div>
                <div className="text-[10px] text-text-muted mt-0.5 leading-tight">
                  {p.subtitle}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ── Phase 1 — Pick a model ─────────────────────────────────────────────────

function ModelPhase({ onDone }: { onDone: () => void }) {
  const step = useOnboardingStore(s => s.step)
  const recommended = useOnboardingStore(s => s.recommended)
  const downloadProgress = useOnboardingStore(s => s.downloadProgress)
  const startDetection = useOnboardingStore(s => s.startDetection)
  const confirmChoice = useOnboardingStore(s => s.confirmChoice)
  const setDownloadProgress = useOnboardingStore(s => s.setDownloadProgress)
  const finishDownload = useOnboardingStore(s => s.finishDownload)
  const finishWarmup = useOnboardingStore(s => s.finishWarmup)
  const fail = useOnboardingStore(s => s.fail)
  const vramTotal = useSystemStore(s => s.vramTotal)
  const { downloadModel } = useModelManager()
  const [busy, setBusy] = useState(false)

  // Kick detection when entering the phase fresh.
  useEffect(() => {
    if (step === 'pending') {
      const id = setTimeout(() => startDetection(vramTotal), 250)
      return () => clearTimeout(id)
    }
  }, [step, vramTotal, startDetection])

  const onStartDownload = async () => {
    if (!recommended) return
    setBusy(true)
    try {
      setDownloadProgress(0)
      const result = await downloadModel(recommended.id)
      if (!result) {
        fail('Download failed — check that the model-manager service is running.')
        setBusy(false)
        return
      }
      setDownloadProgress(100)
      finishDownload()
      try {
        await fetch('http://localhost:8002/api/v1/inference/warmup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model_id: recommended.id }),
          signal: AbortSignal.timeout(30_000),
        })
      } catch {
        /* warmup is optional */
      }
      finishWarmup()
    } finally {
      setBusy(false)
    }
  }

  return (
    <PhaseCard
      illustration={<ModelIllustration />}
      title="Pick a model"
      subtitle="We&apos;ll match a starter model to your GPU and download it once."
    >
      {step === 'detect' && (
        <div className="space-y-4">
          <div className="text-sm text-text-secondary">
            <span className="text-text-muted">GPU memory: </span>
            <span className="font-mono text-text-primary">
              {vramTotal != null ? `${vramTotal.toFixed(1)} GB` : 'detecting…'}
            </span>
          </div>
          {recommended && (
            <div className="p-4 rounded-lg bg-bg-surface-2 border border-border-default space-y-1">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-accent-400" aria-hidden="true" />
                <span className="text-sm font-semibold text-text-primary">
                  {recommended.display}
                </span>
              </div>
              <p className="text-xs text-text-muted">{recommended.reason}</p>
              <p className="text-xs text-text-muted font-mono">
                ~{recommended.size_gb.toFixed(1)} GB download
              </p>
            </div>
          )}
          <PrimaryButton onClick={confirmChoice} disabled={!recommended}>
            Looks good — continue
          </PrimaryButton>
        </div>
      )}

      {step === 'choose' && recommended && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            We&apos;ll fetch <span className="font-semibold text-text-primary">{recommended.display}</span>{' '}
            from HuggingFace. You can swap to a different one later from the Models screen.
          </p>
          <PrimaryButton onClick={onStartDownload} disabled={busy}>
            <Download size={14} aria-hidden="true" />
            Start download
          </PrimaryButton>
        </div>
      )}

      {step === 'download' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-text-secondary">downloading</span>
            <span className="text-text-primary">{downloadProgress}%</span>
          </div>
          <div
            className="w-full h-2 bg-bg-surface-3 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={downloadProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-accent-500 transition-all duration-300 ease-out"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-text-muted">
            Keep working — we&apos;ll continue in the background.
          </p>
        </div>
      )}

      {step === 'warmup' && (
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <Loader2 size={16} className="animate-spin text-accent-400" aria-hidden="true" />
          Warming up first-token cache…
        </div>
      )}

      {step === 'ready' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-accent-400">
            <Check size={16} aria-hidden="true" />
            Model loaded and warm.
          </div>
          <PrimaryButton onClick={onDone}>
            Continue
            <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
        </div>
      )}
    </PhaseCard>
  )
}

// ── Phase 2 — Import workspace ─────────────────────────────────────────────

function WorkspacePhase({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const workspaceRoot = useCodingStore(s => s.workspaceRoot)
  const setWorkspaceRoot = useCodingStore(s => s.setWorkspaceRoot)
  const [draft, setDraft] = useState(workspaceRoot)

  const onContinue = () => {
    const trimmed = draft.trim()
    if (trimmed) setWorkspaceRoot(trimmed)
    onDone()
  }

  return (
    <PhaseCard
      illustration={<WorkspaceIllustration />}
      title="Import a workspace"
      subtitle="Chat, semantic search, and PR Review need a repo root to read from."
    >
      <div className="space-y-3">
        <label className="block">
          <span className="block text-xs text-text-muted mb-1.5 font-mono uppercase tracking-wide">
            Repo root
          </span>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="~/projects/my-repo"
            className="w-full px-3 py-2 rounded-md bg-bg-surface-2 border border-border-default text-sm font-mono text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Workspace root path"
          />
        </label>
        <p className="text-[11px] text-text-muted">
          We&apos;ll never read these files until you ask in chat. Indexing happens on demand.
        </p>
        <div className="flex gap-2">
          <PrimaryButton onClick={onContinue}>
            Use this path
            <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <SecondaryButton onClick={onSkip}>Skip for now</SecondaryButton>
        </div>
      </div>
    </PhaseCard>
  )
}

// ── Phase 3 — Enable agent ─────────────────────────────────────────────────

function AgentPhase({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const agentMode = useAgentStore(s => s.agentMode)
  const setAgentMode = useAgentStore(s => s.setAgentMode)
  const dryRun = useAgentStore(s => s.dryRun)
  const setDryRun = useAgentStore(s => s.setDryRun)

  return (
    <PhaseCard
      illustration={<AgentIllustration />}
      title="Enable agent mode"
      subtitle="Agent mode lets the assistant read files, grep, and propose edits. Dry-run is on by default — nothing writes without your confirmation."
    >
      <div className="space-y-3">
        <ToggleRow
          label="Agent mode"
          description="Allow the assistant to call tools (grep, read_file, write_file)."
          checked={agentMode}
          onChange={setAgentMode}
        />
        <ToggleRow
          label="Dry run"
          description="Preview every write as a diff before applying. Recommended on for the first session."
          checked={dryRun}
          onChange={setDryRun}
          disabled={!agentMode}
        />
        <div className="flex gap-2 pt-1">
          <PrimaryButton onClick={onDone}>
            Continue
            <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <SecondaryButton onClick={onSkip}>Skip for now</SecondaryButton>
        </div>
      </div>
    </PhaseCard>
  )
}

// ── Phase 4 — Invite a federation peer ─────────────────────────────────────

function FederationPhase({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  // Synthetic node id. Real impl would read from the federation-service
  // status endpoint; for onboarding the user only needs to see "you have
  // an identity" — they can copy + share now or later.
  const nodeId = `NODE-${(Math.random() * 0xffff).toString(16).slice(0, 4).toUpperCase()}-${(Math.random() * 0xffff).toString(16).slice(0, 4).toUpperCase()}`
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(nodeId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — user can still read the value */
    }
  }

  return (
    <PhaseCard
      illustration={<FederationIllustration />}
      title="Invite a peer (optional)"
      subtitle="Federation lets your local node share embeddings with trusted machines. Solo works great too — skip if you&apos;re flying alone."
    >
      <div className="space-y-3">
        <div className="p-3 rounded-md bg-bg-surface-2 border border-border-default flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] text-text-muted font-mono uppercase tracking-wide">
              Your node id
            </div>
            <div className="font-mono text-sm text-text-primary truncate">{nodeId}</div>
          </div>
          <button
            type="button"
            onClick={onCopy}
            aria-label="Copy node id"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-surface-3 hover:bg-bg-elevated text-text-secondary hover:text-text-primary text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            {copied ? (
              <>
                <Check size={12} className="text-accent-400" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <ClipboardCopy size={12} aria-hidden="true" />
                Copy
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-text-muted">
          Share this with a teammate; they&apos;ll paste it into their Federation screen
          under <span className="font-mono">Manual connect</span>.
        </p>
        <div className="flex gap-2 pt-1">
          <PrimaryButton onClick={onDone}>
            Finish setup
            <Check size={14} aria-hidden="true" />
          </PrimaryButton>
          <SecondaryButton onClick={onSkip}>Skip — I&apos;m solo</SecondaryButton>
        </div>
      </div>
    </PhaseCard>
  )
}

// ── Shared layout primitives ───────────────────────────────────────────────

function PhaseCard({
  illustration,
  title,
  subtitle,
  children,
}: {
  illustration: React.ReactNode
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="grid md:grid-cols-[200px_1fr] gap-6 p-6 rounded-xl bg-bg-surface-1 border border-border-default">
      <div className="flex items-center justify-center">{illustration}</div>
      <div className="space-y-4 min-w-0">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

function PrimaryButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={[
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md',
        'bg-accent-500 hover:bg-accent-600 active:bg-accent-600 text-white',
        'text-sm font-semibold transition-colors cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function SecondaryButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={[
        'inline-flex items-center justify-center px-4 py-2 rounded-md',
        'bg-transparent hover:bg-bg-surface-2 text-text-secondary hover:text-text-primary',
        'text-sm font-medium transition-colors cursor-pointer border border-border-subtle hover:border-border-default',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}) {
  return (
    <label
      className={[
        'flex items-start gap-3 p-3 rounded-md border border-border-subtle bg-bg-surface-2 cursor-pointer',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-border-default',
      ].join(' ')}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-accent-500"
        aria-label={label}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <div className="text-[11px] text-text-muted mt-0.5">{description}</div>
      </div>
    </label>
  )
}

// ── Inline SVG illustrations (sovereign-toned) ─────────────────────────────
//
// Hand-tuned to use only design tokens (currentColor + text-accent-400),
// so they re-skin with the active theme without code changes. ~200px square.

function ModelIllustration() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full max-w-[200px] h-auto"
      aria-hidden="true"
      role="img"
    >
      {/* Card stack — represents the model files */}
      <rect x="40" y="60" width="120" height="80" rx="10" className="fill-bg-surface-2 stroke-border-default" strokeWidth="1.5" />
      <rect x="48" y="48" width="120" height="80" rx="10" className="fill-bg-surface-3 stroke-border-default" strokeWidth="1.5" />
      <rect x="56" y="36" width="120" height="80" rx="10" className="fill-bg-elevated stroke-accent-500" strokeWidth="2" />
      {/* Lines inside top card */}
      <rect x="68" y="52" width="60" height="6" rx="3" className="fill-accent-400" />
      <rect x="68" y="64" width="80" height="4" rx="2" className="fill-text-muted" />
      <rect x="68" y="74" width="40" height="4" rx="2" className="fill-text-muted" />
      <rect x="68" y="84" width="70" height="4" rx="2" className="fill-text-muted" />
      {/* Sparkle */}
      <circle cx="170" cy="40" r="4" className="fill-accent-400" />
      <circle cx="170" cy="40" r="10" className="fill-none stroke-accent-400" strokeWidth="1" opacity="0.4" />
    </svg>
  )
}

function WorkspaceIllustration() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full max-w-[200px] h-auto"
      aria-hidden="true"
      role="img"
    >
      {/* Folder body */}
      <path
        d="M 30 70 Q 30 60 40 60 L 80 60 L 95 75 L 160 75 Q 170 75 170 85 L 170 150 Q 170 160 160 160 L 40 160 Q 30 160 30 150 Z"
        className="fill-bg-surface-2 stroke-accent-500"
        strokeWidth="2"
      />
      {/* Tabs (files inside) */}
      <rect x="50" y="92" width="100" height="8" rx="2" className="fill-accent-400" opacity="0.8" />
      <rect x="50" y="106" width="80" height="6" rx="2" className="fill-text-muted" />
      <rect x="50" y="118" width="90" height="6" rx="2" className="fill-text-muted" />
      <rect x="50" y="130" width="70" height="6" rx="2" className="fill-text-muted" />
      {/* Tiny git tag */}
      <circle cx="150" cy="58" r="6" className="fill-accent-500" />
      <path d="M 147 58 L 150 61 L 153 56" stroke="white" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function AgentIllustration() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full max-w-[200px] h-auto"
      aria-hidden="true"
      role="img"
    >
      {/* Hexagon — agent identity */}
      <polygon
        points="100,30 160,65 160,135 100,170 40,135 40,65"
        className="fill-bg-surface-2 stroke-accent-500"
        strokeWidth="2"
      />
      {/* Inner bolt */}
      <path
        d="M 110 75 L 85 110 L 100 110 L 90 135 L 115 100 L 100 100 Z"
        className="fill-accent-400"
      />
      {/* Tool nodes — three small circles around the hex */}
      <circle cx="40" cy="65" r="6" className="fill-bg-elevated stroke-accent-400" strokeWidth="1.5" />
      <circle cx="160" cy="100" r="6" className="fill-bg-elevated stroke-accent-400" strokeWidth="1.5" />
      <circle cx="40" cy="135" r="6" className="fill-bg-elevated stroke-accent-400" strokeWidth="1.5" />
    </svg>
  )
}

function FederationIllustration() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full max-w-[200px] h-auto"
      aria-hidden="true"
      role="img"
    >
      {/* Connections */}
      <line x1="100" y1="100" x2="40" y2="50" className="stroke-border-default" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="100" y1="100" x2="160" y2="60" className="stroke-border-default" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="100" y1="100" x2="50" y2="160" className="stroke-border-default" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="100" y1="100" x2="160" y2="155" className="stroke-border-default" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* Peer nodes */}
      <circle cx="40" cy="50" r="10" className="fill-bg-surface-3 stroke-text-muted" strokeWidth="1.5" />
      <circle cx="160" cy="60" r="10" className="fill-bg-surface-3 stroke-text-muted" strokeWidth="1.5" />
      <circle cx="50" cy="160" r="10" className="fill-bg-surface-3 stroke-text-muted" strokeWidth="1.5" />
      <circle cx="160" cy="155" r="10" className="fill-bg-surface-3 stroke-text-muted" strokeWidth="1.5" />
      {/* Local node — emerald centre */}
      <circle cx="100" cy="100" r="16" className="fill-accent-500" />
      <circle cx="100" cy="100" r="24" className="fill-none stroke-accent-500" strokeWidth="1" opacity="0.4" />
      <circle cx="100" cy="100" r="34" className="fill-none stroke-accent-500" strokeWidth="1" opacity="0.2" />
    </svg>
  )
}
