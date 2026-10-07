import React, { useState, useMemo } from 'react'
import type { Beat, Genre } from '../types/beat'
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

const GENRES: Array<Genre | 'ALL'> = ['ALL', 'Hood Trap', 'Dark Drill', 'Trap', 'Ambient Trap']

export const BeatList: React.FC<BeatListProps> = ({
  beats,
  currentBeat,
  isPlaying,
  onSelectBeat,
  onTogglePlay,
  onInquireBeat,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<Genre | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBeats = useMemo(() => {
    return beats.filter((beat) => {
      const matchesGenre = selectedGenre === 'ALL' || beat.genre === selectedGenre
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        query === '' ||
        beat.title.toLowerCase().includes(query) ||
        beat.bpm.toString().includes(query) ||
        beat.key.toLowerCase().includes(query) ||
        beat.genre.toLowerCase().includes(query) ||
        beat.tags.some((tag) => tag.toLowerCase().includes(query))

      return matchesGenre && matchesSearch
    })
  }, [beats, selectedGenre, searchQuery])

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Catalog Title & Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="font-soyuz text-white text-lg sm:text-xl tracking-wider uppercase flex items-center gap-2">
            <span>КАТАЛОГ ЗВУКА</span>
            <span className="text-xs font-mono-tech px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-normal">
              {filteredBeats.length} ТРЕКОВ
            </span>
          </h2>
          <p className="text-xs font-mono-tech text-zinc-400 mt-0.5">
            Слушай превью • Забирай в работу напрямую в Telegram
          </p>
        </div>

        {/* Quick Search Input */}
        <div className="relative min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск (140, Drill, D#m...)"
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono-tech text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
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

      {/* Genre Filter Pills (Thumb-scrollable on mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-3 py-1.5 rounded-xl font-mono-tech text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
              selectedGenre === genre
                ? 'bg-zinc-200 text-black border-white shadow-sm'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Beats List */}
      <div className="space-y-2.5">
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
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-950/40">
            <Music size={28} className="mx-auto text-zinc-600 mb-2" />
            <p className="font-mono-tech text-sm text-zinc-400">Биты не найдены</p>
            <p className="text-xs text-zinc-600 font-mono-tech mt-1">
              Попробуйте изменить запрос или категорию
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
