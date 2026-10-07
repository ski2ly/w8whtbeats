import React from 'react'
import { SITE_CONFIG } from '../config/site'
import { Send, Mail } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="w-full max-w-xl mx-auto pt-6 pb-10 px-1 text-center border-t border-zinc-800/80 mt-8">
      {/* Monogram, Brand & Tagline */}
      <div className="flex flex-col items-center justify-center gap-1.5">
        <div className="flex items-center gap-2">
          <span className="font-soyuz text-base sm:text-lg text-white tracking-wider">
            {SITE_CONFIG.producerName}
          </span>
          <span className="text-zinc-600 font-mono-tech text-xs">•</span>
          <span className="font-mono-tech text-xs text-zinc-400 tracking-widest uppercase">
            {SITE_CONFIG.producerTag}
          </span>
        </div>

        {/* Direct Contacts */}
        <div className="flex items-center gap-4 text-xs font-mono-tech text-zinc-400 mt-2">
          <a
            href={SITE_CONFIG.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Send size={12} />
            <span>TG @{SITE_CONFIG.telegramHandle}</span>
          </a>
          <span className="text-zinc-700">•</span>
          <a
            href={`mailto:${SITE_CONFIG.email}`}
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Mail size={12} />
            <span>{SITE_CONFIG.email}</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
