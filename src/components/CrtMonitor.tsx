import React, { useState, useEffect } from 'react'
import type { Beat } from '../types/beat'
import { CrtOscilloscope } from './CrtOscilloscope'
import { audioEngine } from '../utils/audioEngine'
import { useLanguage } from '../context/LanguageContext'
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
  const { t } = useLanguage()
  const [isLooping, setIsLooping] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.85)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [osdMessage, setOsdMessage] = useState<string | null>(null)

  // Synchronize playback time precisely with audioEngine hardware clock (60fps, zero drift)
  useEffect(() => {
    let animId: number | null = null
    if (isPlaying && isPoweredOn) {
      const update = () => {
        setPlaybackTime(audioEngine.getCurrentTime())
        animId = requestAnimationFrame(update)
      }
      animId = requestAnimationFrame(update)
    } else {
      setPlaybackTime(0)
    }
    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [isPlaying, isPoweredOn])

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
      setOsdMessage(t.onlineMessage)
      const timer = setTimeout(() => setOsdMessage(null), 3000)
      return () => clearTimeout(timer)
    } else {
      setPlaybackTime(0)
    }
  }, [isPoweredOn, t.onlineMessage])

  const handleToggleLoop = () => {
    if (!isPoweredOn) return
    const next = !isLooping
    setIsLooping(next)
    audioEngine.setLoop(next)
    setOsdMessage(next ? t.loopOnOsd : t.loopOffOsd)
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
    setOsdMessage(t.tagOsd)
    setTimeout(() => setOsdMessage(null), 2000)
  }

  const totalDuration = currentBeat.duration || (isPlaying ? audioEngine.getDuration() : 0) || 0

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    const ms = Math.floor((seconds - Math.floor(seconds)) * 10)
    const mm = m < 10 ? `0${m}` : `${m}`
    const ss = s < 10 ? `0${s}` : `${s}`
    return `${mm}:${ss}.${ms}`
  }

  const formatBadgeDuration = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return t.fullTrack
    if (seconds < 60) {
      return `${Math.round(seconds)}s ${t.previewBadge}`
    }
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s < 10 ? '0' : ''}${s} ${t.previewBadge}`
  }

  return (
    <div className="w-full max-w-xl md:max-w-2xl mx-auto transition-all duration-300">
      {/* TV Chassis / Frame with authentic CRT bevel and metallic shading */}
      <div className="relative bg-gradient-to-b from-[#1b1c23] via-[#111218] to-[#0a0b0e] rounded-[24px] sm:rounded-[30px] md:rounded-[34px] p-2.5 sm:p-4 md:p-5 border border-zinc-800 shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.18)]">
        
        {/* Top TV Brand Badge */}
        <div className="flex items-center justify-between px-2 pb-2 text-[10px] sm:text-[11px] font-mono-tech tracking-widest text-zinc-400">
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
            <span className="text-[9px] sm:text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">
              {isPoweredOn ? t.coldPhosphor : t.standbyStatus}
            </span>
          </div>
        </div>

        {/* CRT Glass Tube / Screen Container */}
        <div className="crt-tube-container relative aspect-[4/3] sm:aspect-[16/11] min-h-[280px] sm:min-h-[350px] md:min-h-[390px] bg-black rounded-[14px] sm:rounded-[18px] overflow-hidden border border-zinc-900 shadow-inner">
          {isPoweredOn ? (
            <div className="crt-screen crt-flicker w-full h-full p-3 sm:p-4 md:p-5 flex flex-col justify-between select-none relative animate-crt-on">
              {/* Scanline layer */}
              <div className="scanlines pointer-events-none" />

              {/* Top OSD Information */}
              <div className="relative z-30 flex items-start justify-between font-crt text-base sm:text-xl text-zinc-300 tracking-wider">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-white crt-glow-text">
                    <span className="text-zinc-400 text-xs sm:text-sm">{t.chTitle}</span>
                    <span className="font-bold text-lg sm:text-2xl">
                      0{channelIndex + 1}/{totalChannels < 10 ? `0${totalChannels}` : totalChannels}
                    </span>
                    <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/20">
                      {t.vcrQuality}
                    </span>
                    {isLooping && (
                      <span className="text-[9px] sm:text-[10px] px-1 py-0.2 rounded bg-white text-black font-bold font-mono-tech shadow-[0_0_8px_rgba(255,255,255,0.6)]">
                        {t.loopBadge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] sm:text-xs font-mono-tech text-zinc-400 flex items-center gap-1.5 mt-0.5">
                    <span className={isPlaying ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}>●</span>
                    <span>{isPlaying ? t.playingPreview : t.paused}</span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-white font-mono-tech text-xs sm:text-base font-bold crt-glow-text">
                    {formatTime(playbackTime)} / {formatTime(totalDuration)}
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono-tech text-zinc-400 tracking-normal">
                    {currentBeat.bpm} BPM // {currentBeat.key}
                  </span>
                </div>
              </div>

              {/* Temporary Channel Switch OSD Banner */}
              {osdMessage && (
                <div className="absolute top-12 left-3 right-3 sm:left-4 sm:right-4 z-40 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-mono-tech text-xs sm:text-sm px-3 py-1.5 rounded flex items-center justify-between shadow-lg animate-pulse">
                  <span className="font-bold tracking-wider truncate">{osdMessage}</span>
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 shrink-0 ml-2">STEREO 44.1kHz</span>
                </div>
              )}

              {/* Center Screen: Vinyl Turntable with Monogram */}
              <div className="relative z-20 flex-1 flex flex-col items-center justify-center my-0.5 sm:my-1">
                <div className="relative flex items-center justify-center">
                  {/* Vinyl Outer Disc */}
                  <div 
                    className={`relative w-24 h-24 xs:w-28 xs:h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-950 border-4 border-zinc-800 shadow-[0_0_25px_rgba(0,0,0,0.9),inset_0_0_15px_rgba(255,255,255,0.08)] flex items-center justify-center transition-transform ${
                      isPlaying ? 'animate-spin-slow' : ''
                    }`}
                  >
                    {/* Vinyl Grooves */}
                    <div className="absolute inset-1.5 sm:inset-2 rounded-full border border-zinc-800/80 pointer-events-none" />
                    <div className="absolute inset-3 sm:inset-4 rounded-full border border-zinc-800/60 pointer-events-none" />
                    <div className="absolute inset-5 sm:inset-6 rounded-full border border-zinc-800/80 pointer-events-none" />

                    {/* Vinyl Center Sticker with User Logo */}
                    <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full bg-black border border-zinc-700/80 flex items-center justify-center p-1 shadow-inner overflow-hidden">
                      <img src="/logo.png" alt="WWSKILLY Logo" className="w-7 h-7 xs:w-8 xs:h-8 sm:w-11 sm:h-11 md:w-12 md:h-12 object-contain" />
                    </div>

                    {/* Center Hole */}
                    <div className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white border border-zinc-400 pointer-events-none" />
                  </div>

                  {/* Tonearm Needle representation */}
                  <div 
                    className={`absolute -top-2 right-0.5 sm:right-2 md:right-3 w-12 xs:w-14 sm:w-18 md:w-20 h-1 bg-gradient-to-r from-zinc-500 to-zinc-300 origin-top-right transition-transform duration-500 pointer-events-none ${
                      isPlaying ? 'rotate-[-22deg]' : 'rotate-[-5deg]'
                    }`}
                    style={{ transformOrigin: '100% 0%' }}
                  >
                    <div className="absolute left-0 -top-1 w-2 sm:w-2.5 h-2.5 sm:h-3 bg-zinc-200 rounded-sm shadow-sm" />
                  </div>
                </div>

                {/* Track Details on CRT Screen */}
                <div className="text-center mt-1.5 sm:mt-2.5 z-20 max-w-[90%]">
                  <h3 className="font-soyuz text-sm sm:text-lg md:text-xl text-white tracking-wider truncate crt-glow-text uppercase">
                    {currentBeat.title}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-0.5">
                    <span className="text-[10px] sm:text-[11px] font-mono-tech px-1.5 sm:px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700">
                      {currentBeat.bpm} BPM // {currentBeat.key}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-mono-tech text-zinc-400">
                      {formatBadgeDuration(totalDuration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom: Real-Time CRT Oscilloscope */}
              <div className="relative z-30 pt-0.5 sm:pt-1">
                <CrtOscilloscope isPlaying={isPlaying} />
                <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-mono-tech text-zinc-500 mt-1 px-1">
                  <span>{t.oscilloscopeTitle}</span>
                  <span className="text-zinc-400">{currentBeat.key} {t.scaleTitle}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Standby / Powered Off Screen with Cinematic Turn-On Button */
            <div 
              onClick={onTurnOn}
              className="w-full h-full bg-[#050507] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none relative overflow-hidden cursor-pointer group/screen"
            >
              <div className="scanlines opacity-10 pointer-events-none" />

              {/* Standby Monogram Logo */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center p-2 mb-3 sm:mb-4 shadow-[0_0_20px_rgba(255,255,255,0.03)] group-hover/screen:border-zinc-700 transition-colors">
                <img src="/logo.png" alt="WWSKILLY Logo" className="w-full h-full object-contain opacity-40 group-hover/screen:opacity-60 transition-opacity" />
              </div>

              {/* Central Power-On Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTurnOn()
                }}
                className="group px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-zinc-900 group-hover/screen:bg-white text-zinc-300 group-hover/screen:text-black border border-zinc-700/80 group-hover/screen:border-white font-mono-tech text-xs sm:text-sm font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_25px_rgba(0,0,0,0.9)] active:scale-95 flex items-center gap-2"
              >
                <Power size={15} className="text-red-400 group-hover/screen:text-black transition-colors" />
                <span>{t.turnOnTv}</span>
              </button>
              
              <p className="font-mono-tech text-[10px] sm:text-[11px] text-zinc-600 mt-2.5 sm:mt-3 tracking-widest uppercase group-hover/screen:text-zinc-500 transition-colors">
                {t.standbyHint}
              </p>
            </div>
          )}
        </div>

        {/* Physical TV Front-Panel Controls & Tactile Knobs */}
        <div className="mt-2.5 sm:mt-4 pt-2.5 sm:pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2.5">
          
          {/* Channel Control Buttons (CH+ / CH-) */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-zinc-900/90 p-0.5 sm:p-1 rounded-xl border border-zinc-800 shadow-inner shrink-0">
            <button
              onClick={handlePrev}
              disabled={!isPoweredOn}
              title={t.prevBeatTitle}
              className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 disabled:opacity-30 text-zinc-200 rounded-lg text-xs font-mono-tech flex items-center gap-1 transition-colors border border-zinc-700/60"
            >
              <ChevronDown size={14} />
              <span>CH -</span>
            </button>
            <button
              onClick={handleNext}
              disabled={!isPoweredOn}
              title={t.nextBeatTitle}
              className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 disabled:opacity-30 text-zinc-200 rounded-lg text-xs font-mono-tech flex items-center gap-1 transition-colors border border-zinc-700/60"
            >
              <ChevronUp size={14} />
              <span>CH +</span>
            </button>
          </div>

          {/* Central Playback Trigger, Loop & Voice Tag */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onTogglePlay}
              disabled={!isPoweredOn}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl font-mono-tech text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all shadow-md active:scale-95 border ${
                isPlaying 
                  ? 'bg-zinc-200 text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700'
              } disabled:opacity-30`}
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              <span>{isPlaying ? t.pauseButton : t.playButton}</span>
            </button>

            {/* Loop Toggle Button */}
            <button
              onClick={handleToggleLoop}
              disabled={!isPoweredOn}
              title={isLooping ? t.loopOnTitle : t.loopOffTitle}
              className={`p-1.5 sm:p-2 rounded-xl border font-mono-tech text-xs transition-all flex items-center gap-1 sm:gap-1.5 active:scale-95 ${
                isLooping
                  ? 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.4)] font-bold'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800 hover:text-white'
              } disabled:opacity-30`}
            >
              <Repeat size={13} />
              <span className="hidden xs:inline">{t.loopBadge}</span>
            </button>

            {/* Producer Voice Tag Button */}
            <button
              onClick={handlePlayTag}
              disabled={!isPoweredOn}
              title={t.tagButtonTitle}
              className="p-1.5 sm:p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-colors flex items-center justify-center text-xs font-mono-tech gap-1 sm:gap-1.5 disabled:opacity-30"
            >
              <Sparkles size={13} className="text-zinc-400" />
              <span className="hidden xs:inline">{t.tagFx}</span>
            </button>
          </div>

          {/* Volume and Power Section */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto sm:ml-0">
            {/* Volume control */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-zinc-900/90 px-1.5 sm:px-2 py-1.5 rounded-xl border border-zinc-800">
              <button
                onClick={handleToggleMute}
                disabled={!isPoweredOn}
                title={t.muteTitle}
                className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30 p-0.5"
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
                title={t.volumeTitle}
                className="w-12 xs:w-14 sm:w-16 md:w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white disabled:opacity-30"
              />
            </div>

            {/* Master Power Switch */}
            <button
              onClick={onPowerToggle}
              title={isPoweredOn ? t.powerOffTv : t.powerOnTv}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all active:scale-95 shadow-md ${
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
