export interface SyncedBeat {
  filename: string
  url: string
  duration: number
}

export declare function syncBeats(): SyncedBeat[]
