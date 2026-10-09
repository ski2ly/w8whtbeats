export type Language = 'en' | 'ru'

export interface Translations {
  // Header
  brandTitle: string
  producerTagline: string
  telegramTitle: string
  emailTitle: string
  switchLangTitle: string

  // Standby & Power
  turnOnTv: string
  standbyHint: string
  coldPhosphor: string
  standbyStatus: string
  powerOffTv: string
  powerOnTv: string

  // CRT Screen & OSD
  onlineMessage: string
  chTitle: string
  vcrQuality: string
  playingPreview: string
  paused: string
  loopBadge: string
  fullTrack: string
  previewBadge: string
  oscilloscopeTitle: string
  vfdSpectrumTitle: string
  scaleTitle: string
  gestureHint: string

  // Killer FX Controls & OSD
  halfTimeTitle: string
  halfTimeBadge: string
  halfTimeOsdOn: string
  halfTimeOsdOff: string

  pitchDownTitle: string
  pitchUpTitle: string
  pitchResetTitle: string
  pitchBadge: string
  pitchOsd: (semitones: number, key: string) => string

  vfdToggleTitle: string
  vfdModeWave: string
  vfdModeBars: string

  lofiFilterTitle: string
  lofiBadge: string
  lofiOsdOn: string
  lofiOsdOff: string

  // Standard Controls
  prevBeatTitle: string
  nextBeatTitle: string
  playButton: string
  pauseButton: string
  loopOnTitle: string
  loopOffTitle: string
  loopOnOsd: string
  loopOffOsd: string
  tagButtonTitle: string
  tagOsd: string
  tagFx: string
  volumeTitle: string
  muteTitle: string

  // Tracklist
  tracklistTitle: string
  searchPlaceholder: string
  noTracksFound: string
  noTracksEmpty: string

  // Beat Card
  playTrackAria: string
  pauseTrackAria: string
  acquireBeat: string
  acquireBeatShort: string

  // Deal Modal (Professional licensing & 70/30 split)
  modalBadge: string
  modalNote: string
  dealTermsTitle: string
  dealTermsList: string[]
  modalTgButton: string
  modalEmailButton: string
  copiedText: string
  copyTgBtn: string
  copyEmailBtn: string
  modalFooter: string
  modalTgMessage: (title: string, bpm: number, key: string) => string
  modalEmailSubject: (title: string) => string
  modalEmailBody: (title: string, bpm: number, key: string) => string

  // Footer
  quickResponse: string
}

export const translations: Record<Language, Translations> = {
  en: {
    brandTitle: 'WWSKILLY',
    producerTagline: 'W8WHT? SOUND LAB',
    telegramTitle: 'Contact Producer via Telegram',
    emailTitle: 'Send Licensing Inquiry (Email)',
    switchLangTitle: 'Переключить на русский язык (RU)',

    turnOnTv: 'INITIALIZE MONITOR',
    standbyHint: 'STANDBY // CLICK TO INITIALIZE SYSTEM',
    coldPhosphor: 'CRT 15" // ACTIVE',
    standbyStatus: 'STANDBY // IDLE',
    powerOffTv: 'Power Off Monitor',
    powerOnTv: 'Power On Monitor',

    onlineMessage: 'W8WHT? SOUND LAB // SYSTEM ONLINE',
    chTitle: 'CH',
    vcrQuality: 'HQ-MASTER',
    playingPreview: 'PREVIEW MONITORING',
    paused: 'PAUSED',
    loopBadge: 'LOOP',
    fullTrack: 'MASTER TRACK',
    previewBadge: 'PREVIEW',
    oscilloscopeTitle: 'OSCILLOSCOPE // 20Hz - 20kHz',
    vfdSpectrumTitle: 'VFD SPECTRUM ANALYZER // 16-BAND',
    scaleTitle: 'SCALE / KEY',
    gestureHint: 'SWIPE: CH- / CH+ • TAP: PLAY',

    halfTimeTitle: '0.5X Speed Mode (Half-Time / Slowed)',
    halfTimeBadge: '0.5X SLOW',
    halfTimeOsdOn: 'MODE: HALF-TIME (0.5X)',
    halfTimeOsdOff: 'MODE: ORIGINAL TEMPO (1.0X)',

    pitchDownTitle: 'Transpose Down (-1 Semitone)',
    pitchUpTitle: 'Transpose Up (+1 Semitone)',
    pitchResetTitle: 'Reset Transpose (0 ST)',
    pitchBadge: 'PITCH',
    pitchOsd: (semitones: number, key: string) =>
      `PITCH: ${semitones > 0 ? '+' : ''}${semitones} ST ➔ ${key}`,

    vfdToggleTitle: 'Toggle Visualizer Mode (Oscilloscope / VFD)',
    vfdModeWave: 'WAVE',
    vfdModeBars: 'VFD',

    lofiFilterTitle: 'CRT Speaker Bandpass Emulation (Lo-Fi Filter)',
    lofiBadge: 'LO-FI SPK',
    lofiOsdOn: 'SPEAKER: CRT LO-FI',
    lofiOsdOff: 'SPEAKER: STUDIO MASTER (FLAT)',

    prevBeatTitle: 'Previous track (CH -)',
    nextBeatTitle: 'Next track (CH +)',
    playButton: 'PLAY PREVIEW',
    pauseButton: 'PAUSE',
    loopOnTitle: 'Disable seamless loop',
    loopOffTitle: 'Seamless loop playback (LOOP)',
    loopOnOsd: 'LOOP: ON',
    loopOffOsd: 'LOOP: OFF',
    tagButtonTitle: 'Signature W8WHT? Producer Voice Tag',
    tagOsd: 'VOICE TAG: W8WHT?',
    tagFx: 'TAG FX',
    volumeTitle: 'Monitor Volume',
    muteTitle: 'Mute / Unmute',

    tracklistTitle: 'PRODUCTION CATALOG // DISCOGRAPHY',
    searchPlaceholder: 'Search (BPM, key, title...)',
    noTracksFound: 'No beats matching your criteria',
    noTracksEmpty: 'NO TRACKS AVAILABLE',

    playTrackAria: 'Play preview of',
    pauseTrackAria: 'Pause',
    acquireBeat: 'ACQUIRE MASTER',
    acquireBeatShort: 'ACQUIRE',

    modalBadge: 'PRODUCTION LICENSING // DIRECT ACQUISITION',
    modalNote:
      'Uncompressed 24-bit / 44.1 kHz master WAV provided for commercial streaming release under a 70/30 royalty split (30% producer royalties to WWSKILLY). Multitrack stems (trackouts), custom arrangements, and full exclusive buyout rights are negotiated directly.',
    dealTermsTitle: 'DELIVERABLES & TIERS:',
    dealTermsList: [
      'WAV Master 24-bit — delivered for official commercial release under 70/30 royalty split (30% WWSKILLY)',
      'Trackouts / Stems (multitrack stems) — available for precision vocal mixing & arrangement',
      'Exclusive Buyout — full assignment of exclusive rights with removal from public catalog',
    ],
    modalTgButton: 'DISCUSS RELEASE ON TELEGRAM',
    modalEmailButton: 'SEND OFFICIAL EMAIL INQUIRY',
    copiedText: 'Copied to clipboard!',
    copyTgBtn: 'Copy TG @mrski2ly',
    copyEmailBtn: 'Copy Email',
    modalFooter: 'WWSKILLY Production • Direct author communication and rapid turnaround',
    modalTgMessage: (title: string, bpm: number, key: string) =>
      `Hello Skilly. Interested in the production for "${title}" (${bpm} BPM, ${key}). Planning a commercial release with a 70/30 royalty split. Requesting master WAV and licensing details.`,
    modalEmailSubject: (title: string) => `Production License Inquiry: ${title} [WWSKILLY]`,
    modalEmailBody: (title: string, bpm: number, key: string) =>
      `Hello Skilly,\n\nI am interested in licensing the instrumental "${title}" (${bpm} BPM, ${key}).\nPlanning a commercial release with a 70/30 royalty split (30% producer royalties to WWSKILLY).\n\nRequested deliverables:\n[x] Uncompressed Master WAV (24-bit)\n[ ] Multitrack Stems (Trackouts)\n[ ] Exclusive Buyout\n\nArtist / Label / Management contact:\n`,

    quickResponse: 'WWSKILLY • Premium Sound Design, Production & Direct Licensing',
  },
  ru: {
    brandTitle: 'WWSKILLY',
    producerTagline: 'W8WHT? SOUND LAB',
    telegramTitle: 'Связаться с продюсером в Telegram',
    emailTitle: 'Отправить официальный запрос (Email)',
    switchLangTitle: 'Switch to English (EN)',

    turnOnTv: 'ВКЛЮЧИТЬ МОНИТОР',
    standbyHint: 'STANDBY // НАЖМИТЕ ДЛЯ ЗАПУСКА СИСТЕМЫ',
    coldPhosphor: 'CRT 15" // ACTIVE',
    standbyStatus: 'STANDBY // ОЖИДАНИЕ',
    powerOffTv: 'Выключить монитор',
    powerOnTv: 'Включить монитор',

    onlineMessage: 'W8WHT? SOUND LAB // СИСТЕМА АКТИВНА',
    chTitle: 'CH',
    vcrQuality: 'HQ-MASTER',
    playingPreview: 'МОНИТОРИНГ ПРЕВЬЮ',
    paused: 'ПАУЗА',
    loopBadge: 'LOOP',
    fullTrack: 'МАСТЕР-ТРЕК',
    previewBadge: 'ПРЕВЬЮ',
    oscilloscopeTitle: 'ОСЦИЛЛОГРАФ // 20Hz - 20kHz',
    vfdSpectrumTitle: 'VFD АНАЛИЗАТОР СПЕКТРА // 16 ПОЛОС',
    scaleTitle: 'ТОНАЛЬНОСТЬ',
    gestureHint: 'СВАЙП: CH- / CH+ • ТАП: ПЛЕЙ',

    halfTimeTitle: 'Режим 0.5X (Half-Time / Slowed)',
    halfTimeBadge: '0.5X SLOW',
    halfTimeOsdOn: 'MODE: HALF-TIME (0.5X)',
    halfTimeOsdOff: 'MODE: ORIGINAL TEMPO (1.0X)',

    pitchDownTitle: 'Понизить тональность (-1 полутон)',
    pitchUpTitle: 'Повысить тональность (+1 полутон)',
    pitchResetTitle: 'Сбросить тональность в 0',
    pitchBadge: 'PITCH',
    pitchOsd: (semitones: number, key: string) =>
      `PITCH: ${semitones > 0 ? '+' : ''}${semitones} ST ➔ ${key}`,

    vfdToggleTitle: 'Сменить режим визуализации (Осциллограф / VFD)',
    vfdModeWave: 'WAVE',
    vfdModeBars: 'VFD',

    lofiFilterTitle: 'Эмуляция кинескопного динамика (CRT Lo-Fi)',
    lofiBadge: 'LO-FI SPK',
    lofiOsdOn: 'SPEAKER: CRT LO-FI',
    lofiOsdOff: 'SPEAKER: STUDIO MASTER (FLAT)',

    prevBeatTitle: 'Предыдущий трек (CH -)',
    nextBeatTitle: 'Следующий трек (CH +)',
    playButton: 'СЛУШАТЬ ПРЕВЬЮ',
    pauseButton: 'ПАУЗА',
    loopOnTitle: 'Отключить цикличное воспроизведение',
    loopOffTitle: 'Зациклить воспроизведение (LOOP)',
    loopOnOsd: 'LOOP: ВКЛ',
    loopOffOsd: 'LOOP: ВЫКЛ',
    tagButtonTitle: 'Фирменный войс-тег W8WHT?',
    tagOsd: 'VOICE TAG: W8WHT?',
    tagFx: 'TAG FX',
    volumeTitle: 'Громкость монитора',
    muteTitle: 'Вкл / Выкл звук',

    tracklistTitle: 'КАТАЛОГ ПРОДАКШНА // АУДИОТЕКА',
    searchPlaceholder: 'Поиск по темпу (BPM), тональности, названию...',
    noTracksFound: 'Инструменталы по заданным критериям не найдены',
    noTracksEmpty: 'КАТАЛОГ ПУСТ',

    playTrackAria: 'Слушать превью',
    pauseTrackAria: 'Приостановить',
    acquireBeat: 'ЗАПРОСИТЬ ТРЕК',
    acquireBeatShort: 'ЗАПРОС',

    modalBadge: 'ЛИЦЕНЗИРОВАНИЕ И ПЕРЕДАЧА МАСТЕРА // WWSKILLY',
    modalNote:
      'Мастер-запись в несжатом формате WAV 24-bit / 44.1 kHz передается под коммерческий релиз на условиях распределения роялти 70% (Артист) / 30% (Продюсер WWSKILLY). Поканальные дорожки (Trackouts / Stems), кастомные правки аранжировки и полный выкуп эксклюзивных прав (Exclusive Buyout) обсуждаются напрямую.',
    dealTermsTitle: 'УСЛОВИЯ И ФОРМАТЫ:',
    dealTermsList: [
      'WAV Master 24-bit — передается для официального релиза с роялти-сплитом 70/30 (30% WWSKILLY)',
      'Trackouts / Stems (поканальный мультитрек) — доступен для детального сведения под ваш вокал',
      'Exclusive Buyout — полное отчуждение исключительных прав и удаление инструментала из каталога',
    ],
    modalTgButton: 'ОБСУДИТЬ РЕЛИЗ В TELEGRAM',
    modalEmailButton: 'НАПРАВИТЬ ОФИЦИАЛЬНЫЙ ЗАПРОС (EMAIL)',
    copiedText: 'Скопировано в буфер!',
    copyTgBtn: 'Копировать TG @mrski2ly',
    copyEmailBtn: 'Копировать Email',
    modalFooter: 'WWSKILLY Production • Прямой контакт с автором и оперативное согласование условий',
    modalTgMessage: (title: string, bpm: number, key: string) =>
      `Здравствуйте, Skilly. Интересует продакшн «${title}» (${bpm} BPM, ${key}). Планирую коммерческий релиз с роялти-сплитом 70/30, нужен мастер WAV и согласование условий.`,
    modalEmailSubject: (title: string) => `Запрос лицензии на продакшн: ${title} [WWSKILLY]`,
    modalEmailBody: (title: string, bpm: number, key: string) =>
      `Здравствуйте, Skilly!\n\nИнтересует инструментал «${title}» (${bpm} BPM, ${key}).\nПланируется релиз на цифровых площадках с распределением роялти 70% (Артист) / 30% (Продюсер WWSKILLY).\n\nЗапрашиваемые материалы:\n[x] Несжатый мастер WAV (24-bit)\n[ ] Поканальные дорожки (Stems/Trackouts)\n[ ] Эксклюзивный выкуп прав (Exclusive Buyout)\n\nИмя артиста / лейбл / контакты менеджмента:\n`,

    quickResponse: 'WWSKILLY • Профессиональный продакшн, саунд-дизайн и лицензирование',
  },
}
