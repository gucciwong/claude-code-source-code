import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Cpu, MessageSquare, Zap, Download } from 'lucide-react'
import { useCommandPaletteStore } from '../store/commandPaletteStore'
import { useModelsStore } from '../store/modelsStore'
import { useNavigationStore } from '../store/navigationStore'
import { useResize } from '../hooks/useResize'
import { useUILayoutStore } from '../store/uiLayoutStore'
import { ResizeHandle } from './common/ResizeHandle'

const ACTIONS = [
  { id: 'chat', label: 'Open Chat', icon: MessageSquare, section: 'chat' as const },
  { id: 'training', label: 'Start Training', icon: Zap, section: 'training' as const },
  { id: 'models', label: 'Browse Models', icon: Download, section: 'models' as const },
]

export function CommandPalette() {
  const { open, closePalette, togglePalette } = useCommandPaletteStore()
  const { installed } = useModelsStore()
  const { setActive } = useNavigationStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const commandPaletteWidth = useUILayoutStore(s => s.commandPaletteWidth)
  const commandPaletteHeight = useUILayoutStore(s => s.commandPaletteHeight)
  const setCommandPaletteWidth = useUILayoutStore(s => s.setCommandPaletteWidth)
  const setCommandPaletteHeight = useUILayoutStore(s => s.setCommandPaletteHeight)

  const { onMouseDown: onWidthMouseDown, containerStyle: widthContainerStyle } = useResize({
    value: commandPaletteWidth,
    min: 400,
    max: 800,
    direction: 'horizontal',
    onValueChange: setCommandPaletteWidth,
  })

  const { onMouseDown: onHeightMouseDown, containerStyle: heightContainerStyle } = useResize({
    value: commandPaletteHeight,
    min: 300,
    max: 600,
    direction: 'vertical',
    onValueChange: setCommandPaletteHeight,
  })

  // Global ⌘K / Ctrl+K listener — registered once here, not per-screen
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        togglePalette()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [togglePalette])

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const q = query.toLowerCase()
  const filteredModels = installed.filter((m) => m.name.toLowerCase().includes(q))
  const filteredActions = ACTIONS.filter((a) => a.label.toLowerCase().includes(q))

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && closePalette()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-bg-base/60 z-50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[20%] bg-bg-deeper border border-border-subtle rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col"
          style={{
            width: commandPaletteWidth,
            maxHeight: commandPaletteHeight,
            left: `calc(50% - ${commandPaletteWidth / 2}px)`,
          }}
        >
          {/* Horizontal resize handle at top for height resize */}
          <ResizeHandle
            orientation="horizontal"
            ariaLabel="Resize command palette height"
            onMouseDown={onHeightMouseDown}
          />
          {/* Vertical resize handle at left for width resize */}
          <ResizeHandle
            orientation="vertical"
            ariaLabel="Resize command palette width"
            onMouseDown={onWidthMouseDown}
          />
          <Dialog.Title className="sr-only">Command Palette</Dialog.Title>
          <div className="px-4 py-3 border-b border-border-subtle">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a model name or command..."
              className="w-full bg-transparent text-sm text-text-primary placeholder-text-muted outline-none focus-visible:ring-1 focus-visible:ring-accent-500 rounded"
              aria-label="Command palette search"
            />
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {filteredModels.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-[10px] font-medium text-text-muted uppercase tracking-wider">
                  Models
                </p>
                {filteredModels.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => {
                      useModelsStore.getState().setSelected(m.name)
                      closePalette()
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2 text-sm text-text-primary hover:bg-bg-surface-3 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  >
                    <Cpu size={14} className="text-text-muted flex-shrink-0" aria-hidden={true} />
                    {m.name}
                  </button>
                ))}
              </div>
            )}
            {filteredActions.length > 0 && (
              <div>
                <p className="px-2 py-1 text-[10px] font-medium text-text-muted uppercase tracking-wider">
                  Actions
                </p>
                {filteredActions.map(({ id, label, icon: Icon, section }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setActive(section)
                      closePalette()
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2 text-sm text-text-primary hover:bg-bg-surface-3 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  >
                    <Icon size={14} className="text-text-muted flex-shrink-0" aria-hidden={true} />
                    {label}
                  </button>
                ))}
              </div>
            )}
            {filteredModels.length === 0 && filteredActions.length === 0 && query && (
              <p className="px-2 py-4 text-sm text-text-muted text-center">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
