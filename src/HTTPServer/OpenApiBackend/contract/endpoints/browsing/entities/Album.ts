import { Integer } from '@airtasker/spot'

export interface Album {
  /** Unique values pertaining to the Album's tracks */
  artists: string[]

  albumArtist: string

  /** Unique values pertaining to the Album's tracks */
  bitdepths: Integer[]

  /** Unique values pertaining to the Album's tracks */
  bitrates: Integer[]

  /** Unique values pertaining to the Album's tracks */
  composers: string[]

  /** Unique values pertaining to the Album's tracks */
  fileTypes: string[]

  /** Unique values pertaining to the Album's tracks */
  genres: string[]

  /** Unique values pertaining to the Album's tracks */
  musicbrainzIDs: string[]

  /** Unique values pertaining to the Album's tracks */
  sampleRates: Integer[]

  title: string

  /**
   * If present represents the full path to the first
   * contained track with an embedded albumart
   */
  trackPathWithEmbeddedAlbumart: string | null

  /**
   * If present represents the year of to the first
   * contained track having a year defined
   */
  year: Integer | null
}
