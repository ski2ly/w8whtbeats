import React, { useState, useEffect } from 'react'
import type { Beat } from '../types/beat'
import { CrtOscilloscope } from './CrtOscilloscope'
import { audioEngine } from '../utils/audioEngine'
import { 
  Play, 
  Pause, 
  ChevronUp, 
  ChevronDown, 
  Power, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Repeat
} from 'lucide-react'

interface CrtMonitorProps {
  currentBeat: Beat
  isPlaying: boolean
  isPoweredOn: boolean
  onTogglePlay: () => void
  onPowerToggle: () => void
  onTurnOn: () => void
  onNextBeat: () => void
  onPrevBeat: () => void
  onSelectTrack: (beat: Beat) => void
  channelIndex: number
  totalChannels: number
}

export const CrtMonitor: React.FC<CrtMonitorProps> = ({
  currentBeat,
  isPlaying,
  isPoweredOn,
  onTogglePlay,
  onPowerToggle,
  onTurnOn,
  onNextBeat,
  onPrevBeat,
  channelIndex,
  totalChannels,
}) => {
  const [isLooping, setIsLooping] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.85)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [osdMessage, setOsdMessage] = useState<string | null>(null)

  // Track playback time counter up to 15 seconds
  useEffect(() => {
    let interval: number | null = null
    if (isPlaying && isPoweredOn) {
      interval = window.setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= currentBeat.duration) {
            return isLooping ? 0 : currentBeat.duration
          }
          return +(prev + 0.1).toFixed(1)
        })
      }, 100)
    } else {
      if (!isPlaying) setPlaybackTime(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, isPoweredOn, currentBeat, isLooping])

  // Show temporary OSD message on channel change (only if powered on)
  useEffect(() => {
    if (!isPoweredOn) return
    setOsdMessage(`CH 0${channelIndex + 1}: ${currentBeat.title}`)
    const timer = setTimeout(() => setOsdMessage(null), 2000)
    return () => clearTimeout(timer)
  }, [channelIndex, currentBeat, isPoweredOn])

  // When TV turns on, show welcome OSD
  useEffect(() => {
    if (isPoweredOn) {
      setOsdMessage('W8WHT? // ONLINE')
      const timer = setTimeout(() => setOsdMessage(null), 3000)
      return () => clearTimeout(timer)
    } else {
      setPlaybackTime(0)
    }
  }, [isPoweredOn])

  const handleToggleLoop = () => {
    if (!isPoweredOn) return
    const next = !isLooping
    setIsLooping(next)
    audioEngine.setLoop(next)
    setOsdMessage(next ? 'LOOP: ON' : 'LOOP: OFF')
    setTimeout(() => setOsdMessage(null), 1500)
  }

  const handleNext = () => {
    onNextBeat()
  }

  const handlePrev = () => {
    onPrevBeat()
  }

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol)
    setIsMuted(newVol === 0)
    audioEngine.setVolume(newVol)
  }

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      audioEngine.setVolume(volume || 0.85)
    } else {
      setIsMuted(true)
      audioEngine.setVolume(0)
    }
  }

  const handlePlayTag = () => {
    if (!isPoweredOn) return
    audioEngine.playVoiceTag()
    setOsdMessage('TAG: W8WHT?')
    setTimeout(() => setOsdMessage(null), 2000)
  }

  const formatTime = (seconds: number) => {
    const s = Math.floor(seconds)
    const ms = Math.floor((seconds - s) * 10)
    return `00:${s < 10 ? '0' : ''}${s}.${ms}`
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* TV Chassis / Frame */}
      <div className="relative bg-gradient-to-b from-[#18191f] via-[#101116] to-[#0b0c10] rounded-[28px] p-3 sm:p-5 border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.15)]">
        
        {/* Top TV Brand Badge */}
        <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-mono-tech tracking-widest text-zinc-400">
          <div className="flex items-center gap-2">
            <span 
              className={`inline-block w-2 h-2 rounded-full transition-colors ${
                isPoweredOn 
                  ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' 
                  : 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]'
              }`} 
            />
            <span className="font-bold text-zinc-300">WWSKILLY CRT-15</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">
              {isPoweredOn ? 'COLD PHOSPHOR' : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* CRT Glass Tube / Screen Container */}
        <div className="crt-tube-container relative aspect-[4/3] sm:aspect-[16/11] bg-black">
          {isPoweredOn ? (
            <div className="crt-screen crt-flicker w-full h-full p-4 flex flex-col justify-between select-none relative animate-crt-on">
              {/* Scanline layer */}
              <div className="scanlines" />

              {/* Top OSD Information */}
              <div className="relative z-30 flex items-start justify-between font-crt text-lg sm:text-xl text-zinc-300 tracking-wider">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-white crt-glow-text">
                    <span className="text-zinc-400">CH</span>
                    <span className="font-bold text-xl sm:text-2xl">
                      0{channelIndex + 1}/{totalChannels < 10 ? `0${totalChannels}` : totalChannels}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/20">
                      VCR-HQ
                    </span>
                    {isLooping && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-white text-black font-bold font-mono-tech">
                        LOOP
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-mono-tech text-zinc-400 flex items-center gap-1.5 mt-0.5">
                    <span className={isPlaying ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}>●</span>
                    {isPlaying ? 'PLAYING PREVIEW' : 'PAUSED'}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-white font-mono-tech text-sm sm:text-base font-bold crt-glow-text">
                    {formatTime(playbackTime)} / 00:{currentBeat.duration}.0
                  </span>
                  <span className="text-xs font-mono-tech text-zinc-400 tracking-normal">
                    {currentBeat.bpm} BPM // {currentBeat.key}
                  </span>
                </div>
              </div>

              {/* Temporary Channel Switch OSD Banner */}
              {osdMessage && (
                <div className="absolute top-12 left-4 right-4 z-40 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-mono-tech text-xs sm:text-sm px-3 py-1.5 rounded flex items-center justify-between shadow-lg animate-pulse">
                  <span className="font-bold tracking-wider">{osdMessage}</span>
                  <span className="text-[10px] text-zinc-400">STEREO 44.1kHz</span>
                </div>
              )}

              {/* Center Screen: Vinyl Turntable & Audio Visualizer */}
              <div className="relative z-20 flex-1 flex flex-col items-center justify-center my-1">
                {/* Turntable Vinyl Record */}
                <div className="relative flex items-center justify-center">
                  {/* Vinyl Outer Disc */}
                  <div 
                    className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-950 border-4 border-zinc-800 shadow-[0_0_25px_rgba(0,0,0,0.9),inset_0_0_15px_rgba(255,255,255,0.08)] flex items-center justify-center transition-transform ${
                      isPlaying ? 'animate-spin-slow' : ''
                    }`}
                  >
                    {/* Vinyl Grooves */}
                    <div className="absolute inset-2 rounded-full border border-zinc-800/80 pointer-events-none" />
                    <div className="absolute inset-4 rounded-full border border-zinc-800/60 pointer-events-none" />
                    <div className="absolute inset-6 rounded-full border border-zinc-800/80 pointer-events-none" />

                    {/* Vinyl Center Sticker with User Logo */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-black border border-zinc-700/80 flex items-center justify-center p-1 shadow-inner overflow-hidden">
                      <img src="/logo.png" alt="WWSKILLY Logo" className="w-8 h-8 sm:w-11 sm:h-11 object-contain" />
                    </div>

                    {/* Center Hole */}
                    <div className="absolute w-2 h-2 rounded-full bg-white border border-zinc-400 pointer-events-none" />
                  </div>

                  {/* Tonearm Needle representation */}
                  <div 
                    className={`absolute -top-2 right-1 sm:right-3 w-16 h-1 bg-gradient-to-r from-zinc-500 to-zinc-300 origin-top-right transition-transform duration-500 ${
                      isPlaying ? 'rotate-[-22deg]' : 'rotate-[-5deg]'
                    }`}
                    style={{ transformOrigin: '100% 0%' }}
                  >
                    <div className="absolute left-0 -top-1 w-2.5 h-3 bg-zinc-200 rounded-sm shadow-sm" />
                  </div>
                </div>

                {/* Track Title and Specs on Screen */}
                <div className="mt-2 text-center">
                  <h3 className="font-soyuz text-white text-base sm:text-xl tracking-wider crt-glow-text uppercase">
                    {currentBeat.title}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono-tech px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700">
                      {currentBeat.bpm} BPM // {currentBeat.key}
                    </span>
                    <span className="text-[10px] font-mono-tech text-zinc-400">
                      15s PREVIEW
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom: Real-Time CRT Oscilloscope */}
              <div className="relative z-30 pt-1">
                <CrtOscilloscope isPlaying={isPlaying} />
                <div className="flex justify-between items-center text-[10px] font-mono-tech text-zinc-500 mt-1 px-1">
                  <span>OSCILLOSCOPE // 20Hz - 20kHz</span>
                  <span className="text-zinc-400">{currentBeat.key} SCALE</span>
                </div>
              </div>
            </div>
          ) : (
            /* Standby / Powered Off Screen with Cinematic Turn-On Button */
            <div 
              onClick={onTurnOn}
              className="w-full h-full bg-[#050507] flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden cursor-pointer group/screen"
            >
              <div className="scanlines opacity-10 pointer-events-none" />

              {/* Standby Monogram Logo */}
              <div className="w-16 h-16 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center p-2 mb-4 shadow-[0_0_20px_rgba(255,255,255,0.03)] group-hover/screen:border-zinc-700 transition-colors">
                <img src="/logo.png" alt="WWSKILLY Logo" className="w-full h-full object-contain opacity-40 group-hover/screen:opacity-60 transition-opacity" />
              </div>

              {/* Central Power-On Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTurnOn()
                }}
                className="group px-6 py-3 rounded-2xl bg-zinc-900 group-hover/screen:bg-white text-zinc-300 group-hover/screen:text-black border border-zinc-700/80 group-hover/screen:border-white font-mono-tech text-xs sm:text-sm font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_25px_rgba(0,0,0,0.9)] active:scale-95 flex items-center gap-2"
              >
                <Power size={15} className="text-red-400 group-hover/screen:text-black transition-colors" />
                <span>ВКЛЮЧИТЬ ТЕЛЕВИЗОР</span>
              </button>
              
              <p className="font-mono-tech text-[11px] text-zinc-600 mt-3 tracking-widest uppercase group-hover/screen:text-zinc-500 transition-colors">
                STANDBY • НАЖМИТЕ ДЛЯ ЗАПУСКА
              </p>
            </div>
          )}
        </div>

        {/* Physical TV Front-Panel Controls & Tactile Knobs */}
        <div className="mt-3 sm:mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Channel Control Buttons (CH+ / CH-) */}
          <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shadow-inner">
            <button
              onClick={handlePrev}
              disabled={!isPoweredOn}
              title="Предыдущий бит (CH -)"
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 disabled:opacity-30 text-zinc-200 rounded-lg text-xs font-mono-tech flex items-center gap-1 transition-colors border border-zinc-700/60"
            >
              <ChevronDown size={14} />
              <span>CH -</span>
            </button>
            <button
              onClick={handleNext}
              disabled={!isPoweredOn}
              title="Следующий бит (CH +)"
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 disabled:opacity-30 text-zinc-200 rounded-lg text-xs font-mono-tech flex items-center gap-1 transition-colors border border-zinc-700/60"
            >
              <ChevronUp size={14} />
              <span>CH +</span>
            </button>
          </div>

          {/* Central Playback Trigger & Loop */}
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              disabled={!isPoweredOn}
              className={`px-4 sm:px-5 py-2 rounded-xl font-mono-tech text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 border ${
                isPlaying 
                  ? 'bg-zinc-200 text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700'
              } disabled:opacity-30`}
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY PREVIEW'}</span>
            </button>

            {/* Loop Toggle Button */}
            <button
              onClick={handleToggleLoop}
              disabled={!isPoweredOn}
              title="Зациклить 15 секунд"
              className={`p-2 rounded-xl border font-mono-tech text-xs transition-all flex items-center gap-1.5 active:scale-95 ${
                isLooping
                  ? 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.4)] font-bold'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800 hover:text-white'
              } disabled:opacity-30`}
            >
              <Repeat size={13} />
              <span className="hidden xs:inline">LOOP</span>
            </button>

            {/* Producer Voice Tag Button */}
            <button
              onClick={handlePlayTag}
              disabled={!isPoweredOn}
              title="Фирменный тег W8WHT?"
              className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-colors flex items-center justify-center text-xs font-mono-tech gap-1.5 disabled:opacity-30"
            >
              <Sparkles size={13} className="text-zinc-400" />
              <span className="hidden sm:inline">TAG FX</span>
            </button>
          </div>

          {/* Volume and Power Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Volume control */}
            <div className="flex items-center gap-1.5 bg-zinc-900/90 px-2 py-1.5 rounded-xl border border-zinc-800">
              <button
                onClick={handleToggleMute}
                disabled={!isPoweredOn}
                className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
              >
                {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                disabled={!isPoweredOn}
                className="w-14 sm:w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white disabled:opacity-30"
              />
            </div>

            {/* Master Power Switch */}
            <button
              onClick={onPowerToggle}
              title={isPoweredOn ? 'Выключить ТВ' : 'Включить ТВ'}
              className={`p-2.5 rounded-xl border transition-all active:scale-95 shadow-md ${
                isPoweredOn
                  ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              <Power size={15} />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
