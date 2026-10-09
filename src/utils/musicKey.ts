const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
}

/**
 * Transpose a musical key string by N semitones (e.g., 'Fm' + 1 => 'F#m')
 */
export function transposeKey(keyString: string, semitones: number): string {
  if (!keyString || semitones === 0) return keyString

  const trimmed = keyString.trim()
  // Match note root (e.g., C#, Db, F, G#) and rest (e.g. m, min, maj)
  const match = trimmed.match(/^([A-Ga-g][#b]?)(.*)$/)
  if (!match) {
    const sign = semitones > 0 ? `+${semitones}` : `${semitones}`
    return `${trimmed} (${sign})`
  }

  let root = match[1].charAt(0).toUpperCase() + match[1].slice(1)
  const suffix = match[2]

  // Normalize flats to sharps
  if (FLAT_TO_SHARP[root]) {
    root = FLAT_TO_SHARP[root]
  }

  const idx = CHROMATIC_SCALE.indexOf(root)
  if (idx === -1) {
    const sign = semitones > 0 ? `+${semitones}` : `${semitones}`
    return `${trimmed} (${sign})`
  }

  const newIdx = (idx + semitones + 12 * 10) % 12
  const newRoot = CHROMATIC_SCALE[newIdx]
  return `${newRoot}${suffix}`
}
