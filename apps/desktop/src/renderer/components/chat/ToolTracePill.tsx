/**
 * ToolTracePill — inline tool-trace summary for the chat thread.
 *
 * Visual design distilled from the Stitch v1.0 redesign exploration.
 * Rendered between the user message and the assistant's reply when the
 * assistant invoked tools. Collapsed by default — a thin 32px pill with
 * mono caption "→ Used 3 tools: grep · read_file · write_file (1.2s)".
 * Click to expand into per-tool rows showing name, args preview, and
 * success badge.
 *
 * Uses design tokens; renders identically under any data-theme but is
 * tuned for `sovereign` (Terminal Emerald, hairline #1F1F1F borders).
 */
import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import type { ToolCall } from '../../store/agentStore'

interface ToolTracePillProps {
  /** Tool calls associated with this assistant turn. Pass an empty
   *  array to hide the pill entirely. */
  calls: ToolCall[]
  /** Total elapsed time for the tool-trace sequence, in milliseconds.
   *  If omitted, the pill omits the latency suffix. */
  elapsedMs?: number
}

/** Format ms → "1.2s" or "420ms". */
function fmtDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

/** Truncate a JSON-ish args preview to a single short line. */
function previewArgs(inputs: Record<string, unknown>): string {
  const entries = Object.entries(inputs)
  if (entries.length === 0) return ''
  const first = entries[0]
  const v =
    typeof first[1] === 'string'
      ? `"${first[1].slice(0, 32)}${(first[1] as string).length > 32 ? '…' : ''}"`
      : JSON.stringify(first[1])
  const rest = entries.length > 1 ? `, +${entries.length - 1}` : ''
  return `${first[0]}: ${v}${rest}`
}

function statusIcon(status: ToolCall['status']): JSX.Element {
  switch (status) {
    case 'thinking':
    case 'executing':
      return <Loader2 size={12} className="animate-spin text-accent-400" aria-hidden="true" />
    case 'done':
      return <CheckCircle2 size={12} className="text-accent-400" aria-hidden="true" />
    case 'error':
      return <AlertCircle size={12} className="text-red-400" aria-hidden="true" />
  }
}

export function ToolTracePill({ calls, elapsedMs }: ToolTracePillProps) {
  const [open, setOpen] = useState(false)

  // Don't render anything when there's no trace to show.
  if (calls.length === 0) return null

  const summary = useMemo(() => {
    const names = calls.map((c) => c.name).slice(0, 4)
    const more = calls.length > names.length ? ` +${calls.length - names.length}` : ''
    return names.join(' · ') + more
  }, [calls])

  const allDone = calls.every((c) => c.status === 'done')
  const anyError = calls.some((c) => c.status === 'error')

  // Pill colour shifts subtly with aggregate status — but stays muted.
  const pillTone = anyError
    ? 'text-red-400'
    : allDone
      ? 'text-text-secondary'
      : 'text-accent-400'

  return (
    <div className="my-2 max-w-[80%]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="tool-trace-detail"
        className={[
          'group flex items-center gap-1.5 h-8 px-3',
          'rounded-md border border-border-subtle bg-bg-surface-1/60',
          'font-mono text-[11px] leading-none',
          'transition-colors hover:border-border-default hover:bg-bg-surface-2',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
          pillTone,
        ].join(' ')}
      >
        {open ? (
          <ChevronDown size={12} aria-hidden="true" />
        ) : (
          <ChevronRight size={12} aria-hidden="true" />
        )}
        <span className="text-text-muted">→</span>
        <span>
          Used {calls.length} {calls.length === 1 ? 'tool' : 'tools'}:
        </span>
        <span className="opacity-80">{summary}</span>
        {elapsedMs !== undefined && (
          <span className="text-text-muted ml-1">({fmtDuration(elapsedMs)})</span>
        )}
      </button>

      {open && (
        <div
          id="tool-trace-detail"
          className="mt-1 rounded-md border border-border-subtle bg-bg-surface-1/40 overflow-hidden"
        >
          {calls.map((call, idx) => {
            const argsLine = previewArgs(call.inputs)
            return (
              <div
                key={call.id}
                className={[
                  'flex items-center gap-2 px-3 py-2 text-[11px] font-mono',
                  idx > 0 ? 'border-t border-border-subtle' : '',
                ].join(' ')}
              >
                <span className="flex-shrink-0">{statusIcon(call.status)}</span>
                <span className="text-text-primary">{call.name}</span>
                {argsLine && (
                  <span className="text-text-muted truncate flex-1">{argsLine}</span>
                )}
                {call.status === 'done' && (
                  <span className="text-accent-400 flex-shrink-0">✓</span>
                )}
                {call.status === 'error' && (
                  <span className="text-red-400 flex-shrink-0">✗</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
