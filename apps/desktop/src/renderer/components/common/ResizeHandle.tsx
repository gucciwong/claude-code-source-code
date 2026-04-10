import React, { useCallback } from 'react'

interface ResizeHandleProps {
  orientation: 'vertical' | 'horizontal'
  ariaLabel: string
  onMouseDown: (e: React.MouseEvent) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
}

export function ResizeHandle({
  orientation,
  ariaLabel,
  onMouseDown,
  onKeyDown,
}: ResizeHandleProps) {
  const isVertical = orientation === 'vertical'

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onKeyDown) {
        onKeyDown(e)
        return
      }
      // Default keyboard behavior: Arrow keys resize by 4px
      const increment = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 4 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -4 : null
      if (increment === null) return

      e.preventDefault()
      // Keyboard resize is handled externally via onKeyDown prop
      // The parent should listen for Arrow keys and adjust accordingly
      const event = new CustomEvent('resize:keyboard', {
        detail: { orientation, increment },
        bubbles: true,
      })
      e.currentTarget.dispatchEvent(event)
    },
    [orientation, onKeyDown]
  )

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-label={ariaLabel}
      tabIndex={0}
      onMouseDown={onMouseDown}
      onKeyDown={handleKeyDown}
      className={[
        'flex-shrink-0 select-none transition-colors',
        isVertical
          ? 'w-1 cursor-col-resize hover:bg-accent-500/40 active:bg-accent-500/60'
          : 'h-1 cursor-row-resize hover:bg-accent-500/40 active:bg-accent-500/60',
      ].join(' ')}
    />
  )
}
