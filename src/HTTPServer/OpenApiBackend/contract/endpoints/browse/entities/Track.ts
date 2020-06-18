export interface Track {
  bitdepth?: number
  bitrate?: number
  fileType: string
  hasEmbeddedAlbumart: boolean
  musicbrainz: {
    ID?: string
    albumID?: string
    artistID?: string
    albumartistID?: string
  }

  /** It's the absolute path to the track file */
  path: string
  samplerate?: number
  title: string
}
