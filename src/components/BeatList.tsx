import React, { useState, useMemo } from 'react'
import type { Beat } from '../types/beat'
import { BeatCard } from './BeatCard'
import { Search, Music } from 'lucide-react'

interface BeatListProps {
  beats: Beat[]
  currentBeat: Beat
  isPlaying: boolean
  onSelectBeat: (beat: Beat) => void
  onTogglePlay: (beat: Beat) => void
  onInquireBeat: (beat: Beat) => void
}

export const BeatList: React.FC<BeatListProps> = ({
  beats,
  currentBeat,
  isPlaying,
  onSelectBeat,
  onTogglePlay,
  onInquireBeat,
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBeats = useMemo(() => {
    return beats.filter((beat) => {
      const query = searchQuery.toLowerCase().trim()
      return (
        query === '' ||
        beat.title.toLowerCase().includes(query) ||
        beat.bpm.toString().includes(query) ||
        beat.key.toLowerCase().includes(query)
      )
    })
  }, [beats, searchQuery])

  return (
    <div className="w-full max-w-xl mx-auto space-y-3">
      {/* Tracklist Title & Search Row */}
      <div className="flex items-center justify-between gap-3 pt-1 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="font-soyuz text-white text-base sm:text-lg tracking-wider uppercase m-0">
            ТРЕКЛИСТ
          </h2>
          <span className="text-[11px] font-mono-tech px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
            {filteredBeats.length}
          </span>
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[160px] sm:min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск (140, D#m...)"
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono-tech text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Beats List */}
      <div className="space-y-2">
        {filteredBeats.length > 0 ? (
          filteredBeats.map((beat, index) => (
            <BeatCard
              key={beat.id}
              beat={beat}
              index={index}
              isActive={currentBeat.id === beat.id}
              isPlaying={isPlaying}
              onSelect={onSelectBeat}
              onTogglePlay={onTogglePlay}
              onInquire={onInquireBeat}
            />
          ))
        ) : (
          <div className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-950/40">
            <Music size={24} className="mx-auto text-zinc-600 mb-2" />
            <p className="font-mono-tech text-xs text-zinc-400">Треки не найдены</p>
          </div>
        )}
      </div>
    </div>
  )
}
