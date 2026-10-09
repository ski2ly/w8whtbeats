import React, { useState } from 'react'
import type { Beat } from '../types/beat'
import { SITE_CONFIG } from '../config/site'
import { useLanguage } from '../context/LanguageContext'
import { X, Send, Mail, Copy, Check, Radio, FileAudio, CheckCircle2 } from 'lucide-react'
import confetti from 'canvas-confetti'

interface DealModalProps {
  beat: Beat | null
  onClose: () => void
}

export const DealModal: React.FC<DealModalProps> = ({ beat, onClose }) => {
  const { t } = useLanguage()
  const [copiedType, setCopiedType] = useState<'tg' | 'email' | null>(null)

  if (!beat) return null

  // Pre-formatted friendly direct message for Telegram in current language
  const tgMessage = t.modalTgMessage(beat.title, beat.bpm, beat.key)
  const tgUrl = `https://t.me/${SITE_CONFIG.telegramHandle}?text=${encodeURIComponent(tgMessage)}`

  // Pre-formatted mailto in current language
  const emailSubject = t.modalEmailSubject(beat.title)
  const emailBody = t.modalEmailBody(beat.title, beat.bpm, beat.key)
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* Modal Dialog */}
      <div 
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#0c0d12] border border-zinc-700/80 rounded-2xl p-4 sm:p-6 md:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.95)] text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative scanlines in modal */}
        <div className="absolute inset-0 scanlines opacity-20 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-full transition-colors z-20"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="relative z-10 pr-8">
          <div className="flex items-center gap-2 text-xs font-mono-tech text-zinc-400 uppercase tracking-widest mb-1.5">
            <Radio size={14} className="text-zinc-300 animate-pulse shrink-0" />
            <span className="truncate">{t.modalBadge}</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-soyuz text-white tracking-wide uppercase crt-glow-text leading-tight truncate">
            {beat.title}
          </h2>

          <div className="flex items-center gap-2 mt-2 font-mono-tech text-xs text-zinc-300">
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 font-bold">
              {beat.bpm} BPM
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 font-bold">
              KEY: {beat.key}
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 font-bold">
              24-BIT WAV
            </span>
          </div>
        </div>

        {/* Primary Licensing Overview */}
        <div className="relative z-10 mt-4 sm:mt-5 p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm font-sans">
          <div className="flex items-start gap-2.5">
            <FileAudio size={18} className="text-white shrink-0 mt-0.5" />
            <p className="text-zinc-200 leading-relaxed font-normal">
              {t.modalNote}
            </p>
          </div>
        </div>

        {/* Deliverables & Terms Checklist */}
        <div className="relative z-10 mt-3.5 p-3.5 rounded-xl bg-black/50 border border-zinc-800/90 text-xs font-mono-tech space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">
            {t.dealTermsTitle}
          </span>
          <div className="space-y-1.5 text-zinc-300">
            {t.dealTermsList.map((term, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug text-zinc-300">{term}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Contact Actions */}
        <div className="relative z-10 mt-4 sm:mt-5 space-y-2.5 sm:space-y-3">
          {/* Main Action: Telegram */}
          <a
            href={tgUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={triggerConfetti}
            className="w-full flex items-center justify-center gap-2.5 py-3 sm:py-3.5 px-4 rounded-xl bg-white text-black font-mono-tech text-xs sm:text-sm font-bold tracking-wide hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)]"
          >
            <Send size={16} />
            <span className="truncate">{t.modalTgButton} (@{SITE_CONFIG.telegramHandle})</span>
          </a>

          {/* Secondary Action: Email */}
          <a
            href={mailtoUrl}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono-tech text-xs sm:text-sm font-semibold transition-colors border border-zinc-800"
          >
            <Mail size={16} />
            <span>{t.modalEmailButton}</span>
          </a>

          {/* Copy Direct Handles */}
          <div className="pt-1 flex flex-col xs:flex-row items-center justify-between gap-2 text-xs font-mono-tech text-zinc-400">
            <button
              onClick={() => handleCopy(`@${SITE_CONFIG.telegramHandle}`, 'tg')}
              className="w-full xs:flex-1 py-2 px-3 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedType === 'tg' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedType === 'tg' ? t.copiedText : t.copyTgBtn}</span>
            </button>

            <button
              onClick={() => handleCopy(SITE_CONFIG.email, 'email')}
              className="w-full xs:flex-1 py-2 px-3 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedType === 'email' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedType === 'email' ? t.copiedText : t.copyEmailBtn}</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 mt-4 text-center">
          <p className="text-[10px] sm:text-[11px] font-mono-tech text-zinc-500">
            {t.modalFooter}
          </p>
        </div>
      </div>
    </div>
  )
}
