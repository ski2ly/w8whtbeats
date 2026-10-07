import React from 'react'
import { SITE_CONFIG } from '../config/site'
import { Send, Mail } from 'lucide-react'

export const Header: React.FC = () => {
  return (
    <header className="w-full max-w-xl mx-auto pt-3 pb-3 px-1 flex items-center justify-between border-b border-zinc-800/80">
      {/* Brand & Monogram Logo */}
      <div className="flex items-center gap-3">
        {/* User Monogram Logo */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black border border-zinc-700/80 overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.06)] shrink-0">
          <img
            src="/logo.png"
            alt="WWSKILLY Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <h1 className="font-soyuz text-lg sm:text-2xl text-white tracking-wider leading-none crt-glow-text m-0">
            {SITE_CONFIG.producerName}
          </h1>
          <p className="text-[11px] font-mono-tech text-zinc-400 mt-1 tracking-widest uppercase">
            "{SITE_CONFIG.producerTag}"
          </p>
        </div>
      </div>

      {/* Quick Direct Contacts */}
      <div className="flex items-center gap-2">
        <a
          href={SITE_CONFIG.telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Написать в Telegram"
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-800 hover:border-white transition-all flex items-center gap-1.5 text-xs font-mono-tech shadow-sm"
        >
          <Send size={13} />
          <span className="hidden sm:inline">@{SITE_CONFIG.telegramHandle}</span>
        </a>

        <a
          href={`mailto:${SITE_CONFIG.email}`}
          title="Написать на Email"
          className="p-2 sm:p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
        >
          <Mail size={14} />
        </a>
      </div>
    </header>
  )
}
