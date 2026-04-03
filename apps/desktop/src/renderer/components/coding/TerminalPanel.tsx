import { useRef, useEffect, useState, KeyboardEvent } from 'react'
import { X, Terminal as TerminalIcon, AlertCircle, AlignLeft, Bug } from 'lucide-react'
import { useCodingStore, PanelTab } from '../../store/codingStore'

const PANEL_TABS: { id: PanelTab; label: string; icon: typeof TerminalIcon }[] = [
  { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
  { id: 'problems', label: 'Problems', icon: AlertCircle },
  { id: 'output', label: 'Output', icon: AlignLeft },
  { id: 'debug', label: 'Debug Console', icon: Bug },
]

export function TerminalPanel() {
  const {
    activePanelTab, setActivePanelTab, setPanelOpen,
    terminalLines, appendTerminalLine,
  } = useCodingStore()

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new terminal output
  useEffect(() => {
    const target = bottomRef.current
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }, [terminalLines])

  const handleTerminalSubmit = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !input.trim()) return
    const cmd = input.trim()
    setInput('')
    appendTerminalLine(`$ ${cmd}`)
    // Simulate common command responses
    if (cmd === 'clear') {
      useCodingStore.getState().clearTerminal()
      return
    }
    if (cmd === 'ls' || cmd === 'dir') {
      appendTerminalLine('src/  public/  package.json  tsconfig.json  README.md')
    } else if (cmd.startsWith('npm ') || cmd.startsWith('node ')) {
      appendTerminalLine(`Running: ${cmd}`)
      setTimeout(() => appendTerminalLine('Done.'), 400)
    } else if (cmd === 'pwd') {
      appendTerminalLine('/workspace/my-app')
    } else if (cmd === 'help') {
      appendTerminalLine('Available: ls, pwd, clear, npm <command>, node <file>')
    } else {
      appendTerminalLine(`command not found: ${cmd}`)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-bg-base">
      {/* Panel tab bar */}
      <div className="flex items-center border-b border-border-subtle bg-bg-surface-1 flex-shrink-0">
        <div className="flex items-center flex-1 overflow-x-auto" role="tablist" aria-label="Panel tabs">
          {PANEL_TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activePanelTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActivePanelTab(tab.id)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium cursor-pointer flex-shrink-0',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent-500',
                  isActive
                    ? 'text-text-primary border-b-2 border-accent-500'
                    : 'text-text-muted hover:text-text-secondary',
                ].join(' ')}
              >
                <Icon size={13} aria-hidden="true" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Close panel */}
        <button
          onClick={() => setPanelOpen(false)}
          aria-label="Close panel"
          className="p-1.5 mr-1 text-text-muted hover:text-text-secondary cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500 rounded"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-auto min-h-0">
        {activePanelTab === 'terminal' && (
          <div className="h-full flex flex-col font-mono text-[13px]">
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {terminalLines.map((line, i) => (
                <div key={i} className={[
                  'whitespace-pre-wrap',
                  line.startsWith('$') ? 'text-accent-400' : 'text-green-400',
                ].join(' ')}>
                  {line}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div className="flex items-center px-2 py-1.5 border-t border-border-subtle flex-shrink-0">
              <span className="text-accent-400 mr-1.5">$</span>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleTerminalSubmit}
                placeholder="Type a command..."
                aria-label="Terminal input"
                className="flex-1 bg-transparent text-green-400 placeholder-text-muted outline-none border-none text-[13px] font-mono"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>
        )}

        {activePanelTab === 'problems' && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-text-muted">
            <AlertCircle size={20} className="text-green-500" aria-hidden="true" />
            <p className="text-[13px]">No problems detected</p>
          </div>
        )}

        {activePanelTab === 'output' && (
          <div className="p-2 text-[12px] font-mono text-text-secondary">
            [Output] Waiting for build or run output...
          </div>
        )}

        {activePanelTab === 'debug' && (
          <div className="p-2 text-[12px] font-mono text-text-muted">
            &gt; Debug console is not active. Start a debug session to see output here.
          </div>
        )}
      </div>
    </div>
  )
}
