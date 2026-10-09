import React from 'react'
import { SITE_CONFIG } from '../config/site'
import { useLanguage } from '../context/LanguageContext'
import { Send, Mail, Globe } from 'lucide-react'

export const Header: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage()

  return (
    <header className="w-full max-w-xl md:max-w-2xl mx-auto pt-3 pb-3 px-1 sm:px-2 flex items-center justify-between border-b border-zinc-800/80 transition-all">
      {/* Brand & Monogram Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Producer Monogram Logo */}
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
          <p className="text-[10px] sm:text-[11px] font-mono-tech text-zinc-400 mt-1 tracking-widest uppercase">
            {t.producerTagline}
          </p>
        </div>
      </div>

      {/* Language Switcher & Quick Contacts */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Retro Language Toggle */}
        <button
          onClick={toggleLanguage}
          title={t.switchLangTitle}
          aria-label={t.switchLangTitle}
          className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-mono-tech shadow-sm active:scale-95"
        >
          <Globe size={13} className="text-zinc-400 shrink-0" />
          <span className={language === 'en' ? 'text-white font-bold' : 'text-zinc-500'}>EN</span>
          <span className="text-zinc-600 text-[10px]">/</span>
          <span className={language === 'ru' ? 'text-white font-bold' : 'text-zinc-500'}>RU</span>
        </button>

        {/* Telegram Direct Contact */}
        <a
          href={SITE_CONFIG.telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={t.telegramTitle}
          className="p-1.5 sm:px-3 sm:py-2 rounded-xl bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-800 hover:border-white transition-all flex items-center gap-1.5 text-xs font-mono-tech shadow-sm"
        >
          <Send size={13} />
          <span className="hidden sm:inline">@{SITE_CONFIG.telegramHandle}</span>
        </a>

        {/* Email Direct Contact */}
        <a
          href={`mailto:${SITE_CONFIG.email}`}
          title={t.emailTitle}
          className="p-1.5 sm:p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
        >
          <Mail size={14} />
        </a>
      </div>
    </header>
  )
}
