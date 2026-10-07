export type Genre = 'Hood Trap' | 'Dark Drill' | 'Trap' | 'Ambient Trap' | 'Memphis'

export interface Beat {
  id: string
  title: string
  bpm: number
  key: string
  genre: Genre
  tags: string[]
  duration: number // e.g. 15 seconds
  audioUrl?: string
  status: 'available' | 'reserved'
  description?: string
  dateAdded?: string
}
