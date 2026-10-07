import React from 'react'
import { SITE_CONFIG } from '../config/site'
import { Send, Mail, FileCheck } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="w-full max-w-xl mx-auto pt-8 pb-12 px-1 text-center border-t border-zinc-800/80 mt-10">
      {/* Royalty / Purchase info card */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 text-left mb-6">
        <div className="flex items-center gap-2 text-xs font-mono-tech text-zinc-300 font-bold uppercase mb-2">
          <FileCheck size={16} className="text-zinc-200" />
          <span>КАК ПРОИСХОДИТ СДЕЛКА ПОД РОЯЛТИ:</span>
        </div>
        <ol className="text-xs font-sans text-zinc-400 space-y-2 pl-4 list-decimal marker:text-zinc-500">
          <li>Выбираешь понравившийся бит в каталоге и жмешь <b className="text-zinc-200">«ЗАБРАТЬ WAV»</b>.</li>
          <li>Пишешь напрямую мне в Telegram (<a href={SITE_CONFIG.telegramUrl} target="_blank" rel="noreferrer" className="text-white underline underline-offset-2">@{SITE_CONFIG.telegramHandle}</a>) или на почту.</li>
          <li>Согласовываем детали релиза и подписываем договор передачи прав (Royalty / Split Sheet).</li>
          <li>Получаешь полный архив: <b className="text-zinc-200">WAV Master 24-bit + мультитрек (Stems)</b> без тега.</li>
        </ol>
      </div>

      {/* Copyright & Tagline */}
      <div className="flex flex-col items-center justify-center gap-2">
        <p className="font-display font-extrabold text-sm text-zinc-300 tracking-wider">
          {SITE_CONFIG.producerName}
        </p>
        <p className="text-xs font-mono-tech text-zinc-500">
          Tag: "{SITE_CONFIG.producerTag}" • Dark Trap & Drill Production
        </p>
        <div className="flex items-center gap-4 text-xs font-mono-tech text-zinc-400 mt-2">
          <a
            href={SITE_CONFIG.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <Send size={12} />
            <span>Telegram</span>
          </a>
          <span>•</span>
          <a
            href={`mailto:${SITE_CONFIG.email}`}
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <Mail size={12} />
            <span>{SITE_CONFIG.email}</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
