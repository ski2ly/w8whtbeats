import type { Beat } from '../types/beat'
import { parseBeatFilename } from './beatParser'
import initialManifest from '../data/beatsManifest.json'

interface ManifestItem {
  filename: string
  url: string
  duration?: number
}

function sortBeatsAlphabetically(beats: Beat[]): Beat[] {
  return [...beats].sort((a, b) =>
    a.title.localeCompare(b.title, 'ru', { numeric: true, sensitivity: 'base' })
  )
}

// 1. Initial beats for instant synchronous first render (zero delay)
export function getInitialBeats(): Beat[] {
  if (Array.isArray(initialManifest) && initialManifest.length > 0) {
    const loaded = (initialManifest as ManifestItem[]).map((item) =>
      parseBeatFilename(item.filename, item.url, item.duration)
    )
    return sortBeatsAlphabetically(loaded)
  }
  return []
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
      const data: ManifestItem[] = await response.json()
      if (Array.isArray(data)) {
        const loaded = data.map((item) =>
          parseBeatFilename(item.filename, item.url, item.duration)
        )
        return sortBeatsAlphabetically(loaded)
      }
    }
  } catch {
    // Ignore fetch error
  }

  return getInitialBeats()
}
