import type { Beat } from '../types/beat'
import { BEATS_CATALOG } from '../data/beats'
import { parseBeatFilename } from './beatParser'

// 1. Static glob discovery for src/beats/ folder (works during Vite dev and build)
const globAudio = import.meta.glob<string>('/src/beats/*.{mp3,wav,ogg,m4a,aac,flac}', {
  eager: true,
  query: '?url',
  import: 'default',
})

function sortBeatsAlphabetically(beats: Beat[]): Beat[] {
  return [...beats].sort((a, b) =>
    a.title.localeCompare(b.title, 'ru', { numeric: true, sensitivity: 'base' })
  )
}

export function getStaticDiscoveredBeats(): Beat[] {
  const beats: Beat[] = []
  for (const [filePath, fileUrl] of Object.entries(globAudio)) {
    beats.push(parseBeatFilename(filePath, fileUrl))
  }
  return sortBeatsAlphabetically(beats)
}

// 2. Dynamic live discovery from container/public folder (/api/beats or /beats.json)
export async function fetchLiveContainerBeats(): Promise<Beat[]> {
  try {
    // Try live API first (Vite dev server middleware or container backend)
    let response = await fetch('/api/beats', { cache: 'no-store' })
    
    // Fallback to static manifest if running on pure static file server
    if (!response.ok) {
      response = await fetch('/beats.json', { cache: 'no-store' })
    }

    if (response.ok) {
      const data: Array<{ filename: string; url: string }> = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        const loaded = data.map((item) => parseBeatFilename(item.filename, item.url))
        return sortBeatsAlphabetically(loaded)
      }
    }
  } catch {
    // Ignore fetch error, fallback to static / demo
  }

  // If container fetch returned nothing, return static glob beats or fallback catalog
  const staticBeats = getStaticDiscoveredBeats()
  return staticBeats.length > 0 ? staticBeats : sortBeatsAlphabetically(BEATS_CATALOG)
}

// Initial beats for synchronous first render
export function getInitialBeats(): Beat[] {
  const staticBeats = getStaticDiscoveredBeats()
  return staticBeats.length > 0 ? staticBeats : sortBeatsAlphabetically(BEATS_CATALOG)
}
