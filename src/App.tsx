import { useState, useEffect, useCallback } from 'react'
import { BEATS_CATALOG } from './data/beats'
import type { Beat } from './types/beat'
import { audioEngine } from './utils/audioEngine'
import { Header } from './components/Header'
import { CrtMonitor } from './components/CrtMonitor'
import { BeatList } from './components/BeatList'
import { DealModal } from './components/DealModal'
import { Footer } from './components/Footer'

export function App() {
  const [beats] = useState<Beat[]>(BEATS_CATALOG)
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPoweredOn, setIsPoweredOn] = useState(false)
  const [dealBeat, setDealBeat] = useState<Beat | null>(null)

  const currentBeat = beats[currentBeatIndex] || beats[0]

  // Turn On TV sequence with authentic glitch + 50% faded tag
  const handleTurnOn = useCallback(() => {
    audioEngine.playTurnOnSequence()
    setIsPoweredOn(true)
  }, [])

  // Power Toggle (turns off: plays glitch collapse, kills all audio immediately)
  const handlePowerToggle = useCallback(() => {
    if (isPoweredOn) {
      audioEngine.playTurnOffSequence()
      audioEngine.stop()
      setIsPlaying(false)
      setIsPoweredOn(false)
    } else {
      handleTurnOn()
    }
  }, [isPoweredOn, handleTurnOn])

  // Handle play / pause toggle
  const handleTogglePlay = useCallback(() => {
    // If TV is off, power it on first!
    if (!isPoweredOn) {
      handleTurnOn()
      audioEngine.playBeat(currentBeat, () => {
        setIsPlaying(false)
      })
      setIsPlaying(true)
      return
    }

    if (isPlaying) {
      audioEngine.stop()
      setIsPlaying(false)
    } else {
      audioEngine.playBeat(currentBeat, () => {
        setIsPlaying(false)
      })
      setIsPlaying(true)
    }
  }, [isPoweredOn, isPlaying, currentBeat, handleTurnOn])

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
          audioEngine.playBeat(beat, () => {
            setIsPlaying(false)
          })
          setIsPlaying(true)
          return
        }

        // If clicking same beat that was already playing, toggle pause
        if (currentBeat.id === beat.id && isPlaying) {
          audioEngine.stop()
          setIsPlaying(false)
        } else {
          audioEngine.playBeat(beat, () => {
            setIsPlaying(false)
          })
          setIsPlaying(true)
        }
      }
    },
    [beats, currentBeat, isPlaying, isPoweredOn, handleTurnOn]
  )

  // Switch to next channel/beat
  const handleNextBeat = useCallback(() => {
    if (!isPoweredOn) return
    audioEngine.playSwitchClick()
    const nextIdx = (currentBeatIndex + 1) % beats.length
    setCurrentBeatIndex(nextIdx)
    const nextBeat = beats[nextIdx]
    if (isPlaying) {
      audioEngine.playBeat(nextBeat, () => setIsPlaying(false))
    }
  }, [currentBeatIndex, beats, isPlaying, isPoweredOn])

  // Switch to prev channel/beat
  const handlePrevBeat = useCallback(() => {
    if (!isPoweredOn) return
    audioEngine.playSwitchClick()
    const prevIdx = (currentBeatIndex - 1 + beats.length) % beats.length
    setCurrentBeatIndex(prevIdx)
    const prevBeat = beats[prevIdx]
    if (isPlaying) {
      audioEngine.playBeat(prevBeat, () => setIsPlaying(false))
    }
  }, [currentBeatIndex, beats, isPlaying, isPoweredOn])

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
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-zinc-600/5 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-6 flex flex-col flex-1">
        {/* Top Header */}
        <Header />

        {/* Main Content: Mobile Stack / Desktop 2-Column */}
        <main className="mt-4 sm:mt-6 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (Desktop: Sticky CRT Monitor / Mobile: Top Hero) */}
            <div className="lg:col-span-6 xl:col-span-5 lg:sticky lg:top-4">
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

            {/* Right Column (Beats Catalog & Filtered List) */}
            <div className="lg:col-span-6 xl:col-span-7">
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

          </div>
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
