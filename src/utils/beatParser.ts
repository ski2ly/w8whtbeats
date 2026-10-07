import type { Beat, Genre } from '../types/beat'

/**
 * Parses beat audio filename in the format:
 * "Название_тональность_бпм"
 * Examples:
 * - "BLOCK EYES_Am_160BPM.mp3" -> Title: "BLOCK EYES", Key: "Am", BPM: 160
 * - "Phantom_C#m_190BPM.wav"   -> Title: "Phantom", Key: "C#m", BPM: 190
 * - "GRAVEYARD SHIFT_Fm_140.mp3" -> Title: "GRAVEYARD SHIFT", Key: "Fm", BPM: 140
 * - "NO_MERCY_D#m_145BPM.mp3" -> Title: "NO MERCY", Key: "D#m", BPM: 145
 */
export function parseBeatFilename(rawFilename: string, audioUrl: string): Beat {
  // Strip path (e.g. /beats/ or C:\beats\)
  const filenameWithoutPath = rawFilename.split('/').pop()!.split('\\').pop()!
  
  // Strip file extension (.mp3, .wav, .m4a, .ogg, .flac)
  const baseName = filenameWithoutPath.replace(/\.[^/.]+$/, '').trim()

  const parts = baseName.split('_').map((p) => p.trim()).filter(Boolean)

  let title = baseName
  let key = 'Fm'
  let bpm = 140

  if (parts.length >= 3) {
    // Standard format: [Title, ..., Key, BPM]
    const rawBpm = parts[parts.length - 1]
    const rawKey = parts[parts.length - 2]
    const titleParts = parts.slice(0, parts.length - 2)

    // Check if BPM is indeed in the last position
    const bpmDigits = rawBpm.replace(/[^0-9]/g, '')
    if (bpmDigits.length > 0) {
      const parsed = parseInt(bpmDigits, 10)
      if (!isNaN(parsed) && parsed >= 40 && parsed <= 300) {
        bpm = parsed
      }
    }

    // Key
    if (rawKey.length > 0) {
      key = formatKey(rawKey)
    }

    title = titleParts.join(' ').trim()
  } else if (parts.length === 2) {
    // Format could be: Title_BPM or Title_Key
    const part0 = parts[0]
    const part1 = parts[1]

    const bpmDigits = part1.replace(/[^0-9]/g, '')
    if (bpmDigits.length > 0 && /^\d+(bpm)?$/i.test(part1)) {
      bpm = parseInt(bpmDigits, 10) || 140
      title = part0
    } else {
      key = formatKey(part1)
      title = part0
    }
  }

  // Fallback title formatting: replace extra underscores/dashes with spaces
  const cleanTitle = title.replace(/[-_]+/g, ' ').trim().toUpperCase()

  const id = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `beat-${Math.random().toString(36).slice(2, 7)}`

  // Inferred genre based on BPM
  let genre: Genre = 'Hood Trap'
  if (bpm >= 145 && bpm <= 155) {
    genre = 'Dark Drill'
  } else if (bpm >= 155) {
    genre = 'Hood Trap'
  } else if (bpm <= 130) {
    genre = 'Ambient Trap'
  }

  return {
    id,
    title: cleanTitle,
    bpm,
    key,
    genre,
    tags: ['Dark', `${bpm} BPM`, key],
    duration: 15,
    audioUrl,
    status: 'available',
  }
}

// Helper to format musical keys nicely (e.g., "am" -> "Am", "c#m" -> "C#m")
function formatKey(raw: string): string {
  const clean = raw.trim()
  if (!clean) return 'Fm'

  // Match root note (A-G with optional # or b) and scale (m, min, maj, etc.)
  const match = clean.match(/^([a-gA-G])([#b]?)(.*)$/)
  if (!match) return clean.toUpperCase()

  const root = match[1].toUpperCase()
  const accidental = match[2]
  let suffix = match[3].toLowerCase()

  if (suffix === 'min' || suffix === 'minor') suffix = 'm'
  if (suffix === 'maj' || suffix === 'major') suffix = ' Maj'

  return `${root}${accidental}${suffix}`
}
