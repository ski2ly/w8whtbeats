import React, { useState } from 'react'
import type { Beat } from '../types/beat'
import { SITE_CONFIG } from '../config/site'
import { X, Send, Mail, Copy, Check, Radio } from 'lucide-react'
import confetti from 'canvas-confetti'

interface DealModalProps {
  beat: Beat | null
  onClose: () => void
}

export const DealModal: React.FC<DealModalProps> = ({ beat, onClose }) => {
  const [copiedType, setCopiedType] = useState<'tg' | 'email' | null>(null)

  if (!beat) return null

  // Pre-formatted friendly direct message for Telegram
  const tgMessage = `Привет, Skilly! Заценил бит «${beat.title}» (${beat.bpm} BPM, ${beat.key}). Хочу забрать WAV и залететь на него.`
  const tgUrl = `https://t.me/${SITE_CONFIG.telegramHandle}?text=${encodeURIComponent(tgMessage)}`

  // Pre-formatted mailto
  const emailSubject = `Бит ${beat.title} [WWSKILLY]`
  const emailBody = `Привет, Skilly!\n\nЗаценил твой бит «${beat.title}» (${beat.bpm} BPM, ${beat.key}).\nХочу взять его в работу под трек.\n\nМой никнейм/контакт для связи:`
  const mailtoUrl = `mailto:${SITE_CONFIG.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

  const handleCopy = (text: string, type: 'tg' | 'email') => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 65,
      origin: { y: 0.65 },
      colors: ['#ffffff', '#d4d4d8', '#71717a'],
    })
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* Modal Dialog */}
      <div 
        className="relative w-full max-w-lg bg-[#0c0d12] border border-zinc-700/80 rounded-2xl p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.95)] text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative scanlines in modal */}
        <div className="absolute inset-0 scanlines opacity-25 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-full transition-colors z-20"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono-tech text-zinc-400 uppercase tracking-widest mb-1.5">
            <Radio size={14} className="text-zinc-300 animate-pulse" />
            <span>ВЗЯТЬ БИТ // СВЯЗЬ С SKILLY</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-soyuz text-white tracking-wide uppercase crt-glow-text leading-tight">
            {beat.title}
          </h2>

          <div className="flex items-center gap-2 mt-2 font-mono-tech text-xs text-zinc-300">
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 font-bold">
              {beat.bpm} BPM
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 font-bold">
              KEY: {beat.key}
            </span>
          </div>
        </div>

        {/* Free WAV Note */}
        <div className="relative z-10 mt-5 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm font-sans">
          <p className="text-zinc-200 font-medium leading-relaxed">
            Понравился бит? Пиши в Telegram — бесплатно скину <b>WAV</b> под твой трек.
          </p>
        </div>

        {/* Primary Contact Actions */}
        <div className="relative z-10 mt-5 space-y-3">
          {/* Main Action: Telegram */}
          <a
            href={tgUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={triggerConfetti}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white text-black font-mono-tech text-xs sm:text-sm font-bold tracking-wide hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)]"
          >
            <Send size={18} />
            <span>НАПИСАТЬ В TELEGRAM (@{SITE_CONFIG.telegramHandle})</span>
          </a>

          {/* Secondary Action: Email */}
          <a
            href={mailtoUrl}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono-tech text-xs sm:text-sm font-semibold transition-colors border border-zinc-800"
          >
            <Mail size={16} />
            <span>ОТПРАВИТЬ ПИСЬМО НА EMAIL</span>
          </a>

          {/* Copy Buttons */}
          <div className="pt-1.5 flex items-center justify-between gap-2 text-xs font-mono-tech text-zinc-400">
            <button
              onClick={() => handleCopy(`@${SITE_CONFIG.telegramHandle}`, 'tg')}
              className="flex-1 py-2 px-3 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedType === 'tg' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedType === 'tg' ? 'Скопировано!' : 'Копия TG @mrski2ly'}</span>
            </button>

            <button
              onClick={() => handleCopy(SITE_CONFIG.email, 'email')}
              className="flex-1 py-2 px-3 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedType === 'email' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedType === 'email' ? 'Скопировано!' : 'Копия Email'}</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 mt-4 text-center">
          <p className="text-[11px] font-mono-tech text-zinc-500">
            "{SITE_CONFIG.producerTag}" • Быстрый ответ в Telegram
          </p>
        </div>
      </div>
    </div>
  )
}
