import React, { useEffect, useRef } from 'react'

interface WaveformProps {
  isRecording: boolean
  audioContext?: AudioContext
  analyser?: AnalyserNode
  className?: string
}

/**
 * Real-time audio waveform visualization using Canvas and Web Audio API
 * Displays frequency bars that animate during recording
 */
export function Waveform({ isRecording, audioContext, analyser, className = '' }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isRecording || !canvasRef.current || !analyser) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)

      // Clear canvas
      ctx.fillStyle = 'rgb(13, 13, 13)' // bg-bg-base
      ctx.fillRect(0, 0, rect.width, rect.height)

      // Draw frequency bars
      const barWidth = (rect.width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * rect.height

        // Gradient color: green when quiet → yellow when medium → red when loud
        const hue = (1 - dataArray[i] / 255) * 120 // 120° (green) to 0° (red)
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
        ctx.fillRect(x, rect.height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    draw()

    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [isRecording, analyser])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full bg-bg-base border border-border-default rounded-md ${className}`}
      style={{ minHeight: '80px' }}
      aria-label="Audio waveform visualization"
    />
  )
}
