import { Save } from 'lucide-react'

interface MemoryEditorProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
}

export function MemoryEditor({ value, onChange, onSave }: MemoryEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-text-secondary text-sm font-medium">Memory Markdown</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-bg-surface-3 border border-border-default text-text-primary text-sm font-mono w-full h-64 rounded-md p-3 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        placeholder="Write notes that will be injected into your AI context…"
      />
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-xs">
          This markdown is injected into your AI context automatically.
        </p>
        <button
          onClick={onSave}
          className="bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          <Save size={14} aria-hidden="true" />
          Save Memory
        </button>
      </div>
    </div>
  )
}
