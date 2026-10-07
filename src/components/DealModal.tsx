import React, { useState } from 'react'
import type { Beat } from '../types/beat'
import { SITE_CONFIG } from '../config/site'
import { X, Send, Mail, Copy, Check, FileText, ShieldCheck, Flame } from 'lucide-react'
import confetti from 'canvas-confetti'

interface DealModalProps {
  beat: Beat | null
  onClose: () => void
}

export const DealModal: React.FC<DealModalProps> = ({ beat, onClose }) => {
  const [copiedType, setCopiedType] = useState<'tg' | 'email' | null>(null)

  if (!beat) return null

  // Pre-formatted message for Telegram
  const tgMessage = `Привет, Skilly! Хочу забрать бит «${beat.title}» (${beat.bpm} BPM, ${beat.key}) под роялти с договором.`
  const tgUrl = `https://t.me/${SITE_CONFIG.telegramHandle}?text=${encodeURIComponent(tgMessage)}`

  // Pre-formatted mailto
  const emailSubject = `Покупка бита ${beat.title} [WWSKILLY]`
  const emailBody = `Привет, Skilly!\n\nИнтересует бит «${beat.title}» (${beat.bpm} BPM, ${beat.key}, жанр: ${beat.genre}).\nГотов обсудить условия договора передачи прав под роялти.\n\nМой никнейм/контакты:`
  const mailtoUrl = `mailto:${SITE_CONFIG.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

  const handleCopy = (text: string, type: 'tg' | 'email') => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#ffffff', '#a1a1aa', '#3f3f46'],
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Dialog */}
      <div 
        className="relative w-full max-w-lg bg-[#0e0f14] border border-zinc-700/80 rounded-2xl p-5 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative scanlines in modal */}
        <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-full transition-colors z-20"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono-tech text-zinc-400 uppercase tracking-widest mb-1">
            <Flame size={14} className="text-zinc-300" />
            <span>ОФОРМЛЕНИЕ ЛИЦЕНЗИИ / РОЯЛТИ</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-wide uppercase crt-glow-text">
            {beat.title}
          </h2>

          <div className="flex flex-wrap items-center gap-2 mt-2 font-mono-tech text-xs text-zinc-300">
            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-bold">
              {beat.bpm} BPM
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-bold">
              KEY: {beat.key}
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              {beat.genre}
            </span>
          </div>
        </div>

        {/* License Details Card */}
        <div className="relative z-10 mt-5 p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm font-sans space-y-2.5">
          <div className="flex items-start gap-2.5 text-zinc-300">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Что входит в передачу:</span>
              <p className="text-zinc-400 text-xs mt-0.5">
                Мастер-файл WAV (24-bit / 44.1kHz), дорожки без тега (Stems/Trackout) + юридический договор передачи прав под роялти.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-zinc-300 pt-2 border-t border-zinc-800">
            <FileText size={18} className="text-zinc-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Формат сделки:</span>
              <p className="text-zinc-400 text-xs mt-0.5">
                Пишешь напрямую WWSKILLY, фиксируем условия сплита/роялти (Split Sheet) и получаешь архив со всеми дорожками для записи трека.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Contact Actions */}
        <div className="relative z-10 mt-5 space-y-3">
          {/* Main Action: Telegram */}
          <a
            href={tgUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={triggerConfetti}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white text-black font-mono-tech text-sm font-bold tracking-wide hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)]"
          >
            <Send size={18} />
            <span>НАПИСАТЬ В TELEGRAM (@{SITE_CONFIG.telegramHandle})</span>
          </a>

          {/* Secondary Action: Email */}
          <a
            href={mailtoUrl}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-200 font-mono-tech text-xs sm:text-sm font-semibold transition-colors border border-zinc-700"
          >
            <Mail size={16} />
            <span>ОТПРАВИТЬ ЗАПРОС НА EMAIL</span>
          </a>

          {/* Copy Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 text-xs font-mono-tech text-zinc-400">
            <button
              onClick={() => handleCopy(`@${SITE_CONFIG.telegramHandle}`, 'tg')}
              className="flex-1 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedType === 'tg' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedType === 'tg' ? 'Скопировано!' : 'Копия TG'}</span>
            </button>

            <button
              onClick={() => handleCopy(SITE_CONFIG.email, 'email')}
              className="flex-1 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedType === 'email' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedType === 'email' ? 'Скопировано!' : 'Копия Email'}</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 mt-4 text-center">
          <p className="text-[11px] font-mono-tech text-zinc-500">
            Продюсерский тег: «Wait... What? Skilly» • Прямая связь без посредников
          </p>
        </div>
      </div>
    </div>
  )
}
