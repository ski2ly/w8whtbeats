import type { Beat, Genre } from '../types/beat'

/**
 * Parses beat audio filename in the format:
 * "Название_тональность_бпм"
 * Examples:
 * - "Phantom_A#m_190.mp3"        -> Title: "PHANTOM", Key: "A#m", BPM: 190
 * - "Слабость_Fm_140.mp3"        -> Title: "СЛАБОСТЬ", Key: "Fm", BPM: 140
 * - "Sunrise_Dm_179BBPM.mp3"     -> Title: "SUNRISE", Key: "Dm", BPM: 179
 * - "baby_drill_Gm_123BPM.mp3"   -> Title: "BABY DRILL", Key: "Gm", BPM: 123
 */
export function parseBeatFilename(rawFilename: string, audioUrl: string, duration = 0): Beat {
  // Strip directory paths (e.g. /beats/ or C:\beats\)
  const filenameWithoutPath = rawFilename.split('/').pop()!.split('\\').pop()!

  // Strip file extension (.mp3, .wav, .m4a, .ogg, .flac)
  const baseName = filenameWithoutPath.replace(/\.[^/.]+$/, '').trim()

  const parts = baseName.split('_').map((p) => p.trim()).filter(Boolean)

  let title = baseName
  let key = 'Fm'
  let bpm = 140

  if (parts.length >= 3) {
    // Format: [Title, ..., Key, BPM]
    const rawBpm = parts[parts.length - 1]
    const rawKey = parts[parts.length - 2]
    const titleParts = parts.slice(0, parts.length - 2)

    // Parse BPM
    const bpmDigits = rawBpm.replace(/[^0-9]/g, '')
    if (bpmDigits.length > 0) {
      const parsed = parseInt(bpmDigits, 10)
      if (!isNaN(parsed) && parsed >= 40 && parsed <= 300) {
        bpm = parsed
      }
    }

    // Parse Key
    if (rawKey.length > 0) {
      key = formatKey(rawKey)
    }

    title = titleParts.join(' ').trim()
  } else if (parts.length === 2) {
    // Format: Title_BPM or Title_Key
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

  // Clean uppercase title (supports Russian and English characters)
  const cleanTitle = title.replace(/[-_]+/g, ' ').trim().toUpperCase()

  // Generate deterministic unique ID based on the filename (Unicode letters & numbers)
  const fileSlug = filenameWithoutPath
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  const id = fileSlug || cleanTitle.toLowerCase() || `beat-${Math.random().toString(36).slice(2, 7)}`

  // Inferred genre based on BPM and title
  let genre: Genre = 'Hood Trap'
  const lowerBase = baseName.toLowerCase()
  if (lowerBase.includes('drill') || (bpm >= 140 && bpm <= 145)) {
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
    duration: typeof duration === 'number' && duration > 0 ? duration : 0,
    audioUrl,
    status: 'available',
  }
}

// Helper to format musical keys nicely (e.g. "a#m" -> "A#m", "A#M" -> "A#m", "dm" -> "Dm")
function formatKey(raw: string): string {
  const clean = raw.trim()
  if (!clean) return 'Fm'

  const match = clean.match(/^([a-gA-G])([#b]?)(.*)$/)
  if (!match) return clean.toUpperCase()

  const root = match[1].toUpperCase()
  const accidental = match[2]
  let suffix = match[3].toLowerCase()

  if (suffix === 'm' || suffix === 'min' || suffix === 'minor') {
    suffix = 'm'
  } else if (suffix === 'maj' || suffix === 'major') {
    suffix = ' Maj'
  } else if (suffix === '') {
    // If no suffix, default to minor if producer didn't specify, or keep clean
    suffix = ''
  }

  return `${root}${accidental}${suffix}`
}
