import { useState, useEffect, useCallback } from 'react'
import type { Beat } from './types/beat'
import { getInitialBeats, fetchLiveContainerBeats } from './utils/beatLoader'
import { audioEngine } from './utils/audioEngine'
import { useLanguage } from './context/LanguageContext'
import { Header } from './components/Header'
import { CrtMonitor } from './components/CrtMonitor'
import { BeatList } from './components/BeatList'
import { DealModal } from './components/DealModal'
import { Footer } from './components/Footer'

export function App() {
  const { t } = useLanguage()
  const [beats, setBeats] = useState<Beat[]>(getInitialBeats)
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPoweredOn, setIsPoweredOn] = useState(false)
  const [dealBeat, setDealBeat] = useState<Beat | null>(null)

  // Dynamic duration updater when real audio duration is probed by browser
  const handleUpdateBeatDuration = useCallback((beatId: string, duration: number) => {
    setBeats((prev) =>
      prev.map((b) =>
        b.id === beatId && Math.abs((b.duration || 0) - duration) > 0.1
          ? { ...b, duration: +duration.toFixed(2) }
          : b
      )
    )
  }, [])

  // Auto-sync beats from container/folder
  useEffect(() => {
    let isMounted = true

    const loadBeats = async () => {
      const live = await fetchLiveContainerBeats()
      if (isMounted && live.length > 0) {
        setBeats((prev) => {
          const prevSig = prev.map((b) => `${b.id}:${b.duration}`).join(',')
          const nextSig = live.map((b) => `${b.id}:${b.duration}`).join(',')
          return prevSig === nextSig ? prev : live
        })
      }
    }

    loadBeats()

    // Periodically sync every 3s to catch newly dropped files
    const interval = window.setInterval(loadBeats, 3000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const EMPTY_BEAT: Beat = {
    id: 'empty',
    title: t.noTracksEmpty,
    bpm: 140,
    key: 'Fm',
    genre: 'Hood Trap',
    tags: ['Folder empty'],
    duration: 0,
    status: 'available',
  }

  const currentBeat = beats[currentBeatIndex] || beats[0] || EMPTY_BEAT

  // Preload beats into Web Audio buffer cache for instant zero-latency playback
  useEffect(() => {
    if (beats.length > 0) {
      const urls = beats
        .map((b) => b.audioUrl || `/beats/${encodeURIComponent(b.title)}.mp3`)
        .filter(Boolean)
      audioEngine.preloadBeats(urls)
    }
  }, [beats])

  // Turn On TV sequence with authentic glitch (50% vol) + 50% faded tag
  const handleTurnOn = useCallback(() => {
    audioEngine.playTurnOnSequence()
    setIsPoweredOn(true)
  }, [])

  // Power Toggle (turns off: plays authentic tv_shutdown sound at 50% vol, cuts beat playback)
  const handlePowerToggle = useCallback(() => {
    if (isPoweredOn) {
      audioEngine.playTurnOffSequence()
      setIsPlaying(false)
      setIsPoweredOn(false)
    } else {
      handleTurnOn()
    }
  }, [isPoweredOn, handleTurnOn])

  // Handle play / pause toggle
  const handleTogglePlay = useCallback(() => {
    if (beats.length === 0) return

    // If TV is off, power it on first!
    if (!isPoweredOn) {
      handleTurnOn()
      return
    }

    if (isPlaying) {
      audioEngine.pause()
      setIsPlaying(false)
    } else {
      audioEngine.playBeat(
        currentBeat,
        () => setIsPlaying(false),
        (dur) => handleUpdateBeatDuration(currentBeat.id, dur)
      )
      setIsPlaying(true)
    }
  }, [isPoweredOn, isPlaying, currentBeat, beats.length, handleTurnOn, handleUpdateBeatDuration])

  // Select a specific beat from list
  const handleSelectBeat = useCallback(
    (beat: Beat) => {
      audioEngine.playSwitchClick()
      const idx = beats.findIndex((b) => b.id === beat.id)
      if (idx !== -1) {
        setCurrentBeatIndex(idx)

        // If TV was off, turn it on and start playing this track!
        if (!isPoweredOn) {
          handleTurnOn()
          audioEngine.playBeat(
            beat,
            () => setIsPlaying(false),
            (dur) => handleUpdateBeatDuration(beat.id, dur)
          )
          setIsPlaying(true)
          return
        }

        // If clicking same beat that was already playing, toggle pause
        if (currentBeat.id === beat.id && isPlaying) {
          audioEngine.pause()
          setIsPlaying(false)
        } else {
          audioEngine.playBeat(
            beat,
            () => setIsPlaying(false),
            (dur) => handleUpdateBeatDuration(beat.id, dur)
          )
          setIsPlaying(true)
        }
      }
    },
    [beats, currentBeat, isPlaying, isPoweredOn, handleTurnOn, handleUpdateBeatDuration]
  )

  // Switch to next channel/beat
  const handleNextBeat = useCallback(() => {
    if (!isPoweredOn || beats.length === 0) return
    audioEngine.playSwitchClick()
    const nextIdx = (currentBeatIndex + 1) % beats.length
    setCurrentBeatIndex(nextIdx)
    const nextBeat = beats[nextIdx]
    if (isPlaying) {
      audioEngine.playBeat(
        nextBeat,
        () => setIsPlaying(false),
        (dur) => handleUpdateBeatDuration(nextBeat.id, dur)
      )
    }
  }, [currentBeatIndex, beats, isPlaying, isPoweredOn, handleUpdateBeatDuration])

  // Switch to prev channel/beat
  const handlePrevBeat = useCallback(() => {
    if (!isPoweredOn || beats.length === 0) return
    audioEngine.playSwitchClick()
    const prevIdx = (currentBeatIndex - 1 + beats.length) % beats.length
    setCurrentBeatIndex(prevIdx)
    const prevBeat = beats[prevIdx]
    if (isPlaying) {
      audioEngine.playBeat(
        prevBeat,
        () => setIsPlaying(false),
        (dur) => handleUpdateBeatDuration(prevBeat.id, dur)
      )
    }
  }, [currentBeatIndex, beats, isPlaying, isPoweredOn, handleUpdateBeatDuration])

  // Keyboard controls (Space for play/pause, Arrow keys for channels)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        handleTogglePlay()
      } else if (e.code === 'ArrowDown' || e.code === 'ArrowRight') {
        e.preventDefault()
        handleNextBeat()
      } else if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') {
        e.preventDefault()
        handlePrevBeat()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleTogglePlay, handleNextBeat, handlePrevBeat])

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] bg-zinc-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-xl md:max-w-2xl mx-auto px-2.5 sm:px-4 md:px-6 flex flex-col flex-1 transition-all duration-300">
        {/* Top Header */}
        <Header />

        {/* Main Content: CRT Monitor Unit & Drop-Down Drawer */}
        <main
          className={`w-full flex-1 flex flex-col items-center transition-all duration-500 ${
            isPoweredOn ? 'mt-3 sm:mt-5 md:mt-6' : 'justify-center py-6 sm:py-10 md:py-12'
          }`}
        >
          {/* CRT Monitor Unit */}
          <div className="w-full">
            <CrtMonitor
              currentBeat={currentBeat}
              isPlaying={isPlaying}
              isPoweredOn={isPoweredOn}
              onTogglePlay={handleTogglePlay}
              onPowerToggle={handlePowerToggle}
              onTurnOn={handleTurnOn}
              onNextBeat={handleNextBeat}
              onPrevBeat={handlePrevBeat}
              onSelectTrack={handleSelectBeat}
              channelIndex={currentBeatIndex}
              totalChannels={beats.length}
            />
          </div>

          {/* Tracklist Drawer: Only visible when TV is powered on, smoothly drops down from under the TV */}
          {isPoweredOn && (
            <div className="w-full mt-5 sm:mt-6 animate-drawer-drop">
              <BeatList
                beats={beats}
                currentBeat={currentBeat}
                isPlaying={isPlaying}
                onSelectBeat={handleSelectBeat}
                onTogglePlay={(beat) => {
                  if (currentBeat.id === beat.id) {
                    handleTogglePlay()
                  } else {
                    handleSelectBeat(beat)
                  }
                }}
                onInquireBeat={(beat) => setDealBeat(beat)}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Royalty Deal / Order Modal */}
      <DealModal
        beat={dealBeat}
        onClose={() => setDealBeat(null)}
      />
    </div>
  )
}

export default App
