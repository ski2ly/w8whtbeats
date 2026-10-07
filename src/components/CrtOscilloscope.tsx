import React, { useEffect, useRef } from 'react'
import { audioEngine } from '../utils/audioEngine'

interface CrtOscilloscopeProps {
  isPlaying: boolean
}

export const CrtOscilloscope: React.FC<CrtOscilloscopeProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const analyser = audioEngine.getAnalyser()
    const bufferLength = analyser ? analyser.frequencyBinCount : 128
    const dataArray = new Uint8Array(bufferLength)

    let idlePhase = 0

    const render = () => {
      animationFrameId = requestAnimationFrame(render)

      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(0, 0, width, height)

      // Draw faint phosphor grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
      ctx.lineWidth = 1
      ctx.beginPath()
      // Horizontal center
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      // Vertical quarters
      ctx.moveTo(width / 4, 0)
      ctx.lineTo(width / 4, height)
      ctx.moveTo(width / 2, 0)
      ctx.lineTo(width / 2, height)
      ctx.moveTo((width * 3) / 4, 0)
      ctx.lineTo((width * 3) / 4, height)
      ctx.stroke()

      // Waveform beam
      ctx.beginPath()
      ctx.lineWidth = 2
      // Cold white-cyan CRT beam glow
      ctx.strokeStyle = isPlaying ? 'rgba(235, 245, 255, 0.95)' : 'rgba(180, 195, 210, 0.4)'
      ctx.shadowBlur = isPlaying ? 10 : 3
      ctx.shadowColor = isPlaying ? 'rgba(215, 235, 255, 0.8)' : 'rgba(150, 170, 190, 0.3)'

      if (isPlaying && analyser) {
        analyser.getByteTimeDomainData(dataArray)
        const sliceWidth = (width * 1.0) / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
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
      ctx.shadowBlur = 0 // reset
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPlaying])

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={90}
      className="w-full h-20 rounded bg-black/40 border border-white/5"
    />
  )
}
