export interface Album {
  /** Unique values pertaining to the Album's tracks */
  bitdepth: number[]

  /** Unique values pertaining to the Album's tracks */
  bitrate: number[]

  /** Unique values pertaining to the Album's tracks */
  fileTypes: string[]
  genre: string

  /** Unique values pertaining to the Album's tracks */
  musicbrainzIDs: string[]

  /** Unique values pertaining to the Album's tracks */
  samplerate: number[]
  title: string

  /**
   * If present represents the full path to the first
   * contained track with an embedded albumart
   */
  trackPathWithEmbeddedAlbumart?: string
  year: number
}
