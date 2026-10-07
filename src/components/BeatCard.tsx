import React from 'react'
import type { Beat } from '../types/beat'
import { Play, Pause, ArrowUpRight } from 'lucide-react'

interface BeatCardProps {
  beat: Beat
  index: number
  isActive: boolean
  isPlaying: boolean
  onSelect: (beat: Beat) => void
  onTogglePlay: (beat: Beat) => void
  onInquire: (beat: Beat) => void
}

export const BeatCard: React.FC<BeatCardProps> = ({
  beat,
  index,
  isActive,
  isPlaying,
  onSelect,
  onTogglePlay,
  onInquire,
}) => {
  return (
    <div
      onClick={() => onSelect(beat)}
      className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer border ${
        isActive
          ? 'bg-gradient-to-r from-zinc-900 via-zinc-800/90 to-zinc-900 border-zinc-400 shadow-[0_8px_30px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(255,255,255,0.06)]'
          : 'bg-[#0c0d12]/90 hover:bg-[#12131a] border-zinc-800/90 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Play button and Track info */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Play/Pause Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTogglePlay(beat)
            }}
            aria-label={isActive && isPlaying ? `Пауза ${beat.title}` : `Слушать ${beat.title}`}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md ${
              isActive && isPlaying
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.5)]'
                : 'bg-zinc-800/90 group-hover:bg-zinc-700 text-white'
            }`}
          >
            {isActive && isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          {/* Track Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono-tech text-zinc-500 font-bold">
                0{index + 1}
              </span>
              <h4 className="font-soyuz text-white text-sm sm:text-base tracking-wide truncate group-hover:text-zinc-200 transition-colors uppercase">
                {beat.title}
              </h4>
              {isActive && isPlaying && (
                <div className="flex items-center gap-0.5 ml-1">
                  <span className="w-1 h-3 bg-white animate-pulse" />
                  <span className="w-1 h-4 bg-white animate-pulse delay-75" />
                  <span className="w-1 h-2 bg-white animate-pulse delay-150" />
                </div>
              )}
            </div>

            {/* Badges / Specs */}
            <div className="flex flex-wrap items-center gap-2 mt-1 font-mono-tech text-xs text-zinc-400">
              <span className="text-zinc-300 font-semibold">{beat.bpm} BPM</span>
              <span>•</span>
              <span className="text-zinc-300">{beat.key}</span>
              <span>•</span>
              <span className="px-1.5 py-0.2 rounded bg-zinc-800/70 text-[10px] text-zinc-400 border border-zinc-700/60">
                {beat.genre}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Inquire / Collab Button */}
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onInquire(beat)
            }}
            className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-700/80 hover:border-white font-mono-tech text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 group/btn"
          >
            <span className="hidden sm:inline">ВЗЯТЬ В РАБОТУ</span>
            <span className="sm:hidden">В РАБОТУ</span>
            <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Description / Tags Row on Expansion */}
      {beat.tags && beat.tags.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono-tech text-zinc-500">
          <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
            {beat.tags.map((tag) => (
              <span key={tag} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                #{tag.toLowerCase()}
              </span>
            ))}
          </div>
          <span className="shrink-0 text-zinc-400 ml-2">15s PREVIEW</span>
        </div>
      )}
    </div>
  )
}
