import React, { useEffect, useRef } from 'react'
import { audioEngine } from '../utils/audioEngine'

export type VisualizerMode = 'wave' | 'spectrum'

interface CrtOscilloscopeProps {
  isPlaying: boolean
  mode?: VisualizerMode
  onToggleMode?: () => void
}

export const CrtOscilloscope: React.FC<CrtOscilloscopeProps> = ({
  isPlaying,
  mode = 'wave',
  onToggleMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const peakHoldsRef = useRef<number[]>(new Array(16).fill(0))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const analyser = audioEngine.getAnalyser()
    const bufferLength = analyser ? analyser.frequencyBinCount : 128
    const timeDomainArray = new Uint8Array(bufferLength)
    const frequencyArray = new Uint8Array(bufferLength)

    let idlePhase = 0
    const NUM_BARS = 16

    const render = () => {
      animationFrameId = requestAnimationFrame(render)

      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(0, 0, width, height)

      // Draw faint phosphor grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
      ctx.lineWidth = 1
      ctx.beginPath()
      // Horizontal center & quarter lines
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.moveTo(0, height * 0.25)
      ctx.lineTo(width, height * 0.25)
      ctx.moveTo(0, height * 0.75)
      ctx.lineTo(width, height * 0.75)

      // Vertical quarter lines
      ctx.moveTo(width / 4, 0)
      ctx.lineTo(width / 4, height)
      ctx.moveTo(width / 2, 0)
      ctx.lineTo(width / 2, height)
      ctx.moveTo((width * 3) / 4, 0)
      ctx.lineTo((width * 3) / 4, height)
      ctx.stroke()

      if (mode === 'spectrum') {
        // --- 16-BAND VFD FLUORESCENT SPECTRUM ANALYZER ---
        if (isPlaying && analyser) {
          analyser.getByteFrequencyData(frequencyArray)
        }

        const barGap = 4
        const totalGap = barGap * (NUM_BARS + 1)
        const barWidth = Math.floor((width - totalGap) / NUM_BARS)
        const maxBarHeight = height - 12
        const numSegments = 10
        const segmentHeight = Math.floor((maxBarHeight - (numSegments - 1) * 2) / numSegments)

        idlePhase += 0.05

        for (let i = 0; i < NUM_BARS; i++) {
          let magnitude = 0

          if (isPlaying && analyser) {
            // Logarithmic bin mapping from low bass to high treble
            const binStart = Math.floor(Math.pow(i / NUM_BARS, 1.8) * (bufferLength * 0.75))
            const binEnd = Math.max(binStart + 1, Math.floor(Math.pow((i + 1) / NUM_BARS, 1.8) * (bufferLength * 0.75)))
            let sum = 0
            let count = 0
            for (let b = binStart; b < binEnd && b < bufferLength; b++) {
              sum += frequencyArray[b]
              count++
            }
            magnitude = count > 0 ? sum / count / 255 : 0
          } else {
            // Idle ambient rhythm
            magnitude = 0.08 + Math.sin(idlePhase + i * 0.4) * 0.05
          }

          // Smooth peak hold decay
          const currentH = magnitude * maxBarHeight
          if (currentH > peakHoldsRef.current[i]) {
            peakHoldsRef.current[i] = currentH
          } else {
            peakHoldsRef.current[i] = Math.max(0, peakHoldsRef.current[i] - 1.2)
          }

          const activeSegments = Math.round(magnitude * numSegments)
          const barX = barGap + i * (barWidth + barGap)

          // Draw segmented VFD fluorescent blocks
          for (let s = 0; s < numSegments; s++) {
            const segY = height - 6 - (s + 1) * (segmentHeight + 2)
            const isActive = s < activeSegments

            if (isActive) {
              // Glowing phosphor segments
              const isTop = s >= numSegments - 2
              ctx.fillStyle = isTop
                ? 'rgba(255, 255, 255, 0.95)'
                : 'rgba(215, 235, 255, 0.85)'
              ctx.shadowColor = isTop
                ? 'rgba(255, 255, 255, 0.9)'
                : 'rgba(180, 220, 255, 0.6)'
              ctx.shadowBlur = 6
            } else {
              // Dim unlit vacuum filament background
              ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
              ctx.shadowBlur = 0
            }

            ctx.fillRect(barX, segY, barWidth, segmentHeight)
          }

          // Draw Peak Hold Cap
          const peakY = Math.max(6, height - 6 - peakHoldsRef.current[i])
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
          ctx.shadowColor = 'rgba(220, 245, 255, 0.9)'
          ctx.shadowBlur = 7
          ctx.fillRect(barX, peakY - 2, barWidth, 2)
        }
        ctx.shadowBlur = 0
      } else {
        // --- CRT OSCILLOSCOPE BEAM MODE ---
        ctx.beginPath()
        ctx.lineWidth = 2
        ctx.strokeStyle = isPlaying ? 'rgba(235, 245, 255, 0.95)' : 'rgba(180, 195, 210, 0.4)'
        ctx.shadowBlur = isPlaying ? 10 : 3
        ctx.shadowColor = isPlaying ? 'rgba(215, 235, 255, 0.8)' : 'rgba(150, 170, 190, 0.3)'

        if (isPlaying && analyser) {
          analyser.getByteTimeDomainData(timeDomainArray)
          const sliceWidth = (width * 1.0) / bufferLength
          let x = 0

          for (let i = 0; i < bufferLength; i++) {
            const v = timeDomainArray[i] / 128.0
            const y = (v * height) / 2

            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
            x += sliceWidth
          }
        } else {
          // Idle breathing sine wave
          idlePhase += 0.04
          const sliceWidth = width / 64
          let x = 0
          for (let i = 0; i <= 64; i++) {
            const y = height / 2 + Math.sin(idlePhase + i * 0.15) * 4
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
            x += sliceWidth
          }
        }

        ctx.stroke()
        ctx.shadowBlur = 0
      }
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPlaying, mode])

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={90}
      onClick={onToggleMode}
      title="Click to toggle visualizer mode (Oscilloscope / Spectrum)"
      className="w-full h-20 rounded bg-black/50 border border-white/5 cursor-pointer hover:border-white/20 transition-colors"
    />
  )
}
