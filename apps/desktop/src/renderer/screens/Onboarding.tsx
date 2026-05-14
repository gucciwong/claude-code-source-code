/**
 * W7-T20 — First-run onboarding screen.
 *
 * Renders the `useOnboardingStore` state machine as a 4-step flow.
 *
 * The screen is mounted by `MainContent` when `useOnboardingStore.hasCompleted`
 * is false and the user is on the dashboard. After `complete()` lands the
 * store persists `hasCompleted=true` in localStorage so the screen never
 * reappears (a Settings → "Re-run setup" button can reset it).
 */

import { useEffect, useState } from 'react'
import { Sparkles, Cpu, Download, Check, AlertCircle, Loader2 } from 'lucide-react'

import { useOnboardingStore } from '../store/onboardingStore'
import { useSystemStore } from '../store/systemStore'
import { useModelManager } from '../hooks/useModelManager'

export function Onboarding() {
  const {
    step,
    recommended,
    downloadProgress,
    error,
    startDetection,
    confirmChoice,
    setDownloadProgress,
    finishDownload,
    finishWarmup,
    fail,
    complete,
  } = useOnboardingStore()

  const vramTotal = useSystemStore(s => s.vramTotal)
  const { downloadModel } = useModelManager()
  const [busy, setBusy] = useState(false)

  // On mount: kick detection so the user sees the animation, then settles
  // into `detect` with the recommendation populated.
  useEffect(() => {
    if (step === 'pending') {
      // Slight delay so the "detecting…" copy is visible at least one frame.
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
      // For GA we don't have streaming progress on the hook itself — a
      // 90-second poll loop would be over-engineering here. Jump to 100
      // when the backend acknowledges and let the warmup card show next.
      setDownloadProgress(100)
      finishDownload()
      // Best-effort warmup: a single tiny inference call. Failure is
      // non-fatal — the user can still chat.
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
    <div
      data-testid="screen-onboarding"
      className="flex flex-col items-center justify-center h-full px-8 py-12 bg-bg-base"
    >
      <div className="max-w-2xl w-full space-y-8">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-500/15 mx-auto">
            <Sparkles size={28} className="text-accent-400" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome to Sovereign Code</h1>
          <p className="text-sm text-text-secondary">
            Let&apos;s pick the best local model for your machine. This takes about a minute.
          </p>
        </header>

        {/* Step 1: detection */}
        {step === 'detect' && (
          <Card icon={Cpu} title="Detected hardware">
            <p className="text-sm text-text-secondary">
              GPU memory:{' '}
              <span className="font-semibold text-text-primary">
                {vramTotal != null ? `${vramTotal.toFixed(1)} GB` : 'unknown'}
              </span>
            </p>
            {recommended && (
              <div className="mt-4 p-3 bg-bg-surface-2 border border-border-default rounded-lg space-y-1">
                <p className="text-sm font-semibold text-text-primary">
                  Recommended: {recommended.display}
                </p>
                <p className="text-xs text-text-muted">{recommended.reason}</p>
                <p className="text-xs text-text-muted">
                  ~{recommended.size_gb.toFixed(1)} GB download
                </p>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={confirmChoice}
                disabled={!recommended}
                className="flex-1 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                Looks good — continue
              </button>
            </div>
          </Card>
        )}

        {/* Step 2: choice confirmed → ready to download */}
        {step === 'choose' && recommended && (
          <Card icon={Download} title="Ready to download">
            <p className="text-sm text-text-secondary">
              We&apos;ll fetch <span className="font-semibold">{recommended.display}</span> from
              HuggingFace. You can use a different model later from the Models screen.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={onStartDownload}
                disabled={busy}
                className="flex-1 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                Start download
              </button>
            </div>
          </Card>
        )}

        {/* Step 3: download in flight */}
        {step === 'download' && (
          <Card icon={Download} title="Downloading…">
            <div className="w-full h-2 bg-bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-500 transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
                role="progressbar"
                aria-valuenow={downloadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="text-xs text-text-muted mt-2">
              {downloadProgress}% — feel free to keep working; we&apos;ll notify you when ready.
            </p>
          </Card>
        )}

        {/* Step 4: warm-up */}
        {step === 'warmup' && (
          <Card icon={Loader2} title="Warming up the model…">
            <p className="text-sm text-text-secondary">
              First-token latency stays low when the model is pre-loaded. This takes a few seconds.
            </p>
          </Card>
        )}

        {/* Step 5: ready */}
        {step === 'ready' && (
          <Card icon={Check} title="You&apos;re ready">
            <p className="text-sm text-text-secondary">
              Your model is loaded and warm. Head to Chat to ask your first question.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={complete}
                className="flex-1 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-semibold cursor-pointer"
              >
                Take me to Chat
              </button>
            </div>
          </Card>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/40 text-sm text-red-200">
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

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="p-5 rounded-xl bg-bg-surface-1 border border-border-default">
      <div className="flex items-center gap-3 mb-3">
        <Icon size={18} className="text-accent-400" aria-hidden={true} />
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      {children}
    </section>
  )
}
