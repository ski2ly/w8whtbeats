import React from 'react'
import { SITE_CONFIG } from '../config/site'
import { Send, Mail, Radio } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="w-full max-w-xl mx-auto pt-8 pb-12 px-1 text-center border-t border-zinc-800/80 mt-10">
      {/* Collab Banner / Manifesto */}
      <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-zinc-800/80 rounded-2xl p-5 text-left mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 text-xs font-mono-tech text-zinc-300 font-bold uppercase mb-2">
          <Radio size={14} className="text-zinc-300 animate-pulse" />
          <span>{SITE_CONFIG.collabHeadline}</span>
        </div>

        <p className="text-xs sm:text-sm font-sans text-zinc-300 leading-relaxed mb-3">
          Делаю плотный монохромный саунд. Ищу самобытных и амбициозных артистов, готовых делать сильные релизы.
          Слушай превью, выбирай бит под свой стиль и пиши мне в Telegram.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-zinc-800/80">
          <a
            href={SITE_CONFIG.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-white text-black font-mono-tech text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Send size={13} />
            <span>Написать в TG @{SITE_CONFIG.telegramHandle}</span>
          </a>

          <a
            href={`mailto:${SITE_CONFIG.email}`}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono-tech text-xs transition-colors flex items-center gap-1.5"
          >
            <Mail size={13} />
            <span>{SITE_CONFIG.email}</span>
          </a>
        </div>
      </div>

      {/* Copyright & Monogram */}
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <span className="font-soyuz text-base text-zinc-300 tracking-wider">
            {SITE_CONFIG.producerName}
          </span>
          <span className="text-zinc-600 font-mono-tech text-xs">•</span>
          <span className="text-xs font-mono-tech text-zinc-500 uppercase">
            COLD MONOCHROME VIBE
          </span>
        </div>
        <p className="text-[11px] font-mono-tech text-zinc-600">
          Эксклюзивный саунд и коллаборации • Прямой контакт в Telegram
        </p>
      </div>
    </footer>
  )
}
