import React, { useEffect, useRef } from 'react'

interface WaveformProps {
  isRecording: boolean
  confidence?: number
  className?: string
}

export const Waveform: React.FC<WaveformProps> = ({ isRecording, confidence, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationIdRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  useEffect(() => {
    if (!isRecording) {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = null
      }
      // Clear canvas
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = 'rgb(15, 15, 15)' // bg-bg-base
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
      }
      return
    }

    // Setup audio context to visualize microphone input
    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        const microphone = audioContext.createMediaStreamSource(stream)

        microphone.connect(analyser)
        analyser.fftSize = 256
        const bufferLength = analyser.frequencyBinCount
        dataArrayRef.current = new Uint8Array(bufferLength)

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const draw = () => {
          animationIdRef.current = requestAnimationFrame(draw)

          // Get frequency data
          analyser.getByteFrequencyData(dataArrayRef.current!)

          // Draw background
          ctx.fillStyle = 'rgb(15, 15, 15)' // bg-bg-base
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Draw waveform bars
          const barWidth = (canvas.width / bufferLength) * 2.5
          let x = 0

          // Use accent-500 color: rgb(139, 92, 246)
          ctx.fillStyle = 'rgb(139, 92, 246)'

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArrayRef.current![i] / 255) * canvas.height

            ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight)
            x += barWidth
          }

          // Draw confidence level line if available
          if (confidence !== undefined && confidence > 0) {
            ctx.strokeStyle = 'rgba(36, 197, 94, 0.5)' // green-500 with transparency
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(0, canvas.height * (1 - confidence))
            ctx.lineTo(canvas.width, canvas.height * (1 - confidence))
            ctx.stroke()
          }
        }

        draw()

        // Cleanup on unmount
        return () => {
          if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current)
          }
          stream.getTracks().forEach((track) => track.stop())
          audioContext.close()
        }
      } catch (error) {
        console.error('Failed to setup audio visualization:', error)
      }
    }

    const cleanup = setupAudio()
    return () => {
      cleanup?.then((fn) => fn?.())
    }
  }, [isRecording, confidence])

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className={`w-full bg-bg-base rounded border border-border-subtle ${className}`}
    />
  )
}
