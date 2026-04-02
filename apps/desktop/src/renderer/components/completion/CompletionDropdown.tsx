import React from 'react'
import { useCodeCompletionStore } from '../../store/codeCompletionStore'
import { CompletionItem } from './CompletionItem'

interface CompletionDropdownProps {
  onAccept: (text: string) => void
}

export function CompletionDropdown({ onAccept }: CompletionDropdownProps) {
  const { completions, activeIndex } = useCodeCompletionStore()
  if (completions.length === 0) return null
  return (
    <div
      role="listbox"
      aria-label="Code completions"
      className="bg-bg-elevated border border-border-default rounded-lg shadow-lg overflow-hidden"
    >
      {completions.map((c, i) => (
        <CompletionItem
          key={c.text}
          completion={c}
          isActive={i === activeIndex}
          onAccept={onAccept}
        />
      ))}
    </div>
  )
}
