import { useState, useRef, useCallback } from 'react'
import { Bot, Terminal as TerminalIcon, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { FileTree } from '../components/coding/FileTree'
import { CodeEditor } from '../components/coding/CodeEditor'
import { TerminalPanel } from '../components/coding/TerminalPanel'
import { AiCopilot } from '../components/coding/AiCopilot'
import { useCodingStore } from '../store/codingStore'

// Minimum/maximum pixel widths for resizable panels
const SIDEBAR_MIN = 160
const SIDEBAR_MAX = 400
const COPILOT_MIN = 220
const COPILOT_MAX = 520
const PANEL_MIN = 80
const PANEL_MAX = 480

export function Coding() {
  const { isPanelOpen, setPanelOpen, isCopilotOpen, setCopilotOpen, activeTabId, openTabs } = useCodingStore()

  // Resizable panel state
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const [copilotWidth, setCopilotWidth] = useState(280)
  const [panelHeight, setPanelHeight] = useState(200)

  // Drag state refs (avoid re-renders during drag)
  const dragRef = useRef<{ type: 'sidebar' | 'copilot' | 'panel'; startX: number; startY: number; startValue: number } | null>(null)

  const onMouseDown = useCallback((type: 'sidebar' | 'copilot' | 'panel') => (e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startValue: type === 'sidebar' ? sidebarWidth : type === 'copilot' ? copilotWidth : panelHeight,
    }

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return
      const { type: t, startX, startY, startValue } = dragRef.current
      if (t === 'sidebar') {
        const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startValue + (me.clientX - startX)))
        setSidebarWidth(next)
      } else if (t === 'copilot') {
        const next = Math.min(COPILOT_MAX, Math.max(COPILOT_MIN, startValue - (me.clientX - startX)))
        setCopilotWidth(next)
      } else {
        const next = Math.min(PANEL_MAX, Math.max(PANEL_MIN, startValue - (me.clientY - startY)))
        setPanelHeight(next)
      }
    }

    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [sidebarWidth, copilotWidth, panelHeight])

  const activeTab = openTabs.find(t => t.id === activeTabId)

  return (
    <div className="flex flex-col h-full min-h-0 bg-bg-base overflow-hidden">
      {/* ── Top status bar — VS Code style ────────────────────────── */}
      <div className="flex items-center justify-between px-3 h-7 bg-accent-600 text-white text-[12px] flex-shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-wide">Sovereign Coder</span>
          {activeTab && (
            <span className="opacity-70 flex items-center gap-1">
              <ChevronRightIcon size={10} aria-hidden="true" />
              {activeTab.path}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 opacity-70">
          {activeTab && (
            <>
              <span>{activeTab.language}</span>
              <span aria-hidden="true">|</span>
              <span>UTF-8</span>
            </>
          )}
        </div>
      </div>

      {/* ── Main work area ─────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* File Explorer sidebar */}
        <div
          className="flex-shrink-0 bg-bg-surface-1 border-r border-border-subtle overflow-hidden"
          style={{ width: sidebarWidth }}
        >
          <FileTree />
        </div>

        {/* Drag handle — sidebar */}
        <div
          onMouseDown={onMouseDown('sidebar')}
          className="w-1 flex-shrink-0 cursor-col-resize hover:bg-accent-500/40 transition-colors bg-transparent"
          role="separator"
          aria-label="Resize explorer panel"
          aria-orientation="vertical"
        />

        {/* Editor + bottom panel column */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">

          {/* Editor area */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <CodeEditor />
          </div>

          {/* Drag handle — panel */}
          {isPanelOpen && (
            <div
              onMouseDown={onMouseDown('panel')}
              className="h-1 flex-shrink-0 cursor-row-resize hover:bg-accent-500/40 transition-colors bg-transparent"
              role="separator"
              aria-label="Resize terminal panel"
              aria-orientation="horizontal"
            />
          )}

          {/* Bottom panel */}
          {isPanelOpen && (
            <div
              className="flex-shrink-0 border-t border-border-subtle overflow-hidden"
              style={{ height: panelHeight }}
            >
              <TerminalPanel />
            </div>
          )}
        </div>

        {/* Drag handle — copilot */}
        {isCopilotOpen && (
          <div
            onMouseDown={onMouseDown('copilot')}
            className="w-1 flex-shrink-0 cursor-col-resize hover:bg-accent-500/40 transition-colors bg-transparent"
            role="separator"
            aria-label="Resize AI Copilot panel"
            aria-orientation="vertical"
          />
        )}

        {/* AI Copilot sidebar */}
        {isCopilotOpen && (
          <div
            className="flex-shrink-0 overflow-hidden"
            style={{ width: copilotWidth }}
          >
            <AiCopilot />
          </div>
        )}
      </div>

      {/* ── Activity bar bottom strip ──────────────────────────────── */}
      <div className="flex items-center h-6 px-2 bg-bg-surface-1 border-t border-border-subtle flex-shrink-0 gap-3 select-none">
        {/* Toggle panel */}
        <button
          onClick={() => setPanelOpen(!isPanelOpen)}
          aria-label={isPanelOpen ? 'Hide terminal panel' : 'Show terminal panel'}
          className={[
            'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500',
            isPanelOpen ? 'text-text-primary bg-bg-surface-3' : 'text-text-muted hover:text-text-secondary',
          ].join(' ')}
        >
          <TerminalIcon size={12} aria-hidden="true" />
          Terminal
          {isPanelOpen
            ? <ChevronDown size={10} aria-hidden="true" />
            : <ChevronRightIcon size={10} aria-hidden="true" />}
        </button>

        {/* Toggle copilot */}
        <button
          onClick={() => setCopilotOpen(!isCopilotOpen)}
          aria-label={isCopilotOpen ? 'Hide AI Copilot' : 'Show AI Copilot'}
          className={[
            'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500',
            isCopilotOpen ? 'text-text-primary bg-bg-surface-3' : 'text-text-muted hover:text-text-secondary',
          ].join(' ')}
        >
          <Bot size={12} aria-hidden="true" />
          Copilot
          {isCopilotOpen
            ? <ChevronDown size={10} aria-hidden="true" />
            : <ChevronRightIcon size={10} aria-hidden="true" />}
        </button>

        <div className="flex-1" />
        {activeTab && (
          <span className="text-[11px] text-text-muted">
            Ln 1, Col 1
          </span>
        )}
      </div>
    </div>
  )
}
