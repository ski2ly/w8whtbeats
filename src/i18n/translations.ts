export type Language = 'en' | 'ru'

export interface Translations {
  // Header
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
  scaleTitle: string

  // Controls
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

  // Deal Modal
  modalBadge: string
  modalNote: string
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
    telegramTitle: 'Contact via Telegram',
    emailTitle: 'Send an Email',
    switchLangTitle: 'Переключить на русский язык (RU)',

    turnOnTv: 'TURN ON TV',
    standbyHint: 'STANDBY • CLICK TO POWER ON',
    coldPhosphor: 'COLD PHOSPHOR',
    standbyStatus: 'STANDBY',
    powerOffTv: 'Turn Off TV',
    powerOnTv: 'Turn On TV',

    onlineMessage: 'W8WHT? // ONLINE',
    chTitle: 'CH',
    vcrQuality: 'VCR-HQ',
    playingPreview: 'PLAYING PREVIEW',
    paused: 'PAUSED',
    loopBadge: 'LOOP',
    fullTrack: 'FULL TRACK',
    previewBadge: 'PREVIEW',
    oscilloscopeTitle: 'OSCILLOSCOPE // 20Hz - 20kHz',
    scaleTitle: 'SCALE',

    prevBeatTitle: 'Previous track (CH -)',
    nextBeatTitle: 'Next track (CH +)',
    playButton: 'PLAY PREVIEW',
    pauseButton: 'PAUSE',
    loopOnTitle: 'Disable loop',
    loopOffTitle: 'Loop playback (LOOP)',
    loopOnOsd: 'LOOP: ON',
    loopOffOsd: 'LOOP: OFF',
    tagButtonTitle: 'Signature W8WHT? Voice Tag',
    tagOsd: 'TAG: W8WHT?',
    tagFx: 'TAG FX',
    volumeTitle: 'Volume',
    muteTitle: 'Mute / Unmute',

    tracklistTitle: 'CATALOG // TRACKLIST',
    searchPlaceholder: 'Search (BPM, key, title...)',
    noTracksFound: 'No beats matching your search',
    noTracksEmpty: 'NO TRACKS AVAILABLE',

    playTrackAria: 'Play preview of',
    pauseTrackAria: 'Pause',
    acquireBeat: 'ACQUIRE',
    acquireBeatShort: 'GET',

    modalBadge: 'ACQUIRE BEAT // DIRECT LICENSE',
    modalNote: 'Vibe with this beat? Reach out on Telegram — get the uncompressed WAV free for your placement under royalties.',
    modalTgButton: 'MESSAGE ON TELEGRAM',
    modalEmailButton: 'SEND EMAIL MESSAGE',
    copiedText: 'Copied!',
    copyTgBtn: 'Copy TG @mrski2ly',
    copyEmailBtn: 'Copy Email',
    modalFooter: 'W8WHT? • Instant direct response on Telegram',
    modalTgMessage: (title: string, bpm: number, key: string) =>
      `Hey Skilly! Checked out the beat "${title}" (${bpm} BPM, ${key}). Want to grab the uncompressed WAV and hop on it under royalties.`,
    modalEmailSubject: (title: string) => `Beat Inquiry: ${title} [WWSKILLY]`,
    modalEmailBody: (title: string, bpm: number, key: string) =>
      `Hey Skilly!\n\nJust checked out your beat "${title}" (${bpm} BPM, ${key}).\nI'd like to acquire the WAV tracks and work on a release under royalties.\n\nMy artist name / contact:`,

    quickResponse: 'Direct Music Inquiries',
  },
  ru: {
    telegramTitle: 'Написать в Telegram',
    emailTitle: 'Написать на Email',
    switchLangTitle: 'Switch to English (EN)',

    turnOnTv: 'ВКЛЮЧИТЬ ТЕЛЕВИЗОР',
    standbyHint: 'STANDBY • НАЖМИТЕ ДЛЯ ЗАПУСКА',
    coldPhosphor: 'COLD PHOSPHOR',
    standbyStatus: 'STANDBY',
    powerOffTv: 'Выключить ТВ',
    powerOnTv: 'Включить ТВ',

    onlineMessage: 'W8WHT? // В СЕТИ',
    chTitle: 'CH',
    vcrQuality: 'VCR-HQ',
    playingPreview: 'ИГРАЕТ ПРЕВЬЮ',
    paused: 'ПАУЗА',
    loopBadge: 'LOOP',
    fullTrack: 'ПОЛНЫЙ ТРЕК',
    previewBadge: 'ПРЕВЬЮ',
    oscilloscopeTitle: 'OSCILLOSCOPE // 20Hz - 20kHz',
    scaleTitle: 'ТОНАЛЬНОСТЬ',

    prevBeatTitle: 'Предыдущий бит (CH -)',
    nextBeatTitle: 'Следующий бит (CH +)',
    playButton: 'СЛУШАТЬ ПРЕВЬЮ',
    pauseButton: 'ПАУЗА',
    loopOnTitle: 'Выключить повтор',
    loopOffTitle: 'Зациклить воспроизведение (LOOP)',
    loopOnOsd: 'LOOP: ON',
    loopOffOsd: 'LOOP: OFF',
    tagButtonTitle: 'Фирменный тег W8WHT?',
    tagOsd: 'TAG: W8WHT?',
    tagFx: 'TAG FX',
    volumeTitle: 'Громкость',
    muteTitle: 'Вкл / Выкл звук',

    tracklistTitle: 'КАТАЛОГ // ТРЕКЛИСТ',
    searchPlaceholder: 'Поиск (140, D#m...)',
    noTracksFound: 'Треки не найдены',
    noTracksEmpty: 'НЕТ ТРЕКОВ',

    playTrackAria: 'Слушать превью',
    pauseTrackAria: 'Пауза',
    acquireBeat: 'ВЗЯТЬ В РАБОТУ',
    acquireBeatShort: 'В РАБОТУ',

    modalBadge: 'ВЗЯТЬ БИТ // СВЯЗЬ С SKILLY',
    modalNote: 'Понравился бит? Пиши в Telegram — бесплатно скину WAV под твой трек под роялти.',
    modalTgButton: 'НАПИСАТЬ В TELEGRAM',
    modalEmailButton: 'ОТПРАВИТЬ ПИСЬМО НА EMAIL',
    copiedText: 'Скопировано!',
    copyTgBtn: 'Копия TG @mrski2ly',
    copyEmailBtn: 'Копия Email',
    modalFooter: 'W8WHT? • Быстрый ответ в Telegram',
    modalTgMessage: (title: string, bpm: number, key: string) =>
      `Привет, Skilly! Заценил бит «${title}» (${bpm} BPM, ${key}). Хочу забрать WAV и залететь на него.`,
    modalEmailSubject: (title: string) => `Бит ${title} [WWSKILLY]`,
    modalEmailBody: (title: string, bpm: number, key: string) =>
      `Привет, Skilly!\n\nЗаценил твой бит «${title}» (${bpm} BPM, ${key}).\nХочу взять его в работу под трек.\n\nМой никнейм/контакт для связи:`,

    quickResponse: 'Прямая связь с битмейкером',
  },
}
