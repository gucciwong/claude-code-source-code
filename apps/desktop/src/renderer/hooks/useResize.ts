import { useCallback, useRef } from 'react'

export interface ResizeOptions {
  value: number
  min: number
  max: number
  direction: 'horizontal' | 'vertical'
  onValueChange: (value: number) => void
}

export interface UseResizeReturn {
  value: number
  onMouseDown: (e: React.MouseEvent) => void
  containerStyle: { width?: number; height?: number }
}

export function useResize({
  value,
  min,
  max,
  direction,
  onValueChange,
}: ResizeOptions): UseResizeReturn {
  const dragRef = useRef<{
    startX: number
    startY: number
    startValue: number
  } | null>(null)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startValue: value,
      }

      const onMove = (me: MouseEvent) => {
        if (!dragRef.current) return
        const { startX, startY, startValue } = dragRef.current

        let next: number
        if (direction === 'horizontal') {
          // Horizontal resize: width changes with mouse X delta
          next = startValue + (me.clientX - startX)
        } else {
          // Vertical resize: height changes with mouse Y delta
          next = startValue - (me.clientY - startY)
        }

        // Clamp to min/max
        next = Math.min(max, Math.max(min, next))
        onValueChange(next)
      }

      const onUp = () => {
        dragRef.current = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [value, min, max, direction, onValueChange]
  )

  const containerStyle =
    direction === 'horizontal'
      ? { width: value }
      : { height: value }

  return { value, onMouseDown, containerStyle }
}
