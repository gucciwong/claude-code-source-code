import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, X } from 'lucide-react'
import { useOrgIntelligence } from '../../hooks/useOrgIntelligence'
import { useOrgIntelligenceStore } from '../../store/orgIntelligenceStore'

export function ContributePatternDialog() {
  const [open, setOpen] = useState(false)
  const [patternText, setPatternText] = useState('')
  const [language, setLanguage] = useState('typescript')
  const { contributePattern } = useOrgIntelligence()
  const { isLoading } = useOrgIntelligenceStore()

  const handleSubmit = async () => {
    if (!patternText.trim()) return
    await contributePattern({
      pattern_text: patternText,
      language,
      contributor_id: 'anonymous',
    })
    setPatternText('')
    setOpen(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500">
          <Plus size={16} aria-hidden="true" />
          Contribute Pattern
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface-2 border border-border-default rounded-xl p-6 w-[540px] z-50 focus:outline-none">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-text-primary text-lg font-semibold">Contribute Pattern</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-text-muted hover:text-text-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded" aria-label="Close">
                <X size={18} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-text-secondary text-sm mb-2" htmlFor="pattern-lang">Language</label>
              <select
                id="pattern-lang"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 cursor-pointer"
              >
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
              </select>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-2" htmlFor="pattern-text">Pattern Code</label>
              <textarea
                id="pattern-text"
                value={patternText}
                onChange={e => setPatternText(e.target.value)}
                placeholder="Paste a reusable code pattern…"
                rows={8}
                className="w-full bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm font-mono placeholder-text-muted resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Dialog.Close asChild>
              <button className="border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-4 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !patternText.trim()}
              className="bg-accent-500 hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {isLoading ? 'Contributing…' : 'Contribute'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
